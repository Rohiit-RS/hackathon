"""
CivicTrack Tamil Nadu — Streamlit Direct App Gateway
Zero-buffer full-screen delivery of the CivicTrack Public Works Portal.
"""

import os
import sys
import json
import time
import socket
import shutil
import subprocess
import urllib.request
import streamlit as st
import streamlit.components.v1 as components

# -----------------------------------------------------------------------------
# Configuration & Constants
# -----------------------------------------------------------------------------
BACKEND_PORT = 5000
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.join(PROJECT_ROOT, "server")
BACKEND_HEALTH_URL = f"http://localhost:{BACKEND_PORT}/api/health"

# Preferred standalone embed endpoint (hosted directly via Streamlit static serving)
STATIC_APP_URL = "/app/static/index.html"
LOCAL_APP_URL = f"http://localhost:{BACKEND_PORT}"

st.set_page_config(
    page_title="CivicTrack | Greater Municipal Corporation Portal",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# -----------------------------------------------------------------------------
# Background Process Helper (Optional Local Backend Starter)
# -----------------------------------------------------------------------------
def check_backend_health():
    try:
        req = urllib.request.Request(BACKEND_HEALTH_URL, headers={'User-Agent': 'CivicTrack-Gateway'})
        with urllib.request.urlopen(req, timeout=0.5) as response:
            if response.status == 200:
                return True
    except Exception:
        pass
    return False

def ensure_backend_started():
    if check_backend_health():
        return True
    node_bin = shutil.which("node") or shutil.which("nodejs")
    if not node_bin:
        return False
    server_index = os.path.join(SERVER_DIR, "index.js")
    if not os.path.exists(server_index):
        return False
    try:
        log_path = os.path.join(SERVER_DIR, "server.log")
        log_file = open(log_path, "a", encoding="utf-8")
        subprocess.Popen(
            [node_bin, "index.js"],
            cwd=SERVER_DIR,
            stdout=log_file,
            stderr=log_file,
            shell=(os.name == "nt")
        )
        for _ in range(8):
            time.sleep(0.3)
            if check_backend_health():
                return True
    except Exception:
        pass
    return False

# Attempt background backend startup if running locally
try:
    ensure_backend_started()
except Exception:
    pass

# Choose the active URL (Static Cloud endpoint is 100% independent of localhost)
static_path = os.path.join(PROJECT_ROOT, "static", "index.html")
if os.path.exists(static_path):
    final_url = STATIC_APP_URL
elif check_backend_health():
    final_url = LOCAL_APP_URL
else:
    final_url = STATIC_APP_URL

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
# Full-Screen App Embed
# -----------------------------------------------------------------------------
components.iframe(final_url, height=1000, scrolling=True)
