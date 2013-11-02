var MongoClient = require('mongodb'),
  connect = require('connect'),
  http = require('http'),
  mustache = require('mustache'),
  io = require('socket.io').listen(8000),
  fs = require('fs');
  // npm install router here
  
var app = connect()
  .use(connect.logger('dev'))
  .use(connect.static('public'))
  .listen(3000);

artists = {
    name: "Frida Kahlo",
    bio: "Surrealist",
    summary: "Frida Kahlo was a Mexican painter best know for her surrealist self-portraits, depicting her intense emotional and physical pain. She was three years old at the onset of the Mexican Revolution."
};

titles = {
  titles : [
    {title: 'first thing.'},
    {title: 'second Thing'},
    {title: 'A night in paris'},
    {title: 'Something you should know'},
    {title: 'The perfect trip.'}
  ]
};

// client side mustache test ..
var output = mustache.render("{{name}} the {{bio}}", artists);
console.log(output);

// on initial load only -> turn data into a seperate json file ...
var jsonArtists = JSON.stringify(artists);
fs.writeFile('public/artists.json', jsonArtists, function (err) {
  if (err) throw err;
  console.log('artists saved!');
});

var jsonTitles = JSON.stringify(titles);
fs.writeFile('public/titles.json', jsonTitles, function (err) {
  if (err) throw err;
  console.log('titles saved!');
});


io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});























// MongoClient.connect('mongodb://localhost/pirijan', function(err, db) {
//   if (err) {return console.log(err);}
// 
//   var collection = db.collection('test');
//   var everything = collection.find().toString(function(err, items){});
// });
































