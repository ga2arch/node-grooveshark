(function() {
  var Grooveshark, crypto, http, https;
  require('joose');
  require('joosex-namespace-depended');
  crypto = require('crypto');
  http = require('http');
  https = require('https');
  Grooveshark = (function() {
    function Grooveshark() {
      this.API_BASE = 'grooveshark.com';
      this.UUID = 'A3B724BA-14F5-4932-98B8-8D375F85F266';
      this.CLIENT = 'htmlshark';
      this.CLIENT_REV = '20110606';
      this.COUNTRY = {
        CC2: '0',
        IPR: '353',
        CC4: '1073741824',
        CC3: '0',
        CC1: '0',
        ID: '223'
      };
      this.TOKEN_TTL = 120;
      this.SALT = 'backToTheScienceLab';
      this.METHOD_CLIENTS = {
        getStreamKeyFromSongIDEx: 'jsqueue'
      };
      this.METHOD_SALTS = {
        getStreamKeyFromSongIDEx: 'bewareOfBearsharktopus'
      };
      this.METHOD_CLIENT_REVS = {
        getStreamKeyFromSongIDEx: '20110606.04'
      };
      this.session = null;
      this.commToken = null;
    }
    Grooveshark.prototype.getSession = function(callback) {
      var options, self;
      self = this;
      options = {
        host: 'grooveshark.com',
        port: 80,
        path: '/'
      };
      return http.get(options, function(res) {
        self.session = res.headers['set-cookie'][0].split('=')[1].split(';')[0];
        return self.getCommToken(function() {
          return callback();
        });
      });
    };
    Grooveshark.prototype.getCommToken = function(callback) {
      var md5sum, params, self;
      self = this;
      md5sum = crypto.createHash('md5');
      params = {
        secretKey: md5sum.update(this.session).digest('hex')
      };
      return this.request('getCommunicationToken', params, true, function(data) {
        self.commToken = data;
        self.commTokenTTL = new Date().getTime();
        return callback();
      });
    };
    Grooveshark.prototype.createToken = function(method) {
      var hash, hashed, plain, rnd, salt;
      rnd = this.genHex();
      if (this.METHOD_SALTS[method] || this.SALT) {
        salt = this.METHOD_SALTS[method];
      }
      plain = method + ':' + this.commToken + ':' + salt + ':' + rnd;
      hash = crypto.createHash('sha1');
      hashed = hash.update(plain).digest('hex');
      return rnd + hashed;
    };
    Grooveshark.prototype.genHex = function() {
      var i, item;
      item = '';
      i = 0;
      while (i < 6) {
        item += Math.floor(Math.random() * 16).toString(16);
        i++;
      }
      return item;
    };
    Grooveshark.prototype.request = function(method, params, secure, callback) {
      var body, client, h, options, path, port, postData, req, self, time;
      if (params == null) {
        params = {};
      }
      if (secure == null) {
        secure = false;
      }
      self = this;
      if (this.session === null) {
        this.getSession(function() {
          return self.request(method, params, secure, callback);
        });
        return;
      }
      time = new Date().getTime();
      if (method !== 'getCommunicationToken' && (time - this.commTokenTTL) >= (this.TOKEN_TTL * 1000)) {
        this.getCommToken(function() {
          return self.request(method, params, secure, callback);
        });
        return;
      }
      client = this.METHOD_CLIENTS[method] || this.CLIENT;
      path = '/more.php?' + method;
      body = {
        header: {
          session: this.session,
          uuid: this.UUID,
          client: client,
          clientRevision: this.CLIENT_REV,
          country: this.COUNTRY
        },
        method: method,
        parameters: params
      };
      if (this.commToken !== null) {
        body.header.token = this.createToken(method);
      }
      postData = JSON.stringify(body);
      port = (secure ? 443 : void 0) || 80;
      options = {
        host: this.API_BASE,
        path: path,
        port: port,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length,
          'Cookie': 'PHPSESSID=' + this.session
        }
      };
      h = http.request;
      if (secure) {
        h = https.request;
      }
      req = h(options, function(res) {
        var data;
        data = '';
        res.setEncoding('utf-8');
        res.on('data', function(chuck) {
          return data += chuck;
        });
        return res.on('end', function() {
          data = JSON.parse(data);
          if (data.fault !== void 0) {
            throw data.fault.message;
          }
          return callback(data.result);
        });
      });
      req.on('error', function(e) {
        return console.log(e.message);
      });
      req.write(postData);
      return req.end();
    };
    return Grooveshark;
  })();
  module.exports = Grooveshark;
}).call(this);
