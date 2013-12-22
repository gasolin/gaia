define('panels/MediaStoragePanel',
  ['modules/Panel', 'modules/MediaStorage'],
  function(Panel, MediaStorage) {
    return Panel(MediaStorage.init);
});
