cmake_minimum_required(VERSION 3.18)
project(lsl_jni C)

# Build the JNI bridge as a shared library
add_library(lsl_jni SHARED lsl_jni.c)

# Link against liblsl (pre-built shared library)
# LSL_LIB_DIR is passed from the build script and points to the directory
# containing the already-built liblsl.so for this architecture
set(LSL_LIB_PATH "${LSL_LIB_DIR}/liblsl.so")
if(NOT EXISTS "${LSL_LIB_PATH}")
    message(FATAL_ERROR "liblsl.so not found at ${LSL_LIB_PATH}")
endif()

add_library(lsl SHARED IMPORTED)
set_target_properties(lsl PROPERTIES IMPORTED_LOCATION "${LSL_LIB_PATH}")

target_include_directories(lsl_jni PRIVATE ${LSL_INCLUDE_DIR})
target_link_libraries(lsl_jni lsl log)
