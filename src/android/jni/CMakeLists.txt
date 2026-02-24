cmake_minimum_required(VERSION 3.18)
project(lsl_jni C)

# Build the JNI bridge as a shared library
add_library(lsl_jni SHARED lsl_jni.c)

# Link against liblsl (pre-built shared library)
# The path is set by the Gradle build script
find_library(LSL_LIB lsl PATHS ${LSL_LIB_DIR} NO_DEFAULT_PATH)
if(NOT LSL_LIB)
    message(FATAL_ERROR "liblsl.so not found in ${LSL_LIB_DIR}")
endif()

target_include_directories(lsl_jni PRIVATE ${LSL_INCLUDE_DIR})
target_link_libraries(lsl_jni ${LSL_LIB} log)
