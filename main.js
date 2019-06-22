var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
// app.get('/', function(req, res){
//     res.send('<h1>Hello world</h1>');
// });
var clients = {};
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    io.emit('some event', { for: 'everyone' });
    socket.broadcast.emit('hi');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    socket.on('private-message', function(data){
        console .log(data);
        console.log("Sending: " + data.msg + " to " + data.nm);
        if (clients[data.nm]){
            io.sockets.connected[clients[data.nm].socket].emit("private-message", data.msg);
        } else {
            console.log("User does not exist: " + data.nm);
        }
    });
    socket.on('add-user', function(data){
        console.log(data);
        clients[data.nm] = {
            "socket": socket.id,
            'em':data.em
        };
        console.log(clients);
    });

});

http.listen(3000, function(){
    console.log('listening on *:3000');
});