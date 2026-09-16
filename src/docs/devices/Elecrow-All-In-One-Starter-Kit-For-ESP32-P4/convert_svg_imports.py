#!/usr/bin/env python3
import re
import sys

def to_component_name(svg_path):
    name = svg_path.split('/')[-1].replace('.svg', '')
    result = re.sub(r'[^a-zA-Z0-9]+', ' ', name).title().replace(' ', '') + 'Svg'
    if result[0].isdigit():
        result = 'Svg' + result
    return result

def convert_svg_to_imports(content):
    # Match both plain and require() style SVG img tags
    patterns = [
        r"<img src=[\"']([^\"']+\.svg)[\"'](?:\s+width=[\"'](\d+)[\"'])?\s+alt=[\"']([^\"']+)[\"']\s*/>",
        r"<img src=\{require\('([^']+\.svg)'\)\.default\}(?:\s+width=[\"'](\d+)[\"'])?\s+alt=[\"']([^\"']+)[\"']\s*/>",
    ]

    imports = {}
    replacements = []

    for pattern in patterns:
        for match in re.finditer(pattern, content):
            svg_file, width, alt_text = match.group(1), match.group(2) or '800', match.group(3)
            component_name = to_component_name(svg_file)
            import_path = './' + svg_file.split('/')[-1]

            imports[component_name] = f"import {component_name} from '{import_path}';"
            replacements.append((match.group(0), f"<{component_name}\n  title=\"{alt_text}\"\n  role=\"img\"\n  style={{{{ width: '{width}px', height: 'auto' }}}}\n/>"))

    for old, new in replacements:
        content = content.replace(old, new)

    if imports:
        # Find existing imports after front matter and merge
        front_matter_end = content.find('---', 3)
        insert_pos = content.find('\n', front_matter_end + 3) + 1

        # Remove existing import lines for these components
        for component_name in imports:
            content = re.sub(rf"import {component_name} from '[^']+';?\n", '', content)

        # Collect all import lines currently present after front matter
        existing_imports = re.findall(r"^import .+;\n?", content[insert_pos:insert_pos+2000], re.MULTILINE)
        for line in existing_imports:
            key = re.search(r'import (\w+)', line).group(1)
            if key not in imports:
                imports[key] = line.rstrip('\n')
            content = content.replace(line, '', 1)

        import_block = '\n'.join(sorted(imports.values())) + '\n'
        content = content[:insert_pos] + '\n' + import_block + content[insert_pos:]

    return content

if __name__ == '__main__':
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        converted = convert_svg_to_imports(content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(converted)
        print(f"Converted SVG imports in {file_path}")
    else:
        print(convert_svg_to_imports(sys.stdin.read()))
