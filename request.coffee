events = require 'events'

class Request extends events.EventEmitter
	constructor: ->
		@API_BASE = 'cowbell.grooveshark.com'
		@UUID = 'A3B724BA-14F5-4932-98B8-8D375F85F266'
		@CLIENT = 'htmlshark'
		@CLIENT_REV = '20101222.41'
		@COUNTRY = CC2: '0', IPR: '353', CC4: '1073741824', CC3: '0', CC1: '0', ID: '223'
		@TOKEN_TTL = 120
		@METHOD_CLIENTS = getStreamKeyFromSongIDEx: 'jsqueue'
		
	request: (method, params={}, secure=false) ->
		
	
