#!/bin/bash

# GitPeach Desktop Linux post-remove script.
#
# See linux-after-install.sh for the macro substitution caveat: shell variables
# must be written as $VAR, without braces.

set -e

# dpkg passes "upgrade" here when the package is being replaced; rpm passes the
# number of copies that will remain, so 1 on upgrade. In both cases the new
# package's post-install has already recreated (or will recreate) the symlink,
# and tearing it down here would leave the upgrade without one.
case "$1" in
upgrade | 1)
    exit 0
    ;;
esac

if type update-alternatives >/dev/null 2>&1; then
    update-alternatives --remove '${executable}' '/usr/bin/${executable}' || true
else
    rm -f '/usr/bin/${executable}'
fi

if type update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications || true
fi

if type update-mime-database >/dev/null 2>&1; then
    update-mime-database /usr/share/mime || true
fi

if type gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache --force --ignore-theme-index /usr/share/icons/hicolor || true
fi

echo "GitPeach Desktop Linux removal completed"
