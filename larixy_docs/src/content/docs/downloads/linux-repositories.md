---
# SPDX-License-Identifier: AGPL-3.0-or-later
title: Linux repositories
description: How to add the apt, dnf, pacman and Flatpak repositories Larixy publishes.
---

Larixy publishes apt, dnf, pacman and Flatpak repositories, all signed with the key whose fingerprint is `09D01339EE128925F75E675C855C5BDE34D205D2`. You pick the channel with the entry file on apt and dnf, by package name on pacman and by app ID on Flatpak.

| Package manager | Pick stable with | Pick canary with |
| --- | --- | --- |
| apt | `larixy.sources` | `larixy-canary.sources` |
| dnf | `larixy.repo` | `larixy-canary.repo` |
| pacman | `larixy` | `larixy-canary` |
| Flatpak | `app.larixy.Larixy` | `app.larixy.LarixyCanary` |

## Debian and Ubuntu

```sh
sudo install -d -m 0755 /etc/apt/keyrings
sudo curl -fsSL -o /etc/apt/keyrings/larixy-archive-keyring.gpg \
  https://pkgs.larixy.com/keys/larixy-archive-keyring.gpg
sudo curl -fsSL -o /etc/apt/sources.list.d/larixy.sources \
  https://pkgs.larixy.com/deb/larixy.sources
sudo apt update && sudo apt install larixy
```

A `.deb` you downloaded only gets updates after you add the entry for its channel. For canary, add the canary entry and install `larixy-canary`.

```sh
sudo curl -fsSL -o /etc/apt/sources.list.d/larixy-canary.sources \
  https://pkgs.larixy.com/deb/larixy-canary.sources
sudo apt update && sudo apt install larixy-canary
```

## Fedora and RHEL

RHEL, Rocky, Alma and CentOS Stream need `sudo dnf install epel-release` first, because the package depends on `libXScrnSaver`.

```sh
sudo curl -fsSL -o /etc/yum.repos.d/larixy.repo \
  https://pkgs.larixy.com/rpm/larixy.repo
sudo dnf install larixy
```

dnf asks you to import the signing key on the first install, once for the repository and once for the package. Check that the fingerprint matches the one above both times.

For canary, add the canary entry and install `larixy-canary`.

```sh
sudo curl -fsSL -o /etc/yum.repos.d/larixy-canary.repo \
  https://pkgs.larixy.com/rpm/larixy-canary.repo
sudo dnf install larixy-canary
```

dnf keeps the repository metadata for six hours, so a new build can take up to six hours to show up. Run `sudo dnf --refresh upgrade` to check sooner.

## Arch Linux

Add the signing key to the pacman keyring once, or pacman refuses the repository with `unknown trust`.

```sh
sudo pacman-key --init
curl -fsSL -o /tmp/larixy-archive-keyring.asc \
  https://pkgs.larixy.com/keys/larixy-archive-keyring.asc
sudo pacman-key --add /tmp/larixy-archive-keyring.asc
sudo pacman-key --lsign-key 09D01339EE128925F75E675C855C5BDE34D205D2
```

Then add the repository and install `larixy` or `larixy-canary`.

```sh
sudo tee -a /etc/pacman.conf >/dev/null <<'REPO'

[larixy]
SigLevel = Required TrustedOnly
Server = https://pkgs.larixy.com/arch/$repo/os/$arch
REPO
sudo pacman -Syu larixy
```

## Flatpak

Stable is also on Flathub as `app.larixy.Larixy`, but canary is only in the Larixy repository. The reference file adds a remote called `larixy` and installs the app.

```sh
flatpak install https://pkgs.larixy.com/flatpak/larixy.flatpakref
```

For canary, use the canary reference file.

```sh
flatpak install https://pkgs.larixy.com/flatpak/larixy-canary.flatpakref
```
