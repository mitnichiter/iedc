#!/usr/bin/env python3
"""
Directory Tree Printer
Recursively prints directory structure excluding specified folders like node_modules and .next
"""

import os
import sys
from pathlib import Path

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
    
    Args:
        directory: Path to the directory
        prefix: String prefix for tree formatting
        is_last: Whether this is the last item in its parent directory
        max_depth: Maximum depth to traverse (None for unlimited)
        current_depth: Current depth level
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

def main():
    """
    Main function to run the directory tree printer
    """
    # Get command line arguments
    if len(sys.argv) > 1:
        target_directory = sys.argv[1]
    else:
        target_directory = "."
    
    # Check if max depth is specified
    max_depth = None
    if len(sys.argv) > 2:
        try:
            max_depth = int(sys.argv[2])
        except ValueError:
            print("Warning: Invalid max depth specified. Using unlimited depth.")
    
    # Convert to Path object
    target_path = Path(target_directory).resolve()
    
    # Check if directory exists
    if not target_path.exists():
        print(f"Error: Directory '{target_directory}' does not exist.")
        return
    
    if not target_path.is_dir():
        print(f"Error: '{target_directory}' is not a directory.")
        return
    
    # Print header
    print(f"Directory Tree for: {target_path}")
    print("=" * 50)
    
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
    except Exception as e:
        print(f"[Error: {e}]")
    
    # Print footer with summary
    print("\n" + "=" * 50)
    print("Tree generation completed!")
    if max_depth is not None:
        print(f"Maximum depth: {max_depth}")
    print("Excluded folders: node_modules, .next, .git, __pycache__, .vscode, .idea, coverage, dist, build, .cache, .turbo")

if __name__ == "__main__":
    main()
