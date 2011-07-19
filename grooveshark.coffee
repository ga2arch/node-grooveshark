events = require 'events'
http = require 'http'
https = require 'https'


class Grooveshark extends events.EventEmitter
	constructor: ->
		@API_BASE = 'grooveshark.com'
		@UUID = 'A3B724BA-14F5-4932-98B8-8D375F85F266'
		@CLIENT = 'htmlshark'
		@CLIENT_REV = '20110606'
		@COUNTRY = CC2: '0', IPR: '353', CC4: '1073741824', CC3: '0', CC1: '0', ID: '223'
		@TOKEN_TTL = 120
		@METHOD_CLIENTS = getStreamKeyFromSongIDEx: 'jsqueue'
		@session = null
		
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
			@commToken = JSON.parse(data).result
			@commTokenTTL = new Date().getTime()
	
	refreshToken: (callback) ->
		time = new Date().getTime()
		if time - @commTokenTTL > @TOKEN_TTL
			@getCommToken callback
	
	createToken: (method, commToken) ->
		rnd = @genHex()
		plain = method+':'+commToken+':'+'quitStealinMahShit'+rnd
		hash = Hash.sha1 plain
		rnd+hash
		
	genHex: (size=6) ->
		items = 'abcdef'
		item = ''
		for n in [1..size]
			ran = Math.round Math.random()*14
			if ran > 9
				item += items[ran - 9]
			else 
				item += ran
		item
		
	request: (method, params={}, secure=false, callback) ->
		console.log @session
		if @session is null
			@getSession ->
				@request method, params, secure, callback
		
		@refreshToken ->
			@request method, params, secure, callback
		
		self = @		
		if method is 'getStreamKeyFromSongIDEx'
			agent = 'jsqueue'
		else
			agent = @CLIENT
			
		path = '/more.php?'+method
		body = header: { session: @session, uuid: @UUID, client: agent, clientRevision: @CLIENT_REV, country: @COUNTRY }, method: method, parameters: params
		body.header.token = @createToken method if @commToken isnt null
		postData = JSON.stringify body
		
		console.log postData
		port = 80
		port = 443 if secure
		
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
				callback data
		req.write postData
		req.end()			
				
module.exports = Grooveshark