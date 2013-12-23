define('panels/MediaStoragePanel',
  ['modules/Panel', 'modules/MediaStorage'],
  function(Panel, MediaStorage) {
    return function ctor_MediaStorage() {
      return Panel({
        onInit: function(rootElement) {
          MediaStorage().init(rootElement);
        }
      });
    };
});
