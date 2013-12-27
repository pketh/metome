// Metome.io Server

// ┬──┬ ◡ﾉ(° -°ﾉ)


// npm
var MongoClient = require('mongodb'),
  ObjectId = require('mongodb').ObjectID,
  express = require('express'),
  app = express(),
  http = require('http'),
  io = require('socket.io').listen(8000),
  fs = require('fs'),
  exec = require('child_process').exec,
  util = require('util').inspect,
  busBoy = require('busboy')
  // --> auth http://www.senchalabs.org/connect/basicAuth.html

// metome modules
  // require('./metome_modules/settings.js')

// configure
io.configure('development', function(){
  io.set('log level', 2) // default is 3 (shows full debug)
})

// start server
app.set('port', process.env.PORT || 3000)
app.use(express.logger('dev'))
app.use(express.static('./public'))

// app.use(express.bodyParser({ // =============================================================
//   keepExtensions: true,
//   uploadDir: './temp',
//   limit: '15mb'
// }))

app.listen(app.get('port'))

// routes




// https://npmjs.org/package/api
// .use(express.router) // http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work


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

// ======================================================================

      app.post('/', function(req, res) {
        console.log('upload going')
        var infiles = 0,
          outfiles = 0,
          done = false,
          busboy = new busBoy({
            headers: req.headers,
            limits: {
              fileSize: 15000000,
              files: 1
            }
          })
        console.log('Start parsing form ...')
        busboy.on('file', function(entryID, file, filename, encoding, mimetype) {
          ++infiles
          onFile(entryID, file, filename, function() {
            ++outfiles
            if (done)
              console.log(outfiles + '/' + infiles + ' parts written to disk')
            if (done && infiles === outfiles) {
              // ACTUAL EXIT CONDITION
              console.log('All parts written to disk')
              res.writeHead(200)
              res.end()
              processFile(filename, entryID)
            }
          })
        })
        busboy.on('end', function() {
          console.log('Done parsing form!')
          done = true
        })
        req.pipe(busboy)
      })

      function onFile(entryID, file, filename, next) {
        var fstream = fs.createWriteStream('./temp/' + filename)
        console.log(entryID + '(' + filename + ') start saving')
        file.pipe(fstream)
        file.on('end', function() {
          console.log(entryID + '(' + filename + ') EOF')
        })
        fstream.on('close', function() {
          console.log(entryID + '(' + filename + ') written to disk . ID ')
          next()
        })
      }

      function processFile (filename, entryID) {
        console.log('im a process that is running for ' + filename + ' with ID ' + entryID)
        // crunch diff sizes S M L (max)
        // move to new user dir / entryID as name
        // write the path to the db (overriting any existing)
        // then delete temp file
      }

// ======================================================================================

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
        // log the disconnect to a global json.. (reasons? flushing scheme/reap?, also needs to include user, entryID, time)
        // socket.emit disconnect client code = ur in offline mode / read only
        // fired in all cases when client closed.
        // for reconnect, you have to use the 'connection' event
      })


    }) // close mongo

  }) // close user 'login' socket

}) // closes socket.io
