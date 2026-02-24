# Enumerations / Flags

> Source: https://labstreaminglayer.readthedocs.io/projects/liblsl/ref/enums.html

## Postprocessing options

### `lsl_processing_options_t`

Post-processing options for stream inlets.

| Value | Name | Description |
|-------|------|-------------|
| 0 | `proc_none` | No automatic post-processing; return the ground-truth time stamps for manual post-processing. This is the default behavior of the inlet. |
| 1 | `proc_clocksync` | Perform automatic clock synchronization; equivalent to manually adding the time_correction() value to the received time stamps. |
| 2 | `proc_dejitter` | Remove jitter from time stamps. This will apply a smoothing algorithm to the received time stamps; the smoothing needs to see a minimum number of samples (30-120 seconds worst-case) until the remaining jitter is consistently below 1ms. |
| 4 | `proc_monotonize` | Force the time-stamps to be monotonically ascending. Only makes sense if timestamps are dejittered. |
| 8 | `proc_threadsafe` | Post-processing is thread-safe (same inlet can be read from by multiple threads); uses somewhat more CPU. |
| 1\|2\|4\|8 | `proc_ALL` | The combination of all possible post-processing options. |

## Channel formats

### `lsl_channel_format_t`

Data format of a channel (each transmitted sample holds an array of channels).

| Value | Name | Description |
|-------|------|-------------|
| 1 | `cft_float32` | For up to 24-bit precision measurements in the appropriate physical unit (e.g., microvolts). Integers from -16777216 to 16777216 are represented accurately. |
| 2 | `cft_double64` | For universal numeric data as long as permitted by network & disk budget. The largest representable integer is 53-bit. |
| 3 | `cft_string` | For variable-length ASCII strings or data blobs, such as video frames, complex event descriptions, etc. |
| 4 | `cft_int32` | For high-rate digitized formats that require 32-bit precision. Depends critically on meta-data to represent meaningful units. Useful for application event codes or other coded data. |
| 5 | `cft_int16` | For very high rate signals (40Khz+) or consumer-grade audio. For professional audio float is recommended. |
| 6 | `cft_int8` | For binary signals or other coded data. Not recommended for encoding string data. |
| 7 | `cft_int64` | For now only for future compatibility. Support for this type is not yet exposed in all languages. Also, some builds of liblsl will not be able to send or receive data of this type. |
| 0 | `cft_undefined` | Can not be transmitted. |

## Error codes

### `lsl_error_code_t`

Possible error codes.

| Value | Name | Description |
|-------|------|-------------|
| 0 | `lsl_no_error` | No error occurred. |
| -1 | `lsl_timeout_error` | The operation failed due to a timeout. |
| -2 | `lsl_lost_error` | The stream has been lost. |
| -3 | `lsl_argument_error` | An argument was incorrectly specified (e.g., wrong format or wrong length). |
| -4 | `lsl_internal_error` | Some other internal error has happened. |
