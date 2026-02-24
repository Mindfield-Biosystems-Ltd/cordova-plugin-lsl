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
# Helper: find the built library (could be .dylib, .framework, or named lsl)
# ---------------------------------------------------------------------------

find_built_library() {
    local search_dir="$1"
    local lib_file=""

    # liblsl may build as a framework (lsl.framework/lsl) on macOS/iOS
    lib_file=$(find "${search_dir}" -path "*/lsl.framework/lsl" -type f 2>/dev/null | head -n 1)
    if [ -n "${lib_file}" ]; then
        echo "${lib_file}"
        return
    fi

    # Or as liblsl.dylib
    lib_file=$(find "${search_dir}" -name "liblsl.dylib" -type f 2>/dev/null | head -n 1)
    if [ -n "${lib_file}" ]; then
        echo "${lib_file}"
        return
    fi

    # Or with version suffix
    lib_file=$(find "${search_dir}" -name "liblsl.*.dylib" -type f 2>/dev/null | head -n 1)
    if [ -n "${lib_file}" ]; then
        echo "${lib_file}"
        return
    fi

    # Or as a plain .a static lib
    lib_file=$(find "${search_dir}" -name "liblsl.a" -type f 2>/dev/null | head -n 1)
    if [ -n "${lib_file}" ]; then
        echo "${lib_file}"
        return
    fi

    echo ""
}

# ---------------------------------------------------------------------------
# Helper: find headers directory
# ---------------------------------------------------------------------------

find_headers_dir() {
    local search_dir="$1"
    local headers_dir=""

    # Framework headers
    headers_dir=$(find "${search_dir}" -path "*/lsl.framework/Headers" -type d 2>/dev/null | head -n 1)
    if [ -n "${headers_dir}" ]; then
        echo "${headers_dir}"
        return
    fi

    # Standard include dir
    headers_dir=$(find "${search_dir}" -name "lsl_c.h" -type f 2>/dev/null | head -n 1)
    if [ -n "${headers_dir}" ]; then
        dirname "${headers_dir}"
        return
    fi

    echo ""
}

# ---------------------------------------------------------------------------
# Helper: build for a specific platform/arch
# ---------------------------------------------------------------------------

build_for_platform() {
    local platform_name="$1"
    local osx_architectures="$2"
    local sdk_name="$3"

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
        -DCMAKE_SYSTEM_NAME=iOS \
        -DCMAKE_OSX_ARCHITECTURES="${osx_architectures}" \
        -DCMAKE_OSX_DEPLOYMENT_TARGET="${IOS_DEPLOYMENT_TARGET}" \
        -DCMAKE_OSX_SYSROOT="${sdk_path}" \
        -DCMAKE_BUILD_TYPE=Release \
        -DLSL_BUILD_STATIC=OFF \
        -DCMAKE_INSTALL_PREFIX="${install_dir}" \
        -DCMAKE_INSTALL_NAME_DIR="@rpath"

    cmake --build "${build_dir}" --config Release --parallel "$(sysctl -n hw.ncpu)"
    cmake --install "${build_dir}" --config Release

    local lib_file
    lib_file=$(find_built_library "${install_dir}")

    if [ -z "${lib_file}" ]; then
        echo "ERROR: Could not find liblsl library in ${install_dir}"
        echo "Contents:"
        find "${install_dir}" -type f
        exit 1
    fi

    echo "[${platform_name}] Built: ${lib_file}"
    echo "  Size: $(du -h "${lib_file}" | cut -f1)"
}

# ---------------------------------------------------------------------------
# Build all three variants
# ---------------------------------------------------------------------------

# 1) iOS device (arm64)
build_for_platform "ios-device" "arm64" "iphoneos"

# 2) iOS simulator (arm64) - Apple Silicon Macs
build_for_platform "ios-simulator-arm64" "arm64" "iphonesimulator"

# 3) iOS simulator (x86_64) - Intel Macs
build_for_platform "ios-simulator-x86_64" "x86_64" "iphonesimulator"

# ---------------------------------------------------------------------------
# Prepare libraries for xcframework creation
# ---------------------------------------------------------------------------

echo "============================================="
echo "  Preparing libraries for xcframework"
echo "============================================="

device_lib=$(find_built_library "${BUILD_ROOT}/install-ios-device")
device_headers=$(find_headers_dir "${BUILD_ROOT}/install-ios-device")
sim_arm64_lib=$(find_built_library "${BUILD_ROOT}/install-ios-simulator-arm64")
sim_x86_64_lib=$(find_built_library "${BUILD_ROOT}/install-ios-simulator-x86_64")

echo "Device lib: ${device_lib}"
echo "Device headers: ${device_headers}"
echo "Sim arm64 lib: ${sim_arm64_lib}"
echo "Sim x86_64 lib: ${sim_x86_64_lib}"

# Check if libraries are inside .framework bundles
device_is_framework=false
if [[ "${device_lib}" == *".framework/"* ]]; then
    device_is_framework=true
fi

# Remove existing xcframework if present
rm -rf "${XCFRAMEWORK_PATH}"

if [ "${device_is_framework}" = true ]; then
    # liblsl built as Apple frameworks - use framework-based xcframework creation
    echo "Detected framework-based build"

    device_framework=$(echo "${device_lib}" | sed 's|/lsl$||')
    sim_arm64_framework=$(echo "${sim_arm64_lib}" | sed 's|/lsl$||')
    sim_x86_64_framework=$(echo "${sim_x86_64_lib}" | sed 's|/lsl$||')

    # Create fat simulator framework
    FAT_SIM_DIR="${BUILD_ROOT}/install-ios-simulator-fat"
    rm -rf "${FAT_SIM_DIR}"
    cp -R "${sim_arm64_framework}" "${FAT_SIM_DIR}/lsl.framework"

    lipo -create \
        "${sim_arm64_lib}" \
        "${sim_x86_64_lib}" \
        -output "${FAT_SIM_DIR}/lsl.framework/lsl"

    echo "Fat simulator framework created"
    lipo -info "${FAT_SIM_DIR}/lsl.framework/lsl"

    xcodebuild -create-xcframework \
        -framework "${device_framework}" \
        -framework "${FAT_SIM_DIR}/lsl.framework" \
        -output "${XCFRAMEWORK_PATH}"
else
    # liblsl built as dylibs - use library-based xcframework creation
    echo "Detected dylib-based build"

    # Create fat simulator dylib
    FAT_SIM_DIR="${BUILD_ROOT}/install-ios-simulator-fat/lib"
    mkdir -p "${FAT_SIM_DIR}"

    fat_sim_lib="${FAT_SIM_DIR}/liblsl.dylib"
    lipo -create \
        "${sim_arm64_lib}" \
        "${sim_x86_64_lib}" \
        -output "${fat_sim_lib}"

    echo "Fat simulator library: ${fat_sim_lib}"
    lipo -info "${fat_sim_lib}"

    # Build xcframework args
    xcf_args=(-library "${device_lib}")
    if [ -n "${device_headers}" ]; then
        xcf_args+=(-headers "${device_headers}")
    fi
    xcf_args+=(-library "${fat_sim_lib}")

    xcodebuild -create-xcframework \
        "${xcf_args[@]}" \
        -output "${XCFRAMEWORK_PATH}"
fi

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
find "${XCFRAMEWORK_PATH}" -type f -name "*.dylib" -o -name "lsl" | while read -r f; do
    echo "  ${f}"
    lipo -info "${f}" 2>/dev/null || true
done
echo ""
echo "Done."
