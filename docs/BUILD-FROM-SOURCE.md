# Building liblsl from Source

This plugin ships with pre-built liblsl v1.17.5 binaries. This guide explains how to build them yourself.

## Prerequisites

### All Platforms
- **CMake** 3.20+ (`cmake --version`)
- **Git** (`git --version`)

### Android
- **Android NDK** r26+ (set `ANDROID_NDK_HOME` environment variable)
- **Android SDK** with platform tools
- Linux or macOS build host recommended (WSL2 works on Windows)

### iOS
- **macOS** (required for Xcode)
- **Xcode** 15+
- **Command Line Tools** (`xcode-select --install`)

## Building for Android

### Quick Build

```bash
export ANDROID_NDK_HOME=/path/to/android-ndk
./scripts/build-android.sh
```

This builds for three architectures:
- `arm64-v8a` — Modern 64-bit devices (95%+ of active devices)
- `armeabi-v7a` — Legacy 32-bit devices
- `x86_64` — Android Emulator

Output: `src/android/libs/{arch}/liblsl.so`

### Manual Build (Step by Step)

```bash
# 1. Download liblsl source
wget https://github.com/sccn/liblsl/archive/refs/tags/v1.17.5.tar.gz
tar xzf v1.17.5.tar.gz
cd liblsl-1.17.5

# 2. Build for arm64-v8a
mkdir build-arm64 && cd build-arm64
cmake .. \
    -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake \
    -DANDROID_ABI=arm64-v8a \
    -DANDROID_PLATFORM=android-24 \
    -DANDROID_STL=c++_shared \
    -DCMAKE_BUILD_TYPE=Release \
    -DLSL_BUILD_STATIC=OFF \
    -DLSL_UNIXFOLDERS=ON \
    -DLSL_NO_FANCY_LIBNAME=ON
cmake --build . --config Release
# Output: lib/liblsl.so

# 3. Repeat for armeabi-v7a and x86_64
# (change ANDROID_ABI parameter)
```

## Building for iOS

### Quick Build

```bash
./scripts/build-ios.sh
```

This builds:
- `arm64` device (iPhone/iPad)
- `arm64` + `x86_64` simulator (Apple Silicon + Intel Macs)

Output: `src/ios/liblsl.xcframework/`

### Manual Build (Step by Step)

```bash
# 1. Download liblsl source
wget https://github.com/sccn/liblsl/archive/refs/tags/v1.17.5.tar.gz
tar xzf v1.17.5.tar.gz
cd liblsl-1.17.5

# 2. Build for arm64 device
mkdir build-ios-device && cd build-ios-device
cmake .. \
    -DCMAKE_SYSTEM_NAME=iOS \
    -DCMAKE_OSX_ARCHITECTURES=arm64 \
    -DCMAKE_OSX_SYSROOT=$(xcrun --sdk iphoneos --show-sdk-path) \
    -DCMAKE_OSX_DEPLOYMENT_TARGET=13.0 \
    -DCMAKE_BUILD_TYPE=Release \
    -DLSL_BUILD_STATIC=OFF \
    -DLSL_NO_FANCY_LIBNAME=ON
cmake --build . --config Release
cd ..

# 3. Build for arm64 simulator (Apple Silicon)
mkdir build-ios-sim-arm64 && cd build-ios-sim-arm64
cmake .. \
    -DCMAKE_SYSTEM_NAME=iOS \
    -DCMAKE_OSX_ARCHITECTURES=arm64 \
    -DCMAKE_OSX_SYSROOT=$(xcrun --sdk iphonesimulator --show-sdk-path) \
    -DCMAKE_OSX_DEPLOYMENT_TARGET=13.0 \
    -DCMAKE_BUILD_TYPE=Release \
    -DLSL_BUILD_STATIC=OFF \
    -DLSL_NO_FANCY_LIBNAME=ON
cmake --build . --config Release
cd ..

# 4. Build for x86_64 simulator (Intel)
mkdir build-ios-sim-x86 && cd build-ios-sim-x86
cmake .. \
    -DCMAKE_SYSTEM_NAME=iOS \
    -DCMAKE_OSX_ARCHITECTURES=x86_64 \
    -DCMAKE_OSX_SYSROOT=$(xcrun --sdk iphonesimulator --show-sdk-path) \
    -DCMAKE_OSX_DEPLOYMENT_TARGET=13.0 \
    -DCMAKE_BUILD_TYPE=Release \
    -DLSL_BUILD_STATIC=OFF \
    -DLSL_NO_FANCY_LIBNAME=ON
cmake --build . --config Release
cd ..

# 5. Create fat simulator library
lipo -create \
    build-ios-sim-arm64/lib/liblsl.dylib \
    build-ios-sim-x86/lib/liblsl.dylib \
    -output liblsl-sim.dylib

# 6. Create xcframework
xcodebuild -create-xcframework \
    -library build-ios-device/lib/liblsl.dylib \
    -headers build-ios-device/include \
    -library liblsl-sim.dylib \
    -headers build-ios-sim-arm64/include \
    -output liblsl.xcframework
```

## GitHub Actions (Automated)

CI workflows build liblsl automatically:

- `.github/workflows/build-android.yml` — Triggered on release or manual dispatch
- `.github/workflows/build-ios.yml` — Triggered on release or manual dispatch

Artifacts are uploaded to GitHub Actions and can be downloaded from the workflow run.

## Verifying Builds

### Android

```bash
# Check architectures
file src/android/libs/arm64-v8a/liblsl.so
# Should show: ELF 64-bit LSB shared object, ARM aarch64

file src/android/libs/armeabi-v7a/liblsl.so
# Should show: ELF 32-bit LSB shared object, ARM

file src/android/libs/x86_64/liblsl.so
# Should show: ELF 64-bit LSB shared object, x86-64
```

### iOS

```bash
# Check xcframework structure
ls src/ios/liblsl.xcframework/
# Should show: ios-arm64/, ios-arm64_x86_64-simulator/, Info.plist

# Check device library
lipo -info src/ios/liblsl.xcframework/ios-arm64/liblsl.dylib
# Should show: arm64

# Check simulator library
lipo -info src/ios/liblsl.xcframework/ios-arm64_x86_64-simulator/liblsl.dylib
# Should show: arm64, x86_64
```

## Troubleshooting

### Android: NDK not found
```
Error: ANDROID_NDK_HOME is not set
```
Set the environment variable to your NDK installation path:
```bash
export ANDROID_NDK_HOME=$HOME/Android/Sdk/ndk/26.3.11579264
```

### iOS: No matching SDK
```
Error: xcrun: error: SDK "iphoneos" cannot be located
```
Install Xcode and accept the license:
```bash
sudo xcode-select -s /Applications/Xcode.app
sudo xcodebuild -license accept
```

### CMake version too old
```
CMake 3.20 or higher is required
```
Update CMake:
```bash
# macOS
brew install cmake

# Ubuntu
sudo snap install cmake --classic
```

## References

- [liblsl GitHub](https://github.com/sccn/liblsl) — Source code and build instructions
- [liblsl-Android](https://github.com/labstreaminglayer/liblsl-Android) — Android-specific build reference
- [liblsl.dart](https://pub.dev/packages/liblsl) — Flutter package (build reference for mobile)
- [Android NDK CMake Guide](https://developer.android.com/ndk/guides/cmake)
- [Xcode XCFramework Guide](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle)
