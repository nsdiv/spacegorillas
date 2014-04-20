module.exports = function(app) {
	return new ChatRemote(app);
};

var gameWidth = 1300;
var gameHeight = 800;

var ChatRemote = function(app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

/**
 * Add user into chat channel.
 *
 * @param {String} user 
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
ChatRemote.prototype.add = function(user, sid, name, flag, cb) {
	console.info("adding user; user=" + user);
	var channel = this.channelService.getChannel(name, flag);
	// add game specific params
	// set team of user. if number of people are even then left else right
	var users = channel.getMembers();
	user.team = (users.length % 2 === 0 ? "L" : "R");
	user.ox = (user.team === 'L' ? 20 : gameWidth - 20); // users of one team start at the same x axis
	user.oy = (gameHeight - 20 - ((users.length / 2) * 30));
	
	var param = {
		route: 'onAdd',
		user: user
	};
	channel.pushMessage(param);

	if( !! channel) {
		//channel.add(uid, sid);
		channel.add(user, sid);
	}

	cb(this.get(name, flag));
};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
ChatRemote.prototype.get = function(name, flag) {
	var users = [];
	var channel = this.channelService.getChannel(name, flag);
	if( !! channel) {
		users = channel.getMembers();
	}
	//loop passes only the usernames. we need all the users.
	//for(var i = 0; i < users.length; i++) {
		//users[i] = users[i].split('*')[0];
	//}
	return users;
};

/**
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
ChatRemote.prototype.kick = function(uid, sid, name, cb) {
	var channel = this.channelService.getChannel(name, false);
	// leave channel
	if( !! channel) {
		channel.leave(uid, sid);
	}
	var username = uid.split('*')[0];
	var param = {
		route: 'onLeave',
		user: username
	};
	channel.pushMessage(param);
	cb();
};
