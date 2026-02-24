#!/usr/bin/env bash
# =============================================================================
# build-ios.sh
# Cross-compile liblsl v1.17.5 for iOS and create an xcframework.
#
# Builds:
#   - arm64 (device)
#   - arm64 (simulator, Apple Silicon)
#   - x86_64 (simulator, Intel)
#
# Prerequisites:
#   - macOS with Xcode command line tools
#   - CMake >= 3.16
#
# Output:
#   src/ios/liblsl.xcframework/
# =============================================================================

set -euo pipefail

LIBLSL_VERSION="1.17.5"
LIBLSL_TARBALL="v${LIBLSL_VERSION}.tar.gz"
LIBLSL_URL="https://github.com/sccn/liblsl/archive/refs/tags/${LIBLSL_TARBALL}"
LIBLSL_SRC_DIR="liblsl-${LIBLSL_VERSION}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILD_ROOT="${PROJECT_ROOT}/_build/ios"
OUTPUT_DIR="${PROJECT_ROOT}/src/ios"
XCFRAMEWORK_PATH="${OUTPUT_DIR}/liblsl.xcframework"

IOS_DEPLOYMENT_TARGET="13.0"

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

if [ "$(uname)" != "Darwin" ]; then
    echo "ERROR: This script must be run on macOS."
    exit 1
fi

if ! command -v cmake &>/dev/null; then
    echo "ERROR: cmake not found. Install CMake >= 3.16 (e.g. brew install cmake)."
    exit 1
fi

if ! command -v xcodebuild &>/dev/null; then
    echo "ERROR: xcodebuild not found. Install Xcode command line tools."
    exit 1
fi

# ---------------------------------------------------------------------------
# Idempotency check
# ---------------------------------------------------------------------------

if [ -d "${XCFRAMEWORK_PATH}" ]; then
    echo "liblsl.xcframework already exists. Skipping build."
    echo "  To force a rebuild, delete: ${XCFRAMEWORK_PATH}"
    exit 0
fi

# ---------------------------------------------------------------------------
# Download source
# ---------------------------------------------------------------------------

mkdir -p "${BUILD_ROOT}"
cd "${BUILD_ROOT}"

if [ ! -d "${LIBLSL_SRC_DIR}" ]; then
    echo "Downloading liblsl ${LIBLSL_VERSION} source..."
    curl -L -o "${LIBLSL_TARBALL}" "${LIBLSL_URL}"
    echo "Extracting..."
    tar xzf "${LIBLSL_TARBALL}"
    rm -f "${LIBLSL_TARBALL}"
fi

SRC_PATH="${BUILD_ROOT}/${LIBLSL_SRC_DIR}"

# ---------------------------------------------------------------------------
# Helper: build for a specific platform/arch
# ---------------------------------------------------------------------------

build_for_platform() {
    local platform_name="$1"
    local cmake_system_name="$2"
    local osx_architectures="$3"
    local sdk_name="$4"

    local build_dir="${BUILD_ROOT}/build-${platform_name}"
    local install_dir="${BUILD_ROOT}/install-${platform_name}"

    echo "============================================="
    echo "  Building liblsl: ${platform_name} (${osx_architectures})"
    echo "============================================="

    rm -rf "${build_dir}" "${install_dir}"
    mkdir -p "${build_dir}" "${install_dir}"

    local sdk_path
    sdk_path="$(xcrun --sdk "${sdk_name}" --show-sdk-path)"

    cmake -S "${SRC_PATH}" -B "${build_dir}" \
        -DCMAKE_SYSTEM_NAME="${cmake_system_name}" \
        -DCMAKE_OSX_ARCHITECTURES="${osx_architectures}" \
        -DCMAKE_OSX_DEPLOYMENT_TARGET="${IOS_DEPLOYMENT_TARGET}" \
        -DCMAKE_OSX_SYSROOT="${sdk_path}" \
        -DCMAKE_BUILD_TYPE=Release \
        -DLSL_BUILD_STATIC=OFF \
        -DLSL_NO_FANCY_LIBNAME=ON \
        -DCMAKE_INSTALL_PREFIX="${install_dir}" \
        -DCMAKE_INSTALL_NAME_DIR="@rpath"

    cmake --build "${build_dir}" --config Release --parallel "$(sysctl -n hw.ncpu)"
    cmake --install "${build_dir}" --config Release

    # Locate the built dylib
    local dylib_file
    dylib_file=$(find "${install_dir}" -name "liblsl.dylib" -o -name "liblsl.*.dylib" | head -n 1)

    if [ -z "${dylib_file}" ]; then
        # Also check for .so naming on some cmake versions
        dylib_file=$(find "${install_dir}" -name "liblsl.*" -type f | head -n 1)
    fi

    if [ -z "${dylib_file}" ]; then
        echo "ERROR: Could not find liblsl library in ${install_dir}"
        find "${install_dir}" -type f
        exit 1
    fi

    echo "[${platform_name}] Built: ${dylib_file}"
    echo "  Size: $(du -h "${dylib_file}" | cut -f1)"
}

# ---------------------------------------------------------------------------
# Build all three variants
# ---------------------------------------------------------------------------

# 1) iOS device (arm64)
build_for_platform "ios-device" "iOS" "arm64" "iphoneos"

# 2) iOS simulator (arm64) - Apple Silicon Macs
build_for_platform "ios-simulator-arm64" "iOS" "arm64" "iphonesimulator"

# 3) iOS simulator (x86_64) - Intel Macs
build_for_platform "ios-simulator-x86_64" "iOS" "x86_64" "iphonesimulator"

# ---------------------------------------------------------------------------
# Create fat simulator library (arm64 + x86_64)
# ---------------------------------------------------------------------------

echo "============================================="
echo "  Creating fat simulator library"
echo "============================================="

FAT_SIM_DIR="${BUILD_ROOT}/install-ios-simulator-fat/lib"
mkdir -p "${FAT_SIM_DIR}"

sim_arm64_lib=$(find "${BUILD_ROOT}/install-ios-simulator-arm64" -name "liblsl.dylib" -o -name "liblsl.*.dylib" | head -n 1)
sim_x86_64_lib=$(find "${BUILD_ROOT}/install-ios-simulator-x86_64" -name "liblsl.dylib" -o -name "liblsl.*.dylib" | head -n 1)

if [ -z "${sim_arm64_lib}" ]; then
    sim_arm64_lib=$(find "${BUILD_ROOT}/install-ios-simulator-arm64" -name "liblsl.*" -type f | head -n 1)
fi
if [ -z "${sim_x86_64_lib}" ]; then
    sim_x86_64_lib=$(find "${BUILD_ROOT}/install-ios-simulator-x86_64" -name "liblsl.*" -type f | head -n 1)
fi

fat_sim_lib="${FAT_SIM_DIR}/liblsl.dylib"

lipo -create \
    "${sim_arm64_lib}" \
    "${sim_x86_64_lib}" \
    -output "${fat_sim_lib}"

echo "Fat simulator library: ${fat_sim_lib}"
lipo -info "${fat_sim_lib}"

# ---------------------------------------------------------------------------
# Create xcframework
# ---------------------------------------------------------------------------

echo "============================================="
echo "  Creating xcframework"
echo "============================================="

device_lib=$(find "${BUILD_ROOT}/install-ios-device" -name "liblsl.dylib" -o -name "liblsl.*.dylib" | head -n 1)
if [ -z "${device_lib}" ]; then
    device_lib=$(find "${BUILD_ROOT}/install-ios-device" -name "liblsl.*" -type f | head -n 1)
fi

# Remove existing xcframework if present
rm -rf "${XCFRAMEWORK_PATH}"

xcodebuild -create-xcframework \
    -library "${device_lib}" \
    -library "${fat_sim_lib}" \
    -output "${XCFRAMEWORK_PATH}"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "============================================="
echo "  liblsl ${LIBLSL_VERSION} iOS build complete"
echo "============================================="
echo "  xcframework: ${XCFRAMEWORK_PATH}"
echo ""
echo "Contents:"
find "${XCFRAMEWORK_PATH}" -name "*.dylib" -exec echo "  {}" \;
echo ""
echo "Framework info:"
xcodebuild -checkFirstLaunchStatus 2>/dev/null || true
echo "Done."
