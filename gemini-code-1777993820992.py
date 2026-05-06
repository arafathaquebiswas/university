import os

def generate_folder_tree_to_file(startpath, output_filename):
    try:
        # 'w' means write mode, encoding='utf-8' handles special characters like │ and ├──
        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(f"--- Project Structure for: {startpath} ---\n\n")
            
            for root, dirs, files in os.walk(startpath):
                # Calculate depth
                level = root.replace(startpath, '').count(os.sep)
                indent = '│   ' * level
                
                # Write directory name
                f.write(f'{indent}├── {os.path.basename(root)}/\n')
                
                # Write file names
                subindent = '│   ' * (level + 1)
                for file in files:
                    f.write(f'{subindent}└── {file}\n')
                    
        print(f"Done! The structure has been saved to: {output_filename}")
    except Exception as e:
        print(f"An error occurred: {e}")

# --- CONFIGURATION ---
folder_to_scan = r"D:\470 Project\university-master"
output_file = "project_structure.txt"

if os.path.exists(folder_to_scan):
    generate_folder_tree_to_file(folder_to_scan, output_file)
else:
    print("Error: The path you provided does not exist.")