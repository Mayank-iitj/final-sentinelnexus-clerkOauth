import os
import re

src_dir = r"c:\Users\MS\final-sentinelnexus-clerkOauth\frontend\src"

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".jsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            if "import SpecularButton" in content and "components/SpecularButton" in content:
                # Find the import line
                lines = content.splitlines()
                new_lines = []
                import_line = None
                
                for line in lines:
                    if line.strip().startswith("import SpecularButton"):
                        import_line = line
                    else:
                        new_lines.append(line)
                        
                if import_line:
                    # Insert after "use client" if it exists, otherwise at the top
                    insert_idx = 0
                    if new_lines and new_lines[0].startswith('"use client"'):
                        insert_idx = 1
                        
                    new_lines.insert(insert_idx, import_line)
                    
                    new_content = "\n".join(new_lines) + ("\n" if content.endswith("\n") else "")
                    
                    if new_content != content:
                        with open(filepath, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        print(f"Fixed {filepath}")
