(function() {
  var Grooveshark, events, http, https;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  events = require('events');
  http = require('http');
  https = require('https');
  Grooveshark = (function() {
    __extends(Grooveshark, events.EventEmitter);
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
      this.METHOD_CLIENTS = {
        getStreamKeyFromSongIDEx: 'jsqueue'
      };
      this.session = null;
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
      var params, self;
      self = this;
      params = {
        secretKey: Hash.md5(this.session)
      };
      return this.request('getCommunicationToken', params, true, function(data) {
        this.commToken = JSON.parse(data).result;
        return this.commTokenTTL = new Date().getTime();
      });
    };
    Grooveshark.prototype.refreshToken = function(callback) {
      var time;
      time = new Date().getTime();
      if (time - this.commTokenTTL > this.TOKEN_TTL) {
        return this.getCommToken(callback);
      }
    };
    Grooveshark.prototype.createToken = function(method, commToken) {
      var hash, plain, rnd;
      rnd = this.genHex();
      plain = method + ':' + commToken + ':' + 'quitStealinMahShit' + rnd;
      hash = Hash.sha1(plain);
      return rnd + hash;
    };
    Grooveshark.prototype.genHex = function(size) {
      var item, items, n, ran;
      if (size == null) {
        size = 6;
      }
      items = 'abcdef';
      item = '';
      for (n = 1; 1 <= size ? n <= size : n >= size; 1 <= size ? n++ : n--) {
        ran = Math.round(Math.random() * 14);
        if (ran > 9) {
          item += items[ran - 9];
        } else {
          item += ran;
        }
      }
      return item;
    };
    Grooveshark.prototype.request = function(method, params, secure, callback) {
      var agent, body, h, options, path, port, postData, req, self;
      if (params == null) {
        params = {};
      }
      if (secure == null) {
        secure = false;
      }
      console.log(this.session);
      if (this.session === null) {
        this.getSession(function() {
          return this.request(method, params, secure, callback);
        });
      }
      this.refreshToken(function() {
        return this.request(method, params, secure, callback);
      });
      self = this;
      if (method === 'getStreamKeyFromSongIDEx') {
        agent = 'jsqueue';
      } else {
        agent = this.CLIENT;
      }
      path = '/more.php?' + method;
      body = {
        header: {
          session: this.session,
          uuid: this.UUID,
          client: agent,
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
      console.log(postData);
      port = 80;
      if (secure) {
        port = 443;
      }
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
          return callback(data);
        });
      });
      req.write(postData);
      return req.end();
    };
    return Grooveshark;
  })();
  module.exports = Grooveshark;
}).call(this);
