var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/chatdb";

MongoClient.connect(url, { useNewUrlParser: true },function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    var dbo = db.db("chatdb");
    dbo.createCollection("chatDetails", function(err, res) {
        if (err) throw err;
        console.log("Collection created!");
        //db.close();
    });
    dbo.createCollection("chatUsers", function(err, res) {
        if (err) throw err;
        console.log(" chatUsers Collection created!");
        //db.close();
    });
    // var myobj = { name: "Company Inc", address: "Highway 37" };
    // dbo.collection("customers").insertOne(myobj, function(err, res) {
    //     if (err) throw err;
    //     console.log("1 document inserted");
    //     db.close();
    // });
    //db.close();
});
// app.get('/', function(req, res){
//     res.send('<h1>Hello world</h1>');
// });
var clients = {};
var admin = {};
var users=[];
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/admin', function(req, res){
    res.sendFile(__dirname + '/admin.html');

});

io.on('connection', function(socket){
    updateClients();
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
        console.log("Sending: " + data.msg + " to " + data.em);
        if (clients[data.em]){
            io.sockets.connected[clients[data.nm].socket].emit("private-message", data.msg);
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("chatdb");
                var myobj = { name: data.nm, msg: data.msg };
                dbo.collection("chatDetails").insertOne(myobj, function(err, res) {
                    if (err) throw err;
                    console.log("1 document inserted");
                    db.close();
                });
            });
        } else {
            console.log("User does not exist: " + data.nm);
        }
    });
    socket.on('add-user', function(data){
        console.log(data);
        users.push(data.em);
        clients[data.em] = {
            "socket": socket.id,
            'em':data.em,
            'nm':data.nm,
        };
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("chatdb");
            var myobj = { name: data.nm, em:data.em, socket: socket.id };
            dbo.collection("chatUsers").insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
            });
        });
        console.log(clients);
        updateClients();
    });
    socket.on('add-admin', function(data){
        console.log(data);
        users.push(data.em);
        clients[data.em] = {
            "socket": socket.id,
            'em':data.em,
            'nm':data.nm,
        };
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("chatdb");
            var myobj = { name: data.nm, em:data.em, socket: socket.id };
            dbo.collection("chatUsers").insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
            });
        });
        console.log(clients);
        updateClients();
    });
    function updateClients() {
        io.sockets.emit('updateUsers', users);
    }

});

http.listen(3000, function(){
    console.log('listening on *:3000');
});