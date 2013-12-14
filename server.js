// Metome.io Server

// ┬──┬ ◡ﾉ(° -°ﾉ)


// Node Modules
var MongoClient = require('mongodb'),
  ObjectId = require('mongodb').ObjectID,
  express = require('express'),
  http = require('http'),
  io = require('socket.io').listen(8000),
  fs = require('fs'),
  exec = require('child_process').exec,
  util = require('util');
  // --> auth http://www.senchalabs.org/connect/basicAuth.html
  
// Metome Modules
// var settings
// require('./metome_modules/settings.js')

// Configure
io.configure('development', function(){
  io.set('log level', 2); // default is 3 (shows full debug)
});

// Start server
var app = express();
app.set('port', process.env.PORT || 3000);

app.use(express.logger('dev'));
app.use(express.static(__dirname + './public'));
  // .use(express.router) // http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work
app.listen(app.get('port'));
  // add staticcache/redis http://www.senchalabs.org/connect/staticCache.html




// events
io.sockets.on('connection', function(socket) {
  socket.on('login', function(username){
    var user = username;

    MongoClient.connect('mongodb://localhost/metome', function(err, db) { // make mongo address non-fixed? (hits a replicant on dev , prod on prod)
      if (err) throw err;
      var collection = db.collection(user);
      
      // entries successful emits on connect
      collection.find( {}, { title : 1 } ).sort( { _id: -1 } ).toArray(function(err, titles) {
        if (err) throw err;
        socket.emit('entriesSuccessful', titles);
      });
      
      // load individual entry
      socket.on('entry', function(entryID){
        console.log(entryID);
        collection.findOne({ _id : ObjectId ( entryID ) },function(err,entry) {
          if (err) throw err;
          var entryDate = new Date( (ObjectId(entryID).getTimestamp()) )
          var entryMonth = entryDate.getMonth()
          var entryYear = entryDate.getFullYear()
          // logic for whether the entry has an image or not. nofile or hasfile
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
            console.log(newTitle);
            console.log(entryID);
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
            console.log(newContent);
            console.log(entryID)
            socket.emit('saveSuccess', entryID);
          }
        );
      });
      
      // start file upload
      var files = {}
      socket.on('startSend', function(fileName, fileSize, entryID) {
        console.log('startSend hit')
        files[fileName] = { // create new entry in files {}
          fileSize : fileSize,
          data : '',
          downloaded : 0
        }
        var fileWriting = files[fileName]
        var tempPath = 'temp/' +  entryID + '-' + fileName
        var place = 0 // stores where in the file we are up to

        try{
          var stat = fs.statSync(tempPath);
          if(stat.isFile())
          {
            console.log(files[fileName])
            console.log(fileWriting)
            console.log(fileWriting['downloaded']) // try removing '' in property definitions
            
            fileWriting['downloaded'] = stat.size;
            place = stat.size / 524288; // we're passing data in 1/2 mb increments
            console.log('downloaded: ' + stat.size)
            console.log('new place: ' + place)
          }
        }
        catch(er){} // it's a new file
        fs.open(tempPath, "a", 0755, function(err, fd){
          if(err)
          {
            console.log(err);
          }
          else // requesting
          {
            fileWriting['handler'] = fd; //We store the file handler so we can write to it later
            socket.emit('morePlease', place, entryID, {percent: 0}); // requesting more file pieces
          }
        });
        
        
        socket.on('sendPiece', function(data, fileType, fileName, fileSize, entryID) {
          console.log('sendPiece hit');
          console.log(fileWriting); // December 14, 2013
          
          //
          fileWriting['downloaded'] += data.length;
          fileWriting['data'] += data;
          if(fileWriting['downloaded'] == fileWriting['fileSize']) { //If File is Fully Uploaded
            fs.write(fileWriting['handler'], fileWriting['data'], null, 'Binary', function(err, Writen){
              // process images into S, M, L (ie. entryID-S.png) into real filePath folders(retina).
                // callback for processing complete(? - at least a console msg)
              console.log(Writen);
              console.log('file has been written to temp folder');
              socket.emit('sendSuccessful', entryID);
            });
          }
          else if(fileWriting['data'].length > 10485760){ //If the Data Buffer reaches 10MB
            fs.write(fileWriting['handler'], fileWriting['data'], null, 'Binary', function(err, Writen){
              fileWriting['data'] = ""; //Reset The Buffer
              var place = fileWriting['downloaded'] / 524288;
              var percent = (fileWriting['downloaded'] / fileWriting['fileSize']) * 100;
              socket.emit('MorePlease', place, entryID, percent); // requesting more file pieces
            });
          }
          else { // need more pieces please
            var place = fileWriting['downloaded'] / 524288;
            var percent = (fileWriting['downloaded'] / fileWriting['fileSize']) * 100;
              socket.emit('morePlease', place, entryID, percent); // requesting more file pieces
          }
        
        });

      });
      
      // sendpiece/'upload' event called every time a new block of data is read
      // filereader sends pieces as it reads


// !!!!!!!! implement morePlease ('moreData') on client . December 14, 2013




      // var filePath = __dirname + '/public/uploads/' + user + '/' + name


      
      
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
            console.log('record deleted: ' + entryID);
            socket.emit('removeEntrySuccess', entryID);
          });
      });
      
      socket.on('disconnect', function(){
        console.log('socket.io disconnect event fired')
        //
        // log the disconnect to a global json.. (reasons?, also needs to include user, entryID, time)
        // socket.emit disconnect client code = ur in offline mode / read only
        // fired in all cases when client closed.
        // for reconnect, you have to use the 'connection' event
      })
      
      
    
    }); // close mongo
  
  }); // close user 'login' socket
  
}); // closes socket.io




















































