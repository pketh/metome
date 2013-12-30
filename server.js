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
  , mv        = require('mv')
  , mkdirp    = require('mkdirp')
  , glob      = require('glob')
  // --> auth http://www.senchalabs.org/connect/basicAuth.html

// metome modules
  // require('./metome_modules/settings.js')

// configure
io.configure('development', function(){
  io.set('log level', 2) // default is 3 (shows full debug)
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


// events
io.sockets.on('connection', function(socket) {
  socket.on('login', function(username){
    var user = username

    mongo.connect('mongodb://localhost/metome', function(err, db) { // update to nodejitsu/mongolab path
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
          var entryDate  = new Date( (new ObjectId(entryID).getTimestamp()) )
            , entryMonth = entryDate.getMonth()
            , entryYear  = entryDate.getFullYear()
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

      // receive image
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
          var filetype = filename.substr((~-filename.lastIndexOf('.') >>> 0) + 2) // http://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript
          , tempfile = './temp/' + filename
          onFile(file, tempfile, function() {
            ++outfiles
            if (done)
              console.log(outfiles + '/' + infiles + ' parts written to disk')
            if (done && infiles === outfiles) {
              console.log('All parts written to disk')
              res.writeHead(200)
              res.end()
              processFile(entryID, filename, filetype, tempfile, function() {
                console.log('move original hit')
                 // add function callback                                                          here to move original ?>...
                // move original
                // mv(tempfile, targetPath + '/entryID.', function(err) {
                //   if (err) throw err
                //   console.log('original moved')
                // });
              })
            }
          })
        })
        busboy.on('end', function() {
          console.log('Done parsing form!')
          done = true
        })
        req.pipe(busboy)
      })

      function onFile(file, tempfile, next) {
        var fstream = fs.createWriteStream(tempfile)
        console.log(tempfile + ' start saving.')
        file.pipe(fstream)
        file.on('end', function() {
          console.log(tempfile + ' EOF')
        })
        fstream.on('close', function() {
          console.log(tempfile + ' written to disk')
          next()
        })
      }

      // process images
      function processFile(entryID, filename, filetype, tempfile) {
        var targetPath  = './public/uploads/' + user + '/' + entryID
          , thumb   = targetPath + '/thumb.' + filetype
          , thumb2x = targetPath + '/thumb@2x.' + filetype
          , cover   = targetPath + '/cover.' + filetype
          , cover2x = targetPath + '/cover@2x.' + filetype
          , thumbHeight = 34
          , thumbWidth = 21
          , thumbOffset = 38
          , coverWidth = 760
          , imageMagick = gm.subClass({ imageMagick: true }) // may not be necessary
        mkdirp(targetPath, function (err) {
          if (err) throw err
          console.log(targetPath + ' pow!')


          // thumb
          gm(tempfile)
            .quality(90)
            .resize(null, thumbOffset)
            .gravity('Center')
            .crop(thumbWidth, thumbHeight)
            .mask('./public/assets/mask.png') // LATER: masks don't run http://stackoverflow.com/questions/20828951/graphicsmagick-for-node-not-masking
            // what gm mask does: supplied png protects pixels from subsequent alteration if additional processing / drawing is performed on the image.
            // how it works: the protected pixels are copied to a temp buffer, and then applied back to the final image .
            // .drawRectangle() // .. override but then the image is non-transparent
            .clip()
            .write(thumb, function (err) {
              if (err) throw err
              console.log('thumb done')
              pathUpdate(entryID, { thumb: thumb })
            })
          // thumb@2x
          gm(tempfile)
            .quality(90)
            .resize(null, thumbOffset * 2)
            .gravity('Center')
            .crop(thumbWidth * 2, thumbHeight * 2)
            .mask('./public/assets/mask@2x.png') //
            .write(thumb2x, function (err) {
              if (err) throw err
              console.log('thumb@2x done')
              pathUpdate(entryID, { thumb2x: thumb2x }, function(err) {
                if (err) throw err
                console.log('ready to update entrylist w thumb2x ...')
                // TODO: update entry list name w new thumb , EMIT and cient.js to update the list.
                // draw updates are retina by default. loads will be specific
              })
            })
          // cover
          // TODO make these a bit wider in order to do a Medium style lightbox zoom
          gm(tempfile)
            .resize(coverWidth)
            .write(cover, function (err) {
              if (err) throw err
              console.log('cover done')
              pathUpdate(entryID, { cover: cover })
            })
          // cover@2x
          gm(tempfile)
            .resize(coverWidth * 2)
            .write(cover2x, function (err) {
              if (err) throw err
              console.log('cover@2x done')
              pathUpdate(entryID, { cover2x: cover2x })
            })

          cleanup(targetPath, filetype)

        })

        // update db
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

        // remove unused cover images
        function cleanup(targetPath, filetype) {
          // TODO: kill unused old files.
          // https://npmjs.org/package/glob
          // GLOB
          console.log('clean function hit ...')
        }




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
