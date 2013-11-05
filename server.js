var MongoClient = require('mongodb'),
  connect = require('connect'),
  http = require('http'),
  io = require('socket.io').listen(8000),
  fs = require('fs');
  // npm install router here
  
var app = connect()
  .use(connect.logger('dev'))
  .use(connect.static('public'))
  .listen(3000);

// BLOOP! the following block is old temp code that resets that test json files
// artists = {
//     name: "Frida Kahlo",
//     bio: "Surrealist",
//     summary: "Frida Kahlo was a Mexican painter best know for her surrealist self-portraits, depicting her intense emotional and physical pain. She was three years old at the onset of the Mexican Revolution."
// };
// 
// titles = {
//   titles : [
//     {title: 'first thing.'},
//     {title: 'second Thing'},
//     {title: 'A night in paris'},
//     {title: 'Something you should know'},
//     {title: 'The perfect trip.'}
//   ]
// };
// 
// // on initial load only -> turn data into a seperate json file ...
// var jsonArtists = JSON.stringify(artists, null, 2); // additional params to write pretty json
// fs.writeFile('public/json/artists.json', jsonArtists, function (err) {
//   if (err) throw err;
//   console.log('artists saved!');
// });
// 
// var jsonTitles = JSON.stringify(titles, null, 2); 
// fs.writeFile('public/json/titles.json', jsonTitles, function (err) {
//   if (err) throw err;
//   console.log('titles saved!');
// });


// SOCKET.IO
// wait for a client to connect
// once connection happens, socket object created, run socket functions
io.sockets.on('connection', function (socket) {
  
      // socket.on('initial connection', function (from, msg) {
      //   console.log('I received an itial connection req ', from, ' saying ', msg);
      //   socket.emit('initial connxtion', {data: 'the post stuff'})
      // });

  
  // when the client emits 'some event' , call the callback func w data (data sent from client)
  socket.on('contentEdited', function (newContent) {
    console.log(newContent);
    
    fs.writeFileSync('public/json/artists.json', newcontent, String, function(err){
      if (err) throw err;
      console.log('successfully written in: ' + newcontent)
    })
    
    // pipe it into writestream...
    // .pipe(fs.createWriteStream(pathToFile)) //write to disk as data arrives.
    // .on('end', function () {
       //done
       // emit 'saved' event
  })


MongoClient.connect('mongodb://localhost/pirijan', function(err, db) {
  if (err) {return console.log(err);}
  console.log("Connected to db");

  var collection = db.collection('test');
  var everything = collection.find().toString(function(err, items){});
});



// pass this fucker back to replace the old content in the json. callback -> emit when write complete.
    // should result in {content : 'newvalue..'    
    // then we emit a msg back to the same client. 
    // 'event'=what the client is listening for.
    // 2nd arg = the data we want to send along with the message
//    socket.emit('event', { some: 'data' });
  // });
  
  // socket.on('disconnect', function() {
  //   // log the disconnect 
  // })
  
});























































