require.config({
  baseUrl: '/js',
  paths: {
    'modules': 'modules',
    'LazyLoader': '../shared/js/lazy_loader'
  },
  shim: {
    'settings': {
      exports: 'Settings'
    },
    'LazyLoader': {
      exports: 'LazyLoader'
    }
  },
  modules: [
    {
      name: 'main'
    }
  ]
});
