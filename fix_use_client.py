import os

src_dir = r"c:\Users\MS\final-sentinelnexus-clerkOauth\frontend\src"

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".jsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
                
            has_use_client = any(line.strip().replace("'", '"') == '"use client";' or line.strip().replace("'", '"') == '"use client"' for line in lines)
            
            if has_use_client:
                # check if it's the very first non-empty line
                first_non_empty = -1
                for i, line in enumerate(lines):
                    if line.strip():
                        first_non_empty = i
                        break
                        
                if first_non_empty != -1:
                    first_line_clean = lines[first_non_empty].strip().replace("'", '"')
                    if first_line_clean not in ('"use client";', '"use client"'):
                        # Need to move it
                        new_lines = []
                        use_client_found = False
                        for line in lines:
                            if (line.strip().replace("'", '"') == '"use client";' or line.strip().replace("'", '"') == '"use client"') and not use_client_found:
                                use_client_found = True
                            else:
                                new_lines.append(line)
                        
                        new_lines.insert(0, '"use client";\n')
                        
                        with open(filepath, "w", encoding="utf-8") as f:
                            f.writelines(new_lines)
                        print(f"Fixed use client in {filepath}")
