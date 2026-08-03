#!/bin/bash

# GitPeach Desktop Linux Post-Install Script

set -e

echo "GitPeach Desktop Linux installation completed"

# Verify Git is available
if command -v git >/dev/null 2>&1; then
    echo "Git is available: $(git --version)"
else
    echo "Warning: Git is not installed. GitPeach Desktop requires Git to function properly."
    echo "Please install Git using your package manager:"
    echo "  Ubuntu/Debian: sudo apt install git"
    echo "  Red Hat/Fedora: sudo dnf install git"
fi

# Update desktop database if available
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications || true
fi

# Update icon cache if available
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor || true
    # Force icon cache update with different flags for ARM64 compatibility
    gtk-update-icon-cache --force --ignore-theme-index /usr/share/icons/hicolor || true
fi

# Update MIME database if available
if command -v update-mime-database >/dev/null 2>&1; then
    update-mime-database /usr/share/mime || true
fi

# Additional steps for ARM64 icon visibility fix
ARCH=$(uname -m)
if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    echo "ARM64 detected - applying additional icon fixes"
    
    # Ensure proper permissions on icon files
    if [ -d "/usr/share/icons/hicolor" ]; then
        find /usr/share/icons/hicolor -name "github-desktop.png" -exec chmod 644 {} \; || true
    fi
    
    # Create icon symlinks for better compatibility
    if [ -f "/usr/share/icons/hicolor/64x64/apps/github-desktop.png" ]; then
        # Create fallback in pixmaps
        ln -sf "/usr/share/icons/hicolor/64x64/apps/github-desktop.png" "/usr/share/pixmaps/github-desktop.png" || true
        
        # Create in common theme directories for Ubuntu 24.04
        for theme_dir in "/usr/share/icons/Yaru" "/usr/share/icons/ubuntu-mono-dark" "/usr/share/icons/ubuntu-mono-light" "/usr/share/icons/Adwaita"; do
            if [ -d "$theme_dir" ]; then
                mkdir -p "$theme_dir/64x64/apps" 2>/dev/null || true
                ln -sf "/usr/share/icons/hicolor/64x64/apps/github-desktop.png" "$theme_dir/64x64/apps/github-desktop.png" 2>/dev/null || true
                
                mkdir -p "$theme_dir/48x48/apps" 2>/dev/null || true
                ln -sf "/usr/share/icons/hicolor/64x64/apps/github-desktop.png" "$theme_dir/48x48/apps/github-desktop.png" 2>/dev/null || true
                
                mkdir -p "$theme_dir/32x32/apps" 2>/dev/null || true
                ln -sf "/usr/share/icons/hicolor/32x32/apps/github-desktop.png" "$theme_dir/32x32/apps/github-desktop.png" 2>/dev/null || true
            fi
        done
    fi
    
    # Force desktop entry validation
    if [ -f "/usr/share/applications/github-desktop.desktop" ]; then
        chmod 644 /usr/share/applications/github-desktop.desktop || true
        # Try to validate desktop entry if desktop-file-validate is available
        if command -v desktop-file-validate >/dev/null 2>&1; then
            desktop-file-validate /usr/share/applications/github-desktop.desktop || true
        fi
    fi
    
    # Update XDG desktop database specifically
    if command -v xdg-desktop-menu >/dev/null 2>&1; then
        xdg-desktop-menu forceupdate || true
    fi
    
    # Refresh icon theme cache with additional methods
    if command -v xdg-icon-resource >/dev/null 2>&1; then
        xdg-icon-resource forceupdate || true
    fi
    
    # Update all known icon theme caches
    for theme_dir in "/usr/share/icons/hicolor" "/usr/share/icons/Yaru" "/usr/share/icons/Adwaita"; do
        if [ -d "$theme_dir" ] && command -v gtk-update-icon-cache >/dev/null 2>&1; then
            gtk-update-icon-cache -f -t "$theme_dir" 2>/dev/null || true
        fi
    done
    
    # Run comprehensive ARM64 icon fix script if available
    ARM64_FIX_SCRIPT="/usr/lib/github-desktop/fix-arm64-desktop-icons.sh"
    if [ -f "$ARM64_FIX_SCRIPT" ]; then
        echo "Running comprehensive ARM64 icon fix..."
        chmod +x "$ARM64_FIX_SCRIPT" 2>/dev/null || true
        bash "$ARM64_FIX_SCRIPT" || true
    fi
fi

echo "Installation verification complete"
