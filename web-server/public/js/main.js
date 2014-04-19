var username;


var state = 'ready';


// a generic cannon
var cannon = {
	init : function (name, ox, oy){
		this.ox = ox;
		this.oy = oy;
		this.nozzle = draw.rect(ox - 12, oy - 12, 50, 24); // create new
		this.nozzle.attr({stroke: 'black', 'stroke-width': 3, fill: 'green'}); // color
		
		// and the bal
		this.ball = draw.circle(ox, oy, 10);
		this.ball.attr({stroke: 'black', 'stroke-width': 3, fill: 'blue'}); 
	},
	rotate : function(pageX, pageY){
		var dx = pageX - this.ox;
		var dy = pageY - this.oy;
		var angle = Math.atan2(dy, dx) / Math.PI * 180;
		this.nozzle.rotate(angle, this.ox, this.oy);
	},
	fire : function(pageX, pageY){
		if (state == 'ready') {
		    state = 'flying';
		    var vx = (pageX - this.ox) / 50;
		    var vy = (pageY - this.oy) / 50;
		    var x = this.ball.attr('cx');
		    var y = this.ball.attr('cy');
		    var advance = function() {
		      x += vx;
		      y += vy;
		      vy += 0.1;
		      this.ball.attr({cx: x, cy: y});
		      if (!inrect(field, this.ball) || inrect(wall, this.ball) || inrect(target, this.ball)) {
		        if (inrect(target, this.ball)) target.attr('fill', 'yellow');
		        state = 'landed';
		      } else {
		        setTimeout(advance, 5);
		      }
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
	}
};

function inrect(r, ball) {
	  if (ball.attr('cx') + ball.attr('r') < r.attr('x') ||
	      ball.attr('cy') + ball.attr('r') < r.attr('y') ||
	      ball.attr('cx') - ball.attr('r') > r.attr('x') + r.attr('width') ||
	      ball.attr('cy') - ball.attr('r') > r.attr('y') + r.attr('height')) {
	    return false;
	  }
	  return true;
	}

var game = {
	cannons:[],
	init: function(){
		var w = $(window).width();
		var h = $(window).height();
		var draw = Raphael(0, 0, w, h);

		// create the field
		var field = draw.rect(-10, -h - 10, w + 20, 2 * h + 20);
		field.attr({fill: 'lightgray'});

		// wall between two teams
		var wall = draw.rect(w / 2 - 25, h / 2, 50, h / 2 - 8);
		wall.attr({stroke: 'black', 'stroke-width': 3, fill: 'gray'});

		var target = draw.rect(w - 50, h - 50, 42, 42);
		target.attr({stroke: 'black', 'stroke-width': 3, fill: 'red'});
	},
	initCannonsList : function(data) {
		for(var i = 0; i < data.cannons.length; i++) {
			// add cannons to our list
			game.cannons[data.cannons[i].name] = new cannon(data.cannons[i].ox, data.cannons[i].oy);
		}
	},
	setupCannon : function(cannonName){
		// create our own cannon
		var ox = 20;
		var oy = h-20;
		game.currCannon = new cannon(ox, oy);
		game.cannons[cannonName] = game.currCannon; // this is our cannon

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
			game.currCannon(e.pageX, e.pageY);
			
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

