# cordova-plugin-lsl — Development State

**Last Updated:** 2026-02-24

## Current Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Release Date | 2026-02-24 |
| Status | Released (CI builds green) |
| npm | Not yet published |
| GitHub | [Mindfield-Biosystems-Ltd/cordova-plugin-lsl](https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl) |

## Dependency Versions

| Dependency | Version | Latest | Status |
|------------|---------|--------|--------|
| liblsl | 1.17.5 | 1.17.5 (2026-01-15) | Up to date |
| cordova (engine) | >= 10.0.0 | 12.x | OK |
| cordova-android | >= 14.0.0 | 14.0.0 | Up to date |
| cordova-ios | >= 8.0.0 | 8.0.0 (2025-11-23) | Up to date |
| Jasmine (dev) | ^6.1.0 | 6.x | Up to date (Dependabot) |

## Platform Compatibility

| Platform | Min Version | Tested Through | Notes |
|----------|-------------|----------------|-------|
| Android | 10 (SDK 29) | 14 (SDK 34) | |
| iOS | 13.0 | 26.x | NSLocalNetworkUsageDescription unchanged |
| Xcode | 15 | 26.2 | Compatible, no changes needed |

## Build Status

| Component | Status | Notes |
|-----------|--------|-------|
| JS API (`www/lsl.js`) | Done | 11 methods, input validation |
| TypeScript (`www/lsl.d.ts`) | Done | Full type coverage |
| Android Java | Done | LSLPlugin.java, LSLOutletWrapper.java |
| Android JNI | Done | lsl_jni.c with JNI_OnLoad |
| iOS Objective-C | Done | LSLPlugin.h/m |
| Unit Tests | Done | 77 specs, 0 failures |
| Integration Tests | Done | 3 test files |
| E2E Guides | Done | 2 markdown files |
| CI (GitHub Actions) | Green | CI, Android build, iOS build — all passing |
| Android binaries | In repo | liblsl.so + liblsl_jni.so for arm64-v8a, armeabi-v7a, x86_64 |
| iOS binaries | In repo | liblsl.xcframework for arm64 + simulators |
| npm publish | Not started | Ready to publish |

## Pre-built Binary Status

Pre-built binaries from liblsl v1.17.5 are committed to the repo.

### Android (.so files)
```
src/android/libs/
  arm64-v8a/liblsl.so       (9.6M) ✓
  arm64-v8a/liblsl_jni.so   (48K)  ✓
  armeabi-v7a/liblsl.so     (8.2M) ✓
  armeabi-v7a/liblsl_jni.so (40K)  ✓
  x86_64/liblsl.so          (9.3M) ✓
  x86_64/liblsl_jni.so      (48K)  ✓
```

### iOS (.xcframework)
```
src/ios/liblsl.xcframework/
  ios-arm64/lsl.framework/lsl                         (844K) ✓
  ios-arm64_x86_64-simulator/lsl.framework/lsl        (1.7M) ✓
```

### How to Build
- **Android:** `ANDROID_NDK_HOME=/path/to/ndk ./scripts/build-android.sh`
- **iOS:** `./scripts/build-ios.sh` (macOS only, requires Xcode)
- **CI:** Trigger `Build Android liblsl` / `Build iOS liblsl` workflows manually

## Known Issues

1. **No npm Package:** Not published to npm yet (ready to publish)

## iOS 26 Notes

- **Compatible:** Plugin works on iOS 26 without changes
- **NSLocalNetworkUsageDescription:** Unchanged in iOS 26, still required and configured
- **NSBonjourServices:** `_lsl._tcp` still works for LSL discovery
- **Deployment Target:** iOS 13.0 covers 99%+ of devices, no need to raise
- **Apple April 2026 Deadline:** Apps must be built with latest SDK — this affects the app, not our plugin. Plugin works with any Xcode version >= 15.

## Roadmap

### v1.0.x (Patches)
- [x] Get CI builds working (Android + iOS) ✓
- [x] Download CI artifacts and commit binaries to repo ✓
- [ ] Publish to npm
- [ ] Create v1.0.0 GitHub Release with attached binaries

### v1.1.0 (Minor)
- [ ] Add `getStreamInfo` method (read back outlet metadata)
- [ ] Add `getOutletCount` method
- [ ] Improve error messages with error codes
- [ ] Add sample counter to outlet wrapper

### v2.0.0 (Major — Future)
- [ ] **Inlet (Receiver)** functionality
- [ ] Capacitor support
- [ ] Stream recording on device
