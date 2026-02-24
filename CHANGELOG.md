# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-24

### Added

- Initial release of cordova-plugin-lsl
- **Outlet API:** `createOutlet`, `pushSample`, `pushChunk`, `destroyOutlet`, `destroyAllOutlets`
- **Consumer detection:** `hasConsumers`, `waitForConsumers`
- **Utility:** `getLocalClock`, `getLibraryVersion`, `getProtocolVersion`, `getDeviceIP`
- **Android support:** cordova-android 14.0.0+, Android 10+ (SDK 29)
- **iOS support:** cordova-ios 8.0.0+, iOS 13.0+
- **Channel formats:** float32, double64, int32, int16, int8, string
- **Stream metadata:** manufacturer, device, channel descriptions (label, unit, type)
- **Multi-outlet:** Up to 5+ simultaneous streams
- **Native lifecycle hooks:** Automatic cleanup on app exit (onDestroy/onAppTerminate)
- **TypeScript definitions:** Full type support via `www/lsl.d.ts`
- **Pre-built liblsl binaries:** v1.17.5 for arm64-v8a, armeabi-v7a, x86_64 (Android) and arm64 (iOS)
- **Build scripts:** Cross-compilation scripts for Android NDK and iOS
- **Documentation:** API reference, protocol guide, KnownPeers setup, testing guide
- **Examples:** EDA, Temperature, Pulse, Respiration, EMG, Multi-sensor
- **Unit tests:** JS API validation, exec call verification, promise handling
- **Integration tests:** Outlet lifecycle, multi-outlet, error handling
- **GitHub Actions CI:** Lint, test, build workflows
- **Apple Privacy Manifest:** PrivacyInfo.xcprivacy included
