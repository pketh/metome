// Metome.io Client

// (╯°□°）╯︵ ┻━┻

// TODO:
// make node style modules of this with
// https://github.com/bengourley/module.js
// use grunt to concatenate/minify/bring together everythign , w a sourcemap?


/*
*
* Connection
*
*/

$(document).ready(function () {

  var socket = io.connect('http://localhost:8000'),
    user = 'pirijan'; // TODO - auth

  socket.on('connect', function () {
    socket.emit('login', user )
    //
  })


/*
*
* Entries List
*
*/

  // list entries (triggered by connection)
  socket.on('entriesSuccessful', function(titles){
    titles.forEach(function (title) {
      if (title.title === '') {
        $('.entriesList').append(
          '<li data-id = "' + title._id +'">'
            + 'Blank entry.'
          + '</li>'
        )
      } else if (title.thumb) {
        var thumbPath = title.thumb.substring(8)
        $('.entriesList').append(
          '<li data-id = "' + title._id + '">' + title.title
            + '<img class="thumb" src="' + thumbPath + '">'
          + '</li>'
        )
      } else {
        $('.entriesList').append(
          '<li data-id = "' + title._id + '">'
            + title.title
          + '</li>'
        )
      }
    })
  })


/*
*
* Entry
*
*/

  // request an entry
  $('.entriesList').on('click', 'li', function(){
    var entryID = $(this).data('id')
    socket.emit('requestEntry', entryID)
  })

  // load the entry based into .entry
  socket.on('loadEntry', function(entry, entryMonth, entryYear, entryID){
    $('.entryContainer').load('templates/entry.html', function() {
      var months = {
        0:'Jan', 1:'Feb', 2:'Mar', 3:'Apr', 4:'May', 5:'Jun', 6:'Jul', 7:'Aug', 8:'Sep', 9:'Oct', 10:'Nov', 11:'Dec'
      }
        , entryMonthStr = months[entryMonth]
      $('.entry').attr('data-id', entryID)
      $('.entry .title').append(entry.title)
      $('.entry .content').append(entry.content)
      $('.status .date').text(entryMonthStr + ', ' + entryYear)
      $('.content').autosize()
      $('.title').focus()
      if (entry.cover) {
        var coverPath = entry.cover.substring(8)
        $('.cover').removeClass('hidden')
        $('.cover').attr('src', coverPath )
      }
      if (!(window.XMLHttpRequest)) {
        $('.btn-newFile').addClass('hidden')
      }
      $('.cover').on('click', function() {
        $('.cover').toggleClass('cover-out')
      })
      Zoomerang.listen('.cover')

      uploadTasks(entryID)

      // title saving
      $('.title').typing({
        start: function() {
          displaySaving()
        },
        stop: function(event) {
          saveTitle(event, entryID)
        },
        delay: 400
      })

      // title: enter acts like tab
      $('.title').on('keypress', function(event) {
        if(event.which === 13) {
          event.preventDefault()
          $('.content').focus()
        }
      })

      // content: saving
      $('.content').typing({
        start: function() {
          displaySaving()
        },
        stop: function(event) {
          saveContent(event, entryID)
        },
        delay: 400
      })

      // save entry
      function saveTitle(event, entryID) {
          var newTitle = $('.title').val()
            , listItem = $('.entriesList li[data-id=' + entryID + ']')
          socket.emit('saveTitle', { title: newTitle }, entryID)
          console.log('Saving... ' + 'title ' + entryID)
          console.log(newTitle)
          listItem.empty().append(newTitle)
        }

      // save content
      function saveContent(event, entryID) {
          var newContent = $('.content').val()
          socket.emit('saveContent', { content: newContent }, entryID)
          console.log('Saving... ' + newContent + ' entryID ' + entryID)
        }

      // delete button view logic
      $('.delete').on('click', function() {
        $('.delete').addClass('hidden')
        $('.destroyCancel').removeClass('hidden')
      })

      // cancel button view logic
      $('.cancel').on('click', function() {
        $('.delete').removeClass('hidden')
        $('.destroyCancel').addClass('hidden')
      })

      // destroy entry
      $('.destroy').on('click', function(){
        var entryID= $('.entry').attr('data-id')
        console.log('delete triggered for ' + entryID)
        socket.emit('removeEntry', entryID)
      })

      // trigger input on btn click
      $('.btn-newFile').on('click', function () {
        $('input').click()
      })


    })
  })


  // make new entry
  $('.newEntry').on('click', function(){
    socket.emit('newEntry')
  })
  socket.on('newEntrySuccess', function(entryID){
    $('.entriesList').prepend('<li data-id = "' + entryID + '">Blank entry.</li>')
    console.log('new entry created ' + entryID)
    socket.emit('entry', entryID)
  })

  // showing successful save
  socket.on('saveSuccess', function(entryID) {
    console.log('Saved ' + entryID)
    displaySaved()
  })

  // when entry sucessfully removed
  socket.on('removeEntrySuccess', function(entryID) {
    entryListRemove(entryID)
    viewEntries(entryID) // --> replace with updateList(entryID)?
  })

  function entryListRemove(entryID) {
    var listItem = $('.entriesList li[data-id=' + entryID + ']')
    listItem.remove()
    console.log(entryID + ' removed from entries list')
  }

  // back to viewing the entries list
  function viewEntries(entryID) { // triggered by browser back. or deleting an entry
    console.log('verifying that viewEntries has ID: ' + entryID)
    // DO LATER: move the view back to the entries list w history
    $('.entry').remove()
  }

  function displaySaving() {
    $('.status .date').addClass('hidden')
    $('.status .saving').removeClass('hidden')
    $('.status .saved').addClass('hidden')
  }

  function displaySaved() {
    $('.status .saved').removeClass('hidden')
    $('.status .saving').addClass('hidden')
  }


/*
*
* Image upload tasks
*
*/

  function uploadTasks(entryID) {
    $('input').change(function(event) {
      event.preventDefault()
      var file = this.files[0]
        , fileName = file.name
        , fileSize = file.size
        , fileSizeLimit = 15000000

      if (fileSize <= fileSizeLimit) {
        renderPreview(file)
        var formData = new FormData()
          , xhr = new XMLHttpRequest()
        formData.append(entryID, file)
        xhr.open('post', '/', true, user)
        xhr.upload.onprogress = function(event) {
          var percent = (event.loaded / event.total) * 100
          progressUpdate(percent)
        }
        xhr.onerror = function() {
          console.log('xhr error')
        }
        xhr.onload = function() {
          uploadSuccessful()
        }
        xhr.send(formData);

      } else {
        renderTooBig()
      }
    })
  }

  function renderPreview(file) {
    var windowURL = window.URL || window.webkitURL
      , blobURL = windowURL.createObjectURL(file)
    $('.status .date').addClass('hidden')
    $('.status .savetext').addClass('hidden')
    $('.status .sendfile').removeClass('hidden')
    $('.cover').removeClass('hidden')
    $('.cover').removeClass('hidden')
    $('.btn-newFile').addClass('btn-replaceFile')
    $('.fileSizeError').addClass('hidden')
    $('.cover').attr('src', blobURL )
  }

  function renderTooBig() {
    $('.cover').addClass('hidden')
    $('.fileSizeError').removeClass('hidden')
  }

  function progressUpdate(percent) {
    $('.sendfile .progress').val(percent).text(percent + '%')
  }

  function uploadSuccessful() {
    $('.status .sendfile').addClass('hidden')
    $('.status .savetext').removeClass('hidden')
    $('.status .saved').removeClass('hidden')
    $('.sendfile .progress').val(0).text('0%')
  }

  socket.on('thumbSuccess', function(entryID, thumb2x) {
    console.log('BEEEP thumb2x gm processed on server!')
    console.log('upload list with : ' + entryID + thumb2x)
    // update the list with the new thumb next to the entryid list on save --------------------------------------------------------,,,,,,,,,
    // var listItem = $('.entriesList li[data-id=' + entryID + ']')
    // listItem.empty().append(newTitle) <-- how txt does it
  })


/*
*
* Settings
*
*/

  // settings view
  $('.settings').on('click', function(){
    console.log('settings clicked')
  })


/*
*
* Offline support
*
*/

  socket.on('disconnect', function(){
    console.log('disconnected')
    //'connection error'
    // switch into 'read only mode' = no text area editing / diff styling (greyed out a bit)
    // "disconnect" is emitted when the socket disconnected
    // http://stackoverflow.com/questions/3297923/make-textarea-readonly-with-jquery
  })

  socket.on('reconnecting', function(){
    console.log('reconnecting')
    // reconnecting - is emitted when the socket is attempting to reconnect with the server
  })

  socket.on('reconnect_failed', function(){
    console.log('reconnect failed')
    // reconnect failed - emitted when socket.io fails to re-establish a working
  })

  socket.on('reconnect', function(){
    console.log('reconnected')
    // Q: reconnect fires when connection emits (automatically?)
    // reconnect - emitted when socket.io successfully reconnected to the server
    // on a reconnect event switch contenteditables back to true
    // make sure the list doesn't append again to replicate on top of existing
  })


})
