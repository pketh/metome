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
  , colors    = require('colors')
  // --> auth http://www.senchalabs.org/connect/basicAuth.html

// metome modules
  // require('./metome_modules/settings.js')

// configure
io.configure('development', function(){
  io.set('log level', 2) // default is 3 (shows full debug)
})

colors.setTheme({
  silly: 'rainbow'
, input: 'grey'
, verbose: 'cyan'
, prompt: 'grey'
, info: 'green'
, data: 'grey'
, help: 'cyan'
, warn: 'yellow'
, debug: 'blue'
, error: 'red'
})
// NPM COLOR THEME CUSTOMIZE (multichainable)
// italic
// underline
// yellow ..
// cyan ..
// white
// magenta -> status:
// green ..
// red
// grey
// blue
// rainbow
// zebra


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

// =====================================================================================================

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
              processFile(entryID, filename, filetype, tempfile)


// 1. clean up folder (cover and cover2x replication)
// 2. move original file .. 1/2 or just copy (somewhere in processfile) and run reap against time in temp and , unrefeced in mongo to do periodic clean ups
// 3. client -> update the list w new thumb
// 4. client -> list updates include thumbnail fetching
// 5. client -> loading entry includes thumbnail


                // cleanup(targetPath, filetype)
                        // remove unused cover images
        // function cleanup(targetPath, filetype) {
        //   // TODO: kill unused old files.
        //   // https://npmjs.org/package/glob
        //   // GLOB
        //   console.log('clean function hit ...')
        // }

                 // add function callback here to move original ?>...
                // move original // --> switch to copy / reap?
                // mv(tempfile, targetPath + '/entryID.', function(err) {
                //   if (err) throw err
                //   console.log('original moved')
                // });
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
          , thumb       = targetPath + '/thumb.png'
          , thumb2x     = targetPath + '/thumb@2x.png'
          , mask        = './public/assets/mask.png'
          , mask2x      = './public/assets/mask@2x.png'
          , cover       = targetPath + '/cover.' + filetype
          , cover2x     = targetPath + '/cover@2x.' + filetype
          , thumbWidth  = 21
          , thumbHeight = 34
          , thumbOffset = 38
          , coverWidth  = 760

        mkdirp(targetPath, function (err) {
          if (err) throw err
          console.log(targetPath + ' pow!')
          // thumb
          gm(tempfile)
            .quality(90)
            .resize(null, thumbOffset)
            .gravity('Center')
            .crop(thumbWidth, thumbHeight)
            .noProfile()
            .write(thumb, function (err) {
              if (err) throw err
              console.log('thumb sized')
              compositeMask(thumb, mask, function(){
                console.log('mask1 done')
              })
            })
          // thumb@2x
          gm(tempfile)
            .quality(90)
            .resize(null, thumbOffset * 2)
            .gravity('Center')
            .crop(thumbWidth * 2, thumbHeight * 2)
            .noProfile()
            .write(thumb2x, function (err) {
              if (err) throw err
              console.log('thumb@2x sized')
              compositeMask(thumb2x, mask2x, function(){
                console.log('mask2x done')
                socket.emit('uploadSuccess', entryID, thumb2x) //
              })
            })
          // cover
          gm(tempfile)
            .resize(coverWidth)
            .noProfile()
            .write(cover, function (err) {
              if (err) throw err
              console.log('cover done')
              pathUpdate(entryID, { cover: cover })
            })
          // cover@2x
          gm(tempfile)
            .resize(coverWidth * 2)
            .noProfile()
            .write(cover2x, function (err) {
              if (err) throw err
              console.log('cover@2x done')
              pathUpdate(entryID, { cover2x: cover2x })
            })
        }) // closes mkdirp

        // mask the thumb
        function compositeMask(thumb, mask, next) {
          var gmComposite = 'gm composite -compose in ' + thumb + ' ' + mask + ' ' + thumb
          exec(gmComposite, function(err) {
            if (err) throw err
            pathUpdate(entryID, { thumb: thumb })
            next()
          })
        }

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
      } // closes processfile

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
