// Metome.io Server





var MongoClient = require('mongodb'),
  ObjectId = require('mongodb').ObjectID,
  express = require('express'),
  http = require('http'),
  io = require('socket.io').listen(8000),
  fs = require('fs'),
  inspect = require('util').inspect,
  Busboy = require('busboy');

  // --> npm install lean mean router here ..
  // --> auth

io.configure('development', function(){
  io.set('log level', 2); // default is 3 (shows full debug)
});

var app = express()
  .use(express.logger('dev'))
  
  .post('/uploads', function(req, res){
    var infiles = 0, outfiles = 0, done = false,
        busboy = new Busboy({ headers: req.headers });
    console.log('Start parsing form ...');
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      ++infiles;
      onFile(fieldname, file, filename, function() {
        ++outfiles;
        if (done)
          console.log(outfiles + '/' + infiles + ' parts written to disk');
        if (done && infiles === outfiles) {
          // ACTUAL EXIT CONDITION
          console.log('All parts written to disk');
          res.writeHead(200, { 'Connection': 'close' });
          res.end("That's all folks!");
        }
      });
    });
    busboy.on('end', function() {
      console.log('Done parsing form!');
      done = true;
    });
    req.pipe(busboy);
  })

  .use(express.static(__dirname + '/public'))
  
  .listen(3000);

function onFile(fieldname, file, filename, next) {
  // or save at some other location
  var writeStream = fs.createWriteStream(__dirname + '/public/uploads/'); // change os.tmpDir ... or move and flush after
  file.on('end', function() {
    console.log(fieldname + '(' + filename + ') EOF');
  });
  writeStream.on('close', function() {
    console.log(fieldname + '(' + filename + ') written to disk');
    next();
  });
  console.log(fieldname + '(' + filename + ') start saving');  
  // This pipes the POST data to the file
  file.pipe(writeStream);
}


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











