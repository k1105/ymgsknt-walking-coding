#!/usr/bin/env python3
"""
Download all p5.js sketches from p5.js Web Editor to local sketches/ directory.
Reads meta.json from each sketch dir, fetches files via p5.js Editor API,
and saves them locally (index.html, sketch.js, style.css, assets).
"""

import json
import os
import sys
import time
from pathlib import Path

import requests

SKETCHES_DIR = Path(__file__).resolve().parent.parent / "public" / "sketches"
P5_API = "https://editor.p5js.org/editor/k1105/projects"

def fetch_project(sketch_id: str) -> dict | None:
    """Fetch project data from p5.js Editor API."""
    url = f"{P5_API}/{sketch_id}"
    for attempt in range(3):
        try:
            resp = requests.get(url, timeout=30)
            if resp.status_code == 404:
                print(f"  Not found: {sketch_id}")
                return None
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"  Retry {attempt+1}: {e}")
            time.sleep(2)
    return None


def download_asset(url: str, dest: Path) -> bool:
    """Download a binary asset."""
    if dest.exists():
        print(f"  Already exists: {dest.name}")
        return True
    try:
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        dest.write_bytes(resp.content)
        size_kb = len(resp.content) / 1024
        print(f"  Downloaded: {dest.name} ({size_kb:.0f}KB)")
        return True
    except Exception as e:
        print(f"  Failed to download {dest.name}: {e}")
        return False


def save_project_files(project: dict, sketch_dir: Path):
    """Save all project files to the sketch directory."""
    files = project.get("files", [])

    for f in files:
        name = f.get("name", "")
        content = f.get("content", "")
        url = f.get("url", "")
        file_type = f.get("fileType", "")
        children = f.get("children", [])

        # Skip root folder
        if name == "root":
            # Process children references — they're IDs, actual files are top-level
            continue

        # Binary asset (has URL, no content)
        if url and not content:
            dest = sketch_dir / name
            download_asset(url, dest)
            continue

        # Text file (has content)
        if content:
            dest = sketch_dir / name
            # Don't overwrite existing files unless they differ
            if dest.exists():
                existing = dest.read_text(encoding="utf-8")
                if existing == content:
                    print(f"  Unchanged: {name}")
                    continue
            dest.write_text(content, encoding="utf-8")
            print(f"  Wrote: {name}")
            continue


def main():
    if not SKETCHES_DIR.exists():
        print(f"Sketches dir not found: {SKETCHES_DIR}")
        sys.exit(1)

    # Find all sketch directories with meta.json
    sketch_dirs = sorted([
        d for d in SKETCHES_DIR.iterdir()
        if d.is_dir() and (d / "meta.json").exists() and d.name != "_template"
    ])

    print(f"Found {len(sketch_dirs)} sketch directories")

    success = 0
    skipped = 0
    failed = 0

    for sketch_dir in sketch_dirs:
        meta_path = sketch_dir / "meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        sketch_id = meta.get("p5jsSketchId", "")
        date = meta.get("date", sketch_dir.name)

        if not sketch_id:
            print(f"\n{date}: No p5jsSketchId, skipping")
            skipped += 1
            continue

        # Check if already downloaded
        if (sketch_dir / "sketch.js").exists():
            print(f"\n{date}: Already has sketch.js, skipping")
            skipped += 1
            continue

        print(f"\n{date} (id: {sketch_id})")

        project = fetch_project(sketch_id)
        if not project:
            failed += 1
            continue

        save_project_files(project, sketch_dir)
        success += 1

        # Rate limit
        time.sleep(0.5)

    print(f"\n=== Done ===")
    print(f"Downloaded: {success}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    main()
