// Metome.io Server

// ┬──┬ ◡ﾉ(° -°ﾉ)


// npm
var mongo     = require('mongodb')
  , ObjectId  = require('mongodb').ObjectID
  , express   = require('express')
  , http      = require('http')
  , io        = require('socket.io').listen(8000)
  , fs        = require('fs')
  , exec      = require('child_process').exec
  , util      = require('util').inspect
  , busBoy    = require('busboy')
  , gm        = require('gm')
  , mkdirp    = require('mkdirp')
  , colors    = require('colors')
  , dive      = require('dive')
  // --> auth http://www.senchalabs.org/connect/basicAuth.html, for express?

// metome modules
  // require('./metome_modules/settings.js')

// configure
io.configure('development', function(){
  io.set('log level', 2) // default is 3 (shows full debug)
})

colors.setTheme({
  silly: 'rainbow'
, info: 'grey'
, help: 'blue'
, status: 'blue'
, warn: 'yellow'
, debug: 'magenta'
, error: 'red'
})

// start server
var app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.logger('dev'))
app.use(express.static('./public'))
app.listen(app.get('port'))


// routes

// https://npmjs.org/package/api
// .use(express.router) // http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work
// relation with history ..


// events
io.sockets.on('connection', function(socket) {
  socket.on('login', function(username){
    var user = username

    mongo.connect('mongodb://localhost/metome', function(err, db) { // update to nodejitsu/mongolab path
      if (err) throw err
      var collection = db.collection(user)

      // entries successful emits on connect
      collection.find( {}, { title : 1, thumb: 1 } ).sort( { _id: -1 } ).toArray(function(err, titles) {
        if (err) throw err
        socket.emit('entriesSuccessful', titles)
      })

      // load individual entry
      socket.on('requestEntry', function(entryID){
        console.log(entryID)
        collection.findOne({ '_id' : new ObjectId ( entryID ) }, function(err,entry) {
          if (err) throw err
          var entryDate  = new Date( (new ObjectId(entryID).getTimestamp()) )
            , entryMonth = entryDate.getMonth()
            , entryYear  = entryDate.getFullYear()
            , cover = new ObjectId(entryID) // /////////////////////////////////// include cover as part of the db query........
          // logic for whether the entry has an image or not. nofile or hasfile ...........................................................
          socket.emit('loadEntry', entry, entryMonth, entryYear, entryID, cover)
        })
      })

      // write title on changes
      socket.on('saveTitle', function(newTitle, entryID) {
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
      socket.on('saveContent', function(newContent, entryID) {
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

// upload tasks start =====================================================================================================

      // receive image
      app.post('/', function(req, res) {
        console.log('upload going')
        var infiles = 0
          , outfiles = 0
          , done = false
          , busboy = new busBoy({
            headers: req.headers,
            limits: {
              fileSize: 15000000,
              files: 1
            }
          })
        busboy.on('file', function(entryID, file, fileName, encoding, mimetype) {
          var fileType = fileName.substr((~-fileName.lastIndexOf('.') >>> 0) + 2)
            , targetPath  = './public/uploads/' + user + '/' + entryID
            , newFile = targetPath + '/' + fileName

          console.log(newFile)

          mkdirp(targetPath, function (err) {
            if (err) throw err
            console.log(targetPath + ' pow!');
            ++infiles

            onFile(file, newFile, function() {
              ++outfiles
              if (done)
                console.log(outfiles + '/' + infiles + ' parts written to disk')
              if (done && infiles === outfiles) {
                console.log('All parts written to disk')

                res.writeHead(200)
                res.end()



                processFile(entryID, fileType, targetPath, newFile)
                cleanDir(targetPath, fileName, fileType)


              }
            })
          })
        })

        busboy.on('end', function() {
          console.log('Done parsing form!')
          done = true
        })
        req.pipe(busboy)
      })

      function onFile(file, newFile, next) {
        var fstream = fs.createWriteStream(newFile)
        console.log(newFile + ' start saving.'.debug)
        file.pipe(fstream)
        console.log('file pipe'.debug)
        file.on('end', function() {
          console.log(newFile + ' EOF')
        })
        fstream.on('close', function() {
          console.log(newFile + ' written to disk')
          next()
        })
      }

      // removes previous uploads
      function cleanDir(targetPath, fileName, fileType){
        dive(targetPath, function(err, file) {
          if (err) throw err
          if (!(file.match(fileName + '|(thumb|cover|@2x)(?=.' + fileType + ')'))) {
            fs.unlink(file)
          }
        })
      }

      // process images
      function processFile(entryID, fileType, targetPath, newFile) {
        console.log('processFile hit'.debug)
        var thumb       = targetPath + '/thumb.png'
          , thumb2x     = targetPath + '/thumb@2x.png'
          , mask        = './public/assets/mask.png'
          , mask2x      = './public/assets/mask@2x.png'
          , cover       = targetPath + '/cover.' + fileType
          , cover2x     = targetPath + '/cover@2x.' + fileType
          , thumbWidth  = 21
          , thumbHeight = 34
          , thumbOffset = 38
          , coverWidth  = 760

        // original
        collection.update(
          { '_id' : new ObjectId ( entryID ) },
          { $set:
           { original: newFile }
          },
          {upsert: true},
          function (err) {
            if (err) throw err
            console.log('original written to db')
          }
        )

        // thumb
        gm(newFile)
          .quality(90)
          .resize(null, thumbOffset)
          .gravity('Center')
          .crop(thumbWidth, thumbHeight)
          .noProfile()
          .write(thumb, function (err) {
            if (err) throw err
            console.log('thumb sized')
            pathUpdate(entryID, { thumb: thumb })
            compositeMask(thumb, mask, function(){
              console.log('thumb-mask1 done')
            })
          })
        // thumb@2x
        gm(newFile)
          .quality(90)
          .resize(null, thumbOffset * 2)
          .gravity('Center')
          .crop(thumbWidth * 2, thumbHeight * 2)
          .noProfile()
          .write(thumb2x, function (err) {
            if (err) throw err
            console.log('thumb@2x sized')
            pathUpdate(entryID, { thumb2x: thumb2x })
            compositeMask(thumb2x, mask2x, function(){
              console.log('thumb-mask2x done')
              thumbSuccess()
            })
          })

        function thumbSuccess() {
          socket.emit('thumbSuccess', entryID, thumb2x)
          console.log('EEEP doing something: ' + entryID + thumb2x.silly)
        }


        // cover
        gm(newFile)
          .resize(coverWidth)
          .noProfile()
          .write(cover, function (err) {
            if (err) throw err
            console.log('cover done')
            pathUpdate(entryID, { cover: cover })
          })
        // cover@2x
        gm(newFile)
          .resize(coverWidth * 2)
          .noProfile()
          .write(cover2x, function (err) {
            if (err) throw err
            console.log('cover@2x done')
            pathUpdate(entryID, { cover2x: cover2x })
          })



        // update db w image paths
        function pathUpdate(entryID, record) {
          collection.update(
            { '_id' : new ObjectId ( entryID ) },
            { $set:
             record
            },
            {upsert: true},
            function (err) {
              if (err) throw err
              console.log(Object.keys(record) + ' updated in db!')
            }
          )
        }

        // mask the thumb
        function compositeMask(thumb, mask, next) {
          var gmComposite = 'gm composite -compose in ' + thumb + ' ' + mask + ' ' + thumb
          exec(gmComposite, function(err) {
            if (err) throw err
            next()
          })
        }

      } // closes processfile

// upload tasks end ======================================================================================

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
