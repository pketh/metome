// Metome.io Server

// ┬──┬ ◡ﾉ(° -°ﾉ)


// Modules
var MongoClient = require('mongodb'),
  ObjectId = require('mongodb').ObjectID,
  express = require('express'),
  http = require('http'),
  io = require('socket.io').listen(8000),
  fs = require('fs'),
  siofu = require('socketio-file-upload');
  // --> auth http://www.senchalabs.org/connect/basicAuth.html

// Configure
io.configure('development', function(){
  io.set('log level', 2); // default is 3 (shows full debug)
});

// Start server
var app = express();
app.set('port', process.env.PORT || 3000);

app.use(express.logger('dev'));
app.use(express.static(__dirname + '/public'));
  // .use(express.router) // http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work
  // .use(express.multipart({ uploadDir: __dirname + '/public/uploads/' })) // http://www.senchalabs.org/connect/multipart.html
app.listen(app.get('port'));
  // add staticcache/redis http://www.senchalabs.org/connect/staticCache.html




// events
io.sockets.on('connection', function(socket) {
  socket.on('login', function(username){
    var user = username;
    
    var uploader = new siofu();
    uploader.dir = __dirname + '/public/uploads/' + user + '/'
    uploader.listen(socket);
    
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
      
      // socket.on('initSendFile', function(){
      //   // replace the old upload associated with the entry id
      //   console.log('initSendFile hit!')
      // })
      
      var uploadPath = __dirname + '/public/uploads/' + user + '/'
      
      
      
      uploader.on('progress', function(event){
        console.log('progress') // event.buffer
      });
      
      uploader.on('saved', function(event){
        console.log('file saved')
        // console.log(event.file);
        // here's where I convert stuff and save S , M , L to db
      });
      
      uploader.on('complete', function(event){
        console.log('file transmission complete')
      });
      
      uploader.on('error', function(event){
        console.log('error from siofu uploader', event);
      });


      // socket.on('sendFile', function(dataURI, fileType, fileName, fileSize, entryID) {
      //
      //   // adapted from http://net.tutsplus.com/tutorials/javascript-ajax/how-to-create-a-resumable-video-uploade-in-node-js/
      //   console.log(dataURI + '\n');
      //   console.log('Total file size is ' + fileSize + ' bytes\n');
      //   console.log('File type is ' + fileType + '\n');
      //   var newFilePath = __dirname + '/public/uploads/' + user + '/' + entryID + '.' + fileType
      //   console.log(newFilePath + '\n');
      //
      //
      //   var src = data uri stripped of front stuff;
      //   console.log(src)
      //
      //   fs.writeFile(newFilePath, src, function (err) {
      //     if (err) throw err;
      //     console.log('It\'s saved! ' + entryID + '.' + fileType + '\n');
      //     socket.emit('sendFileSuccess', entryID + '\n');
      //   });
        
        
        // fs.writeFile(tempFile, src, "binary", function(err) {
        //   if(err) {
        //     console.log(err);
        //   } else {
        //     console.log("The file was saved!");
        //     socket.emit('sendFileSuccess', entryID);
        //   }
        // });

        // with siofu
        


        // - emit upload progress (with entryID) (0.0 -> 1.0) - http://stackoverflow.com/questions/14454193/is-it-possible-to-show-actual-progress-from-async-method-in-node-js
        // - read and write the file to tmp path (755) - fs read + writestream
        // [X] file type validation (are these real images? https://github.com/ctavan/express-validator ?)
        // - make resized version, and thumb version - https://github.com/thomaspeklak/express-upload-resizer
        // - save both versions to specific folders w names
        // - add the path(s) to db collection update w entry ID
        // - delete original upload from path
        // - emit sendFileSuccess with entryID, and new paths to client
        

        //path to store uploaded files (NOTE: presumed you have created the folders -> create user folder on new acct creation)
        // console.log('proposed ' + fileName)
        // fs.exists('tempFile', function () {
        //   console.log('entryId.png etc already exists. Delete it.');
        // });
        
        // open file for appending (file is created if not exist). 0755 = permissions mode (user can write, everyone can read)
        // fd param = file descriptor = indicator for accessing a file (0=standard input(stdin), 1=stdout, 2=stderr(errror).
        // Next, we open the file using open(). The r argument denotes that the file is being opened for reading. The open() callback function provides a file descriptor, fd for accessing the newly opened file. Inside the callback function, we define a buffer to hold the file’s contents. Notice that the buffer is initialized to the file’s size, which is stored in stats.size. Next, the file is read into the buffer using the read() function. The buffer now contains the raw data read from the file. In order to display the data, we must first convert it to a UTF-8 encoded string. Finally, the file contents are printed to the console, and the file is closed. http://www.sitepoint.com/accessing-the-file-system-in-node-js/
        // fs.open(fileName, 'a', 0755, function(err, fd) {
          // if (err) throw err;
          // fs write = Write buffer to the file specified by fd.
          // null = offset from the beginning of file. nulls means the data will be written at current posn
          // in the callback : written = progress from buffer.
        // });
        
        // setTimeout(500) .. to simulate lag
        // http://stackoverflow.com/questions/14788898/save-a-image-using-nodejs-expressjs-and-socket-io
      // });
      
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









































// I THINK : this whole make a json file thing is only useful for API calls ...
// and backup prep, and offline manifest prep (txt only for offline from scratch mode)
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











