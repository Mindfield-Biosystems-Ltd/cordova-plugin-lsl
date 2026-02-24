# LSL freestanding functions

> Source: https://labstreaminglayer.readthedocs.io/projects/liblsl/ref/freefuncs.html

## `lsl_local_clock()`

```cpp
double lsl_local_clock()
```

Obtain a local system time stamp in seconds.

The resolution is better than a millisecond. This reading can be used to assign time stamps to samples as they are being acquired. If the "age" of a sample is known at a particular time (e.g., from USB transmission delays), it can be used as an offset to `lsl_local_clock()` to obtain a better estimate of when a sample was actually captured. See `lsl_push_sample()` for a use case.

## `lsl_time_correction_ex()`

```cpp
double lsl_time_correction_ex(lsl_inlet in, double *remote_time, double *uncertainty, double timeout, int32_t *ec)
```

Retrieve an estimated time correction offset for the given stream.

The first call to this function takes several milliseconds until a reliable first estimate is obtained. Subsequent calls are instantaneous (and rely on periodic background updates).

On a well-behaved network, the precision of these estimates should be below 1 ms (empirically it is within +/-0.2 ms).

To get a measure of whether the network is well-behaved, use `lsl_time_correction_ex` and check uncertainty (which maps to round-trip-time). 0.2 ms is typical of wired networks. 2 ms is typical of wireless networks. The number can be much higher on poor networks.

**Return:** The time correction estimate. This is the number that needs to be added to a time stamp that was remotely generated via `lsl_local_clock()` to map it into the local clock domain of this machine.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `in` | The lsl_inlet object to act on. |
| `timeout` | Timeout to acquire the first time-correction estimate. Use LSL_FOREVER to defuse the timeout. |
| `ec` | (out) Error code: if nonzero, can be either `lsl_timeout_error` (if the timeout has expired) or `lsl_lost_error` (if the stream source has been lost). |
| `remote_time` | The current time of the remote computer that was used to generate this time_correction. If desired, the client can fit time_correction vs remote_time to improve the real-time time_correction further. |
| `uncertainty` | The maximum uncertainty of the given time correction. |

## `lsl_library_version()`

```cpp
int32_t lsl_library_version()
```

Version of the liblsl library.

The major version is `library_version() / 100;`
The minor version is `library_version() % 100;`

## `lsl_library_info()`

```cpp
const char *lsl_library_info()
```

Get a string containing library information.

The format of the string shouldn't be used for anything important except giving a debugging person a good idea which exact library version is used.

## `lsl_protocol_version()`

```cpp
int32_t lsl_protocol_version()
```

Protocol version.

The major version is `protocol_version() / 100;`
The minor version is `protocol_version() % 100;`

Clients with different minor versions are protocol-compatible with each other while clients with different major versions will refuse to work together.
