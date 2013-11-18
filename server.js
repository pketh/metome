// Metome.io Server





var MongoClient = require('mongodb'),
  ObjectId = require('mongodb').ObjectID,
  connect = require('connect'),
  http = require('http'),
  io = require('socket.io').listen(8000),
  fs = require('fs');
  // --> npm install lean mean router here ..
  // --> auth

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
    
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // entries successful emits on connect/load bc not gated
      collection.find( {}, { title : 1 } ).sort( { _id: -1 } ).toArray(function(err, titles) {
        if (err) throw err;
        socket.emit('entriesSuccessful', titles);
      });

      
      // load individual entry
      socket.on('entry', function(entryID){
        console.log(entryID); // DEBUG        
        collection.findOne({ _id : ObjectId ( entryID ) },function(err,entry) {
          if (err) throw err;          
          var entryDate = new Date( (ObjectId(entryID).getTimestamp()) )
          var entryMonth = entryDate.getMonth()
          var entryYear = entryDate.getFullYear()  
          socket.emit('entrySuccessful', entry, entryMonth, entryYear, entryID);
        });
      });

      // write title on changes
      socket.on('titleEdited', function(newTitle, entryID) {
        collection.update(
          { '_id' : ObjectId ( entryID ) },
          { $set:
           newTitle
          },
          function (err) {
            if (err) throw err;
            console.log(newTitle); // DEBUG
            console.log(entryID); // DEBUG
            socket.emit('saveSuccess', entryID);
          }
        );
      });    
      
      // write content on changes
      socket.on('contentEdited', function(newContent, entryID) {        
        collection.update(
          { '_id' : ObjectId ( entryID ) },
          { $set: 
           newContent
          },
          function (err) {
            if (err) throw err;
            console.log(newContent); // DEBUG
            console.log(entryID) // DEBUG
            socket.emit('saveSuccess', entryID);
          }
        );
      });
      
      // insert new record
      socket.on('newEntry', function(err){
        if (err) throw err;
        var document =  {title:'', content:''}
        collection.insert(document, function(err, entry) {
          if (err) throw err;
          var entryID = entry[0]._id
          console.log("Record added as "+ entryID);
          socket.emit('newEntrySuccess', entryID);
        });
      });
  
      socket.on('removeEntry', function(entryID){
        collection.remove( 
          { '_id': ObjectId ( entryID ) }, 
          function(err){
            if (err) throw err;
            console.log('record deleted: ' + entryID); // DEBUG
            socket.emit('removeEntrySuccess', entryID);
          });
      });
      
      
      socket.on('disconnect', function(){
        console.log('socket.io disconnect event fired') // DEBUG
        //
        // log the disconnect to a global json.. (reasons?, also needs to include user, entryID, time)
        // socket.emit disconnect client code = ur in offline mode / read only
        // fired in all cases when client closed.
        // for reconnect, you have to use the 'connection' event
      })  
      
  
          
    }); // close mongo
  
  }); // close user 'login' socket
  
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











