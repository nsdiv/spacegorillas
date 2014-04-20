module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	var self = this;
	var user = {
		username : msg.username,
		uid : msg.username + '*' + msg.rid
	};
	//var rid = msg.rid;
	//var uid = msg.username + '*' + rid;
	var sessionService = self.app.get('sessionService');

	//duplicate log in
	if( !! sessionService.getByUid(user.uid)) {
		next(null, {
			code: 500,
			error: true
		});
		return;
	}

	session.bind(user.uid);
	session.set('rid', msg.rid);
	session.push('rid', function(err) {
		if(err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));

	//put user into channel
	self.app.rpc.chat.chatRemote.add(session, user, self.app.get('serverId'), msg.rid, true, function(users){
		next(null, {
			users:users,
			gameWidth : 1300,
			gameHeight : 800
		});
	});
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};