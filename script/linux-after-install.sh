#!/bin/bash

# GitPeach Desktop Linux post-install script.
#
# Pointing deb.afterInstall/rpm.afterInstall here replaces electron-builder's
# own after-install template wholesale, so everything that template did has to
# be repeated below - in particular the /usr/bin symlink and the chrome-sandbox
# mode, which this script used to drop on the floor.
#
# The "executable" and "sanitizedProductName" macros below are expanded by
# electron-builder before the script is packaged. It substitutes every
# dollar-brace occurrence and hard-errors on ones it does not recognise, so
# plain shell variables here must be written as $VAR without the braces - and
# that goes for comments too.

set -e

APP_DIR='/opt/${sanitizedProductName}'

# Put the executable on PATH: update-alternatives where it exists, a plain
# symlink otherwise.
if type update-alternatives >/dev/null 2>&1; then
    # Drop a previous plain symlink so update-alternatives can take over.
    if [ -L '/usr/bin/${executable}' ] && [ -e '/usr/bin/${executable}' ] &&
        [ "$(readlink '/usr/bin/${executable}')" != '/etc/alternatives/${executable}' ]; then
        rm -f '/usr/bin/${executable}'
    fi

    update-alternatives --install '/usr/bin/${executable}' '${executable}' \
        "$APP_DIR/${executable}" 100 ||
        ln -sf "$APP_DIR/${executable}" '/usr/bin/${executable}'
else
    ln -sf "$APP_DIR/${executable}" '/usr/bin/${executable}'
fi

# Chromium only needs the SUID sandbox helper on kernels without working user
# namespaces; leaving it setuid elsewhere is what it complains about at startup.
if [ -e "$APP_DIR/chrome-sandbox" ]; then
    if { [ -L /proc/self/ns/user ] && unshare --user true; } >/dev/null 2>&1; then
        chmod 0755 "$APP_DIR/chrome-sandbox" || true
    else
        chmod 4755 "$APP_DIR/chrome-sandbox" || true
    fi
fi

# Verify Git is available
if command -v git >/dev/null 2>&1; then
    echo "Git is available: $(git --version)"
else
    echo "Warning: Git is not installed. GitPeach Desktop requires Git to function properly."
    echo "Please install Git using your package manager:"
    echo "  Ubuntu/Debian: sudo apt install git"
    echo "  Red Hat/Fedora: sudo dnf install git"
fi

# Pick up the desktop entry, its scheme handlers, and the icons electron-builder
# wrote into /usr/share/icons/hicolor.
if type update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications || true
fi

if type update-mime-database >/dev/null 2>&1; then
    update-mime-database /usr/share/mime || true
fi

if type gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache --force --ignore-theme-index /usr/share/icons/hicolor || true
fi

echo "GitPeach Desktop Linux installation completed"
