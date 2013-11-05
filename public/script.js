$(document).ready(function () {
  $('.title').on('click', function() {
    alert('hi')
  });
    
  // issue with keyup (to keypress) is it registers arrow keys (only want to register new or deleted chars - i.e. changes to doc)
  $('.child').on('keyup', function() {
    alert('content change')
  });
  
  var socket = io.connect('http://localhost:8000');

  // detect content changes and emit to server
  $('[contenteditable]').on('keypress', function() {
    newValue = $('.content').html()
    // console.log(newValue)
    socket.emit('contentEdited', { content: newValue }); 
  });
// how to id this?.. what if multiple forms?
});

// fetch json entry data from server
// !!!!!! insert this $getjson into socket.on event below..

$.getJSON('json/artists.json', function(artistsdata) {
  var title = artistsdata.name
  var content = artistsdata.summary

  $('.editable .title h2').append(title);
  $('.editable .content p').append(content);

});






// SOCKET.IO

// make the backend connection

// on some event , run the callback
// socket.on('event', function (data) {
//   var delta = $('.content').val()
//   console.log(delta);  
//   // send a message back to the server .
//   // 1. what the server is listening for (server socket .on)
//   // 2. data to send with msg
//   socket.emit('some event', { some: 'data' });
// });

// socket.on('disconnect', function() {
//   // let users know somethign bad happened 'connection error' 
// })