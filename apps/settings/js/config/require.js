require.config({
  baseUrl: '/js',
  paths: {
    'modules': 'modules'
  },
  shim: {
    'settings': {
      exports: 'Settings'
    }
  },
  modules: [
    {
      name: 'main'
    }
  ]
});
