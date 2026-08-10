import os
import re

src_dir = r"c:\Users\MS\final-sentinelnexus-clerkOauth\frontend\src"

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".jsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            if "<button" in content or "</button>" in content:
                # Replace <button with <SpecularButton
                new_content = re.sub(r'<button\b', r'<SpecularButton', content)
                new_content = re.sub(r'</button>', r'</SpecularButton>', new_content)
                
                # Add import if not exists
                if "import SpecularButton" not in content:
                    rel_path = os.path.relpath(filepath, src_dir)
                    depth = rel_path.count(os.sep)
                    if depth == 0:
                        import_path = "./components/SpecularButton"
                    else:
                        import_path = "../" * depth + "components/SpecularButton"
                    
                    import_stmt = f"import SpecularButton from '{import_path.replace(os.sep, '/')}';"
                    
                    # insert after last import
                    lines = new_content.splitlines()
                    last_import_idx = -1
                    for i, line in enumerate(lines):
                        if line.startswith("import "):
                            last_import_idx = i
                    
                    if last_import_idx != -1:
                        lines.insert(last_import_idx + 1, import_stmt)
                    else:
                        lines.insert(0, import_stmt)
                        
                    new_content = "\n".join(lines) + ("\n" if content.endswith("\n") else "")
                
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
