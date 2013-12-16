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
  util = require('util')
  // --> auth http://www.senchalabs.org/connect/basicAuth.html
  
// Metome Modules
// var settings
// require('./metome_modules/settings.js')

// Configure
io.configure('development', function(){
  io.set('log level', 2) // default is 3 (shows full debug)
})

// Start server
var app = express()
app.set('port', process.env.PORT || 3000)

app.use(express.logger('dev'))
app.use(express.static('./public'))
  // .use(express.router) // http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work
app.listen(app.get('port'))
  // add staticcache/redis http://www.senchalabs.org/connect/staticCache.html




// events
io.sockets.on('connection', function(socket) {
  socket.on('login', function(username){
    var user = username

    MongoClient.connect('mongodb://localhost/metome', function(err, db) { // make mongo address non-fixed? (hits a replicant on dev , prod on prod)
      if (err) throw err
      var collection = db.collection(user)
      
      // entries successful emits on connect
      collection.find( {}, { title : 1 } ).sort( { _id: -1 } ).toArray(function(err, titles) {
        if (err) throw err
        socket.emit('entriesSuccessful', titles)
      })
      
      // load individual entry
      socket.on('entry', function(entryID){
        console.log(entryID)
        collection.findOne({ _id : ObjectId ( entryID ) },function(err,entry) {
          if (err) throw err
          var entryDate = new Date( (ObjectId(entryID).getTimestamp()) )
          var entryMonth = entryDate.getMonth()
          var entryYear = entryDate.getFullYear()
          // logic for whether the entry has an image or not. nofile or hasfile
          socket.emit('entrySuccessful', entry, entryMonth, entryYear, entryID)
        })
      })
      
      // write title on changes
      socket.on('titleEdited', function(newTitle, entryID) {
        collection.update(
          { '_id' : ObjectId ( entryID ) },
          { $set:
           newTitle
          },
          function (err) {
            if (err) throw err
            console.log(newTitle)
            console.log(entryID)
            socket.emit('saveSuccess', entryID)
          }
        )
      })

      // write content on changes
      socket.on('contentEdited', function(newContent, entryID) {
        collection.update(
          { '_id' : ObjectId ( entryID ) },
          { $set:
           newContent
          },
          function (err) {
            if (err) throw err;
            console.log(newContent)
            console.log(entryID)
            socket.emit('saveSuccess', entryID)
          }
        )
      })


// ----------------------------------------------------------


      // start file upload
      socket.on('startSend', function(fileName, fileSize, entryID) {
        var chunkSize = 262144 // ~.256kb
        console.log('\n \n$ startSend hit for ' + fileName)
        var fileWriting = { // create new entry in files {}
          fileName : fileName,
          fileSize : fileSize,
          data : '',
          downloaded : 0,
          place : 0,
          percent : 0
        }
        var place = fileWriting.place
        var percent = fileWriting.percent
        var tempPath = 'temp/' +  entryID + '-' + fileName

        fs.open(tempPath, "a", 0755, function(err, fd){
          if (err) throw err
          console.log('NEW FILE: ' + fileName + ' ' + percent + '% at place ' + place)
          fileWriting['handler'] = fd // store the file handler to fs.write to later
          socket.emit('moreChunks', place, entryID, percent, fileName)
          console.log('+1 NEW FILE moreChunks: ' + fileName + ' chunks needed at place ' + place + ' and percent ' + percent) // ISSUE
        })

        // processing the file pieces from client
        socket.on('sendChunk', function(data, fileName, fileSize, entryID) {
          console.log('- sendChunk hit for ' + fileName) // ISSUE asks for previous/complete and new here
          fileWriting['downloaded'] += data.length
          fileWriting['data'] += data


          if (fileWriting['downloaded'] == fileWriting['fileSize']) { // file is fully uploaded (downloaded = filesize)
            fs.write(fileWriting['handler'], fileWriting['data'], null, 'Binary', function(err, Writen){ // write buffer to the file
              console.log('SUCCESS: ' + fileName)
              // later: process images into S, M, L (ie. entryID-S.png) into real filePath folders(retina). filePath = './public/uploads/' + user + '/' + name
              socket.emit('sendSuccessful', entryID)
            })
          }

          else if (fileWriting['data'].length > 10485760){ //If the Data Buffer reaches 10MB
            fs.write(fileWriting['handler'], fileWriting['data'], null, 'Binary', function(err, Writen){
              fileWriting['data'] = ""; //Reset The Buffer
              var place = fileWriting['downloaded'] / chunkSize
              var percent = (fileWriting['downloaded'] / fileWriting['fileSize']) * 100
              socket.emit('moreChunks', place, entryID, percent, fileName)
            })
          }

          else { // need more chunks please // 2nd file hits need chunks even if it's less than 256kb
            var place = fileWriting['downloaded'] / chunkSize
            console.log('+ moreChunks: ' + fileName + ' chunks needed at place ' + place + ' and percent ' + percent) // ISSUE asks for previous/complete and new here
            var percent = (fileWriting['downloaded'] / fileWriting['fileSize']) * 100
              socket.emit('moreChunks', place, entryID, percent, fileName) // requesting more file pieces
          }
        })
      }) // close startSend


// ----------------------------------------------------------




      // insert new record
      socket.on('newEntry', function(err){
        if (err) throw err
        var document =  {title:'', content:''}
        collection.insert(document, function(err, entry) {
          if (err) throw err
          var entryID = entry[0]._id
          console.log("Record added as "+ entryID)
          socket.emit('newEntrySuccess', entryID)
        })
      })
      
      socket.on('removeEntry', function(entryID){
        collection.remove(
          { '_id': ObjectId ( entryID ) },
          function(err){
            if (err) throw err;
            console.log('record deleted: ' + entryID)
            socket.emit('removeEntrySuccess', entryID)
          })
      })
      
      socket.on('disconnect', function(){
        console.log('socket.io disconnect event fired')
        //
        // log the disconnect to a global json.. (reasons?, also needs to include user, entryID, time)
        // socket.emit disconnect client code = ur in offline mode / read only
        // fired in all cases when client closed.
        // for reconnect, you have to use the 'connection' event
      })
      
      
    
    }) // close mongo
  
  }) // close user 'login' socket
  
}) // closes socket.io




















































