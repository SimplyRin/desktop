#!/bin/bash

# Fix Linux dependencies script  
# This script ensures critical libraries are available for Linux packaging (deb/rpm)

set -e

echo "=== Linux Dependencies Fix ==="

# Detect target architecture (x64 only)
ARCH=$(uname -m)

echo "Host architecture: $ARCH"

# Check for essential libraries
echo "Checking for essential compression libraries..."
libs_to_check=("libz.so.1" "libbz2.so.1" "liblzma.so.5" "libzstd.so.1")

for lib in "${libs_to_check[@]}"; do
    if ldconfig -p | grep -q "$lib"; then
        echo "✓ Found $lib"
        ldconfig -p | grep "$lib" | head -1
    else
        echo "✗ Missing $lib"
    fi
done

# Create library symlinks if needed
echo "Creating library symlinks for Linux packaging..."

# Standard library locations for x64 only
lib_dirs_x64=("/usr/lib/x86_64-linux-gnu" "/lib/x86_64-linux-gnu" "/usr/lib" "/lib")

create_symlink_if_needed() {
    local src="$1"
    local dest="$2"
    
    if [ -f "$src" ] && [ ! -f "$dest" ]; then
        echo "Creating symlink: $dest -> $src"
        sudo ln -sf "$src" "$dest" || echo "Failed to create symlink (may need sudo)"
    fi
}

# Function to fix libraries for specific architecture
fix_libraries_for_arch() {
    local arch_dirs=("$@")
    
    for dir in "${arch_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo "Checking directory: $dir"
            
            # Ensure libz.so is available
            if [ -f "$dir/libz.so.1" ]; then
                create_symlink_if_needed "$dir/libz.so.1" "$dir/libz.so"
            fi
            
            # Ensure libbz2.so is available (handle different naming)
            if [ -f "$dir/libbz2.so.1.0" ]; then
                create_symlink_if_needed "$dir/libbz2.so.1.0" "$dir/libbz2.so.1"
                create_symlink_if_needed "$dir/libbz2.so.1.0" "$dir/libbz2.so"
            elif [ -f "$dir/libbz2.so.1" ]; then
                create_symlink_if_needed "$dir/libbz2.so.1" "$dir/libbz2.so"
            fi
            
            # Ensure liblzma.so is available
            if [ -f "$dir/liblzma.so.5" ]; then
                create_symlink_if_needed "$dir/liblzma.so.5" "$dir/liblzma.so"
            fi
            
            # Ensure libzstd.so is available
            if [ -f "$dir/libzstd.so.1" ]; then
                create_symlink_if_needed "$dir/libzstd.so.1" "$dir/libzstd.so"
            fi
        fi
    done
}

# Fix libraries for x64 architecture only
echo "Fixing x64 libraries..."
fix_libraries_for_arch "${lib_dirs_x64[@]}"

# Set environment variables for electron-builder (x64 only)
export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu:/usr/lib:/lib:${LD_LIBRARY_PATH:-}"

echo "LD_LIBRARY_PATH set to: $LD_LIBRARY_PATH"

# Verify libraries are now accessible
echo "Final library check:"
for lib in "${libs_to_check[@]}"; do
    if ldconfig -p | grep -q "$lib"; then
        echo "✓ $lib is accessible"
    else
        echo "⚠ $lib may still not be accessible"
    fi
done

echo "=== Dependencies fix completed ==="
