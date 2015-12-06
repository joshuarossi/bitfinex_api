Package.describe({
  name: 'nevtep:bitfinex-api',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'A simple wrapper that allows one to interact with bitfinex, without dependency of iron router',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/nevtep/bitfinex_api.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.use(['http', 'mongo', 'livedata', 'meteor'], ['server']);
  api.use(['meteor-platform']);
  api.versionsFrom('1.1.0.2');
  api.addFiles(['bitfinex-api.js', 'server/methods.js'], 'server');
  api.export(['bitfinex', 'Bitfinex'], 'server');
});
