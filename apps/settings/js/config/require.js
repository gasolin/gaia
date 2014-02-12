require.config({
  baseUrl: '/js',
  paths: {
    'modules': 'modules',
    'shared': '../shared/js'
  },
  shim: {
    'settings': {
      exports: 'Settings'
    },
    'shared/lazy_loader': {
      exports: 'LazyLoader'
    }
  },
  modules: [
    {
      name: 'main'
    }
  ]
});
