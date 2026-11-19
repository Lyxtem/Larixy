<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./larixy_static/marketing/branding/logo-white.svg">
    <img src="" alt="Larixy logo" width="400">
  </picture>
</p>

<p align="center">
  <a href="https://larixy.com/download">
    <img src="https://img.shields.io/badge/Download-larixy.com-4641D9" alt="Download" /></a>
  <a href="https://docs.larixy.com">
    <img src="https://img.shields.io/badge/Docs-docs.larixy.com-blue" alt="Documentation" /></a>
  <a href="https://larixy.com/donate">
    <img src="https://img.shields.io/badge/Donate-larixy.com%2Fdonate-brightgreen" alt="Donate" /></a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-AGPLv3-purple" alt="AGPLv3 License" /></a>
</p>

<p align="center">
  <a href="https://flathub.org/apps/app.larixy.Larixy">
    <img src="https://dl.flathub.org/assets/badges/flathub-badge-en.svg" alt="Get it on Flathub" height="60" /></a>
</p>

# Larixy

> [!IMPORTANT]
> Bug reports and feature requests have moved to [feedback.larixy.com](https://feedback.larixy.com). Sign in with your Larixy account to post, vote and follow updates. GitHub Issues and Discussions are closed. Report security vulnerabilities privately through [larixy.com/security](https://larixy.com/security).

Larixy is a free and open source instant messaging and VoIP chat app built for friends, groups, and communities.

<p align="center">
  <img src="https://larixy.com/static/img/screenshots-desktop-readme-1920w.9f7c8fdb2760d49b.png" alt="Larixy running side by side on a desktop monitor and a phone" width="640">
</p>

## Download

| Windows | macOS | Linux | Android | iOS |
| --- | --- | --- | --- | --- |
| [Installer (x64)][win-setup-x64] | [Disk image][mac-dmg] | [Flatpak][flatpak-ref] | [Google Play][android-play] | [Beta paused][ios-beta-paused] |
| [Installer (ARM64)][win-setup-arm64] | | [Flathub][flathub] | [APK][android-apk] | |
| [Portable (x64)][win-portable-x64] | | [deb (x64)][linux-deb-x64] | [Obtainium (most phones)][obtainium-fcm] | |
| [Portable (ARM64)][win-portable-arm64] | | [deb (ARM64)][linux-deb-arm64] | [Obtainium (degoogled phones)][obtainium-oss] | |
| | | [rpm (x64)][linux-rpm-x64] | | |
| | | [rpm (ARM64)][linux-rpm-arm64] | | |
| | | [AppImage (x64)][linux-appimage-x64] | | |
| | | [AppImage (ARM64)][linux-appimage-arm64] | | |
| | | [tar.gz (x64)][linux-targz-x64] | | |
| | | [tar.gz (ARM64)][linux-targz-arm64] | | |

The macOS disk image runs on both Apple silicon and Intel. Windows and Linux need the build matching your processor.

On Linux, prefer a repository over a single file so Larixy updates with the rest of your system.

## Linux package repositories

The package is `larixy` for stable and `larixy-canary` for canary. apt and dnf subscribe to one channel per entry file. pacman and Flatpak serve both from one repository.

### Flatpak

Larixy's own Flatpak repository gets every update the day we release it. Open [the stable][flatpak-ref] or [the canary][flatpak-canary-ref] reference file and your software manager takes over. Some desktops also accept `flatpak+https://pkgs.larixy.com/flatpak/larixy.flatpakref` in the address bar.

From a terminal:

```sh
flatpak install https://pkgs.larixy.com/flatpak/larixy.flatpakref
```

Stable is also on [Flathub][flathub], but Flathub can be a few weeks behind and has no canary:

```sh
flatpak install flathub app.larixy.Larixy
```

### Debian and Ubuntu

```sh
sudo install -d -m 0755 /etc/apt/keyrings
sudo curl -fsSL -o /etc/apt/keyrings/larixy-archive-keyring.gpg https://pkgs.larixy.com/keys/larixy-archive-keyring.gpg
sudo curl -fsSL -o /etc/apt/sources.list.d/larixy.sources https://pkgs.larixy.com/deb/larixy.sources
sudo apt update && sudo apt install larixy
```

For canary, use the canary entry file and package.

```sh
sudo curl -fsSL -o /etc/apt/sources.list.d/larixy-canary.sources https://pkgs.larixy.com/deb/larixy-canary.sources
sudo apt update && sudo apt install larixy-canary
```

A `.deb` installed from a download only updates once its channel's entry is added.

### Fedora and RHEL

```sh
sudo curl -fsSL -o /etc/yum.repos.d/larixy.repo https://pkgs.larixy.com/rpm/larixy.repo
sudo dnf install larixy
```

For canary, use the canary entry file and package.

```sh
sudo curl -fsSL -o /etc/yum.repos.d/larixy-canary.repo https://pkgs.larixy.com/rpm/larixy-canary.repo
sudo dnf install larixy-canary
```

RHEL, Rocky, Alma and CentOS Stream need `sudo dnf install epel-release` first, because their base repositories lack `libXScrnSaver`. Fedora does not.

### Arch Linux

The repository is signed, so pacman needs the key once:

```sh
sudo pacman-key --init
curl -fsSL -o /tmp/larixy-archive-keyring.asc https://pkgs.larixy.com/keys/larixy-archive-keyring.asc
sudo pacman-key --add /tmp/larixy-archive-keyring.asc
sudo pacman-key --lsign-key 09D01339EE128925F75E675C855C5BDE34D205D2
```

`--lsign-key` is what makes pacman trust it. Then add the repository:

```sh
sudo tee -a /etc/pacman.conf >/dev/null <<'REPO'

[larixy]
SigLevel = Required TrustedOnly
Server = https://pkgs.larixy.com/arch/$repo/os/$arch
REPO
sudo pacman -Syu larixy
```

Write `$repo` and `$arch` literally. Both are pacman variables, not shell ones, hence the quoted heredoc.

Full setup notes, including canary, are in the [Linux repositories documentation][docs-linux].

## Other ways to run it

- [Open Larixy in a browser](https://larixy.com/app), no install needed.
- [Host your own instance][docs-selfhost] from this repository.
- [Build the desktop app from source](larixy_desktop/PACKAGING.md) for a Linux distribution.

## Documentation

- [Documentation home][docs]
- [Downloads][docs-downloads]
- [Self-hosting][docs-selfhost]

## License

The source is licensed under the [AGPL-3.0-or-later](./LICENSE) license.

Larixy artwork, such as the logo, icons, badges and default avatars, is
licensed under [CC BY-SA 4.0](./larixy_static/LICENSE). Third-party material
keeps its own terms, listed in
[larixy_static/THIRD_PARTY_LICENSES.md](./larixy_static/THIRD_PARTY_LICENSES.md).

Use of the Larixy name and logo is covered by the
[name and marks policy](./.github/GOVERNANCE.md#name-and-marks).

[win-setup-x64]: https://pkgs.larixy.com/desktop/stable/win32/x64/latest/setup
[win-setup-arm64]: https://pkgs.larixy.com/desktop/stable/win32/arm64/latest/setup
[win-portable-x64]: https://pkgs.larixy.com/desktop/stable/win32/x64/latest/portable
[win-portable-arm64]: https://pkgs.larixy.com/desktop/stable/win32/arm64/latest/portable
[mac-dmg]: https://pkgs.larixy.com/desktop/stable/darwin/arm64/latest/dmg
[linux-deb-x64]: https://pkgs.larixy.com/desktop/stable/linux/x64/latest/deb
[linux-deb-arm64]: https://pkgs.larixy.com/desktop/stable/linux/arm64/latest/deb
[linux-rpm-x64]: https://pkgs.larixy.com/desktop/stable/linux/x64/latest/rpm
[linux-rpm-arm64]: https://pkgs.larixy.com/desktop/stable/linux/arm64/latest/rpm
[linux-appimage-x64]: https://pkgs.larixy.com/desktop/stable/linux/x64/latest/appimage
[linux-appimage-arm64]: https://pkgs.larixy.com/desktop/stable/linux/arm64/latest/appimage
[linux-targz-x64]: https://pkgs.larixy.com/desktop/stable/linux/x64/latest/tar_gz
[linux-targz-arm64]: https://pkgs.larixy.com/desktop/stable/linux/arm64/latest/tar_gz
[flatpak-ref]: https://pkgs.larixy.com/flatpak/larixy.flatpakref
[flatpak-canary-ref]: https://pkgs.larixy.com/flatpak/larixy-canary.flatpakref
[flathub]: https://flathub.org/apps/app.larixy.Larixy
[android-play]: https://play.google.com/store/apps/details?id=com.larixy
[android-apk]: https://larixy.com/download/android
[obtainium-fcm]: https://apps.obtainium.imranr.dev/redirect?r=obtainium%3A%2F%2Fapp%2F%7B%22id%22%3A%22com.larixy%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2Flarixyapp%2Fflutter_client%22%2C%22author%22%3A%22larixyapp%22%2C%22name%22%3A%22Larixy%20%28FCM%29%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22fallbackToOlderReleases%5C%22%3Atrue%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22stablefcm%5C%22%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%7D%22%7D
[obtainium-oss]: https://apps.obtainium.imranr.dev/redirect?r=obtainium%3A%2F%2Fapp%2F%7B%22id%22%3A%22com.larixy%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2Flarixyapp%2Fflutter_client%22%2C%22author%22%3A%22larixyapp%22%2C%22name%22%3A%22Larixy%20%28OSS%29%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22fallbackToOlderReleases%5C%22%3Atrue%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22stableoss%5C%22%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%7D%22%7D
[ios-beta-paused]: https://larixy.com/help/ios-testflight
[docs]: https://docs.larixy.com
[docs-downloads]: https://docs.larixy.com/downloads/overview/
[docs-linux]: https://docs.larixy.com/downloads/linux-repositories/
[docs-selfhost]: https://docs.larixy.com/operator/
