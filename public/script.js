














$(document).ready(function () {

// ----------- Entries -------------
      
  var socket = io.connect('http://localhost:8000')
  
  var user = 'pirijan' // TODO - auth

  socket.on('connect', function () { 
    socket.emit('login', user );   
  });

  // ask for all titles
  // *** Revise - tied to routing to route
  $('.titlestemp').on('click', function(){ // Placeholder trigger
    socket.emit('entries'); 
  });
  
  // list entries
  socket.on('entriesSuccessful', function(titles){
    titles.forEach(function(titleIndex) {
      var entryID = titleIndex._id
      $(".entriesList").append('<li data-id = "' + entryID + '">' + titleIndex.title + '</li>');
      // incl something ehre for highlighting previously edited entry id? 
      // if entryID = previous entry id .. then... (means pulling in previously edited id in the socket.on)
    });
  });
  
  // request an entry
  $('.entriesList').on('click', 'li', function(){
    var entryID = $(this).data('id')
    socket.emit('entry', entryID)
    
    // HERE IS WHERE U CLEAR THE ENTRIES LIST? orrrr Update only the changes? ----> on title save... THEN add highlight class for the id that changed on retrigger (means IF at top of entriesSuccessful). incl an if null/else eval too
    
    // !! HERE IS WHERE YOU CLEAR ENTRY CONTENTS. confirmed
    
  });
  
  
// ------------ load Entry --------------

  socket.on('entrySuccessful', function(entry, entryMonthStr, entryYear, entryID){

    // use jquery replaceWith (didnt work) // wipes first instead.. OR trigger wipe on entriesList click
    
    $('.entry').attr('data-id', entryID);
    console.log($('.entry')); // DEBUG 
    
    $('.entry .title h2').append(entry.title);
    $('.entry .content p').append(entry.content);

    $('.entryDate').append(entryMonthStr + ', ' + entryYear);
  })  

// ************* Title ***************
  
  // TODO : add if or switch nesting for don't save on cursor movement
    
  // save Title on keyup
  $('.title[contenteditable]').on('keyup', function(event) {
         
    var newTitle = $('.title h2').html()
    var entryID = $('.entry').data('id')
    socket.emit('titleEdited', { title: newTitle }, entryID); // add entryID to the emit
    
    console.log('Saving... ' + 'title ' + entryID) // DEBUG --> closure // ADD print ENTRY ID
    console.log(newTitle); // DEBUG
  });

  // .title 'enter' acts like 'tab'
  $('.title[contenteditable]').on('keypress', function(event) {
    if(event.which == 13) {
      event.preventDefault();
      $('.content[contenteditable]').focus();
    }
  });


// ************* Content *************
  
  // keyup bug/issue: registering cursor movement as keyup event. (keypress won't work)
  
  // save Content on keyup
  $('.content[contenteditable]').on('keyup', function(event) {
      
      var newContent = $('.content p').html()
      var entryID = $('.entry').data('id')
      
      socket.emit('contentEdited', { content: newContent }, entryID);
      
      console.log('Saving... ' + 'content ' + entryID) // DEBUG --> closure closure // ADD print ENTRY ID
      console.log(newContent) // DEBUG
  });

  
  socket.on('saveSuccess', function(entryID) {
    console.log('Saved ' + entryID) // DEBUG -> also show // + entryID
    // TODO LATER -> PLACEHOLDER do something on the client to show saved (fade in and out of zZz)
    // some kind of time out or delay buffer
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
// assuming all disconnects = errors . 'connection lost' reload 
// 'read only mode'
// client => make all contenteditable uneditable (false)
// })

}); // close domready