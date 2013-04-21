
var Twit = require('twit')

var http = require('net');
var app                 = require('http').createServer(handler),
    io                  = require('socket.io').listen(app),
    fs                  = require('fs'),
    mysql               = require('mysql'),
    connectionsArray    = [];
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '010503',
	database:'node_test'
}),
    POLLING_INTERVAL = 1000,
    pollingTimer;
connection.connect(function(err) {
  // connected! (unless `err` is set)
  console.log( err );
});

// creating the server ( localhost:8000 )
app.listen(5130);

var T = new Twit({
	consumer_key: 'uTaunR6TuFSyWYOsRGtOgw',
	consumer_secret: 'uJliBxxc33npZOQhbuGOcPPtAlSY6HVQeGoxaC3QY',
	access_token: '15740707-aXRJmkyHO8yp8p2PliO0kAbjqxPXvqjqwAHuTJKHQ',
	access_token_secret: 'Hl0JVX0YufjWAbjsCpfe7RWkMRhe3CHS5uuj6hX6EE'

});


/*
function a(){
	twit.search('@', {}, function(err, data) {
	console.log('@',data.results[0].from_user ,'yaitu---->',data.results[0].text);
	
	});
}
setInterval(a,1*100);
BritAmaMusicBankLive
*/
var stream = T.stream('statuses/filter', { track: '#Vespa3V #VespaWeekender' })

stream.on('tweet', function (tweet) {
	console.log(tweet);
	var ts = Date.now() / 1000;
	var post  = {id_twit: tweet.id, from:tweet.user.screen_name,date_twit: tweet.created_at,content:tweet.text, profile_image_url:tweet.user.profile_image_url};
	var query = connection.query('INSERT INTO tb_cintamonyet SET ?', post, function(err, result) {
  // Neat!
});
})
// on server started we can load our client.html page
function handler ( req, res ) {
	fs.readFile( __dirname + '/client.html' , function ( err, data ) {
		if ( err ) {
			//console.log( err );
			res.writeHead(500);
			return res.end( 'Error loading client.html' );
		}
		res.writeHead( 200 );
		res.end( data );
	});
}

var pollingLoop = function () {

	// Doing the database query
	var query = connection.query('SELECT * FROM tb_cintamonyet ORDER BY id DESC LIMIT 0 , 2000'),
	/*
SELECT  id ,  id_twit ,  from ,  profile_image_url ,  date_twit ,  content 
FROM  tb_LA
WHERE content LIKE  Gue lagi di LA LIGHTS INDIE MOVIE #moviedayout, acara seru ngumpul, ngulik dan bikin film
	*/
		users = []; // this array will contain the result of our db query

	// resuming the connection that is paused each loop
	connection.resume();

	// setting the query listeners
	query
	.on('error', function(err) {
		// Handle error, and 'end' event will be emitted after this as well
		//console.log( err );
		updateSockets( err );

	})
	.on('result', function( user ) {
		// it fills our array looping on each user row inside the db
		users.push( user );
	})
	.on('end',function(){
		// loop on itself only if there are sockets still connected
		if(connectionsArray.length) {
			pollingTimer = setTimeout( pollingLoop, POLLING_INTERVAL );
			connection.pause();

			updateSockets({users:users});
		}
	});

};
// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on( 'connection', function ( socket ) {

	//console.log('Number of connections:' + connectionsArray.length);
	// starting the loop only if at least there is one user connected
	if (!connectionsArray.length) {
		pollingLoop();
	}

	socket.on('disconnect', function () {
		var socketIndex = connectionsArray.indexOf( socket );
		//console.log('socket = ' + socketIndex + ' disconnected');
		if (socketIndex >= 0) {
			connectionsArray.splice( socketIndex, 1 );
		}
	});

	console.log( 'A new socket is connected!' );
	connectionsArray.push( socket );

});

var updateSockets = function ( data ) {
	// adding the time of the last update
	data.time = new Date();
	// sending new data to all the sockets connected
	connectionsArray.forEach(function( tmpSocket ){
		tmpSocket.volatile.emit( 'notification' , data );
	});
};
/*
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
*/