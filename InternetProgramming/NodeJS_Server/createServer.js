const http = require('http');
const url = require('url');
const fs = require('fs');
const qs = require('querystring');

const port = 9001;
http.createServer(function (req, res) {
  var q = url.parse(req.url, true);
  var filename = "." + q.pathname;
  if(req.url === '/'){
    indexPage(req,res);
  }
  else if(req.url === '/index.html'){
    indexPage(req,res);
  }
  else if(req.url === '/events.html'){
    eventsPage(req,res);
  }
  else if(req.url === '/addEvent.html'){
    addEventPage(req,res);
  }
  else if(req.url === '/stock.html'){
    stockPage(req,res);
  }
  else if(req.url === '/getEvent'){
    getEventsPage(req,res);
  }
  else if(req.url === '/postEventEntry'){
    var body = '';
    //listen all the input form the addEvent page
    req.on('data', function(data){
      body += data;
    });
    req.on('end', function(){
      addToEvents(req, res, body);
    });
  }
  else{
    res.writeHead(404, {'Content-Type': 'text/html'});
    return res.end("404 Not Found");
  }
}).listen(port);

function addToEvents(req, res, body){
  //parse body into JS object
  newEvent = qs.parse(body);
  fs.readFile("events.json", function(err, content){
    if(err){
      throw err;
    }
    //parse content from evnets.json to JS object
    events = JSON.parse(content);
    //push the new event into the original file
    events['events'].push(newEvent);
    //stringify the JS object back to JSON 
    eventsJSON = JSON.stringify(events);
    //write eventsJSON to events.json file
    fs.writeFile('events.json', eventsJSON, function(err){
      if(err){
        throw err;
      }else{
        //here redirect to events.html page
        res.statusCode = 302;
        res.setHeader('Location','/events.html');
        res.end();
      }
    });
  });
}

function getEventsPage(req, res) {
  fs.readFile('events.json', function(err, json) {
    if(err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'Application/json');
    res.write(json);
    res.end();
  });
}

function indexPage(req, res) {
  fs.readFile('client/index.html', function(err, html) {
    if(err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}

function eventsPage(req, res) {
  fs.readFile('client/events.html', function(err, html) {
    if(err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}

function addEventPage(req, res) {
  fs.readFile('client/addEvent.html', function(err, html) {
    if(err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}

function stockPage(req, res) {
  fs.readFile('client/stock.html', function(err, html) {
    if(err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}