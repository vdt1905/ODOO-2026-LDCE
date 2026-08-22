"""Regenerates the LangGraph state diagram from the actual compiled graph, so the
diagram can never drift from the code. Run from the AI/ folder:

    python scripts/generate_diagram.py

Writes diagrams/state_diagram.mmd always, and diagrams/state_diagram.png if network
access to the Mermaid renderer is available.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.graph.build import suggestion_graph  # noqa: E402

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "diagrams")


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    graph = suggestion_graph.get_graph()

    mermaid_source = graph.draw_mermaid()
    mmd_path = os.path.join(OUT_DIR, "state_diagram.mmd")
    with open(mmd_path, "w", encoding="utf-8") as f:
        f.write(mermaid_source)
    print(f"Wrote {mmd_path}")

    try:
        png_bytes = graph.draw_mermaid_png()
        png_path = os.path.join(OUT_DIR, "state_diagram.png")
        with open(png_path, "wb") as f:
            f.write(png_bytes)
        print(f"Wrote {png_path}")
    except Exception as exc:  # network/renderer unavailable — .mmd is the source of truth
        print(f"Skipped PNG render ({exc}). The .mmd file is still up to date.")


if __name__ == "__main__":
    main()
