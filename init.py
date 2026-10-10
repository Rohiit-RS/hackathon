"""
CivicTrack Tamil Nadu — Streamlit Direct App Gateway
Seamless full-page delivery of the CivicTrack full-stack application.
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
import streamlit as st
import streamlit.components.v1 as components

# -----------------------------------------------------------------------------
# Configuration & Constants
# -----------------------------------------------------------------------------
BACKEND_PORT = 5000
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.join(PROJECT_ROOT, "server")
BACKEND_HEALTH_URL = f"http://localhost:{BACKEND_PORT}/api/health"
WEB_APP_URL = f"http://localhost:{BACKEND_PORT}"

st.set_page_config(
    page_title="CivicTrack | Greater Municipal Corporation Portal",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# -----------------------------------------------------------------------------
# Background Process Helper (Ensures Node.js Backend is Running)
# -----------------------------------------------------------------------------
def check_backend_health():
    try:
        req = urllib.request.Request(BACKEND_HEALTH_URL, headers={'User-Agent': 'CivicTrack-Gateway'})
        with urllib.request.urlopen(req, timeout=0.8) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                return True, data
    except Exception:
        pass
    return False, None

def get_node_executable():
    for cmd in ["node", "nodejs", "/usr/bin/node", "/usr/bin/nodejs", "/usr/local/bin/node"]:
        path = shutil.which(cmd)
        if path:
            return path
    return None

def get_npm_executable():
    for cmd in ["npm", "/usr/bin/npm", "/usr/local/bin/npm"]:
        path = shutil.which(cmd)
        if path:
            return path
    return None

def ensure_server_dependencies():
    node_modules = os.path.join(SERVER_DIR, "node_modules")
    if os.path.exists(node_modules):
        return True
    
    npm = get_npm_executable()
    if not npm:
        return False
    
    try:
        res = subprocess.run(
            [npm, "install", "--omit=dev", "--no-audit", "--no-fund"],
            cwd=SERVER_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=120
        )
        return res.returncode == 0
    except Exception:
        return False

def ensure_backend_started():
    is_healthy, _ = check_backend_health()
    if is_healthy:
        return True

    node_bin = get_node_executable()
    if not node_bin:
        return False

    server_index = os.path.join(SERVER_DIR, "index.js")
    if not os.path.exists(server_index):
        return False

    ensure_server_dependencies()

    log_path = os.path.join(SERVER_DIR, "server.log")
    try:
        log_file = open(log_path, "a", encoding="utf-8")
        p = subprocess.Popen(
            [node_bin, "index.js"],
            cwd=SERVER_DIR,
            stdout=log_file,
            stderr=log_file,
            shell=(os.name == "nt")
        )

        for _ in range(12):
            time.sleep(0.4)
            healthy, _ = check_backend_health()
            if healthy:
                return True

        return False
    except Exception:
        return False

# Ensure the backend service is up
backend_running = ensure_backend_started()

# -----------------------------------------------------------------------------
# Zero-Buffer Fullscreen Streamlit Styling
# Completely strips all default Streamlit padding, margins, header, and footer.
# -----------------------------------------------------------------------------
st.markdown("""
<style>
    /* Remove default Streamlit header, footer, decoration & sidebar */
    #MainMenu { visibility: hidden !important; display: none !important; }
    header { visibility: hidden !important; display: none !important; }
    footer { visibility: hidden !important; display: none !important; }
    [data-testid="stHeader"] { visibility: hidden !important; display: none !important; }
    [data-testid="stToolbar"] { display: none !important; }
    [data-testid="stDecoration"] { display: none !important; }
    [data-testid="stStatusWidget"] { display: none !important; }
    [data-testid="stSidebar"] { display: none !important; }
    [data-testid="collapsedControl"] { display: none !important; }

    /* Remove all container padding and margins */
    html, body, .stApp {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: #f8fafc !important;
    }

    .block-container {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        width: 100vw !important;
        height: 100vh !important;
    }

    div[data-testid="stVerticalBlock"] {
        gap: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    /* Make iframe fill 100% of the entire viewport */
    iframe {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 999999 !important;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Direct Localhost Embed
# -----------------------------------------------------------------------------
components.iframe(WEB_APP_URL, height=1000, scrolling=True)
