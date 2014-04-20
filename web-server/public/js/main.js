var username;


var state = 'ready';


// a generic cannon
var cannon = function(name, team, ox, oy) {
	this.team = team;
	this.ox = ox;
	this.oy = oy;
	this.nozzle = draw.rect(ox - 12, oy - 12, 50, 24); // create new
	this.nozzle.attr({stroke: 'black', 'stroke-width': 3, fill: 'green'}); // color

	// and the ball
	this.ball = draw.circle(ox, oy, 10);
	this.ball.attr({stroke: 'black', 'stroke-width': 3, fill: 'blue'}); 
};

cannon.prototype.rotate = function(pageX, pageY){
	var dx = pageX - this.ox;
	var dy = pageY - this.oy;
	var angle = Math.atan2(dy, dx) / Math.PI * 180;
	this.nozzle.rotate(angle, this.ox, this.oy);
};

cannon.prototype.fire = function(pageX, pageY){
	if (state == 'ready') {
		state = 'flying';
		var vx = (pageX - this.ox) / 50;
		var vy = (pageY - this.oy) / 50;
		var x = this.ball.attr('cx');
		var y = this.ball.attr('cy');
		var ball = this.ball;
		var firingCannon = this;
		var advance = function() {
			x += vx;
			y += vy;
			vy += 0.1;
			ball.attr({cx: x, cy: y});
			if (!game.hasBallLanded(firingCannon)) {
				setTimeout(advance, 5); // do the same after 5 ms
			}
			
			/*if (!inrect(field, ball) || inrect(wall, ball) || inrect(target, ball)) {
				if (inrect(target, ball)) target.attr('fill', 'yellow');
				state = 'landed';
			} else {
				setTimeout(advance, 5);
			}*/
		};
		advance();
	}
	else if (state == 'landed') {
		if (inrect(target, this.ball)) {
			target.attr({x: w - 50 - Math.random() * (w / 3),
				y: h - 50 - Math.random() * (h / 2)});
			target.attr('fill', 'red');
		}
		this.ball.attr({cx: this.ox, cy: this.oy});
		state = 'ready';
	}
};

var draw;
var game = {
	cannons:[],
	init: function(){
		var w = 1300; //$(window).width();
		var h = 800;  //$(window).height();
		draw = Raphael(0, 0, w, h);

		// create the field
		game.field = draw.rect(-10, -h - 10, w + 20, 2 * h + 20);
		game.field.attr({fill: 'lightgray'});

		// wall between two teams
		game.wall = draw.rect(w / 2 - 25, h / 2, 50, h / 2 - 8);
		game.wall.attr({stroke: 'black', 'stroke-width': 3, fill: 'gray'});
	},
	initCannonsList : function(data) {
		for(var i = 0; i < data.users.length; i++) {
			// add cannons to our list
			game.cannons[data.users[i].username] = new cannon(data.users[i].username,
					data.users[i].team, data.users[i].ox, data.users[i].oy);
			
			// if the cannons name matches our username then thats our cannon
			if (data.users[i].username === username){
				game.currCannon = game.cannons[data.users[i].username];
			}
		}
	},
	setupCannon : function(){
		// cannon rotation
		$('body').mousemove(function(e) {
			game.currCannon.rotate(e.pageX, e.pageY);
			
			// send message about rotation
			var route = "chat.chatHandler.rotate";
			var target = $("#usersList").val();
			var msg = JSON.stringify({
				pageX : e.pageX,
				pageY : e.pageY
			});
			
			pomelo.request(route, {
				rid: rid,
				content: msg,
				from: username,
				target: target
			}, function(data) {
			});
		});

		// firing
		$('body').click(function(e) {
			game.currCannon.fire(e.pageX, e.pageY);
			
			// send message about firing
			var route = "chat.chatHandler.fire";
			var target = $("#usersList").val();
			var msg = JSON.stringify({
				pageX : e.pageX,
				pageY : e.pageY
			});
			
			pomelo.request(route, {
				rid: rid,
				content: msg,
				from: username,
				target: target
			}, function(data) {
			});
		});
	},
	addCannon : function(name, ox, oy){
		game.cannons[name] = new cannon(ox, oy);
	},
	removeCannon : function(name){
		game.cannons[name] = null;
	},
	hasBallLanded : function (firingCannon){
		// first check if ball is within the field
		if (!game.inrect(game.field, firingCannon.ball)){
			return true; // has gone out of the field so has landed
		}
		if (game.inrect(game.wall, firingCannon.ball)){
			return true; // has hit the wall so has landed
		}
		// now see if it has hit any cannon of the other side
		for(var i = 0; i < game.cannons.length; i++){
			if (game.cannons[i].team === firingCannon.team){
				continue; //cannot land on same teams cannon
			}
			if (game.inrect(game.cannons[i].nozzle, firingCannon.ball)){
				game.cannons[i].nozzle.attr('fill', 'yellow');
				return true; // ball landed on the opposing teams cannon and this cannon is dead
			}
		}
		return false;
			
		/*if (!inrect(game.field, firingCannon.ball) || inrect(game.wall, ball) || inrect(target, ball)) {
			if (inrect(target, ball)) target.attr('fill', 'yellow');
			state = 'landed';
		}*/
	},
	
	inrect : function(r, ball) {
		if (ball.attr('cx') + ball.attr('r') < r.attr('x') ||
				ball.attr('cy') + ball.attr('r') < r.attr('y') ||
				ball.attr('cx') - ball.attr('r') > r.attr('x') + r.attr('width') ||
				ball.attr('cy') - ball.attr('r') > r.attr('y') + r.attr('height')) {
			return false;
		}
		return true;
	}
};

// pomelo stuff
var pomelo = window.pomelo;

var users;
var rid;
var base = 1000;
var increase = 25;
var reg = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
var LOGIN_ERROR = "There is no server to log in, please wait.";
var LENGTH_ERROR = "Name/Channel is too long or too short. 20 character max.";
var NAME_ERROR = "Bad character in Name/Channel. Can only have letters, numbers, Chinese characters, and '_'";
var DUPLICATE_ERROR = "Please change your name to login.";


//show tip
function tip(type, name) {
	var tip,title;
	switch(type){
		case 'online':
			tip = name + ' is online now.';
			title = 'Online Notify';
			break;
		case 'offline':
			tip = name + ' is offline now.';
			title = 'Offline Notify';
			break;
		case 'message':
			tip = name + ' is saying now.'
			title = 'Message Notify';
			break;
	}
	var pop=new Pop(title, tip);
};

//add user in user list
function addUser(user) {
	var slElement = $(document.createElement("option"));
	slElement.attr("value", user);
	slElement.text(user);
	$("#usersList").append(slElement);
};

//remove user from user list
function removeUser(user) {
	$("#usersList option").each(
		function() {
			if($(this).val() === user) $(this).remove();
	});
};

//set your name
function setName() {
	$("#name").text(username);
};

//set your room
function setRoom() {
	$("#room").text(rid);
};

//show error
function showError(content) {
	$("#loginError").text(content);
	$("#loginError").show();
};

//show login panel
function showLogin() {
	$("#loginView").show();
	$("#chatHistory").hide();
	$("#toolbar").hide();
	$("#loginError").hide();
	$("#loginUser").focus();
};

//show chat panel
function showChat() {
	$("#loginView").hide();
	$("#loginError").hide();
	$("#toolbar").show();
	$("entry").focus();
	scrollDown(base);
};

//query connector
function queryEntry(uid, callback) {
	var route = 'gate.gateHandler.queryEntry';
	pomelo.init({
		host: window.location.hostname,
		port: 3014,
		log: true
	}, function() {
		pomelo.request(route, {
			uid: uid
		}, function(data) {
			pomelo.disconnect();
			if(data.code === 500) {
				showError(LOGIN_ERROR);
				return;
			}
			callback(data.host, data.port);
		});
	});
};

$(document).ready(function() {
	//when first time into chat room.
	showLogin();

	//wait message from the server.
	pomelo.on('onRotate', function(data) {
		if(data.from !== username)
			game.cannons[data.from].rotate(data.msg.pageX, data.msg.pageY);
			//tip('message', data.from);
	});
	
	//wait message from the server.
	pomelo.on('onFire', function(data) {
		if(data.from !== username)
			game.cannons[data.from].fire(data.msg.pageX, data.msg.pageY);
			//tip('message', data.from);
	});

	//update user list
	pomelo.on('onAdd', function(data) {
		var user = data.user;
		tip('online', user.name);
		game.addCannon(user.name, user.ox, user.oy);
	});

	//update user list
	pomelo.on('onLeave', function(data) {
		var user = data.user;
		tip('offline', user.name);
		removeUser(user.name);
	});

	//handle disconect message, occours when the client is disconnect with servers
	pomelo.on('disconnect', function(reason) {
		showLogin();
	});

	//deal with login button click.
	$("#login").click(function() {
		username = $("#loginUser").attr("value");
		rid = $('#channelList').val();

		if(username.length > 20 || username.length == 0 || rid.length > 20 || rid.length == 0) {
			showError(LENGTH_ERROR);
			return false;
		}

		if(!reg.test(username) || !reg.test(rid)) {
			showError(NAME_ERROR);
			return false;
		}

		//query entry of connection
		queryEntry(username, function(host, port) {
			pomelo.init({
				host: host,
				port: port,
				log: true
			}, function() {
				var route = "connector.entryHandler.enter";
				pomelo.request(route, {
					username: username,
					rid: rid
				}, function(data) {
					if(data.error) {
						showError(DUPLICATE_ERROR);
						return;
					}
					setName();
					setRoom();
					// now we start the game
					game.init();
					game.initCannonsList(data);
					game.setupCannon();
				});
			});
		});
	});

	//deal with chat mode.
	$("#entry").keypress(function(e) {
		var route = "chat.chatHandler.send";
		var target = $("#usersList").val();
		if(e.keyCode != 13 /* Return */ ) return;
		var msg = $("#entry").attr("value").replace("\n", "");
		if(!util.isBlank(msg)) {
			pomelo.request(route, {
				rid: rid,
				content: msg,
				from: username,
				target: target
			}, function(data) {
				$("#entry").attr("value", ""); // clear the entry field.
				if(target != '*' && target != username) {
					addMessage(username, target, msg);
					$("#chatHistory").show();
				}
			});
		}
	});
});

