define('modules/Volume',
  ['modules/StackedBar', 'modules/Utils'],
  function(StackedBar, Utils) {
    'use strict';
    const MEDIA_TYPE = ['music', 'pictures', 'videos', 'sdcard'];
    const ITEM_TYPE = ['music', 'pictures', 'videos', 'free'];

    var Volume = function(name, external, externalIndex, storages) {
      this.name = name;
      this.external = external;
      this.externalIndex = externalIndex;
      this.storages = storages;
      this.rootElement = null;  //<ul></ul>
      this.stackedbar = null;
    };

    // This function will create a view for each volume under #volume-list,
    // the DOM structure looks like:
    //
    //<header>
    //  <h2 data-l10n-id="storage-name-internal">Internal Storage</h2>
    //</header>
    //<ul>
    //  <li>
    //    <div id="sdcard-space-stackedbar" class="space-stackedbar">
    //      <!-- stacked bar for displaying the amounts of media type usages -->
    //    </div>
    //  </li>
    //  <li class="color-music">
    //    <span class="stackedbar-color-label"></span>
    //    <a data-l10n-id="music-space">Music
    //      <span class="size"></span>
    //    </a>
    //  </li>
    //  <li class="color-pictures">
    //    <span class="stackedbar-color-label"></span>
    //    <a data-l10n-id="pictures-space">Pictures
    //      <span class="size"></span>
    //    </a>
    //  </li>
    //  <li class="color-videos">
    //    <span class="stackedbar-color-label"></span>
    //    <a data-l10n-id="videos-space">Videos
    //      <span class="size"></span>
    //    </a>
    //  </li>
    //  <li class="color-free">
    //    <span class="stackedbar-color-label"></span>
    //    <a data-l10n-id="free-space">Space left
    //      <span class="size"></span>
    //    </a>
    //  </li>
    //  <li>
    //    <label class="pack-switch">
    //      <input type="checkbox" name="ums.volume.sdcard.enabled" />
    //      <span data-l10n-id="share-using-usb">Share using USB</span>
    //    </label>
    //  </li>
    //</ul>

    Volume.prototype.getL10nId = function volume_getL10nId(useShort) {
      var prefix = useShort ? 'short-storage-name-' : 'storage-name-';
      if (this.external) {
        return prefix + 'external-' + this.externalIndex;
      } else {
        return prefix + 'internal';
      }
    };

    Volume.prototype.createView = function volume_createView(listRoot) {
      var _ = navigator.mozL10n.get;
      // create header
      var h2 = document.createElement('h2');
      var l10nId = this.getL10nId();
      h2.dataset.l10nId = l10nId;
      h2.textContent = _(l10nId);
      var header = document.createElement('header');
      header.appendChild(h2);
      listRoot.appendChild(header);
      // create ul
      this.rootElement = document.createElement('ul');
      listRoot.appendChild(this.rootElement);

      var stackedbarDiv = document.createElement('div');
      stackedbarDiv.id = this.name + '-space-stackedbar';
      stackedbarDiv.classList.add('space-stackedbar');
      var li = document.createElement('li');
      li.appendChild(stackedbarDiv);
      this.rootElement.appendChild(li);
      this.stackedbar = StackedBar(stackedbarDiv);

      var self = this;
      ITEM_TYPE.forEach(function(type) {
        var label = document.createElement('span');
        label.classList.add('stackedbar-color-label');
        var size = document.createElement('span');
        size.classList.add('size');
        var text = document.createElement('a');
        var l10nId = type + '-space';
        text.dataset.l10nId = l10nId;
        text.textContent = _(l10nId);
        text.appendChild(size);
        var li = document.createElement('li');
        li.classList.add('color-' + type);
        li.appendChild(label);
        li.appendChild(text);
        self.rootElement.appendChild(li);
      });

      var input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'ums.volume.' + this.name + '.enabled';
      var label = document.createElement('label');
      label.classList.add('pack-switch');
      label.appendChild(input);
      var span = document.createElement('span');
      span.dataset.l10nId = 'share-using-usb';
      span.textContent = _('share-using-usb');
      label.appendChild(span);

      var ele = document.createElement('li');
      ele.appendChild(label);
      this.rootElement.appendChild(ele);
    };

    Volume.prototype.updateStorageInfo = function volume_updateStorageInfo() {
      // Update the storage details
      var self = this;
      this.getStats(function(sizes) {
        self.stackedbar.reset();
        ITEM_TYPE.forEach(function(type) {
          var element =
            self.rootElement.querySelector('.color-' + type + ' .size');
          Utils.DeviceStorageHelper.showFormatedSize(element,
                                               'storageSize', sizes[type]);
          self.stackedbar.add({ 'type': type, 'value': sizes[type] });
        });
        self.stackedbar.refreshUI();
      });
    };

    Volume.prototype.getStats = function volume_getStats(callback) {
      var results = {};
      var current = MEDIA_TYPE.length;
      var storages = this.storages;
      MEDIA_TYPE.forEach(function(type) {
        var storage = storages[type];
        storage.usedSpace().onsuccess = function(e) {
          results[type] = e.target.result;
          current--;
          if (current == 0) {
            storage.freeSpace().onsuccess = function(e) {
              results['free'] = e.target.result;
              if (callback)
                callback(results);
            };
          }
        };
      });
    };

    Volume.prototype.updateInfo = function volume_updateInfo(callback) {
      var self = this;
      var availreq = this.storages.sdcard.available();
      availreq.onsuccess = function availSuccess(evt) {
        var state = evt.target.result;
        switch (state) {
          case 'shared':
            self.setInfoUnavailable();
            break;
          case 'unavailable':
            self.setInfoUnavailable();
            break;
          case 'available':
            self.updateStorageInfo();
            break;
        }
        if (callback)
          callback(state);
      };
    };

    Volume.prototype.setInfoUnavailable = function volume_setInfoUnavailable() {
      var self = this;
      var _ = navigator.mozL10n.get;
      ITEM_TYPE.forEach(function(type) {
        var rule = '.color-' + type + ' .size';
        var element = self.rootElement.querySelector(rule);
        element.textContent = _('size-not-available');
        element.dataset.l10nId = 'size-not-available';
      });
      this.stackedbar.reset();
    };

    return Volume;
});
