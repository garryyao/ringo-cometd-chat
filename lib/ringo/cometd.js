var {ListenerAdaptor} = require("ringo/cometd/event-adapter");
var {Session} = require("ringo/webapp/request");

export("BayeuxService", "serverStarted", "serverStopped");

var bayeux;

function BayeuxService(name) {
    if (!bayeux) {
        throw new Error("Bayeux service not available");
    }
    var session = bayeux.newLocalSession(name);
	session.handshake();

    this.subscribe = function(channelId, callback) {
		var channel = session.getChannel(channelId);
		channel.subscribe(adapter.wrappedListener(org.cometd.bayeux.client.ClientSessionChannel.MessageListener, { onMessage : callback }));
    };

	this.clientRemoved = function(callback)
	{
		bayeux.addListener((adapter.wrappedListener(org.cometd.bayeux.server.BayeuxServer.SessionListener, { 'sessionRemoved' : callback })));
	};

	this.clientAdded = function(callback)
	{
		bayeux.addListener((adapter.wrappedListener(org.cometd.bayeux.server.BayeuxServer.SessionListener, { 'sessionAdded' : callback })));
	};

	this.publish = function(channelId, data, messageId)
	{
		var channel = session.getChannel( channelId );
		channel.publish( data, messageId );
	};

	this.getId = function() {
        return session.getId();
    };
}

var adapter = new ListenerAdaptor();
adapter.addArgumentConverter(org.cometd.bayeux.Channel, function(c) c.getId());
adapter.addArgumentConverter(org.cometd.bayeux.Session, function(c) c.getId());
adapter.addArgumentConverter(org.cometd.bayeux.Message, function(msg) {
    return {
        data: wrapData(msg.getData()),
        channel: msg.getChannel(),
        clientId: msg.getClientId(),
        id : msg.getId(),
        getExt: function(create) wrapData(msg.getExt(create)),
        unwrap: function() msg
    };
});

function serverStarted(server) {
    var servlet = new org.cometd.server.CometdServlet();
    // TODO make things configurable
    server.getDefaultContext().addServlet("/cometd/*", servlet);
    bayeux = servlet.getBayeux();
    if (!bayeux) {
        throw new Error("Could not create Bayeux service");
    }
}

function serverStopped(server) {
    bayeux = null;
}

function wrapData(obj) {
    if (obj instanceof java.util.Map) {
        return new ScriptableMap(obj);
    } else if (obj instanceof java.util.List) {
        return new ScriptableList(obj);
    } else {
        return obj;
    }
}
