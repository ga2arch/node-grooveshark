require 'joose'
require 'joosex-namespace-depended'
require 'hash'

http = require 'http'
https = require 'https'

class Grooveshark
	constructor: ->
		@API_BASE = 'grooveshark.com'
		@UUID = 'A3B724BA-14F5-4932-98B8-8D375F85F266'
		@CLIENT = 'htmlshark'
		@CLIENT_REV = '20110606'
		@COUNTRY = CC2: '0', IPR: '353', CC4: '1073741824', CC3: '0', CC1: '0', ID: '223'
		@TOKEN_TTL = 120
		@SALT = 'backToTheScienceLab'
		@METHOD_CLIENTS = getStreamKeyFromSongIDEx: 'jsqueue'
		@METHOD_SALTS = getStreamKeyFromSongIDEx: 'bewareOfBearsharktopus'
		@METHOD_CLIENT_REVS = getStreamKeyFromSongIDEx: '20110606.04'
		@session = null
		@commToken = null
		
		
	getSession: (callback) ->
		self = @
		options = host: 'grooveshark.com', port: 80, path: '/'
		http.get options, (res) ->
			self.session = res.headers['set-cookie'][0].split('=')[1].split(';')[0]
			self.getCommToken ->
				callback()
	
	getCommToken: (callback) ->
		self = @
		params = secretKey: Hash.md5 @session
		@request 'getCommunicationToken', params, true, (data) ->
			self.commToken = data
			self.commTokenTTL = new Date().getTime()
			callback()
	
	createToken: (method) ->
		rnd = @genHex()
		salt = @METHOD_SALTS[method] if @METHOD_SALTS[method] || @SALT
		plain = method+':'+@commToken+':'+salt+':'+rnd
		hash = Hash.sha1 plain
		rnd+hash
		
	genHex: ->
		item = ''
		i = 0
		while i < 6
			item += Math.floor(Math.random() * 16).toString(16)
			i++
		item
		
	request: (method, params={}, secure=false, callback) ->
		self = @
		if @session is null
			@getSession ->
				self.request method, params, secure, callback
			return
		
		'''time = new Date().getTime()
		if time - @commTokenTTL > @TOKEN_TTL * 1000
			@getCommToken ->
				self.request method, params, secure, callback 
			return'''
		
		client = @METHOD_CLIENTS[method] || @CLIENT
			
		path = '/more.php?'+method
		body = header: { session: @session, uuid: @UUID, client: client, clientRevision: @CLIENT_REV, country: @COUNTRY }, method: method, parameters: params
		body.header.token = @createToken method if @commToken isnt null
		postData = JSON.stringify body
		
		port = ( 443 if secure ) || 80
		
		options = host: @API_BASE, path: path, port: port, method: 'POST', headers: {
		          	'Content-Type': 'application/json',
					'Content-Length': postData.length,
					'Cookie': 'PHPSESSID='+@session
		          }

		h = http.request
		if secure
			h = https.request
			
		req = h options, (res) ->
			data = ''
			res.setEncoding 'utf-8'
			res.on 'data', (chuck) ->
				data += chuck
				
			res.on 'end', ->
				data = JSON.parse data
				if data.fault isnt undefined
					throw data.fault.message
				callback data.result
		
		req.on 'error', (e) ->
			console.log e.message
		
		req.write postData
		req.end()			
				
module.exports = Grooveshark