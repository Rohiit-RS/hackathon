"""
CivicTrack Tamil Nadu — Streamlit Direct App Gateway
Zero-buffer full-screen delivery of the CivicTrack Public Works Portal.
"""

import os
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="CivicTrack | Greater Municipal Corporation Portal",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

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
# Instant In-Memory Delivery of Full React Single Page Application
# -----------------------------------------------------------------------------
BUNDLE_FILE = os.path.join(os.path.dirname(__file__), "client", "dist", "bundle.html")
STATIC_BUNDLE = os.path.join(os.path.dirname(__file__), "static", "bundle.html")

target_file = BUNDLE_FILE if os.path.exists(BUNDLE_FILE) else STATIC_BUNDLE

with open(target_file, "r", encoding="utf-8") as f:
    html_code = f.read()

components.html(html_code, height=1000, scrolling=True)
