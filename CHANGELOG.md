# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Android CI: JNI bridge CMake now uses IMPORTED target with direct path to liblsl.so
- iOS CI: Added missing `mkdir -p` for fat simulator framework directory

### Changed
- Bumped Jasmine from 5.x to 6.1.0 (Dependabot)
- Bumped actions/checkout from v4 to v6 (Dependabot)
- Bumped actions/setup-node from v4 to v6 (Dependabot)
- Bumped actions/setup-java from v4 to v5 (Dependabot)
- Added CI, Build Android, Build iOS status badges to README
- Updated README iOS tested version to 26.x

### Added
- Pre-built liblsl v1.17.5 binaries from CI (Android 3 archs + iOS xcframework)

- Published to npm as [cordova-plugin-lsl](https://www.npmjs.com/package/cordova-plugin-lsl)
- GitHub Release [v1.0.0](https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl/releases/tag/v1.0.0)

## [1.1.0] - 2026-02-24

### Fixed (Critical)
- **Library version parsing** - `lsl_library_version()` returns `major*100+minor` (2-part), was incorrectly parsed as 3-part. Version 1.17 was displayed as "1.1.7" instead of "1.17" (Android + iOS)
- **Push sample return values** - All `lsl_push_sample_*t()` return `int32_t` error codes, JNI bridge declared them as `void`. Now correctly returns and can propagate errors (lsl_jni.c)
- **getLocalClock cross-platform type mismatch** - Android returned String, iOS returned Double. Both now return consistent JSON `{timestamp: double}`, JS layer extracts the number
- **hasConsumers/waitForConsumers type mismatch** - Android returned int (0/1), iOS returned boolean. JS layer now normalizes to boolean on both platforms
- **iOS null pointer crash in getWifiIPAddress** - `ifa_addr` can be NULL for some network interfaces, was dereferenced without check

### Fixed (Non-Critical)
- **JNI local reference leak in string push** - `GetObjectArrayElement` was called twice per element in push/release loops, leaking 2N local refs per call. Refactored to store and reuse jstring references
- **JNI OOM crash risk** - Added NULL checks after all `Get*ArrayElements` calls (return -4 on failure instead of segfault)
- **Android push/destroy race condition** - Added `synchronized(wrapper)` blocks and `isDestroyed()` checks to prevent use-after-free when pushing and destroying concurrently

### Changed
- **pushChunk performance** - Replaced sample-by-sample loop with native `lsl_push_chunk_*t()` calls. Flattens 2D array into 1D buffer for a single JNI/liblsl call. ~10-100x faster for high-rate streams (Android + iOS)
- TypeScript definitions now accept `string[]` for string channel format in `pushSample` and `pushChunk`
- Version string format changed from "X.Y.Z" to "X.Y" to match liblsl's 2-part encoding

### Added
- 5 new JNI functions for native chunk push: `lsl_push_chunk_f/d/i/s/c`
- iOS `pushChunkNative:` method using native `lsl_push_chunk_*t()` calls
- LSL specification review report (`docs/LSL-REVIEW-REPORT.md`)
- Complete LSL documentation archive (`docs/LSL-DOCUMENTATION/`, 25 pages)

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

[Unreleased]: https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl/releases/tag/v1.0.0
