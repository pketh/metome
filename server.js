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
app.use(express.bodyParser({
  keepExtensions: true,
  uploadDir: './temp',
  limit: '15mb'
}))
app.use(express.methodOverride())
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
        collection.findOne({ '_id' : new ObjectId ( entryID ) }, function(err,entry) {
          if (err) throw err
          var entryDate = new Date( (new ObjectId(entryID).getTimestamp()) )
          var entryMonth = entryDate.getMonth()
          var entryYear = entryDate.getFullYear()
          // logic for whether the entry has an image or not. nofile or hasfile
          socket.emit('entrySuccessful', entry, entryMonth, entryYear, entryID)
        })
      })

      // write title on changes
      socket.on('titleEdited', function(newTitle, entryID) {
        collection.update(
          { '_id' : new ObjectId ( entryID ) },
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
          { '_id' : new ObjectId ( entryID ) },
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


      app.post('/', function(req, res) {
        console.log('upload success!')
        console.log(req.files);
        res.end();
      });


      // insert new record
      socket.on('newEntry', function(err){
        if (err) throw err
        var document =  {title:'', content:''}
        collection.insert(document, function(err, entry) {
          if (err) throw err
          var entryID = entry[0]._id
          console.log('Record added as ' + entryID)
          socket.emit('newEntrySuccess', entryID)
        })
      })

      socket.on('removeEntry', function(entryID){
        collection.remove(
          { '_id': new ObjectId ( entryID ) },
          function(err){
            if (err) throw err;
            console.log('record deleted: ' + entryID)
            socket.emit('removeEntrySuccess', entryID)
          })
      })

      socket.on('disconnect', function(){
        console.log('socket.io disconnect event fired')
        //
        // log the disconnect to a global json.. (reasons? flushing scheme/reap?, also needs to include user, entryID, time)
        // socket.emit disconnect client code = ur in offline mode / read only
        // fired in all cases when client closed.
        // for reconnect, you have to use the 'connection' event
      })


    }) // close mongo

  }) // close user 'login' socket

}) // closes socket.io
