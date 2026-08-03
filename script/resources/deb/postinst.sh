#!/bin/bash

set -e

PROFILE_D_FILE="/etc/profile.d/github-desktop.sh"
INSTALL_DIR="/usr/lib/github-desktop"
CLI_DIR="$INSTALL_DIR/resources/app/static"

case "$1" in
    configure)
      # add executable permissions for CLI interface
      chmod +x "$CLI_DIR"/github || :
      # check if this is a dev install or standard
      if [ -f "$INSTALL_DIR/github-desktop-dev" ]; then
	      BINARY_NAME="github-desktop-dev"
      else
	      BINARY_NAME="github-desktop"
      fi
      # create symbolic links to /usr/bin directory
      ln -f -s "$INSTALL_DIR"/$BINARY_NAME /usr/bin || :
      ln -f -s "$CLI_DIR"/github /usr/bin || :
      
      # ARM64-specific fixes for icon visibility
      ARCH=$(uname -m)
      if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
          echo "ARM64 detected - applying icon visibility fixes..."
          
          # Make ARM64 fix script executable if it exists
          ARM64_FIX_SCRIPT="$INSTALL_DIR/fix-arm64-desktop-icons.sh"
          if [ -f "$ARM64_FIX_SCRIPT" ]; then
              chmod +x "$ARM64_FIX_SCRIPT" || :
          fi
          
          # Ensure icon directories exist and have correct permissions
          mkdir -p /usr/share/icons/hicolor/{32x32,48x48,64x64,128x128,256x256,512x512,1024x1024}/apps || :
          mkdir -p /usr/share/pixmaps || :
          
          # Set proper permissions for all icon files
          find /usr/share/icons/hicolor -name "github-desktop.png" -exec chmod 644 {} \; 2>/dev/null || :
          chmod 644 /usr/share/pixmaps/github-desktop.png 2>/dev/null || :
          chmod 644 /usr/share/applications/github-desktop.desktop 2>/dev/null || :
          
          # Force multiple icon cache updates for ARM64
          if command -v gtk-update-icon-cache >/dev/null 2>&1; then
              gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || :
              gtk-update-icon-cache --force --ignore-theme-index /usr/share/icons/hicolor 2>/dev/null || :
          fi
          
          if command -v xdg-icon-resource >/dev/null 2>&1; then
              xdg-icon-resource forceupdate 2>/dev/null || :
          fi
          
          if command -v xdg-desktop-menu >/dev/null 2>&1; then
              xdg-desktop-menu forceupdate 2>/dev/null || :
          fi
          
          echo "ARM64 icon fixes applied. If icons don't appear, please log out and back in."
      fi
    ;;

    abort-upgrade|abort-remove|abort-deconfigure)
    ;;

    *)
      echo "postinst called with unknown argument \`$1'" >&2
      exit 1
    ;;
esac

exit 0
