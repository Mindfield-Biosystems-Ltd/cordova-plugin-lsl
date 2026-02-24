# XDF Meta-Data Specifications

> Source: https://github.com/sccn/xdf/wiki/Meta-Data

## Introduction

This document contains recommendations for representing meta-data about different kinds of recordings (for example, EEG, NIRS, fMRI, and so on).

Meta-information is associated with a particular stream, and therefore it can be found in the StreamHeader chunk of a stream. In particular, it is represented as an XML string within the `<desc>` tag.

## Call for contributions

The most important goal is to lay out and delineate the basic categories of the meta-information thoroughly. Details can be added later, but categories cannot be corrected after the first programs start supporting prematurely standardized content. The second most important topic is to specify details in those areas where you are a domain expert.

## Notes on editing

When editing please try to be consistent with the current naming/formatting style. The meta-information is presented within xml code blocks. Comments are started by the # character. Use two spaces to indent by one level.

Expert note: This is a human-readable description for a simplified XML grammar which does not include attributes.

## Stream content types

Currently, specifications for meta-data associated with the following content-type values is available:

- **EEG** (for Electroencephalogram) - see [EEG Meta-Data](https://github.com/sccn/xdf/wiki/EEG-Meta-Data)
- **MoCap** (for Motion Capture) - see [MoCap Meta-Data](https://github.com/sccn/xdf/wiki/MoCap-Meta-Data)
- **NIRS** (Near-Infrared Spectroscopy) - see [NIRS Meta-Data](https://github.com/sccn/xdf/wiki/NIRS-Meta-Data)
- **Gaze** (for gaze / eye tracking parameters) - see [Gaze Meta-Data](https://github.com/sccn/xdf/wiki/Gaze-Meta-Data)
- **VideoRaw** (for uncompressed video) - see [Video Raw Meta-Data](https://github.com/sccn/xdf/wiki/Video-Raw-Meta-Data)
- **VideoCompressed** (for compressed video) - see [Video Compressed Meta-Data](https://github.com/sccn/xdf/wiki/Video-Compressed-Meta-Data)
- **Audio** (for PCM-encoded audio) - see [Audio Meta-Data](https://github.com/sccn/xdf/wiki/Audio-Meta-Data)
- **Markers** (for event marker streams) - see [Markers Meta-Data](https://github.com/sccn/xdf/wiki/Markers-Meta-Data)

## Additional meta-data categories

Further bits of meta-data that can be associated with a stream:

- [Human-Subject Information](https://github.com/sccn/xdf/wiki/Human-Subject-Meta-Data)
- [Recording Environment Information](https://github.com/sccn/xdf/wiki/Recording-Environment-Meta-Data)
- [Experiment Information](https://github.com/sccn/xdf/wiki/Experiment-Meta-Data)
- [Synchronization Information](https://github.com/sccn/xdf/wiki/Synchronization)
