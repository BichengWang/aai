from __future__ import annotations

from textwrap import dedent

JS_CLEAN_TEXT = "const clean = (value) => (value || '').replace(/\\s+/g, ' ').trim();"
JS_MAIN_SCOPE = "const inMain = document.querySelector('main') || document.body;"


def build_js_extract(body: str) -> str:
    return dedent(
        f"""
        () => {{
          {JS_CLEAN_TEXT}
          {JS_MAIN_SCOPE}
        {body}
        }}
        """
    ).strip()
