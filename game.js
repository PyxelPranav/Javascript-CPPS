var express = require('express');
var app = express();
var serv = require('http').Server(app);
 
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.use('/client',express.static(__dirname + '/client'));
 
serv.listen(2000);
console.log("Server started.");
 
var SOCKET_LIST = {};
 
var USERS = {
	//username:password
	"pyxelpranav":"pyxelpranav",
	"drharvey":"drharvey"
};

var isValidPassword = function(data) {
	return USERS[data.username] === data.pass;
}

var isUsernameTaken = function(data) {
	return USERS[data.username];
}

var addUser = function(data) {
	USERS[data.username] = data.pass;
}
 
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    socket.x = 350;
    socket.y = 340;
    socket.number = "" + Math.floor(10 * Math.random());
	
	socket.place = 'town';
	socket.look = 1;
	socket.army = 'none';
	socket.hspd = 0;
	socket.vspd = 0;
	
	socket.pressingUp = false;
	socket.pressingLeft = false;
	socket.pressingRight = false;
	socket.pressingDown = false;
	
	socket.sit = false;
	
    // SOCKET_LIST[socket.id] = socket;
	
	socket.on('keydown', function(data) {
		switch(data) {
			case 38:
				socket.pressingUp = true;
				break;
			case 37:
				socket.pressingLeft = true;
				break;
			case 39:
				socket.pressingRight = true;
				break;
			case 40:
				socket.pressingDown = true;
				break;
			default:
				break;
		}
	});
	
	socket.on('keyup', function(data) {
		switch(data) {
			case 38:
				socket.pressingUp = false;
				break;
			case 37:
				socket.pressingLeft = false;
				break;
			case 39:
				socket.pressingRight = false;
				break;
			case 40:
				socket.pressingDown = false;
				break;
			case 83:
				switch(socket.look) {
					case 1:
						socket.look = 9;
						break;
					case 2:
						socket.look = 10;
						break;
					case 3:
						socket.look = 11;
						break;
					case 4:
						socket.look = 12;
						break;
					case 5:
						socket.look = 13;
						break;
					case 6:
						socket.look = 14;
						break;
					case 7:
						socket.look = 15;
						break;
					case 8:
						socket.look = 16;
						break;
				}
				break;
			default:
				break;
		}
	});
	
    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
    });
	
	socket.on('signIn', function(data) {
			if(isValidPassword(data)) {
				socket.emit('signInResponse', {success: true});
				SOCKET_LIST[socket.id] = socket;
			} else {
				socket.emit('signInResponse', {success: false});
			}
		});
		
	socket.on('signUp', function(data) {
		if(isUsernameTaken(data)) {
			socket.emit('signUpResponse', {success: false});
		} else {
			addUser(data);
			socket.emit('signUpResponse', {success: true});
		}
	});
   
});

setInterval(function(){
    var pack = [];
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
		
		if(socket.pressingUp) socket.y -= 4;
		if(socket.pressingLeft) socket.x -= 4;
		if(socket.pressingRight) socket.x += 4;
		if(socket.pressingDown) socket.y += 4;
		
		if(socket.pressingRight && !socket.pressingUp && !socket.pressingDown) socket.look = 7;
		if(socket.pressingLeft && !socket.pressingUp && !socket.pressingDown) socket.look = 3;
		if(socket.pressingUp && !socket.pressingRight && !socket.pressingLeft) socket.look = 5;
		if(socket.pressingDown && !socket.pressingLeft && !socket.pressingRight) socket.look = 1;
		
		if(socket.pressingRight && socket.pressingUp) socket.look = 6;
		if(socket.pressingLeft && socket.pressingDown) socket.look = 2;
		if(socket.pressingLeft && socket.pressingUp) socket.look = 4;
		if(socket.pressingRight && socket.pressingDown) socket.look = 8;
		
        pack.push({
            x:socket.x,
            y:socket.y,
            number:socket.number,
			place:socket.place,
			look:socket.look,
			army:socket.army,
			pressingUp:socket.pressingUp,
			pressingLeft:socket.pressingLeft,
			pressingRight:socket.pressingRight,
			pressingDown:socket.pressingDown,
			sit:socket.sit
        });    
    }
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('player_data', {pack:pack, place:socket.place});
    }
},1000/60);

