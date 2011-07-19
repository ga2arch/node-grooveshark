(function() {
  var groove, params, shark;
  require('joose');
  require('joosex-namespace-depended');
  require('hash');
  groove = require('./grooveshark.js');
  shark = new groove();
  params = {
    userID: 4497783,
    ofWhat: 'Albums'
  };
  shark.request('userGetPlaylists', params, function(data) {
    return console.log(data);
  });
}).call(this);
