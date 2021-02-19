// YOU CAN USE THIS FILE AS REFERENCE FOR SERVER DEVELOPMENT

// include the express module
var express = require("express");

// create an express application
var app = express();

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// native js function for hashing messages with the SHA-256 algorithm
var crypto = require('crypto');

// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

var mysql = require('mysql');

var db;
//required for reading XML files
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
fs.readFile(__dirname + '/dbconfig.xml', function(err, data){
  if(err) throw err;
  //console.log("data: \n" + data);
  parser.parseString(data, function(err, result){
    if(err) throw err;
    db = mysql.createConnection({
      host : result.dbconfig.host[0],
      user : result.dbconfig.user[0],
      password : result.dbconfig.password[0],
      database : result.dbconfig.database[0],
      port : result.dbconfig.port[0]
    });
    db.connect(function(err){
      if(err) throw err;
      console.log("Connected to dtabase!");
    });
  });
});
// use express-session
// in mremory session is sufficient for this assignment
app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false
}));

// server listens on port 9184 for incoming connections
app.listen(9184, () => console.log('Listening on port 9184!'));

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/welcome.html');
});

// // GET method route for the events page.
// It serves events.html present in client folder
app.get('/events',function(req, res) {
  //Add Details
  if(!req.session.value){
    res.redirect('/login');
  }else{
    res.sendFile(__dirname + '/client/events.html');
  }
  
});

// GET method route for the addEvent page.
// It serves addEvent.html present in client folder
app.get('/addEvent',function(req, res) {
  //Add Details
  if(!req.session.value){
    res.redirect('/login');
  }else{
    res.sendFile(__dirname + '/client/addEvent.html');
  }
});

// GET method route for the admin page.
// It serves admin.html present in client folder
app.get('/admin',function(req, res) {
  //Add Details
  if(!req.session.value){
    res.redirect('/login');
  }else{
    res.sendFile(__dirname + '/client/admin.html');
  }
});

//GET method for stock page
app.get('/stock', function (req, res) {
  //Add Details
  if(!req.session.value){
    res.redirect('/login');
  }else{
    res.sendFile(__dirname + '/client/stock.html');
  }
});

// GET method route for the login page.
// It serves login.html present in client folder
app.get('/login',function(req, res) {
  //Add Details
  if(!req.session.value){
    res.sendFile(__dirname + '/client/login.html');
  }else{
    res.redirect('/events');
  }
});

//here below are the routes for administration management:
app.get('/getListOfUsers', function(req, res){
  if(!req.session.value){
    res.redirect('/login');
  }else{
      db.query('SELECT * FROM tbl_accounts', function(err, result) {
        if(err) {
          throw err;
        }else{
          if(result.length == 0){
            var responseObj = {res : []};
          }else{
            var objArray = [];
            for(var i = 0; i < result.length; i++){
              var obj = {
                id : result[i].acc_id,
                name : result[i].acc_name,
                login : result[i].acc_login,
                password : result[i].acc_password
              };
              objArray.push(obj);
            }
            //responseObj = {res: objArray};
            res.json(objArray);
          }
        }
        //resonseObj = JSON.stringify(responseObj);
        //res.send(responseObj);
    });
}
});

app.get('/getCurrentUser', function(req, res){
  if(!req.session.value){
    res.redirect('/login');
  }else{
    db.query('SELECT * FROM tbl_accounts WHERE acc_id = ?', req.session.value, function(err, result){
      if(err) throw err;
      res.send(result[0].acc_name);
    });
  }
});

app.post('/addUser', function(req, res){
  if(!req.session.value){
    res.redirect('/login');
  }else{
    db.query('SELECT * FROM tbl_accounts WHERE acc_login=?', req.body.login, function(err, result){
      if(result.length == 0){
        var obj = {
          acc_name : req.body.name,
          acc_login : req.body.login,
          acc_password : crypto.createHash('sha256').update(req.body.password).digest('base64')
        }
        db.query('INSERT tbl_accounts SET ?', obj, function(err, result){
          if(err) throw err;
          else{
            //console.log("Values inserted");
            res.send({flag:true, id:result.insertId});
          }
        });
      }else{
        res.send({flag:false});
      }
    });
}
});


app.post('/updateUser', function(req, res){
  if(!req.session.value){
    res.redirect('/login');
  }else{
        //actually here we can edit the account that we currently in:
    db.query('SELECT *FROM tbl_accounts where acc_login = ? and acc_id != ?', [req.body.login, req.body.id], function(err, result){
      //except the account that we want to update, no other accounts using the same login:
      if(err) throw err;
      else{
        if(result.length == 0){
          if(req.body.password){
            db.query('Update tbl_accounts Set acc_name = ?, acc_login = ?, acc_password = ? Where acc_id = ?', [req.body.name, req.body.login, req.body.password, req.body.id], function(err, result){
              if(err) throw err;
              res.send({flag: true});
            })
          }else{
            db.query('Update tbl_accounts Set acc_name = ?, acc_login = ? Where acc_id = ?', [req.body.name, req.body.login, req.body.id], function(err, result){
              if(err) throw err;
              res.send({flag: true});
            })
          }
        }else{
          res.send({flag : false});
        }
      }
    });
}
});

app.post('/deleteUser', function(req, res){
  if(!req.session.value){
    res.redirect('/login');
  }else{
    if(req.body.id == req.session.value){
      res.send({flag: false});
    }else{
      db.query('DELETE FROM tbl_accounts WHERE acc_login = ?', req.body.login, function(err, result){
        if(err) throw err;
        res.send({flag: true});
      });
    }
  }
});

//below is the Events pages part
// GET method to return the list of events
// The function queries the tbl_events table for the list of events and sends the response back to client
app.get('/getListOfEvents', function(req, res) {
  //Add Details
  //console.log("HERE we are in the geteventlist database");
  if(!req.session.value){
    res.redirect('/login');
  }else{
  	// include the mysql module
	
      db.query('SELECT * FROM tbl_events', function(err, result) {
        if(err) {
          throw err;
        }else{
          if(result.length == 0){
            var retrunObj = {"events" : []};
            var responseObj = {res : returnObj};
          }else{
            var eventsArray = [];
            for(var i = 0; i < result.length; i++){
              var event = {
                day : result[i].event_day,
                event : result[i].event_event,
                start : result[i].event_start,
                end : result[i].event_end,
                location : result[i].event_location,
                phone : result[i].event_phone,
                info : result[i].event_info,
                url : result[i].event_url
              };
              eventsArray.push(event);
            }
            returnObj = {"events":eventsArray};
            responseObj = {res: returnObj};
          }
        }
        resonseObj = JSON.stringify(responseObj);
        res.send(responseObj);
    });
}
});

// POST method to insert details of a new event to tbl_events table
app.post('/postEvent', function(req, res) {
  //Add Details
  //console.log("reach here the postEvnet page!!1");
  if(!req.session.value){
    res.redirect('/login');
  }else{
  	// include the mysql module
    db.connect(function(err) {
      if (err) {
        throw err;
      }
      else{
        var obj = {
        	event_day : req.body.day,
            event_event : req.body.event,
            event_start : req.body.start,
            event_end : req.body.end,
            event_location : req.body.location,
            event_phone : req.body.phone,
            event_info : req.body.info,
            event_url : req.body.url
        }
        
        con.query('INSERT tbl_events SET ?', obj, function(err, result){
          if(err) throw err;
          else{
            //console.log("Values inserted");
            res.redirect(302, '/events');
          }
        });
}
});
}
});

// POST method to validate user login
// upon successful login, user session is created
app.post('/sendLoginDetails', function(req, res) {
  //Add Details
  var username = req.body.username;
  var password = crypto.createHash('sha256').update(req.body.password).digest('base64');
	    // include the mysql module
    //console.log("Connected!");
    db.query('SELECT acc_login, acc_password, acc_id FROM tbl_accounts', function(err, result) {
      if(err) {
        throw err;
      }
      var login_status = false;
      for(var i = 0; i < result.length; i++){
        if(result[i].acc_login == username && result[i].acc_password == password){
          req.session.value = result[i].acc_id;
          login_status = true;
        }
      }
      if(login_status){
        res.status(200).send('success');
      }else{
      	//console.log(password);
        res.status(200).send('fail');
      }
    });
});

// log out of the application
// destroy user session
app.get('/logout', function(req, res) {
  //Add Details
  if(!req.session.value){
  	res.send("Session is not started yet, so cannot log out!");
  }else{
  	req.session.destroy();
  	res.redirect('/login');
  }
});

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));


// function to return the 404 message and error to client
app.get('*', function(req, res) {
  // add details
});
