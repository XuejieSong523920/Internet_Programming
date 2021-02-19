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

// GET method to return the list of events
// The function queries the tbl_events table for the list of events and sends the response back to client
app.get('/getListOfEvents', function(req, res) {
  //Add Details
  //console.log("HERE we are in the geteventlist database");
  if(!req.session.value){
    res.redirect('/login');
  }else{
  	// include the mysql module
	var mysql = require("mysql");

	var con = mysql.createConnection({
	    host: "cse-larry.cse.umn.edu",
	    user: "C4131F20U94", // replace with the database user provided to you
	    password: "8866", // replace with the database password provided to you
	    database: "C4131F20U94", // replace with the database user provided to you
	    port: 3306
	    });
    con.connect(function(err) {
      if (err) {
        throw err;
      }else{
      con.query('SELECT * FROM tbl_events', function(err, result) {
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
	var mysql = require("mysql");

	var con = mysql.createConnection({
	    host: "cse-larry.cse.umn.edu",
	    user: "C4131F20U94", // replace with the database user provided to you
	    password: "8866", // replace with the database password provided to you
	    database: "C4131F20U94", // replace with the database user provided to you
	    port: 3306
	    });
    con.connect(function(err) {
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

  var mysql = require("mysql");
  var con = mysql.createConnection({
    host: "cse-larry.cse.umn.edu",
    user: "C4131F20U94", // replace with the database user provided to you
    password: "8866", // replace with the database password provided to you
    database: "C4131F20U94", // replace with the database user provided to you
    port: 3306
    });
  con.connect(function(err) {
    if (err) {
      throw err;
    };
	    // include the mysql module
    //console.log("Connected!");
    con.query('SELECT acc_login, acc_password FROM tbl_accounts', function(err, result) {
      if(err) {
        throw err;
      }
      var login_status = false;
      for(var i = 0; i < result.length; i++){
        if(result[i].acc_login == username && result[i].acc_password == password){
          req.session.value = 1;
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
