# Viewers

> Source: https://labstreaminglayer.readthedocs.io/info/viewers.html

---

Over the years, several online and offline data viewers have been developed for LSL. The list below is by no means complete. If you have created a visualizer for LSL and wish to add it to the list below, please clone this repository, edit this file and submit a pull request. Or, if there is a viewer neglected in the list below, simply post an issue with a link.

## Online Viewers

A part of any LSL workbench should be a reliable way to monitor your data. Thus, sturdy, online data visualizers are essential tools. There are a number of stand-alone applications for viewing LSL data in real-time and software packages include online visualization windows.

Stand-alone online viewers:

- [MNE-LSL Player](https://mne.tools/mne-lsl/stable/generated/tutorials/20_player_annotations.html#sphx-glr-generated-tutorials-20-player-annotations-py)
- [StreamViewer](https://github.com/intheon/stream_viewer)
- [BrainVision LSL Viewer](https://www.brainproducts.com/downloads.php?kid=40&tab=3)
- [MATLABViewer](https://github.com/labstreaminglayer/App-MATLABViewer) -- Allow visualizing, filtering and saving data in EEGLAB format. Exists as a compiled standalone application (see GitHub release) with no MATLAB installation necessary, or as an EEGLAB plugin.
- StreamViewer (old version; used to be hosted at SCCN ftp as part of the mobi_utils package)
- [SigVisualizer](https://github.com/labstreaminglayer/App-SigVisualizer) (Python/PyQt5 based - From Yida Lin and Clemens Brunner)
- [PlotJuggler](https://github.com/facontidavide/PlotJuggler) supports LSL streams and other data sources.
- [Open Ephys](https://open-ephys.org/gui) via [OpenEphysLSL-Inlet Plugin](https://github.com/labstreaminglayer/OpenEphysLSL-Inlet)
  - Older [LSL-Inlet Plugin](https://github.com/tne-lab/LSL-inlet)
- The [python bindings](https://github.com/labstreaminglayer/liblsl-Python) contain a [very basic visualizer](https://github.com/labstreaminglayer/liblsl-Python/blob/master/pylsl/examples/ReceiveAndPlot.py). To start it, install pylsl and pyqtgraph and run it as `python -m pylsl.examples.ReceiveAndPlot`.

Software suites/packages supporting online LSL visualization:

- [BCI2000](http://bci2000.org/)
- [Muse LSL](https://github.com/alexandrebarachant/muse-lsl)
- [Neuropype](https://www.neuropype.io/)
- [OpenViBE](http://openvibe.inria.fr/)

## Offline Viewers

The following software suites/packages support offline visualization of XDF files, the file format used by [LabRecorder](https://github.com/labstreaminglayer/App-LabRecorder) to store LSL streams:

- [EEGLAB](https://sccn.ucsd.edu/eeglab/index.php)
- [Neuropype](https://www.neuropype.io/)
- [MNELab](https://github.com/cbrnr/mnelab)
- [MoBILAB](https://sccn.ucsd.edu/wiki/MoBILAB)
- [SigViewer](https://github.com/cbrnr/sigviewer)
