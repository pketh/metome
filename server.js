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
    
      collection.find( {}, { title : 1 } ).sort( { _id: -1 } ).toArray(function(err, titles) { // query db -> get titles in reverse order by id/cdate -> convert to array -> make titles object [{x,y}, {x,y}]
        if (err) throw err;
        socket.emit('entriesSuccessful', titles)
      });

      // listen for titles request  
      socket.on('entries', function(){   
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
        // make new mongo record in user collection
        // November 14, 2013
        // change doc defaults to span class ph 'text'
        var document =  {title:'', content:''}
        
        collection.insert(document, function(err, entry) {
          if (err) throw err;
          
          console.log("Record added as "+entry[0]._id);
          var entryID = entry[0]._id
          
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


// TODO 
// November 14, 2013
// refactor out functions here (client style)


// BUG p wrapping new line issue - too aggressive with the p's 
// MOVE TO SERVER as part of textfilter 
  // $('.content[contenteditable]').on('keyup', function(event) {
  //   if(event.which == 13) // enter key
  //     console.log('wrap fired'); // DEBUG
  //     $(".content").contents().filter(function() {
  //       return this.nodeType == 3;
  //     }).wrap('<p></p>');
  // });
// Or something more regex-y
//







































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











