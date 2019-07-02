//var app = require('express')();
var bodyParser=require("body-parser");
var express=require("express");
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/chatdb";


app.use(bodyParser.json());
//app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/img',express.static(__dirname + '/public'));
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
    dbo.createCollection("chatAdmin", function(err, res) {
        if (err) throw err;
        console.log(" chatAdmin Collection created!");
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

app.get('/adminregister', function(req, res){
    res.sendFile(__dirname + '/adminRegister.html');

});
app.get('/adminlogin', function(req, res){
    res.sendFile(__dirname + '/adminLogin.html');

});

app.post('/sign_up', function(req,res){
    var name = req.body.nm;
    var email =req.body.email;
    var pass = req.body.pass;
    //var phone =req.body.phone;

    var data = {
        "name": name,
        "email":email,
        "password":pass,
        //"phone":phone
    };
    console.log('data');
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("chatdb");
        //var myobj = { name: data.nm, em:data.em, socket: socket.id };
        dbo.collection("chatAdmin").insertOne(data, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
    });

    return res.redirect('/adminlogin');
});

app.post('/getchat', function(req,res){
    console.log('1'+req.body);
    var email =req.body.em;
    var response=res;
    var data = {
        "uem":email,
    };
    console.log('data');
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("chatdb");
        //var myobj = { name: data.nm, em:data.em, socket: socket.id };
        dbo.collection("chatDetails").find(data).toArray( function(err, res) {
            if (err) throw err;
            console.log(res);
            //response=res;
            response.send(res);
            //db.close();
            //return res;

        });
    });
    //return res.redirect('/admin');
});

app.post('/login', function(req,res){

    var email =req.body.email;
    var pass = req.body.pass;
    var response=res;


    var data = {
        "email":email,
        "password":pass,
    };
    console.log(data);
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        console.log('in');
        var dbo = db.db("chatdb");
        dbo.collection("chatAdmin").find(data).toArray( function(err, res) {
            if (err) throw err;
            console.log(res);
            //response=res;
            db.close();
            console.log('out');
            if(res){
                var string = encodeURIComponent(res[0].email);
                return response.redirect('/admin?valid=' + string);
            }
        });
    });


    //var string = encodeURIComponent('test');
    //res.redirect('/?valid=' + string);

    //return res.redirect('/admin?valid=' + string);
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
    socket.on('private-message-admin', function(data){
        console .log(data);
        console.log("Sending: " + data.msg + " to " + data.tem + " frm " + data.fem);
        if (admin[data.tem]){
            //io.sockets.connected[clients[data.em].socket].emit("private-message", data.msg);
            io.sockets.connected[admin[data.tem].socket].emit("private-message-admin", data.msg);
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("chatdb");
                var myobj = { aem: data.tem, uem:data.fem, msg: data.msg, type:'outgoing' };
                dbo.collection("chatDetails").insertOne(myobj, function(err, res) {
                    if (err) throw err;
                    console.log("1 document inserted");
                    db.close();
                });
            });
        } else {
            console.log("User does not exist: " + data.tem);
        }
    });
    socket.on('private-message-user', function(data){
        console .log(data);
        console.log("Sending: " + data.msg + " to " + data.tem + " frm " + data.fem);
        if (clients[data.tem]){
            //io.sockets.connected[clients[data.em].socket].emit("private-message", data.msg);
            io.sockets.connected[clients[data.tem].socket].emit("private-message-user", data.msg);
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("chatdb");
                var myobj = { uem: data.tem, aem:data.fem, msg: data.msg, type:'incoming' };
                dbo.collection("chatDetails").insertOne(myobj, function(err, res) {
                    if (err) throw err;
                    console.log("1 document inserted");
                    db.close();
                });
            });
        } else {
            console.log("User does not exist: " + data.tem);
        }
    });
    socket.on('add-user', function(data){
        console.log(data);
        var myobj={em:data.em, nm:data.nm};
        users.push(myobj);
        clients[data.em] = {
            "socket": socket.id,
            'em':data.em,
            'nm':data.nm,
        };
        MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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
        admin[data.em] = {
            "socket": socket.id,
            'em':data.em,
        };

    });
    socket.on('reg-admin', function(data){
        console.log(data);

        //users.push(myobj);
        /*clients[data.em] = {
            "socket": socket.id,
            'em':data.em,
            'nm':data.nm,
        };*/
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
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
        console.log(users);
        io.sockets.emit('updateUsers', users);
    }

});

http.listen(3000, function(){
    console.log('listening on *:3000');
});