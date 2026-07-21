#!/usr/bin/env python3
"""
Combined Directory Analyzer
1. Prints directory structure excluding specified folders
2. Copies contents of specified files into a combined text file
"""

import os
import sys
from pathlib import Path
from datetime import datetime

def should_exclude_folder(folder_name):
    """
    Check if a folder should be excluded from the tree
    """
    excluded_folders = {
        'node_modules',
        '.next',
        '.git',
        '__pycache__',
        '.vscode',
        '.idea',
        'coverage',
        'dist',
        'build',
        '.cache',
        '.turbo'
    }
    return folder_name in excluded_folders

def should_exclude_file(file_name):
    """
    Check if a file should be excluded from the tree
    """
    excluded_extensions = {
        '.pyc',
        '.pyo',
        '.pyd',
        '.so',
        '.dll'
    }
    excluded_files = {
        '.DS_Store',
        'Thumbs.db',
        '.gitkeep'
    }
    
    # Check file extensions
    _, ext = os.path.splitext(file_name)
    if ext.lower() in excluded_extensions:
        return True
    
    # Check specific file names
    if file_name in excluded_files:
        return True
    
    return False

def print_tree(directory, prefix="", is_last=True, max_depth=None, current_depth=0):
    """
    Recursively print directory tree structure
    """
    if max_depth is not None and current_depth > max_depth:
        return
    
    directory = Path(directory)
    
    # Print current directory
    connector = "└── " if is_last else "├── "
    print(f"{prefix}{connector}{directory.name}/")
    
    # Update prefix for children
    extension = "    " if is_last else "│   "
    new_prefix = prefix + extension
    
    try:
        # Get all items in directory
        items = list(directory.iterdir())
        
        # Separate and filter directories and files
        directories = []
        files = []
        
        for item in items:
            if item.is_dir() and not should_exclude_folder(item.name):
                directories.append(item)
            elif item.is_file() and not should_exclude_file(item.name):
                files.append(item)
        
        # Sort directories and files separately
        directories.sort(key=lambda x: x.name.lower())
        files.sort(key=lambda x: x.name.lower())
        
        # Combine directories first, then files
        all_items = directories + files
        
        # Print all items
        for i, item in enumerate(all_items):
            is_last_item = (i == len(all_items) - 1)
            
            if item.is_dir():
                # Recursively print subdirectory
                print_tree(item, new_prefix, is_last_item, max_depth, current_depth + 1)
            else:
                # Print file
                connector = "└── " if is_last_item else "├── "
                print(f"{new_prefix}{connector}{item.name}")
                
    except PermissionError:
        print(f"{new_prefix}[Permission Denied]")
    except Exception as e:
        print(f"{new_prefix}[Error: {e}]")

def print_directory_tree(target_directory=".", max_depth=None):
    """
    Print the directory tree for the specified directory
    """
    # Convert to Path object
    target_path = Path(target_directory).resolve()
    
    # Check if directory exists
    if not target_path.exists():
        print(f"Error: Directory '{target_directory}' does not exist.")
        return False
    
    if not target_path.is_dir():
        print(f"Error: '{target_directory}' is not a directory.")
        return False
    
    # Print header
    print(f"Directory Tree for: {target_path}")
    print("=" * 80)
    
    # Print the tree
    print(f"{target_path.name}/")
    
    try:
        # Get all items in root directory
        items = list(target_path.iterdir())
        
        # Separate and filter directories and files
        directories = []
        files = []
        
        for item in items:
            if item.is_dir() and not should_exclude_folder(item.name):
                directories.append(item)
            elif item.is_file() and not should_exclude_file(item.name):
                files.append(item)
        
        # Sort directories and files separately
        directories.sort(key=lambda x: x.name.lower())
        files.sort(key=lambda x: x.name.lower())
        
        # Combine directories first, then files
        all_items = directories + files
        
        # Print all items
        for i, item in enumerate(all_items):
            is_last_item = (i == len(all_items) - 1)
            
            if item.is_dir():
                # Recursively print subdirectory
                print_tree(item, "", is_last_item, max_depth, 1)
            else:
                # Print file
                connector = "└── " if is_last_item else "├── "
                print(f"{connector}{item.name}")
                
    except PermissionError:
        print("[Permission Denied]")
        return False
    except Exception as e:
        print(f"[Error: {e}]")
        return False
    
    # Print footer
    print("\n" + "=" * 80)
    print("Directory tree completed!")
    if max_depth is not None:
        print(f"Maximum depth: {max_depth}")
    print("Excluded folders: node_modules, .next, .git, __pycache__, .vscode, .idea, coverage, dist, build, .cache, .turbo")
    
    return True

def copy_file_contents():
    """
    Copy contents of specified files into a combined text file
    """
    # List of files to copy content from
    files = [
        r"app\admin\events\[eventId]\edit\page.js",
        r"app\admin\events\[eventId]\page.js",
        r"app\admin\events\[eventId]\RegistrationsList.js",
        r"app\admin\events\create\page.js",
        r"app\admin\events\page.js",
        r"app\admin\givesr\page.js",
        r"app\admin\layout.js",
        r"app\admin\members\[userId]\page.js",
        r"app\admin\members\page.js",
        r"app\admin\page.js",
        r"app\api\admin\events\[eventId]\registrations\[registrationId]\route.js",
        r"app\api\admin\events\[eventId]\registrations\route.js",
        r"app\api\admin\events\[eventId]\route.js",
        r"app\api\admin\events\route.js",
        r"app\api\admin\members\[userId]\approve\route.js",
        r"app\api\admin\members\[userId]\role\route.js",
        r"app\api\admin\members\[userId]\route.js",
        r"app\api\admin\users\grant-admin\route.js",
        r"app\api\auth\login\route.js",
        r"app\api\auth\login\send-otp\route.js",
        r"app\api\auth\register\route.js",
        r"app\api\auth\register\send-otp\route.js",
        r"app\api\auth\register\verify-otp\route.js",
        r"app\api\auth\set-password\route.js",
        r"app\api\events\[eventId]\register\route.js",
        r"app\api\events\public\route.js",
        r"app\auth\action\page.js",
        r"app\dashboard\page.js",
        r"app\dashboard\settings\page.js",
        r"app\events\[eventId]\page.js",
        r"app\events\[eventId]\register\page.js",
        r"app\events\page.js",
        r"app\globals.css",
        r"app\layout.js",
        r"app\page.js",
        r"app\register\login\page.js",
        r"app\register\page.js",
        r"app\register\reset-password\page.js",
        "components.json",
        r"components\auth\AdminRoute.js",
        r"components\auth\LoginModal.js",
        r"components\auth\ProtectedRoute.js",
        r"components\theme-provider.jsx",
        r"components\ui\alert-dialog.jsx",
        r"components\ui\badge.jsx",
        r"components\ui\button.jsx",
        r"components\ui\calendar.jsx",
        r"components\ui\card.jsx",
        r"components\ui\checkbox.jsx",
        r"components\ui\command.jsx",
        r"components\ui\dialog.jsx",
        r"components\ui\dropdown-menu.jsx",
        r"components\ui\form.jsx",
        r"components\ui\input.jsx",
        r"components\ui\label.jsx",
        r"components\ui\multi-select.js",
        r"components\ui\popover.jsx",
        r"components\ui\select.jsx",
        r"components\ui\sheet.jsx",
        r"components\ui\switch.jsx",
        r"components\ui\table.jsx",
        r"components\ui\tabs.jsx",
        r"components\ui\textarea.jsx",
        "eslint.config.mjs",
        "firebase.json",
        "jsconfig.json",
        r"lib\auth-helper.js",
        r"lib\AuthContext.js",
        r"lib\firebase-admin.js",
        r"lib\firebase.js",
        r"lib\nodemailer.js",
        r"lib\utils.js",
        "next.config.mjs",
        "package.json",
        "postcss.config.mjs",
        "PROJECT_STRUCTURE.md",
        "README.md",
        "WARP.md",
    ]

    output_file = "combined_output.txt"
    
    print(f"\n{'='*80}")
    print("COPYING FILE CONTENTS")
    print(f"{'='*80}")
    print(f"Copying contents of {len(files)} files to '{output_file}'...")
    
    files_processed = 0
    files_found = 0
    files_not_found = 0
    
    with open(output_file, "w", encoding="utf-8", errors="ignore") as out:
        # Write header
        out.write(f"IEDC Website - Combined File Contents\n")
        out.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        out.write(f"Total files to process: {len(files)}\n")
        out.write(f"{'='*100}\n\n")
        
        for f in files:
            files_processed += 1
            print(f"Processing ({files_processed}/{len(files)}): {f}")
            
            if os.path.exists(f):
                files_found += 1
                out.write(f"FILE: {f}\n")
                out.write(f"{'='*80}\n")
                try:
                    with open(f, "r", encoding="utf-8", errors="ignore") as infile:
                        content = infile.read()
                        out.write(content)
                        if not content.endswith('\n'):
                            out.write('\n')
                except Exception as e:
                    out.write(f"[Error reading file: {e}]\n")
                    print(f"  ⚠️  Error reading file: {e}")
            else:
                files_not_found += 1
                out.write(f"FILE: {f}\n")
                out.write(f"{'='*80}\n")
                out.write("[File not found]\n")
                print(f"  ❌ File not found")
            
            out.write("\n" + "-"*100 + "\n\n")  # separator
        
        # Write footer
        out.write(f"\n{'='*100}\n")
        out.write(f"SUMMARY:\n")
        out.write(f"Total files processed: {files_processed}\n")
        out.write(f"Files found: {files_found}\n")
        out.write(f"Files not found: {files_not_found}\n")
        out.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    print(f"\n✅ All contents copied to '{output_file}'")
    print(f"📊 Summary:")
    print(f"   • Total files processed: {files_processed}")
    print(f"   • Files found: {files_found}")
    print(f"   • Files not found: {files_not_found}")
    
    return True

def main():
    """
    Main function to run both operations
    """
    print("🚀 IEDC Website Directory Analyzer")
    print("=" * 80)
    
    # Get command line arguments
    target_directory = "."
    max_depth = None
    
    if len(sys.argv) > 1:
        target_directory = sys.argv[1]
    
    if len(sys.argv) > 2:
        try:
            max_depth = int(sys.argv[2])
        except ValueError:
            print("Warning: Invalid max depth specified. Using unlimited depth.")
    
    # Step 1: Print directory tree
    print("📁 STEP 1: GENERATING DIRECTORY TREE")
    print("-" * 80)
    
    success = print_directory_tree(target_directory, max_depth)
    
    if not success:
        print("❌ Failed to generate directory tree. Exiting.")
        return
    
    # Step 2: Copy file contents
    print("\n📄 STEP 2: COPYING FILE CONTENTS")
    print("-" * 80)
    
    copy_file_contents()
    
    # Final summary
    print(f"\n🎉 COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print("Both operations completed:")
    print("1. ✅ Directory tree printed to console")
    print("2. ✅ File contents saved to 'combined_output.txt'")

if __name__ == "__main__":
    main()
