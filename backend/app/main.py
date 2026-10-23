"""
Wordle Infinite Backend Application
FastAPI REST Server with Shannon Entropy Solver & Absurdle Adversary.
"""
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router as api_v1_router
from app.config import SOLUTIONS_SET, VALID_WORDS_SET

app = FastAPI(
    title="Wordle Infinite API",
    description="Multi-grid wordle suite with 3Blue1Brown Shannon entropy hint engine and Absurdle adversarial AI",
    version="1.0.0",
)

# Enable CORS for local development and cross-origin embedding
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routes
app.include_router(api_v1_router)

# Mount frontend build if available
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
ASSETS_DIR = FRONTEND_DIST / "assets"

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


@app.get("/{full_path:path}", response_class=HTMLResponse, include_in_schema=False)
async def serve_spa(full_path: str):
    """Serves the Single Page Application or returns status if dist is not yet built."""
    # Never intercept API routes
    if full_path.startswith("api/") or full_path == "docs" or full_path == "openapi.json":
        return None

    index_html = FRONTEND_DIST / "index.html"
    if index_html.exists():
        return FileResponse(str(index_html))

    return HTMLResponse(
        content=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Wordle Infinite API</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                       background: #121213; color: #ffffff; text-align: center; padding: 50px; }}
                h1 {{ color: #538d4e; margin-bottom: 10px; }}
                p {{ color: #818384; font-size: 16px; }}
                a {{ color: #b59f3b; text-decoration: none; font-weight: bold; }}
                a:hover {{ text-decoration: underline; }}
                .badge {{ display: inline-block; background: #3a3a3c; padding: 6px 12px; border-radius: 4px; margin: 5px; }}
            </style>
        </head>
        <body>
            <h1>🟩 Wordle Infinite Backend Active</h1>
            <p>API v1 is operational with <strong>{len(SOLUTIONS_SET):,}</strong> solutions and <strong>{len(VALID_WORDS_SET):,}</strong> total valid words.</p>
            <div style="margin: 20px 0;">
                <span class="badge">Shannon Entropy Solver</span>
                <span class="badge">Absurdle Adversary</span>
                <span class="badge">Mulberry32 PRNG</span>
                <span class="badge">Two-Pass Duplicate Matcher</span>
            </div>
            <p><a href="/docs">View Interactive OpenAPI Documentation &rarr;</a></p>
        </body>
        </html>
        """
    )
