# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Pending
- Pre-built liblsl binaries (awaiting CI build completion)
- npm publish to registry

## [1.0.0] - 2026-02-24

### Added
- **Outlet API:** `createOutlet`, `pushSample`, `pushChunk`, `destroyOutlet`, `destroyAllOutlets`
- **Consumer detection:** `hasConsumers`, `waitForConsumers`
- **Utility:** `getLocalClock`, `getLibraryVersion`, `getProtocolVersion`, `getDeviceIP`
- **Android support:** cordova-android 14.0.0+, Android 10+ (SDK 29)
  - Java CordovaPlugin with JNI bridge to liblsl C API
  - Thread-safe outlet management (ConcurrentHashMap)
  - Lifecycle hooks: onDestroy, onReset
  - Wi-Fi IP detection (ConnectivityManager + WifiManager fallback)
- **iOS support:** cordova-ios 8.0.0+, iOS 13.0+
  - Objective-C CDVPlugin with direct liblsl C API calls
  - Thread-safe outlet management (@synchronized)
  - Lifecycle hooks: onAppTerminate, onReset
  - Wi-Fi IP detection (BSD getifaddrs on en0)
  - Apple Privacy Manifest (PrivacyInfo.xcprivacy)
- **Channel formats:** float32, double64, int32, int16, int8, string
- **Stream metadata:** manufacturer, device, channel descriptions (label, unit, type)
- **Multi-outlet:** 5+ simultaneous streams supported
- **TypeScript definitions:** Full type support via `www/lsl.d.ts`
- **Android JNI bridge:** `lsl_jni.c` with JNI_OnLoad registration for both Plugin and Wrapper classes
- **Build scripts:** `build-android.sh` (NDK), `build-ios.sh` (Xcode), `run-tests.sh`
- **GitHub Actions CI:** lint + unit tests, Android build, iOS build
- **Documentation:** API reference, LSL protocol guide, KnownPeers setup, testing guide, build-from-source
- **Examples:** EDA, Temperature, Pulse, Respiration, EMG, Multi-sensor (6 files)
- **Unit tests:** 77 Jasmine specs (API validation, exec calls, promise handling)
- **Integration tests:** Outlet lifecycle, multi-outlet, error handling
- **E2E test guides:** LabRecorder single stream, all 5 eSense streams

### Dependencies
- liblsl v1.17.5 (2026-01-15) — MIT License
- cordova >= 10.0.0
- cordova-android >= 14.0.0
- cordova-ios >= 8.0.0

### Compatibility
- Android 10+ (SDK 29)
- iOS 13.0+ (tested through iOS 26)
- Xcode 15+ (compatible with Xcode 26)

[Unreleased]: https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl/releases/tag/v1.0.0
