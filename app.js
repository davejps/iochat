var app = require('express')();
app.set('port', process.env.PORT || 9000);
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var port = app.get('port');
console.log(port);
server.listen(port, process.env.IP);


// routing
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

mongoose.connect('mongodb://localhost/ChatApp2', function(err){
	
	if(err){
		console.log(err);
	} else{
		console.log('success');
	}
});

var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
	room: String,
	created: {type: Date, default: Date.now}
	
});

var Chat = mongoose.model('Message', chatSchema);

// usernames which are currently connected to the chat
var usernames = {};
// rooms which are currently available in chat
var rooms = [];
io.sockets.on('connection', function (socket) {
	socket.on('adduser', function (username, room) {
        if(rooms.indexOf(room) != -1)
        {  
            socket.username = username;
            socket.room = room;
            usernames[username] = username;
            socket.join(room);
			socket.emit('updatechat', '', 'Hello ' + username);
			socket.emit('updatechat', '', 'Apologies as this chat is still in beta can you plesase ring the number liseted below or type your full name and email or phone and we will be in contact with you shorthly.');
            socket.emit('updatechat', '', 'Number: 0872023333');
			socket.broadcast.to(room).emit('updatechat', 'SERVER', username + ' has connected to this room');
        }else{
            socket.emit('updatechat', 'SERVER', 'Please enter valid code.');
        }
    });
	socket.on('createroom', function () {
		var num = 1;
		num++;
		var new_room = (num);
		rooms.push(new_room);
        socket.emit('updatechat', 'SERVER', 'Your room is ready, invite someone using this ID:' + new_room);
		socket.emit('roomcreated', new_room);
	});
    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
		
			var newMsg = new Chat({msg : data, nick: socket.username, room: socket.room});
		newMsg.save(function(err){
			if(err) throw err;
			
			 io.sockets. in (socket.room).emit('updatechat', socket.username, data);
		});
       
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        delete usernames[socket.username];
        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        if(socket.username !== undefined){
        	socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        	socket.leave(socket.room);
        }
    });
});