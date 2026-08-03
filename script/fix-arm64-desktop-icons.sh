#!/bin/bash

# ARM64 Desktop Icon Fix Script
# This script addresses specific issues with icon display on ARM64 systems

set -e

echo "=== ARM64 Desktop Icon Fix ==="

# Check if we're on ARM64
ARCH=$(uname -m)
if [ "$ARCH" != "aarch64" ] && [ "$ARCH" != "arm64" ]; then
    echo "Not on ARM64 architecture, skipping ARM64-specific fixes"
    exit 0
fi

echo "ARM64 architecture detected: $ARCH"

# Paths
HICOLOR_DIR="/usr/share/icons/hicolor"
PIXMAPS_DIR="/usr/share/pixmaps"
APPS_DIR="/usr/share/applications"
DESKTOP_FILE="$APPS_DIR/github-desktop.desktop"

# Function to fix icon permissions and cache
fix_icon_permissions() {
    echo "Fixing icon file permissions..."
    
    if [ -d "$HICOLOR_DIR" ]; then
        find "$HICOLOR_DIR" -name "github-desktop.png" -type f -exec chmod 644 {} \; 2>/dev/null || true
        echo "Set permissions for hicolor icons"
    fi
    
    if [ -f "$PIXMAPS_DIR/github-desktop.png" ]; then
        chmod 644 "$PIXMAPS_DIR/github-desktop.png" 2>/dev/null || true
        echo "Set permissions for pixmaps icon"
    fi
    
    if [ -f "$DESKTOP_FILE" ]; then
        chmod 644 "$DESKTOP_FILE" 2>/dev/null || true
        echo "Set permissions for desktop file"
    fi
}

# Function to update icon cache with ARM64-specific methods
update_icon_cache_arm64() {
    echo "Updating icon cache for ARM64..."
    
    # Standard gtk icon cache update
    if command -v gtk-update-icon-cache >/dev/null 2>&1; then
        gtk-update-icon-cache -f -t "$HICOLOR_DIR" 2>/dev/null || true
        gtk-update-icon-cache --force --ignore-theme-index "$HICOLOR_DIR" 2>/dev/null || true
        echo "Updated GTK icon cache"
    fi
    
    # XDG icon resource update
    if command -v xdg-icon-resource >/dev/null 2>&1; then
        xdg-icon-resource forceupdate 2>/dev/null || true
        echo "Forced XDG icon resource update"
    fi
    
    # Update desktop database
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$APPS_DIR" 2>/dev/null || true
        echo "Updated desktop database"
    fi
    
    # XDG desktop menu update
    if command -v xdg-desktop-menu >/dev/null 2>&1; then
        xdg-desktop-menu forceupdate 2>/dev/null || true
        echo "Forced XDG desktop menu update"
    fi
}

# Function to validate desktop file
validate_desktop_file() {
    echo "Validating desktop file..."
    
    if [ -f "$DESKTOP_FILE" ]; then
        if command -v desktop-file-validate >/dev/null 2>&1; then
            if desktop-file-validate "$DESKTOP_FILE" 2>/dev/null; then
                echo "Desktop file validation passed"
            else
                echo "Desktop file validation failed, but continuing..."
            fi
        else
            echo "desktop-file-validate not available, skipping validation"
        fi
    else
        echo "Desktop file not found at $DESKTOP_FILE"
    fi
}

# Function to create additional icon symlinks for ARM64 compatibility
create_icon_symlinks() {
    echo "Creating additional icon symlinks for ARM64 compatibility..."
    
    # Find the best available icon size
    BEST_ICON=""
    for size in 64x64 128x128 256x256 48x48 32x32; do
        if [ -f "$HICOLOR_DIR/$size/apps/github-desktop.png" ]; then
            BEST_ICON="$HICOLOR_DIR/$size/apps/github-desktop.png"
            echo "Found icon at size $size"
            break
        fi
    done
    
    if [ -n "$BEST_ICON" ]; then
        # Create symlink in pixmaps if it doesn't exist
        if [ ! -f "$PIXMAPS_DIR/github-desktop.png" ]; then
            ln -sf "$BEST_ICON" "$PIXMAPS_DIR/github-desktop.png" 2>/dev/null || true
            echo "Created pixmaps symlink"
        fi
        
        # Create additional symlinks for common locations and Ubuntu 24.04 themes
        for alt_path in "/usr/share/icons/gnome" "/usr/share/icons/Adwaita" "/usr/share/icons/Yaru" "/usr/share/icons/ubuntu-mono-dark" "/usr/share/icons/ubuntu-mono-light"; do
            if [ -d "$alt_path" ]; then
                mkdir -p "$alt_path/48x48/apps" 2>/dev/null || true
                ln -sf "$BEST_ICON" "$alt_path/48x48/apps/github-desktop.png" 2>/dev/null || true
                
                mkdir -p "$alt_path/64x64/apps" 2>/dev/null || true
                ln -sf "$BEST_ICON" "$alt_path/64x64/apps/github-desktop.png" 2>/dev/null || true
                
                echo "Created symlink in $alt_path"
            fi
        done
        
        # Create fallback in /usr/share/icons for direct access
        mkdir -p "/usr/share/icons/github-desktop" 2>/dev/null || true
        ln -sf "$BEST_ICON" "/usr/share/icons/github-desktop/github-desktop.png" 2>/dev/null || true
    else
        echo "No suitable icon found for symlinking"
    fi
}

# Main execution
echo "Starting ARM64 desktop icon fixes..."

fix_icon_permissions
create_icon_symlinks
validate_desktop_file
update_icon_cache_arm64

echo "=== ARM64 Desktop Icon Fix Completed ==="
echo "If icons still don't appear, try logging out and back in, or run:"
echo "  gtk-update-icon-cache -f /usr/share/icons/hicolor"
echo "  xdg-desktop-menu forceupdate"
