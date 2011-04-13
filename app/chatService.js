var {addListener, publish, send, BayeuxService} = require("ringo/cometd");
var _ = require("underscore");
export("serverStarted");
module.shared = true;

var service;
var rooms = {}, users = {};

function onUserDisconnect( id )
{
	if ( id in users )
	{
		for ( var i in rooms )
		{
			var room = rooms[ i ];
			var index = room.indexOf(id);
			if ( index != -1 )
			{
				print( 'user leave:', users[ id ] );
				delete users[ id ];
				room.splice( index, 1 );
				showRoomUsers(room);
			}
		}
	}
}

function onUserConnect(id) {
	users[ id ] = 1;
}

function onJoinRoom(channel, evt)
{
	var data =evt.data;
	if ( (data.userId in users) )
	{
		users[ data.userId ] = data.user;
		var room = rooms[data.room];
		if ( !room)
			room = rooms[data.room] = [];
		room.push(data.userId);
		print( 'user joined:', users[ data.userId ] );
	}
	showRoomUsers(rooms[data.room]);
}

function showRoomUsers( room )
{
	service.publish("/chat/members",  _( room).map( function( userId ) { return users[ userId ]; }));
}

function serverStarted(server) {
    service = new BayeuxService("chat");
    service.subscribe("/service/members", onJoinRoom);
	service.clientRemoved(onUserDisconnect)
	service.clientAdded(onUserConnect)
}
