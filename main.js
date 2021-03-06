//var app = require('express')();
var bodyParser=require("body-parser");
var express=require("express");
var app = express();
var cors = require('cors');
var http = require('http').createServer(app);
const fileUpload = require('express-fileupload');
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/chatdb";


app.use(bodyParser.json());
//app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());
app.use('/img',express.static(__dirname + '/public'));
//app.use('/images',express.static(__dirname + '/public/images'));
app.use(fileUpload());

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
//get page
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
app.get('/fileupload', function(req, res){
    res.sendFile(__dirname + '/file.html');

});

//file upload
app.post('/upload', function(req, res) {
  if (Object.keys(req.files).length == 0) {
    console.log('no file uploaded');
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
  console.log(sampleFile);
  console.log(Date.now());
  var filenm=Date.now()+sampleFile.name;
  var response=res;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('/sahil/node/public/images/'+filenm, function(err) {
    if (err){
        console.log('err in move');
        console.log(err);
      return res.status(500).send(err);
    }
    console.log(req.headers.host);
    if(req.body.from == 'admin'){
        data={
            aem: req.body.fem,
            uem: req.body.tem,
            msg: '<img src="http://'+req.headers.host+'/img/images/'+filenm+'" width="200px" height="200px">',
            type: 'incoming'
        };
    }
    else{
        data={
            aem: req.body.tem,
            uem: req.body.fem,
            msg: '<img src="http://'+req.headers.host+'/img/images/'+filenm+'" width="200px" height="200px">',
            type: 'outgoing'
        };
    }
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("chatdb");
        console.log('data-'+data)
        //var myobj = { name: data.nm, em:data.em, socket: socket.id };
        dbo.collection("chatDetails").insertOne(data, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
            //io.sockets.emit('img')
            io.sockets.connected[clients[data.fem].socket].emit("private-message-user", data.msg);
            io.sockets.connected[admin[data.tem].socket].emit("private-message-admin", data);
            response.status(200).send('File uploaded!');
        });
    });
    //emit_img(data);
    //io.emit("img");
    // io.sockets.connected[clients[data.fem].socket].emit("private-message-user", data.msg);
    // io.sockets.connected[admin[data.tem].socket].emit("private-message-admin", data);

    //res.status(200).send('File uploaded!');
  });
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
        console.log(socket.id);
    });
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    socket.on('private-message-admin', function(data){
        console .log(data);
        
        if (admin[data.tem]){
            console.log("Sending: " + data.msg + " to " + data.tem + " frm " + data.fem);
            io.sockets.connected[clients[data.fem].socket].emit("private-message-user", data.msg);
            io.sockets.connected[admin[data.tem].socket].emit("private-message-admin", data);
            MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
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
            io.sockets.connected[admin[data.fem].socket].emit("private-message-user", data);
            io.sockets.connected[clients[data.tem].socket].emit("private-message-admin", data.msg);
            MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
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
        //new
        var data2={ em:data.em };
        console.log('data2'+JSON.stringify(data2));
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
            if (err) throw err;
            console.log('in');
            var dbo = db.db("chatdb");
            dbo.collection("chatUsers").find(data2).toArray( function(err, res) {
                if (err) throw err;
                console.log(res);
                console.log('in1');
                //response=res;
                /*db.close();
                console.log('out');*/
                console.log('len-'+res.length);
                if(res.length==0){
                    console.log('in2');
                    var myobj2 = { name: data.nm, em:data.em, socket: socket.id };
                    dbo.collection("chatUsers").insertOne(myobj2, function(err, res) {
                        if (err) throw err;
                        console.log("1 document inserted");
                        db.close();
                    });
                }
            });
        });
        //end new
        users.push(myobj);
        clients[data.em] = {
            "socket": socket.id,
            'em':data.em,
            'nm':data.nm,
        };
        /*MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("chatdb");
            var myobj = { name: data.nm, em:data.em, socket: socket.id };
            dbo.collection("chatUsers").insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
            });
        });*/
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

    var files = {}, 
    struct = { 
        name: null, 
        type: null, 
        size: 0, 
        data: [], 
        slice: 0, 
    };

    socket.on('slice upload', (data) => { 
        if (!files[data.name]) { 
            files[data.name] = Object.assign({}, struct, data); 
            files[data.name].data = []; 
        }
        
        //convert the ArrayBuffer to Buffer 
        data.data = new Buffer(new Uint8Array(data.data)); 
        //save the data 
        files[data.name].data.push(data.data); 
        files[data.name].slice++;
        
        if (files[data.name].slice * 100000 >= files[data.name].size) { 
            //do something with the data 
            socket.emit('end upload'); 
        } else { 
            socket.emit('request slice upload', { 
                currentSlice: files[data.name].slice 
            }); 
        } 
    });
    function updateClients() {
        console.log(users);
        io.sockets.emit('updateUsers', users);
    }
    function emit_img(data){
        console.log('in'+data);
        io.sockets.connected[clients[data.fem].socket].emit("private-message-user", data.msg);
        io.sockets.connected[admin[data.tem].socket].emit("private-message-admin", data);
    }

});

http.listen(3000, '0.0.0.0', function(){
    console.log('listening on *:3000');
});