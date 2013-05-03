var Twit = require('twit')
var http = require('net');
var cache = require('./cache.js');
var config = require('./config.js');

var app                 = require('http').createServer(handler),
    io                  = require('socket.io').listen(app,{ log: false }),
    fs                  = require('fs'),
    mysql               = require('mysql'),
    connectionsArray    = [];

var connection = mysql.createConnection(config.mysql),
    POLLING_INTERVAL = 1000,
    pollingTimer;
connection.connect(function(err) {
  // connected! (unless `err` is set)
  console.log( err );
});

app.listen(5130);

var T = new Twit({
	consumer_key: 'uTaunR6TuFSyWYOsRGtOgw',
	consumer_secret: 'uJliBxxc33npZOQhbuGOcPPtAlSY6HVQeGoxaC3QY',
	access_token: '15740707-aXRJmkyHO8yp8p2PliO0kAbjqxPXvqjqwAHuTJKHQ',
	access_token_secret: 'Hl0JVX0YufjWAbjsCpfe7RWkMRhe3CHS5uuj6hX6EE'

});

var hash = config.hash;
var stream = T.stream('statuses/filter', { track: hash });

stream.on('tweet', function (tweet) {
	//console.log(tweet);
	var ts = Date.now() / 1000;
	console.log("new tweat "+tweet.id);
	
	var length = hash.length,
	    element = null;

	for (var i = 0; i < length; i++) {
	  element = hash[i];

	  if(tweet.text.toUpperCase().indexOf(element.toUpperCase()) !== -1){
		console.log("new tweat save to db : "+tweet.id+" filter : "+element);
		var params = [tweet.id,tweet.user.screen_name,tweet.user.profile_image_url,tweet.created_at,tweet.text,element,element];
		connection.query('INSERT INTO tb_LA values(null,?,?,?,?,?,(select IFNULL(MAX(m.no)+1,1) from tb_LA m where m.filter = ?),?)', params, function(err, result) {
			if (err){ console.log(err); }
			connection.query('SELECT max(id) as id from tb_LA', function(err, rows, fields) {
			  	console.log("Notif all clients");
			  	var max = 0
			  	if(rows.length > 0)
				  	max = rows[0].id;
				io.sockets.emit('notification', max);
			});
		});
	  }
	}
});
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

io.sockets.on( 'connection', function ( socket ) {
	socket.on('all', function (min, max, fn) {
		var id_cache = "tweet_"+min+"to"+max
		var rowsc = cache.get(id_cache);
		console.log(id_cache);
		if(rowsc===null){
			console.log( 'Load From : '+min+' to '+max);
			var sql = 'select * from (SELECT * FROM tb_LA WHERE id > \''+min+'\' and id <= \''+max+'\' ORDER BY id DESC LIMIT 0 , 100) a ORDER BY ID';
			var query = connection.query(sql, function(err, rows, fields) {
				cache.put(id_cache,rows,100000);
				fn({users:rows,hash:hash});
			});
		}
		else{
			console.log( 'Load From : '+min+' to '+max+" from cache");
			fn({users:rowsc,hash:hash});
		}
	});

	connection.query('SELECT max(id) as id from tb_LA', function(err, rows, fields) {
	  	if (err){ console.log(err); }
	  	var max = 0;
	  	if(rows.length > 0){
		  	max = rows[0].id;
		}
		socket.emit('notification', max);
		console.log("Notif to a new client that max id to load is "+max);
	});

	socket.on('disconnect', function () {
		var socketIndex = connectionsArray.indexOf( socket );
		//console.log('socket = ' + socketIndex + ' disconnected');
		if (socketIndex >= 0) {
			connectionsArray.splice( socketIndex, 1 );
		}
		console.log( 'A socket disconnected ! total curent socket : '+connectionsArray.length );
	});
	
	connectionsArray.push( socket );
	console.log( 'A new socket is connected! total curent socket : '+connectionsArray.length );
});