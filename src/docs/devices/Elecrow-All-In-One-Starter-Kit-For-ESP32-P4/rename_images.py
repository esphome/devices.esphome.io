import re
import os
from pathlib import Path

def normalize_filename(filename):
    """Converts filename to lowercase and replaces spaces/underscores with dashes."""
    name, ext = os.path.splitext(filename)
    name = name.lower().replace(' ', '-').replace('_', '-')
    return name + ext.lower()

def process_markdown_file(markdown_filepath):
    markdown_path = Path(markdown_filepath)
    if not markdown_path.is_file():
        print(f"Error: Markdown file not found at {markdown_filepath}")
        return

    image_dir = markdown_path.parent
    content = markdown_path.read_text(encoding='utf-8')
    
    # Regex to find <img src="..."> tags and standard ![alt](path) markdown links
    # Captures the path to .png or .svg files
    img_pattern = re.compile(r'(?:<img\s+[^>]*src="([^"]+\.(?:png|svg))"|!\[.*?\]\(([^)]+\.(?:png|svg))\))', re.IGNORECASE)

    # Extract matches from groups
    found_matches = set(m[0] or m[1] for m in img_pattern.findall(content))
    
    if not found_matches:
        print(f"No .png or .svg image references found in {markdown_filepath}")
        return

    print(f"Processing {len(found_matches)} image references in {markdown_filepath}...")

    rename_map = {}
    for old_path in found_matches:
        if old_path.startswith(('http://', 'https://', '/')):
            print(f"Skipping external/absolute URL: {old_path}")
            continue

        new_path = normalize_filename(old_path)

        if old_path != new_path:
            # Always add to rename map so the Markdown file gets updated
            rename_map[old_path] = new_path
            
            old_file = image_dir / old_path
            new_file = image_dir / new_path

            if old_file.is_file():
                if new_file.exists():
                    print(f"Warning: Destination {new_file} already exists. Mapping reference only.")
                else:
                    try:
                        old_file.rename(new_file)
                        print(f"Renamed: {old_file.name} -> {new_file.name}")
                    except Exception as e:
                        print(f"Error renaming {old_path}: {e}")
            else:
                print(f"Note: Referenced file not found on disk: {old_file}. Updated Markdown reference only.")

    # Safely update content using re.sub with a callback to target only the paths
    def replace_func(match):
        img_path = match.group(1) # Path from <img src="...">
        md_path = match.group(2)  # Path from ![alt](path)
        path = img_path or md_path

        new_path = rename_map.get(path, path)
        if img_path:
            # Convert plain string src to {require('./path').default}
            req_path = new_path if new_path.startswith('./') else f"./{new_path}"
            return match.group(0).replace(f'src="{img_path}"', f'src={{require(\'{req_path}\').default}}')
        return match.group(0).replace(path, new_path)

    updated_content = img_pattern.sub(replace_func, content)
    markdown_path.write_text(updated_content, encoding='utf-8')
    print(f"Successfully updated {markdown_filepath} and renamed local files.")

if __name__ == "__main__":
    markdown_file = "/home/nonasuomy/code/esphome-devices/src/docs/devices/Elecrow-All-In-One-Starter-Kit-For-ESP32-P4/index.md"
    process_markdown_file(markdown_file)