# Larixy for Android (Capacitor)

Capacitor shell that turns the Larixy web app into an Android APK.

## Current scope: WebRTC spike build

This first version loads the live web app from `https://larixy.xyz`
(`server.url` in `capacitor.config.json`), so the WebView runs the exact
production client — same origin, same instance discovery — with **no changes
to `larixy_app`**. Its only job is to answer one question on a real device:

> Do WebRTC voice and video calls work inside the Android WebView against
> the production instance?

Screen sharing is known not to work in a WebView (`getDisplayMedia` is not
available); that stays a desktop feature.

If the spike passes, a follow-up packages the web build (`dist/`) inside
the APK, wires FCM push (the `@capacitor/push-notifications` dependency is
already declared; `larixy_push` already speaks FCM server-side) and adds
release signing.

## Why the android/ project is not committed

`cap add android` generates binary files (e.g. `gradle-wrapper.jar`) that
cannot be pushed through every channel this repo is edited through, so the
generated project is git-ignored and recreated by CI on every build. The
permissions the app needs beyond Capacitor's defaults are reapplied by
`scripts/patch-android-manifest.py` right after generation.

This package is deliberately **not** part of the pnpm workspace (the
workspace package list is explicit and does not include it); it installs
standalone with npm.

## Build

CI: run the `build android apk` workflow (manual dispatch). It produces a
debug APK as a downloadable artifact — good enough to sideload for the
spike; it is not a signed release build.

Locally (needs Node 20+, JDK 21 and the Android SDK):

```sh
cd larixy_android
npm install
npx cap add android
python3 scripts/patch-android-manifest.py
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Spike checklist (on a real Android phone)

1. Install the APK, open Larixy, sign in.
2. Join the «Oficina» voice channel on the official server.
3. The system must ask for the microphone permission; you must hear and be
   heard from another client (web or desktop).
4. Turn the camera on; video must flow both ways.
5. Note the result on the PR that introduced this package.
