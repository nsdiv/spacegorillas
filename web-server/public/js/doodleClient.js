/* ------------------------------------------------------------------------
Title:          DoodlePad
    
Version:        0.1
URL:            TBD
    
Description:
    
Author:         Ninad Divadkar

Licence:
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

------------------------------------------------------------------------ */

var doodlePad = {
    width: 600,
    height: 400,
    saveID: '#save',
    newID: '#new',
    penID: '#pen',
    eraserID: '#eraser',
    brushSizeID: '#brush_size',
    colorPickerID: '#color_picker',

    doodles: [], // collection of all the user's doodles
    init: function (username, myDoodle) {
        doodles[username] = myDoodle; // current users doodle

        // Collect elements from the DOM and set-up the canvas
        doodlePad.canvas = $('#doodle_canvas')[0];
        doodlePad.context = doodlePad.canvas.getContext('2d');
        doodlePad.oldState = doodlePad.context.getImageData(0, 0, doodlePad.width, doodlePad.height);

        doodlePad.newDoodle();

        $('#share div').hide();
        // Set up the share links
        $('#share h2').bind('click', function () {
            $('#share div').slideToggle('normal');
        });

        // Mouse based interface
        $(doodlePad.canvas).bind('mousedown', myDoodle.drawStart);
        $(doodlePad.canvas).bind('mousemove', myDoodle.draw);
        $(doodlePad.canvas).bind('mouseup', myDoodle.drawEnd);
        $(doodlePad.canvas).bind('mouseleave', function () {
            doodlePad.context.putImageData(doodlePad.oldState, 0, 0);
        });
        $('body').bind('mouseup', myDoodle.drawEnd);

        // Touch screen based interface
        $(doodlePad.canvas).bind('touchstart', myDoodle.drawStart);
        $(doodlePad.canvas).bind('touchmove', myDoodle.draw);
        $(doodlePad.canvas).bind('touchend', myDoodle.drawEnd);

        // Add save event to save button
        $(doodlePad.saveID).bind('click', doodlePad.saveImage);

        // Add clear canvas event
        $(doodlePad.newID).bind('click', doodlePad.newDoodle);

        // Add Pen selection event
        $(doodlePad.penID).bind('click', function (ev) {
            // Flag that pen is now active
            $(doodlePad.penID).toggleClass('active');

            // Remove active state from eraser
            $(doodlePad.eraserID).removeClass('active');
            myDoodle.pen(ev, $(doodlePad.colorPickerID).val());
        });
        $(doodlePad.eraserID).bind('click', function (ev) {
            // Flag that eraser is now active
            $(doodlePad.eraserID).toggleClass('active');

            // Remove active state from pen
            $(doodlePad.penID).removeClass('active');
            myDoodle.eraser(ev);
        });

        // Brush size
        $(doodlePad.brushSizeID).bind('change', function (ev) {
            myDoodle.changeBrushSize(ev, $(this).val());
        });

        // color picker
        $(doodlePad.colorPickerID).CanvasColorPicker({
            onColorChange: function (RGB, HSB) {
                // RGB, current color in rgb format: {r,g,b}
                // HSB: current color in hsb format: {h,s,b}

                // Your code starts from here
                var newColor = $(doodlePad.colorPickerID).val();
                if (newColor == myDoodle.currColor) {
                    return;
                }
                myDoodle.changeColor(1, newColor);
            }
        });
    },
    addDoodle: function(username, doodle){
    	doodles[username] = doodle;
    },
    newDoodle: function (src, id) {
        doodlePad.clearCanvas();
        if (!src) {
            src = '/static/images/blank.gif';
        }

        if (!id) {
            id = '';
        }
        // Build an empty thumb
        thumb_html = '<img class="active" src="' + src + '" id="i' + id + '" width="32" height="24" />';

        // Add the thumb to the DOM then bind click event
        $('#output').append(thumb_html);
        $('#output img').bind('click', doodlePad.loadImage);
        //$('img.active').bind('click', doodle.loadImage);
    },
    loadDoodles: function (cookie) {
        var keys = cookie.split(",");
        for (var i = 0; i < keys.length; i++) {
            doodlePad.newDoodle('/thumb?id=' + keys[i] + '&rnd=' + Math.random(), keys[i]);
        }
    },
    saveImage: function (ev) {
        alert('coming soon!');
        return;
        // Extract the Base64 data from the canvas and post it to the server
        base64 = doodlePad.canvas.toDataURL("image/png");
        if (!doodlePad.updating) {
            $.post('/save', { img: base64 }, function (data) { doodlePad.updateThumb(data) });
        } else {
            $.post('/save', { img: base64, key: doodlePad.loaded_id }, function (data) { doodlePad.updateThumb(data) });
        }
    },
    loadImage: function (event) {
        alert('coming soon!');
        return;
        // Stop from following link
        event.preventDefault();

        // If the current doodle is loaded, do nothing
        if ($(this).hasClass('active')) {
            return;
        }

        // Clear the canvas
        doodlePad.clearCanvas();

        // Load saved image onto the canvas
        if ($(this).attr('id')) {
            doodlePad.loaded_id = $(this).attr('id').slice(1);
            var img_src = '/image?id=' + doodlePad.loaded_id + '&rnd=' + Math.random();
            var img = new Image();
            img.src = img_src;

            // Wait for image to finish loading before drawing to canvas
            img.onload = function () {
                doodlePad.context.drawImage(img, 0, 0);
                doodlePad.oldState = doodlePad.context.getImageData(0, 0, doodlePad.width, doodlePad.height);
            };

            // Flag that user is updating a saved doodle
            doodlePad.updating = true;
        } else {

        }

        // Add active class to selected thumb
        $(this).addClass('active');
    },
    clearCanvas: function (ev) {
        // Clear existing drawing
        doodlePad.context.clearRect(0, 0, doodlePad.canvas.width, doodlePad.canvas.height);
        doodlePad.canvas.width = doodlePad.canvas.width;

        // Set the background to white.
        // then reset the fill style back to black
        doodlePad.context.fillStyle = '#FFFFFF';
        doodlePad.context.fillRect(0, 0, doodlePad.canvas.width, doodlePad.canvas.height);
        doodlePad.context.fillStyle = '#000000';

        // Remove active class from other thumbs
        $('#output IMG').each(function () {
            $(this).removeClass('active');
        });

        // Clear state
        doodlePad.oldState = doodlePad.context.getImageData(0, 0, doodlePad.width, doodlePad.height);

        // Set the drawning method to pen
        doodlePad.myDoodle.pen();

        // Flag that the user is working on a new doodle
        doodlePad.updating = false;
    },
    updateThumb: function (data) {
        // Notify the user that the image has been saved
        //$(doodle.noticeID).html('Saved');

        var thumb = $('img.active');
        // Reset the thumb image
        // Note: a random number is added to the image to prevent caching
        thumb.attr('src', '/thumb?id=' + data + '&rnd=' + Math.random());
        thumb.attr('id', 'i' + data);
        $('img.active').bind('click', doodle.loadImage);

        // Save doodle ID to a cookie
        if (doodle.loaded_id !== data) {
            var keys;
            if ($.cookie('doodles')) {
                keys = $.cookie('doodles') + ',' + data;
            } else {
                keys = data;
            }
            $.cookie('doodles', keys);
        }

        // Store doodle ID
        doodle.loaded_id = data;

        // The doodle has been saved, update from here on
        doodle.updating = true;
    }
};


// A doodle is a collection of the users drawing history
function doodle() {
    var currDoodle = this;
    // Define some variables
    currDoodle.drawing = false;
    currDoodle.linethickness = 1;
    currDoodle.updating = false;
    currDoodle.currColor = '#000000';
    currDoodle.noticeID = '#notification';
    currDoodle.loaded_id = false;
    currDoodle.history = [];
    currDoodle.history = [];
    currDoodle.history[0] = [];

    // Change the size of the brush
    currDoodle.changeBrushSize = function (ev, value) {
        currDoodle.linethickness = value;
        if (ev) {
            // also add to history
            currDoodle.history[currDoodle.history.length - 1].push({ ev: 'changeBrushSize', value:value });
            console.log('changeBrushSize; value=' + value);
        }
    };

    currDoodle.drawStart = function (ev, x, y) {
        if (ev) {
            ev.preventDefault();
        }

        //var x, y;
        // if x or y not passed in
        if (x == null || y == null) {
            // Calculate the current mouse X, Y coordinates with canvas offset
            x = ev.pageX - $(doodlePad.canvas).offset().left;
            y = ev.pageY - $(doodlePad.canvas).offset().top;

            // also add to history
            currDoodle.history[currDoodle.history.length - 1].push({ ev: 'drawStart', x: x, y: y });
            console.log('drawStart ' + x + ", " + y);
        }
        currDoodle.drawing = true;
        doodlePad.context.lineWidth = currDoodle.linethickness;

        // Store the current x, y positions
        currDoodle.oldX = x;
        currDoodle.oldY = y;
    };

    currDoodle.draw = function (event, x, y) {
        //var x, y;
        //if x or y not passed in
        if (x == null || y == null) {
            // Calculate the current mouse X, Y coordinates with canvas offset
            x = event.pageX - $(doodlePad.canvas).offset().left;
            y = event.pageY - $(doodlePad.canvas).offset().top;

            if (currDoodle.drawing) {
                // also add to history
                currDoodle.history[currDoodle.history.length - 1].push({ ev: 'draw', x: x, y: y });
                console.log('draw ' + x + ", " + y);
            }
        }
        // If the mouse is down (drawing) then start drawing lines
        if (currDoodle.drawing) {
            doodlePad.context.putImageData(doodlePad.oldState, 0, 0);
            doodlePad.context.strokeStyle = currDoodle.currColor;
            doodlePad.context.beginPath();
            doodlePad.context.moveTo(currDoodle.oldX, currDoodle.oldY);
            doodlePad.context.lineTo(x, y);
            doodlePad.context.closePath();
            doodlePad.context.stroke();
            doodlePad.oldState = doodlePad.context.getImageData(0, 0, doodlePad.width, doodlePad.height);
        } else {

            doodlePad.context.putImageData(doodlePad.oldState, 0, 0);

            doodlePad.context.beginPath();
            doodlePad.context.arc(x, y, currDoodle.linethickness, 0, 2 * Math.PI, false);

            doodlePad.context.lineWidth = 3;
            doodlePad.context.strokeStyle = '#fff';
            doodlePad.context.stroke();

            doodlePad.context.lineWidth = 1;
            doodlePad.context.strokeStyle = '#000';
            doodlePad.context.stroke();

        }

        // Store the current X, Y position
        currDoodle.oldX = x;
        currDoodle.oldY = y;
    };

    // Finished drawing (mouse up)
    currDoodle.drawEnd = function (ev) {
        currDoodle.drawing = false;
        if (ev && currDoodle.history.length > 0) {
            // also add to history
            currDoodle.history[currDoodle.history.length - 1].push({ ev: 'drawEnd' });
            console.log('drawEnd');

            if (ev){//if this is the current users doodle and has been triggered by an event
            	// send to everyone else
            	var route = "chat.chatHandler.draw";
            	var target = $("#usersList").val();

            	// message is the last event
            	var msg = JSON.stringify(currDoodle.history[currDoodle.history.length - 1]);
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
            }
            // adding a new list
            currDoodle.history[currDoodle.history.length] = [];
            
    		
    		//var drawHubClient = $.connection.drawHub;
    		//drawHubClient.sendMessage(JSON.stringify(currDoodle.history));
    		//currDoodle.history = []; // clear
        }
    };

    // Set the drawing method to pen
    currDoodle.pen = function (ev, currColor) {
        if (ev != null) {
            // also add to history
            currDoodle.history.push({ ev: 'pen', currColor: currColor });
            console.log('pen');
        }
        // Change color and thickness of the line
        currDoodle.currColor = currColor;
    };

    // Set the drawing method to eraser
    currDoodle.eraser = function (ev) {
        if (ev != null) {
            // also add to history
            currDoodle.history.push({ ev: 'eraser' });
            console.log('eraser');
        }
        // Change color and thickness of the line
        currDoodle.currColor = '#FFFFFF';
    };

    currDoodle.changeColor = function (ev, newColor) {
        currDoodle.currColor = newColor;
        if (ev) {
            // also add to history
            currDoodle.history.push({ ev: 'changeColor', newColor: newColor });
            console.log('changeColor ' + newColor);
        }
    };

    currDoodle.drawCommands = function (commands) {
        //var commands = currDoodle.history;
        for (var i = 0; i < commands.length; i++) {
            if (commands[i].ev == 'drawStart') {
                currDoodle.drawStart(null, commands[i].x, commands[i].y);
            } else if (commands[i].ev == 'draw') {
                currDoodle.draw(null, commands[i].x, commands[i].y);
            } else if (commands[i].ev == 'drawEnd') {
                currDoodle.drawEnd(null);
            } else if (commands[i].ev == 'eraser') {
                currDoodle.eraser(null);
            } else if (commands[i].ev == 'pen') {
                currDoodle.pen(null, commands[i].currColor);
            } else if (commands[i].ev == 'changeBrushSize') {
                currDoodle.changeBrushSize(null, commands[i].value);
            } else if (commands[i].ev == 'changeColor') {
                currDoodle.changeColor(null, commands[i].newColor);
            };
        }
    };
}



var pomelo = window.pomelo;
var username;
var users;
var rid;
var base = 1000;
var increase = 25;
var reg = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
var LOGIN_ERROR = "There is no server to log in, please wait.";
var LENGTH_ERROR = "Name/Channel is too long or too short. 20 character max.";
var NAME_ERROR = "Bad character in Name/Channel. Can only have letters, numbers, Chinese characters, and '_'";
var DUPLICATE_ERROR = "Please change your name to login.";

util = {
	urlRE: /https?:\/\/([-\w\.]+)+(:\d+)?(\/([^\s]*(\?\S+)?)?)?/g,
	//  html sanitizer
	toStaticHTML: function(inputHtml) {
		inputHtml = inputHtml.toString();
		return inputHtml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	},
	//pads n with zeros on the left,
	//digits is minimum length of output
	//zeroPad(3, 5); returns "005"
	//zeroPad(2, 500); returns "500"
	zeroPad: function(digits, n) {
		n = n.toString();
		while(n.length < digits)
		n = '0' + n;
		return n;
	},
	//it is almost 8 o'clock PM here
	//timeString(new Date); returns "19:49"
	timeString: function(date) {
		var minutes = date.getMinutes().toString();
		var hours = date.getHours().toString();
		return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
	},

	//does the argument only contain whitespace?
	isBlank: function(text) {
		var blank = /^\s*$/;
		return(text.match(blank) !== null);
	}
};

//always view the most recent message when it is added
function scrollDown(base) {
	window.scrollTo(0, base);
	$("#entry").focus();
}

// add message on board
function addMessage(from, target, text, time) {
	var name = (target == '*' ? 'all' : target);
	if(text === null) return;
	if(time == null) {
		// if the time is null or undefined, use the current time.
		time = new Date();
	} else if((time instanceof Date) === false) {
		// if it's a timestamp, interpret it
		time = new Date(time);
	}
	//every message you see is actually a table with 3 cols:
	//  the time,
	//  the person who caused the event,
	//  and the content
	var messageElement = $(document.createElement("table"));
	messageElement.addClass("message");
	// sanitize
	text = util.toStaticHTML(text);
	var content = '<tr>' + '  <td class="date">' + util.timeString(time) + '</td>' + '  <td class="nick">' + util.toStaticHTML(from) + ' says to ' + name + ': ' + '</td>' + '  <td class="msg-text">' + text + '</td>' + '</tr>';
	messageElement.html(content);
	//the log is the stream that we view
	$("#chatHistory").append(messageElement);
	base += increase;
	scrollDown(base);
}

function drawMessage(from, target, message, time) {
	// check if the user is the current user. if yes we've already drawn his stuff
	if (from == username) {
		return;
	}
	
	// create a new doodle if it doesn't exist
	if (!doodlePad.doodles[from]){
		doodlePad.addDoodle(user, new Doodle());
	}	
	
	// parse the message and execute in the canvas
    var commands = eval(message);
    if (commands.length > 1) {
    	doodlepad[from].drawCommands(commands);
        //commands = command[1];
        //if (command.length > 0) {
            
        //}
    }
}

// show tip
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

// init user list
function initUserList(data) {
	users = data.users;
	for(var i = 0; i < users.length; i++) {
		var slElement = $(document.createElement("option"));
		slElement.attr("value", users[i]);
		slElement.text(users[i]);
		$("#usersList").append(slElement);
	}
};

// add user in user list
function addUser(user) {
	var slElement = $(document.createElement("option"));
	slElement.attr("value", user);
	slElement.text(user);
	$("#usersList").append(slElement);
};

// remove user from user list
function removeUser(user) {
	$("#usersList option").each(
		function() {
			if($(this).val() === user) $(this).remove();
	});
};

// set your name
function setName() {
	$("#name").text(username);
};

// set your room
function setRoom() {
	$("#room").text(rid);
};

// show error
function showError(content) {
	$("#loginError").text(content);
	$("#loginError").show();
};

// show login panel
function showLogin() {
	$("#loginView").show();
	$("#chatHistory").hide();
	$("#toolbar").hide();
	$("#loginError").hide();
	$("#loginUser").focus();
};

// show chat panel
function showChat() {
	$("#loginView").hide();
	$("#loginError").hide();
	$("#toolbar").show();
	$("entry").focus();
	scrollDown(base);
};

// query connector
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
	pomelo.on('onChat', function(data) {
		addMessage(data.from, data.target, data.msg);
		$("#chatHistory").show();
		if(data.from !== username){
			tip('message', data.from);
		}
	});
	
	//wait message from the server.
	pomelo.on('onDraw', function(data) {
		drawMessage(data.from, data.target, data.msg);
		//$("#chatHistory").show();
		//if(data.from !== username){
			//tip('message', data.from);
		//}
	});

	//update user list
	pomelo.on('onAdd', function(data) {
		var user = data.user;
		tip('online', user);
		addUser(user);
	});

	//update user list
	pomelo.on('onLeave', function(data) {
		var user = data.user;
		tip('offline', user);
		removeUser(user);
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
					showChat();
					initUserList(data);
					
					myDoodle = new doodle();
				    doodlePad.init(username, myDoodle);
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