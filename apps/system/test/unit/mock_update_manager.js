'use strict';
/* exported MockUpdateManager */

var MockUpdateManager = {
  _startedDownloadUsingDataConnection: false,

  addToUpdatesQueue: function mum_addtoUpdateQueue(updatable) {
    this.mLastUpdatesAdd = updatable;
    this.mUpdates.push(updatable);
  },
  addToUpdatableApps: function mum_addToUpdatableApps(updatable) {
    this.mLastUpdatableAdd = updatable;
  },

  removeFromUpdatesQueue: function mum_removeFromUpdateQueue(updatable) {
    this.mLastUpdatesRemoval = updatable;
    var index = this.mUpdates.indexOf(updatable);
    if (index >= 0) {
      this.mUpdates.splice(index, 1);
    }
  },

  addToDownloadsQueue: function mum_addtoActiveDownloads(updatable) {
    this.mLastDownloadsAdd = updatable;
    this.mDownloads.push(updatable);
  },
  removeFromDownloadsQueue:
    function mum_removeFromActiveDownloads(updatable) {

    this.mLastDownloadsRemoval = updatable;
    var index = this.mDownloads.indexOf(updatable);
    if (index >= 0) {
      this.mDownloads.splice(index, 1);
    }
  },

  downloaded: function mum_downloaded(updatable) {
    this.mDownloadedCalled = true;
  },

  downloadProgressed: function mum_downloadProgressed(bytes) {
    this.mProgressCalledWith = bytes;
  },

  startedUncompressing: function mum_startedUncompressing() {
    this.mStartedUncompressingCalled = true;
  },

  requestErrorBanner: function mum_requestErrorBanner() {
    this.mErrorBannerRequested = true;
  },

  mErrorBannerRequested: false,
  mUpdates: [],
  mDownloads: [],
  mLastUpdatesAdd: null,
  mLastUpdatableAdd: null,
  mLastUpdatesRemoval: null,
  mLastDownloadsAdd: null,
  mLastDownloadsRemoval: null,
  mProgressCalledWith: null,
  mStartedUncompressingCalled: false,
  mDownloadedCalled: false,
  mTeardown: function mum_mTeardown() {
    this._startedDownloadUsingDataConnection = false;

    this.mErrorBannerRequested = false;
    this.mLastUpdatesAdd = null;
    this.mLastUpdatableAdd = null;
    this.mLastUpdatesRemoval = null;
    this.mLastDownloadsAdd = null;
    this.mLastDownloadsRemoval = null;
    this.mProgressCalledWith = null;
    this.mStartedUncompressingCalled = false;
    this.mDownloadedCalled = false;
    this.mUpdates = [];
    this.mDownloads = [];
  }
};
