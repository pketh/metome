var MongoClient = require('mongodb'),
  ObjectId = require('mongodb').ObjectID,
  connect = require('connect'),
  http = require('http'),
  io = require('socket.io').listen(8000),
  fs = require('fs');
  // --> npm install lean mean router here ..
  // --> auth
  
// --> refactor: local require files = closures.js , api (for json curl reqs)

Metome = {}; // Globally scoped object

io.configure('development', function(){
  io.set('log level', 2); // default is 3 (shows full debug)
});
    
var app = connect()
  .use(connect.logger('dev'))
  .use(connect.static('public'))
  .listen(3000);

// events
io.sockets.on('connection', function(socket) {
  socket.on('login', function(username){
    var user = username;
    
    MongoClient.connect('mongodb://localhost/metome', function(err, db) {
      if (err) throw err;  
      var collection = db.collection(user); 
    
      // listen for titles request      
      socket.on('entries', function(){        
        collection.find( {}, { title : 1 } ).sort( { _id: -1 } ).toArray(function(err, titles) { // query db -> get titles in reverse order by id/cdate -> convert to array -> make titles object [{x,y}, {x,y}]
          if (err) throw err;
          socket.emit('entriesSuccessful', titles)
          console.log(titles)
        });
      });
      
      // load individual entry
      socket.on('entry', function(entryID){
        console.log(entryID); // DEBUG        
        collection.findOne({ _id : ObjectId ( entryID ) },function(err,entry) { // pulls in entry object
          if (err) throw err;
          var entryDate = new Date( (ObjectId(entryID).getTimestamp()) )
          var entryMonth = entryDate.getMonth()
          switch (entryMonth)
          {
          case 0:
            var entryMonthStr = 'Jan';
            break;
          case 1:
            var entryMonthStr = 'Feb';
            break;
          case 2:
            var entryMonthStr = 'Mar';
            break;
          case 3:
            var entryMonthStr = 'Apr';
            break;
          case 4:
            var entryMonthStr = 'May';
            break;
          case 5:
            var entryMonthStr = 'Jun';
            break;
          case 6:
            var entryMonthStr = 'Jul';
            break;
          case 7:
            var entryMonthStr = 'Aug';
            break;
          case 8:
            var entryMonthStr = 'Sep';
            break;
          case 9:
            var entryMonthStr = 'Oct';
            break;
          case 10:
            var entryMonthStr = 'Nov';
            break;
          case 11:
            var entryMonthStr = 'Dec';
            break;
          default:
            var entryMonthStr = 'err';
            break;
          }
          var entryYear = entryDate.getFullYear()
          
          socket.emit('entrySuccessful', entry, entryMonthStr, entryYear, entryID); 
        });
      });
      
      // db.pirijan.findOne({ '_id' : ObjectId("5279262e74d92da751eb2b8e") })

// console.log(Metome.entryID) // global id scope test
// returns Thu Sep 20 2012 22:56:39 GMT-0400
      
      // write title on changes
      socket.on('titleEdited', function(newTitle, entryID) {      
        collection.update(
          { '_id' : ObjectId ( entryID ) }, // id should be passed in from client
          { $set: 
           newTitle
          },
          function (err) {
            if (err) throw err;
            console.log(newTitle); // DEBUG
            console.log(entryID); // DEBUG
            socket.emit('saveSuccess', entryID);
        });
      });    
      
      // write content on changes
      socket.on('contentEdited', function(newContent, entryID) {
        collection.update(
          { '_id' : ObjectId ( entryID ) }, // id should be passed in from client
          { $set: 
           newContent
          },
          function (err) {
            if (err) throw err;
            console.log(newContent); // DEBUG
            console.log(entryID) // DEBUG
            socket.emit('saveSuccess', entryID);
        });
      });
          
      
      socket.on('newEntry', function(err){
        if (err) throw err;
        //
        // get entryID
        socket.emit('newEntrySuccess', {
          // inc emitting EntryID param above
          //x:y opt
        });
      });
  
      socket.on('removeEntry', function(err, entry){
        if (err) throw err;
        //
        socket.emit('removeEntrySuccess', {
          //x:y opt
        });
      });
          
    });
  

//    socket.on('disconnect', function(..socket..) {
      // do disconnect event research
      // log the disconnect to a global json.. (reasons?)
      // socket.on disconnect client code = ur in offline mode / read only
//    })

  }); // close 'login' socket
  
}); // closes socket.io












































// I THINK : this whole make a json file thing is only useful for API calls ...
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











