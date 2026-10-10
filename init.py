"""
CivicTrack Tamil Nadu — Streamlit Deployment Portal & Executive Dashboard
Inter-Agency Dig-Once Infrastructure Coordination & Citizen Grievance Management
Government of Tamil Nadu • Municipal Administration & Water Supply Department
"""

import os
import sys
import json
import time
import socket
import shutil
import subprocess
import urllib.request
import urllib.error
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

# -----------------------------------------------------------------------------
# Configuration & Constants
# -----------------------------------------------------------------------------
BACKEND_PORT = 5000
FRONTEND_PORT = 5173
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.join(PROJECT_ROOT, "server")
DB_JSON_PATH = os.path.join(SERVER_DIR, "src", "data", "db.json")
BACKEND_HEALTH_URL = f"http://localhost:{BACKEND_PORT}/api/health"
WEB_APP_URL = f"http://localhost:{BACKEND_PORT}"

st.set_page_config(
    page_title="CivicTrack TN | Dig-Once & Public Works Coordination",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# Custom Styling (TN Government Civic Theme)
# -----------------------------------------------------------------------------
st.markdown("""
<style>
    /* Government Header Styling */
    .tn-header {
        background: linear-gradient(135deg, #0b2545 0%, #133c55 50%, #1d4ed8 100%);
        color: white;
        padding: 22px 28px;
        border-radius: 16px;
        margin-bottom: 24px;
        box-shadow: 0 10px 25px -5px rgba(11, 37, 69, 0.25);
    }
    .tn-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(4px);
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 8px;
        border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .metric-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 18px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px 8px 0 0;
        padding: 10px 18px;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Background Process & Health Checker
# -----------------------------------------------------------------------------
def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def check_backend_health():
    try:
        req = urllib.request.Request(BACKEND_HEALTH_URL, headers={'User-Agent': 'CivicTrack-Streamlit'})
        with urllib.request.urlopen(req, timeout=1.0) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                return True, data
    except Exception:
        pass
    return False, None

def get_node_executable():
    candidates = ["node", "nodejs", "/usr/bin/node", "/usr/bin/nodejs", "/usr/local/bin/node"]
    for cmd in candidates:
        path = shutil.which(cmd)
        if path:
            return path
    return None

def get_npm_executable():
    candidates = ["npm", "/usr/bin/npm", "/usr/local/bin/npm"]
    for cmd in candidates:
        path = shutil.which(cmd)
        if path:
            return path
    return None

def ensure_server_dependencies():
    """Ensure node_modules exists in server folder; runs npm install if missing."""
    node_modules = os.path.join(SERVER_DIR, "node_modules")
    if os.path.exists(node_modules):
        return True, "Dependencies already installed"
    
    npm = get_npm_executable()
    if not npm:
        return False, "npm binary not found in system PATH"
    
    try:
        res = subprocess.run(
            [npm, "install", "--omit=dev", "--no-audit", "--no-fund"],
            cwd=SERVER_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=180
        )
        if res.returncode == 0:
            return True, "npm install succeeded"
        return False, f"npm install returned code {res.returncode}: {res.stderr[:300]}"
    except Exception as e:
        return False, f"npm install error: {str(e)}"

def ensure_backend_started():
    is_healthy, data = check_backend_health()
    if is_healthy:
        return True, "Backend already running and healthy"

    node_bin = get_node_executable()
    if not node_bin:
        return False, "Node.js runtime not found. Ensure 'nodejs' and 'npm' are installed."

    server_index = os.path.join(SERVER_DIR, "index.js")
    if not os.path.exists(server_index):
        return False, f"Server entrypoint not found at {server_index}"

    # Verify dependencies
    ensure_server_dependencies()

    log_path = os.path.join(SERVER_DIR, "server.log")
    try:
        log_file = open(log_path, "a", encoding="utf-8")
        log_file.write(f"\n--- CivicTrack Backend Startup: {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
        log_file.flush()

        p = subprocess.Popen(
            [node_bin, "index.js"],
            cwd=SERVER_DIR,
            stdout=log_file,
            stderr=log_file,
            shell=(os.name == "nt")
        )

        # Wait up to 8 seconds for boot
        for _ in range(16):
            time.sleep(0.5)
            healthy, health_data = check_backend_health()
            if healthy:
                return True, "Backend successfully initialized and running on port 5000"

        # Check if process crashed
        if p.poll() is not None:
            log_file.close()
            log_snippet = ""
            if os.path.exists(log_path):
                with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                    log_snippet = f.read()[-600:]
            return False, f"Node process exited with code {p.returncode}. Log:\n{log_snippet}"

        return False, f"Server process started (PID {p.pid}), but health probe on port 5000 timed out."
    except Exception as e:
        return False, f"Could not launch Node process: {str(e)}"

# -----------------------------------------------------------------------------
# Data Retrieval & Calculations
# -----------------------------------------------------------------------------
@st.cache_data(ttl=5)
def load_civic_data():
    """Load projects, reports, users, and departments either via API or db.json directly."""
    # Attempt via DB file directly for instantaneous speed and offline resilience
    if os.path.exists(DB_JSON_PATH):
        try:
            with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception as e:
            st.error(f"Error reading database file: {e}")

    # Fallback to empty schema
    return {"projects": [], "reports": [], "users": [], "departments": [], "workOrders": [], "contractors": []}

def calculate_dig_once_conflicts(projects, radius_meters=200):
    """Detect spatial proximity overlaps between projects from different departments."""
    conflicts = []
    import math

    def haversine(lat1, lon1, lat2, lon2):
        R = 6371000  # meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    for i in range(len(projects)):
        p1 = projects[i]
        for j in range(i + 1, len(projects)):
            p2 = projects[j]
            try:
                lat1, lon1 = float(p1.get("latitude", 0)), float(p1.get("longitude", 0))
                lat2, lon2 = float(p2.get("latitude", 0)), float(p2.get("longitude", 0))
                if lat1 == 0 or lat2 == 0:
                    continue
                dist = haversine(lat1, lon1, lat2, lon2)
                if dist <= radius_meters:
                    conflicts.append({
                        "Project A": p1.get("title", "Project A"),
                        "Dept A": p1.get("department_name", "Dept"),
                        "Project B": p2.get("title", "Project B"),
                        "Dept B": p2.get("department_name", "Dept"),
                        "Distance (m)": round(dist, 1),
                        "Ward": p1.get("ward", "Chennai Region"),
                        "Recommendation": "Consolidate excavation into joint trenching to prevent road re-cutting."
                    })
            except Exception:
                continue
    return conflicts

# -----------------------------------------------------------------------------
# Main Application Flow
# -----------------------------------------------------------------------------
backend_ok, backend_msg = ensure_backend_started()
data = load_civic_data()

projects = data.get("projects", [])
reports = data.get("reports", [])
users = data.get("users", [])
departments = data.get("departments", [])
work_orders = data.get("workOrders", [])
contractors = data.get("contractors", [])

conflicts = calculate_dig_once_conflicts(projects)

# -----------------------------------------------------------------------------
# Sidebar Navigation & Quick Credentials
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### 🏛️ CivicTrack TN")
    st.caption("Municipal Administration & Water Supply Dept")
    st.markdown("---")
    
    # Engine Status Pill
    if backend_ok:
        st.success(f"🟢 Full-Stack Engine: Online\n(Port {BACKEND_PORT})")
    else:
        st.warning("🟡 Direct Data Mode Active\n(Node.js not connected)")

    st.markdown("### 🔑 Demo Accounts & Roles")
    st.markdown("""
    Use these accounts on the portal or create your own custom account:
    - 👑 **Admin**: `admin@tn.gov.in` / `admin123`
    - 🛣️ **Highways**: `highways@tn.gov.in` / `highways123`
    - 💧 **Water (CMWSSB)**: `water@cmwssb.tn.gov.in` / `water123`
    - ⚡ **Power (TANGEDCO)**: `power@tangedco.gov.in` / `power123`
    - 👤 **Citizen**: `citizen@demo.com` / `demo1234`
    """)

    st.markdown("---")
    st.markdown("### 🚀 Quick Launch")
    st.link_button("🌐 Open Web App (Fullscreen)", WEB_APP_URL, use_container_width=True)

    if st.button("🔄 Refresh Data Cache", use_container_width=True):
        st.cache_data.clear()
        st.rerun()

    st.markdown("---")
    st.caption("CivicTrack v2.0 • Dig-Once Tamil Nadu Public Works Infrastructure")

# -----------------------------------------------------------------------------
# Header Banner
# -----------------------------------------------------------------------------
st.markdown("""
<div class="tn-header">
    <div class="tn-badge">Tamil Nadu Infrastructure Coordination Portal</div>
    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: white;">
        CivicTrack — Inter-Agency Dig-Once Public Works System
    </h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; color: #e2e8f0;">
        Eliminating duplicate road excavation, orchestrating joint municipal utility trenches, and tracking citizen grievances across Tamil Nadu.
    </p>
</div>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Top Metric Row
# -----------------------------------------------------------------------------
col1, col2, col3, col4 = st.columns(4)

total_sanctioned = sum(p.get("sanctioned_budget", 0) for p in projects)
savings_estimate = len(conflicts) * 350000  # Avg savings per joint dig ₹3.5 Lakhs

with col1:
    st.metric(
        label="Active Capital Projects",
        value=len(projects),
        delta=f"{sum(1 for p in projects if p.get('status') == 'In Progress')} Ongoing"
    )

with col2:
    st.metric(
        label="Dig-Once Conflicts Flagged",
        value=len(conflicts),
        delta=f"-{len(conflicts)} Road Cuts Prevented",
        delta_color="normal"
    )

with col3:
    st.metric(
        label="Citizen Grievances Logged",
        value=len(reports),
        delta=f"{sum(1 for r in reports if r.get('status') == 'submitted')} Pending Action"
    )

with col4:
    st.metric(
        label="Taxpayer Savings via Dig-Once",
        value=f"₹{savings_estimate / 100000:.1f} Lakhs",
        delta="Consolidated Trenching",
        delta_color="normal"
    )

st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Tabs Layout
# -----------------------------------------------------------------------------
tab_app, tab_map, tab_conflicts, tab_reports, tab_health = st.tabs([
    "🌐 Full Interactive App",
    "🗺️ Spatial GIS & Projects Map",
    "⚡ Dig-Once Conflict Engine",
    "📋 Citizen Grievance Registry",
    "⚙️ System Diagnostics & API"
])

# -----------------------------------------------------------------------------
# TAB 1: FULL INTERACTIVE WEB APPLICATION
# -----------------------------------------------------------------------------
with tab_app:
    st.subheader("Live CivicTrack Full Application Portal")

    # Check if backend is available for iframe
    if backend_ok:
        st.success(f"🟢 Full-Stack Engine: Online & Connected (Port {BACKEND_PORT})")
        st.info("The complete React + Leaflet interactive client is embedded below. You can log in, switch departments, report issues by dragging pins on the map, schedule maintenance windows, and approve joint excavation permits.")
        components.iframe(WEB_APP_URL, height=880, scrolling=True)
    else:
        st.warning("⚠️ The Node.js Express server is initializing or not running locally. You can browse the spatial data and analytics tabs above, or start the server using `node server/index.js`.")
        col_a, col_b = st.columns([1, 1])
        with col_a:
            st.code("cd server\nnode index.js", language="bash")
        with col_b:
            if st.button("🚀 Attempt Backend Auto-Start", use_container_width=True):
                with st.spinner("Initializing Node.js runtime and starting backend server..."):
                    started, start_msg = ensure_backend_started()
                    if started:
                        st.success(f"✅ {start_msg}")
                        time.sleep(1)
                        st.rerun()
                    else:
                        st.error(f"❌ {start_msg}")

        # Show log diagnostics if server.log exists
        log_path = os.path.join(SERVER_DIR, "server.log")
        if os.path.exists(log_path):
            with st.expander("📄 View Server Diagnostics & Boot Log"):
                try:
                    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                        st.code(f.read()[-1500:], language="text")
                except Exception:
                    pass

        st.markdown("---")
        st.markdown("### 💡 Cloud Architecture Note")
        st.caption(
            "On cloud platforms (Streamlit Community Cloud), the backend runs inside the container on loopback port 5000. "
            "All live Public Works GIS maps, Dig-Once Conflict Engine calculations, and Citizen Grievances in Tabs 2, 3, 4, and 5 "
            "are fully active and operating directly on the real-time dataset."
        )

# -----------------------------------------------------------------------------
# TAB 2: SPATIAL GIS & PROJECTS MAP
# -----------------------------------------------------------------------------
with tab_map:
    st.subheader("Public Works & Grievance Geographic Intelligence")
    st.caption("Interactive coordinates mapping across Chennai Metropolitan Area and Tamil Nadu.")

    # Filter controls
    m_col1, m_col2, m_col3 = st.columns(3)
    with m_col1:
        dept_options = ["All Departments"] + sorted(list({p.get("department_name") for p in projects if p.get("department_name")}))
        selected_dept = st.selectbox("Filter by Department:", dept_options)
    with m_col2:
        category_options = ["All Categories"] + sorted(list({p.get("category") for p in projects if p.get("category")}))
        selected_cat = st.selectbox("Filter by Work Category:", category_options)
    with m_col3:
        entity_type = st.radio("Display Entity Layer:", ["All Entries", "Capital Projects Only", "Citizen Reports Only"], horizontal=True)

    # Prepare map points
    map_points = []
    
    if entity_type in ["All Entries", "Capital Projects Only"]:
        for p in projects:
            if selected_dept != "All Departments" and p.get("department_name") != selected_dept:
                continue
            if selected_cat != "All Categories" and p.get("category") != selected_cat:
                continue
            try:
                lat = float(p.get("latitude", 0))
                lon = float(p.get("longitude", 0))
                if lat != 0 and lon != 0:
                    map_points.append({
                        "latitude": lat,
                        "longitude": lon,
                        "title": p.get("title", "Project"),
                        "type": "Capital Project",
                        "department": p.get("department_name", "N/A"),
                        "severity": p.get("severity", "Normal"),
                        "status": p.get("status", "Active")
                    })
            except Exception:
                pass

    if entity_type in ["All Entries", "Citizen Reports Only"]:
        for r in reports:
            if selected_cat != "All Categories" and r.get("category") != selected_cat:
                continue
            try:
                lat = float(r.get("latitude", 0))
                lon = float(r.get("longitude", 0))
                if lat != 0 and lon != 0:
                    map_points.append({
                        "latitude": lat,
                        "longitude": lon,
                        "title": r.get("title", "Report"),
                        "type": "Citizen Grievance",
                        "department": r.get("category", "Grievance").capitalize(),
                        "severity": r.get("severity", "Moderate"),
                        "status": r.get("status", "Reported")
                    })
            except Exception:
                pass

    if map_points:
        df_map = pd.DataFrame(map_points)
        st.map(df_map, latitude="latitude", longitude="longitude", size=18, zoom=12)
        
        with st.expander(f"📍 View Plotted Geographic Coordinates ({len(map_points)} points)"):
            st.dataframe(df_map[["title", "type", "department", "severity", "status", "latitude", "longitude"]], use_container_width=True)
    else:
        st.info("No matching locations found for the selected filter.")

# -----------------------------------------------------------------------------
# TAB 3: DIG-ONCE CONFLICT ENGINE
# -----------------------------------------------------------------------------
with tab_conflicts:
    st.subheader("⚡ Dig-Once Conflict & Road-Cutting Prevention Engine")
    st.markdown("""
    Under Tamil Nadu Dig-Once Protocol, multiple departments (Highways, CMWSSB, TANGEDCO, Telecom) intending to dig 
    within **200 meters** of each other must coordinate joint trenching to avoid repetitive road resurfacing expenses.
    """)

    if conflicts:
        st.error(f"⚠️ {len(conflicts)} Spatial & Utility Overlaps Identified")
        df_conflicts = pd.DataFrame(conflicts)
        st.dataframe(df_conflicts, use_container_width=True)

        st.subheader("Joint Trenching Savings Model")
        s_col1, s_col2 = st.columns(2)
        with s_col1:
            st.markdown(f"""
            - **Standard Road Cut Re-surfacing Cost**: ₹3,50,000 per 100m
            - **Identified Conflicting Segments**: {len(conflicts)}
            - **Direct Excavation Savings**: **₹{savings_estimate:,.0f}**
            - **Traffic Disruption Days Saved**: ~{len(conflicts) * 14} days
            """)
        with s_col2:
            dept_counts = {}
            for p in projects:
                d = p.get("department_name", "Other")
                dept_counts[d] = dept_counts.get(d, 0) + 1
            st.bar_chart(pd.Series(dept_counts, name="Projects by Department"))
    else:
        st.success("✅ No conflicting road-cutting projects detected in the current schedule window.")

# -----------------------------------------------------------------------------
# TAB 4: CITIZEN GRIEVANCE REGISTRY
# -----------------------------------------------------------------------------
with tab_reports:
    st.subheader("📋 Public Grievance Tracking & Verification Registry")
    st.caption("Citizen reports submitted via GPS or interactive drag-and-drop pin positioning.")

    rep_summary_cols = st.columns(4)
    with rep_summary_cols[0]:
        st.metric("Total Grievances", len(reports))
    with rep_summary_cols[1]:
        st.metric("Pending Review", sum(1 for r in reports if r.get("status") == "submitted"))
    with rep_summary_cols[2]:
        st.metric("In Progress", sum(1 for r in reports if r.get("status") == "in_progress"))
    with rep_summary_cols[3]:
        st.metric("Resolved", sum(1 for r in reports if r.get("status") == "resolved"))

    # Table of reports
    if reports:
        report_rows = []
        for r in reports:
            report_rows.append({
                "ID": r.get("id"),
                "Title": r.get("title"),
                "Category": r.get("category"),
                "Problem Type": r.get("problem_type"),
                "Ward": r.get("ward"),
                "Address": r.get("address"),
                "Location Source": r.get("location_source", "GPS"),
                "Verified": "✅ Yes" if r.get("location_verified") else "⏳ Pending",
                "Status": r.get("status"),
                "Citizen": r.get("user_name", "Anonymous")
            })
        st.dataframe(pd.DataFrame(report_rows), use_container_width=True)
    else:
        st.info("No grievances filed yet.")

# -----------------------------------------------------------------------------
# TAB 5: SYSTEM HEALTH & ENGINE DIAGNOSTICS
# -----------------------------------------------------------------------------
with tab_health:
    st.subheader("⚙️ System Architecture & Engine Diagnostics")

    h_col1, h_col2 = st.columns(2)
    with h_col1:
        st.markdown("#### Backend Service Probe")
        st.markdown(f"- **Port 5000 Active**: `{'YES' if is_port_in_use(5000) else 'NO'}`")
        st.markdown(f"- **Port 5173 (Vite Dev)**: `{'YES' if is_port_in_use(5173) else 'NO'}`")
        st.markdown(f"- **Health Endpoint**: `{BACKEND_HEALTH_URL}`")
        is_healthy, health_data = check_backend_health()
        if is_healthy:
            st.json(health_data)
        else:
            st.warning("Backend API is currently offline or starting up.")

    with h_col2:
        st.markdown("#### Database Summary")
        st.markdown(f"- **Database Path**: `{DB_JSON_PATH}`")
        st.markdown(f"- **Projects Count**: `{len(projects)}`")
        st.markdown(f"- **Reports Count**: `{len(reports)}`")
        st.markdown(f"- **Departments Count**: `{len(departments)}`")
        st.markdown(f"- **Users Registered**: `{len(users)}`")
        st.markdown(f"- **Work Orders Count**: `{len(work_orders)}`")

    st.markdown("---")
    st.markdown("#### Deployment Instructions")
    st.markdown("""
    **To deploy to Streamlit Cloud:**
    1. Connect this GitHub repository.
    2. Set Main file path: `init.py`.
    3. Ensure `requirements.txt` contains `streamlit`, `pandas`, `requests`.
    4. Ensure `packages.txt` contains `nodejs`, `npm`.
    5. Hit Deploy!
    """)
