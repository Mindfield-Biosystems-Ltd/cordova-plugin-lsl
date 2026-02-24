#!/usr/bin/env bash
# =============================================================================
# build-android.sh
# Cross-compile liblsl v1.17.5 for Android (arm64-v8a, armeabi-v7a, x86_64)
#
# Prerequisites:
#   - ANDROID_NDK_HOME environment variable set (e.g. /path/to/android-ndk-r26d)
#   - CMake >= 3.16
#   - curl or wget
#
# Output:
#   src/android/libs/{arm64-v8a,armeabi-v7a,x86_64}/liblsl.so
# =============================================================================

set -euo pipefail

LIBLSL_VERSION="1.17.5"
LIBLSL_TARBALL="v${LIBLSL_VERSION}.tar.gz"
LIBLSL_URL="https://github.com/sccn/liblsl/archive/refs/tags/${LIBLSL_TARBALL}"
LIBLSL_SRC_DIR="liblsl-${LIBLSL_VERSION}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILD_ROOT="${PROJECT_ROOT}/_build/android"
OUTPUT_DIR="${PROJECT_ROOT}/src/android/libs"

ARCHS=("arm64-v8a" "armeabi-v7a" "x86_64")
ANDROID_API_LEVEL=24

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

if [ -z "${ANDROID_NDK_HOME:-}" ]; then
    echo "ERROR: ANDROID_NDK_HOME is not set."
    echo "       Set it to the path of your Android NDK installation."
    echo "       Example: export ANDROID_NDK_HOME=/opt/android-ndk-r26d"
    exit 1
fi

if [ ! -d "${ANDROID_NDK_HOME}" ]; then
    echo "ERROR: ANDROID_NDK_HOME directory does not exist: ${ANDROID_NDK_HOME}"
    exit 1
fi

TOOLCHAIN_FILE="${ANDROID_NDK_HOME}/build/cmake/android.toolchain.cmake"
if [ ! -f "${TOOLCHAIN_FILE}" ]; then
    echo "ERROR: Cannot find NDK toolchain file: ${TOOLCHAIN_FILE}"
    echo "       Make sure ANDROID_NDK_HOME points to a valid NDK installation."
    exit 1
fi

if ! command -v cmake &>/dev/null; then
    echo "ERROR: cmake not found. Install CMake >= 3.16."
    exit 1
fi

# ---------------------------------------------------------------------------
# Idempotency check: skip if all outputs already exist
# ---------------------------------------------------------------------------

all_built=true
for arch in "${ARCHS[@]}"; do
    if [ ! -f "${OUTPUT_DIR}/${arch}/liblsl.so" ]; then
        all_built=false
        break
    fi
done

if [ "${all_built}" = true ]; then
    echo "All liblsl Android libraries already exist. Skipping build."
    echo "  To force a rebuild, delete: ${OUTPUT_DIR}/*/liblsl.so"
    exit 0
fi

# ---------------------------------------------------------------------------
# Download source
# ---------------------------------------------------------------------------

mkdir -p "${BUILD_ROOT}"
cd "${BUILD_ROOT}"

if [ ! -d "${LIBLSL_SRC_DIR}" ]; then
    echo "Downloading liblsl ${LIBLSL_VERSION} source..."
    if command -v curl &>/dev/null; then
        curl -L -o "${LIBLSL_TARBALL}" "${LIBLSL_URL}"
    elif command -v wget &>/dev/null; then
        wget -O "${LIBLSL_TARBALL}" "${LIBLSL_URL}"
    else
        echo "ERROR: Neither curl nor wget found. Install one of them."
        exit 1
    fi

    echo "Extracting..."
    tar xzf "${LIBLSL_TARBALL}"
    rm -f "${LIBLSL_TARBALL}"
fi

SRC_PATH="${BUILD_ROOT}/${LIBLSL_SRC_DIR}"

# ---------------------------------------------------------------------------
# Build for each architecture
# ---------------------------------------------------------------------------

for arch in "${ARCHS[@]}"; do
    output_file="${OUTPUT_DIR}/${arch}/liblsl.so"

    if [ -f "${output_file}" ]; then
        echo "[${arch}] Already built. Skipping."
        continue
    fi

    echo "============================================="
    echo "  Building liblsl for Android ${arch}"
    echo "============================================="

    build_dir="${BUILD_ROOT}/build-${arch}"
    rm -rf "${build_dir}"
    mkdir -p "${build_dir}"

    cmake -S "${SRC_PATH}" -B "${build_dir}" \
        -DCMAKE_TOOLCHAIN_FILE="${TOOLCHAIN_FILE}" \
        -DANDROID_ABI="${arch}" \
        -DANDROID_NATIVE_API_LEVEL="${ANDROID_API_LEVEL}" \
        -DANDROID_STL=c++_shared \
        -DCMAKE_BUILD_TYPE=Release \
        -DLSL_BUILD_STATIC=OFF \
        -DLSL_UNIXFOLDERS=ON \
        -DLSL_NO_FANCY_LIBNAME=ON \
        -DCMAKE_INSTALL_PREFIX="${build_dir}/install"

    cmake --build "${build_dir}" --config Release --parallel "$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)"

    # Locate the built .so file
    so_file=$(find "${build_dir}" -name "liblsl.so" -type f | head -n 1)
    if [ -z "${so_file}" ]; then
        echo "ERROR: liblsl.so not found in build directory for ${arch}."
        echo "       Build output:"
        find "${build_dir}" -name "*.so" -type f
        exit 1
    fi

    mkdir -p "${OUTPUT_DIR}/${arch}"
    cp "${so_file}" "${output_file}"
    echo "[${arch}] Installed: ${output_file}"
    echo "  Size: $(du -h "${output_file}" | cut -f1)"
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "============================================="
echo "  liblsl ${LIBLSL_VERSION} Android build complete"
echo "============================================="
for arch in "${ARCHS[@]}"; do
    size=$(du -h "${OUTPUT_DIR}/${arch}/liblsl.so" | cut -f1)
    echo "  ${arch}: ${size}"
done
echo ""
echo "Output directory: ${OUTPUT_DIR}"
