/**
 * cordova-plugin-lsl
 * JNI Bridge: Maps Java native method declarations to liblsl C API calls.
 *
 * Copyright (c) 2026 Mindfield Biosystems Ltd.
 * Licensed under the MIT License.
 */

#include <jni.h>
#include <string.h>
#include <stdlib.h>
#include "lsl_c.h"

/* ======================== Helper Macros ======================== */

#define JNI_CLASS_PLUGIN  "de/mindfield/cordova/lsl/LSLPlugin"
#define JNI_CLASS_WRAPPER "de/mindfield/cordova/lsl/LSLOutletWrapper"

/* Cast between jlong and pointer safely */
#define PTR_TO_JLONG(p)   ((jlong)(intptr_t)(p))
#define JLONG_TO_PTR(j,T) ((T)(intptr_t)(j))

/* ======================== Stream Info ======================== */

static jlong native_lsl_create_streaminfo(JNIEnv *env, jclass cls,
        jstring jname, jstring jtype, jint channelCount,
        jdouble sampleRate, jint channelFormat, jstring jsourceId) {

    const char *name = (*env)->GetStringUTFChars(env, jname, NULL);
    const char *type = (*env)->GetStringUTFChars(env, jtype, NULL);
    const char *sourceId = (*env)->GetStringUTFChars(env, jsourceId, NULL);

    lsl_streaminfo info = lsl_create_streaminfo(
        name, type, (int)channelCount, (double)sampleRate,
        (lsl_channel_format_t)channelFormat, sourceId);

    (*env)->ReleaseStringUTFChars(env, jname, name);
    (*env)->ReleaseStringUTFChars(env, jtype, type);
    (*env)->ReleaseStringUTFChars(env, jsourceId, sourceId);

    return PTR_TO_JLONG(info);
}

static void native_lsl_destroy_streaminfo(JNIEnv *env, jclass cls, jlong info) {
    if (info != 0) {
        lsl_destroy_streaminfo(JLONG_TO_PTR(info, lsl_streaminfo));
    }
}

static jlong native_lsl_get_desc(JNIEnv *env, jclass cls, jlong info) {
    lsl_xml_ptr desc = lsl_get_desc(JLONG_TO_PTR(info, lsl_streaminfo));
    return PTR_TO_JLONG(desc);
}

/* ======================== XML Metadata ======================== */

static jlong native_lsl_append_child(JNIEnv *env, jclass cls,
        jlong parent, jstring jname) {
    const char *name = (*env)->GetStringUTFChars(env, jname, NULL);
    lsl_xml_ptr child = lsl_append_child(JLONG_TO_PTR(parent, lsl_xml_ptr), name);
    (*env)->ReleaseStringUTFChars(env, jname, name);
    return PTR_TO_JLONG(child);
}

static jlong native_lsl_append_child_value(JNIEnv *env, jclass cls,
        jlong parent, jstring jname, jstring jvalue) {
    const char *name = (*env)->GetStringUTFChars(env, jname, NULL);
    const char *value = (*env)->GetStringUTFChars(env, jvalue, NULL);
    lsl_xml_ptr child = lsl_append_child_value(
        JLONG_TO_PTR(parent, lsl_xml_ptr), name, value);
    (*env)->ReleaseStringUTFChars(env, jname, name);
    (*env)->ReleaseStringUTFChars(env, jvalue, value);
    return PTR_TO_JLONG(child);
}

/* ======================== Outlet ======================== */

static jlong native_lsl_create_outlet(JNIEnv *env, jclass cls,
        jlong info, jint chunkSize, jint maxBuffered) {
    lsl_outlet outlet = lsl_create_outlet(
        JLONG_TO_PTR(info, lsl_streaminfo), (int)chunkSize, (int)maxBuffered);
    return PTR_TO_JLONG(outlet);
}

static void native_lsl_destroy_outlet(JNIEnv *env, jclass cls, jlong outlet) {
    if (outlet != 0) {
        lsl_destroy_outlet(JLONG_TO_PTR(outlet, lsl_outlet));
    }
}

static void native_lsl_push_sample_f(JNIEnv *env, jclass cls,
        jlong outlet, jfloatArray jdata, jdouble timestamp) {
    jfloat *data = (*env)->GetFloatArrayElements(env, jdata, NULL);
    lsl_push_sample_ft(JLONG_TO_PTR(outlet, lsl_outlet), data, (double)timestamp);
    (*env)->ReleaseFloatArrayElements(env, jdata, data, JNI_ABORT);
}

static void native_lsl_push_sample_d(JNIEnv *env, jclass cls,
        jlong outlet, jdoubleArray jdata, jdouble timestamp) {
    jdouble *data = (*env)->GetDoubleArrayElements(env, jdata, NULL);
    lsl_push_sample_dt(JLONG_TO_PTR(outlet, lsl_outlet), data, (double)timestamp);
    (*env)->ReleaseDoubleArrayElements(env, jdata, data, JNI_ABORT);
}

static void native_lsl_push_sample_i(JNIEnv *env, jclass cls,
        jlong outlet, jintArray jdata, jdouble timestamp) {
    jint *data = (*env)->GetIntArrayElements(env, jdata, NULL);
    lsl_push_sample_it(JLONG_TO_PTR(outlet, lsl_outlet), (const int32_t *)data, (double)timestamp);
    (*env)->ReleaseIntArrayElements(env, jdata, data, JNI_ABORT);
}

static void native_lsl_push_sample_s(JNIEnv *env, jclass cls,
        jlong outlet, jshortArray jdata, jdouble timestamp) {
    jshort *data = (*env)->GetShortArrayElements(env, jdata, NULL);
    lsl_push_sample_st(JLONG_TO_PTR(outlet, lsl_outlet), (const int16_t *)data, (double)timestamp);
    (*env)->ReleaseShortArrayElements(env, jdata, data, JNI_ABORT);
}

static void native_lsl_push_sample_c(JNIEnv *env, jclass cls,
        jlong outlet, jbyteArray jdata, jdouble timestamp) {
    jbyte *data = (*env)->GetByteArrayElements(env, jdata, NULL);
    lsl_push_sample_ct(JLONG_TO_PTR(outlet, lsl_outlet), (const char *)data, (double)timestamp);
    (*env)->ReleaseByteArrayElements(env, jdata, data, JNI_ABORT);
}

static void native_lsl_push_sample_str(JNIEnv *env, jclass cls,
        jlong outlet, jobjectArray jdata, jdouble timestamp) {
    int len = (*env)->GetArrayLength(env, jdata);
    const char **strs = (const char **)malloc(len * sizeof(const char *));

    for (int i = 0; i < len; i++) {
        jstring jstr = (jstring)(*env)->GetObjectArrayElement(env, jdata, i);
        strs[i] = (*env)->GetStringUTFChars(env, jstr, NULL);
    }

    lsl_push_sample_strt(JLONG_TO_PTR(outlet, lsl_outlet), strs, (double)timestamp);

    for (int i = 0; i < len; i++) {
        jstring jstr = (jstring)(*env)->GetObjectArrayElement(env, jdata, i);
        (*env)->ReleaseStringUTFChars(env, jstr, strs[i]);
    }
    free(strs);
}

static jint native_lsl_have_consumers(JNIEnv *env, jclass cls, jlong outlet) {
    return (jint)lsl_have_consumers(JLONG_TO_PTR(outlet, lsl_outlet));
}

static jint native_lsl_wait_for_consumers(JNIEnv *env, jclass cls,
        jlong outlet, jdouble timeout) {
    return (jint)lsl_wait_for_consumers(JLONG_TO_PTR(outlet, lsl_outlet), (double)timeout);
}

/* ======================== Utility ======================== */

static jdouble native_lsl_local_clock(JNIEnv *env, jclass cls) {
    return (jdouble)lsl_local_clock();
}

static jint native_lsl_library_version(JNIEnv *env, jclass cls) {
    return (jint)lsl_library_version();
}

static jint native_lsl_protocol_version(JNIEnv *env, jclass cls) {
    return (jint)lsl_protocol_version();
}

/* ======================== JNI Registration ======================== */

/* Methods for LSLPlugin class */
static JNINativeMethod pluginMethods[] = {
    {"lsl_create_streaminfo",  "(Ljava/lang/String;Ljava/lang/String;IDILjava/lang/String;)J",
        (void *)native_lsl_create_streaminfo},
    {"lsl_destroy_streaminfo", "(J)V",
        (void *)native_lsl_destroy_streaminfo},
    {"lsl_get_desc",           "(J)J",
        (void *)native_lsl_get_desc},
    {"lsl_append_child",       "(JLjava/lang/String;)J",
        (void *)native_lsl_append_child},
    {"lsl_append_child_value", "(JLjava/lang/String;Ljava/lang/String;)J",
        (void *)native_lsl_append_child_value},
    {"lsl_create_outlet",      "(JII)J",
        (void *)native_lsl_create_outlet},
    {"lsl_destroy_outlet",     "(J)V",
        (void *)native_lsl_destroy_outlet},
    {"lsl_push_sample_f",      "(J[FD)V",
        (void *)native_lsl_push_sample_f},
    {"lsl_push_sample_d",      "(J[DD)V",
        (void *)native_lsl_push_sample_d},
    {"lsl_push_sample_i",      "(J[ID)V",
        (void *)native_lsl_push_sample_i},
    {"lsl_push_sample_s",      "(J[SD)V",
        (void *)native_lsl_push_sample_s},
    {"lsl_push_sample_c",      "(J[BD)V",
        (void *)native_lsl_push_sample_c},
    {"lsl_push_sample_str",    "(J[Ljava/lang/String;D)V",
        (void *)native_lsl_push_sample_str},
    {"lsl_have_consumers",     "(J)I",
        (void *)native_lsl_have_consumers},
    {"lsl_wait_for_consumers", "(JD)I",
        (void *)native_lsl_wait_for_consumers},
    {"lsl_local_clock",        "()D",
        (void *)native_lsl_local_clock},
    {"lsl_library_version",    "()I",
        (void *)native_lsl_library_version},
    {"lsl_protocol_version",   "()I",
        (void *)native_lsl_protocol_version},
};

/* Methods for LSLOutletWrapper class (destroy functions) */
static JNINativeMethod wrapperMethods[] = {
    {"lsl_destroy_outlet",     "(J)V",
        (void *)native_lsl_destroy_outlet},
    {"lsl_destroy_streaminfo", "(J)V",
        (void *)native_lsl_destroy_streaminfo},
};

JNIEXPORT jint JNI_OnLoad(JavaVM *vm, void *reserved) {
    JNIEnv *env;
    if ((*vm)->GetEnv(vm, (void **)&env, JNI_VERSION_1_6) != JNI_OK) {
        return JNI_ERR;
    }

    /* Register native methods for LSLPlugin */
    jclass pluginClass = (*env)->FindClass(env, JNI_CLASS_PLUGIN);
    if (pluginClass == NULL) return JNI_ERR;

    if ((*env)->RegisterNatives(env, pluginClass,
            pluginMethods, sizeof(pluginMethods) / sizeof(pluginMethods[0])) < 0) {
        return JNI_ERR;
    }

    /* Register native methods for LSLOutletWrapper */
    jclass wrapperClass = (*env)->FindClass(env, JNI_CLASS_WRAPPER);
    if (wrapperClass == NULL) return JNI_ERR;

    if ((*env)->RegisterNatives(env, wrapperClass,
            wrapperMethods, sizeof(wrapperMethods) / sizeof(wrapperMethods[0])) < 0) {
        return JNI_ERR;
    }

    return JNI_VERSION_1_6;
}
