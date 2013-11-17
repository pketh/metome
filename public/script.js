














$(document).ready(function () {

  var socket = io.connect('http://localhost:8000');

  var user = 'pirijan'; // TODO - auth

  socket.on('connect', function () { 
    socket.emit('login', user );  
    socket.emit('entries'); // requesting entry titles
  });

  // list entries
  socket.on('entriesSuccessful', function(titles){
    console.log('entries successfully retrieved');
    titles.forEach(function (titleIndex) {
      if (titleIndex.title === '') {
        $(".entriesList").append('<li data-id = "' + titleIndex._id + '">Blank entry.</li>');
      } else {
        $(".entriesList").append('<li data-id = "' + titleIndex._id + '">' + titleIndex.title+ '</li>');
        // for non blank, simply append what the server gives --> it'll be prefiltered/formatted >>>>>>>>>>>>>>>>>>>>>>>>>>>
      };
    });
  });


  
  // request an entry
  $('.entriesList').on('click', 'li', function(){
    var entryID = $(this).data('id');
    $('.entry').remove(); // should be redundant/useless after routing implemented
    socket.emit('entry', entryID);
  });

  // load the entry based on template (entry.html)
  socket.on('entrySuccessful', function(entry, entryMonthStr, entryYear, entryID){    
    $('.entryContainer').load('entry.html', function() {
      
      printEntry(entry, entryMonthStr, entryYear, entryID);
      
      // title saving
      $('.title[contenteditable]').typing({
        start: function(Event) {
          displaySaving();
        },
        stop: function(event) {
          saveTitle(event, entryID);
        },
        delay: 400
      });
      
      // title: enter acts like tab
      $('.title[contenteditable]').on('keypress', function(event) {
        if(event.which == 13) {
          event.preventDefault();
          $('.content[contenteditable]').focus();
        }
      });
      
      // content: saving
      $('.content[contenteditable]').typing({
        start: function(event) {
          displaySaving();
        },
        stop: function(event) {
          saveContent(event, entryID);
        },
        delay: 400
      });
      
      // remove entry
      $('.remove').on('click', function(){
        socket.emit('removeEntry', entryID);
      });
      
      // done button
      $('.done').on('click', function(entryID) {
        viewEntries(entryID);
      });


    });
    
  }); // close entry

  $('.settings').on('click', function(){
    // 
  });  


  // make new entry
  $('.newEntry').on('click', function(){
    socket.emit('newEntry');
  });

  socket.on('newEntrySuccess', function(entryID){
    $('.entriesList').prepend('<li data-id = "' + entryID + '">Blank entry.</li>');
    console.log('new entry created ' + entryID); // DEBUG
    socket.emit('entry', entryID);
  });

  socket.on('saveSuccess', function(entryID) {
    console.log('Saved ' + entryID); // DEBUG
    displaySaved();  
  });

  socket.on('removeEntrySuccess', function(entryID) {
    entryListRemove(entryID);
    viewEntries(entryID);
  });





  socket.on('disconnect', function(){
    //'connection error' 
    // switch into 'read only mode' contenteditables false
    // "disconnect" is emitted when the socket disconnected    
  });

  socket.on('reconnect_failed', function(){
    // reconnect failed - emitted when socket.io fails to re-establish a working 
  });

  socket.on('reconnecting', function(){
    // reconnecting - is emitted when the socket is attempting to reconnect with the server
  });

  socket.on('reconnect', function(){
    // Q: reconnect fires when connection emits (automatically?)
    // reconnect - emitted when socket.io successfully reconnected to the server
    // on a reconnect event switch contenteditables back to true
  });





// --------------------------------------------------------------------------

function printEntry(entry, entryMonthStr, entryYear, entryID) {
  console.log('fetched entry template')    
  $('.entry').attr('data-id', entryID);
  $('.entry .title').append(entry.title);
  $('.entry .content').append(entry.content);
  $('.status').append('<span>' + entryMonthStr + ', ' + entryYear + '</span>');
  console.log( 'printed entry for ' + entryID); // DEBUG
}


function entryListRemove(entryID) {
  $('.entriesList li[data-id=' + entryID + ']').remove();
  console.log(entryID + ' removed from entries list');
}


function saveTitle(event, entryID) {
  var newTitle = $('.title').html();
  socket.emit('titleEdited', { title: newTitle }, entryID);
  console.log('Saving... ' + 'title ' + entryID); // DEBUG  
  console.log(newTitle); // DEBUG
  
// DO NOW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// November 16, 2013
// find the entry in the titlelist and update it to its latest title
  
}

function saveContent(event, entryID) {
  var newContent = $('.content').html();
  socket.emit('contentEdited', { content: newContent }, entryID);
  console.log(newContent); // DEBUG
  console.log('Saving... ' + 'content: on stop typing ' + entryID); // DEBUG
}


function displaySaving() {
  $('.status span').replaceWith('<span>' + 'Saving...' + '</span>');
}

function displaySaved() {
  $('.status span').replaceWith('<span>' + 'Saved' + '</span>');

// TBD??
// transition back to showing the date .. if yes, based on what rules?
}

// November 16, 2013
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// back to viewing the entries list
function viewEntries(entryID) { // triggered by .done & browser back.

  console.log('verifying that viewEntries has ID: ' + entryID);

  // move the view back to the entries list (do later)
  
  $('.entry').remove();
    
  // if entryID exists && li with entryID exists in .entrieslist : 
// entries .foreach li .removeClass ('updated') 


  // remove all existing .updateds on the li
  // add an .updated css class on the li with the correct data entryid
}


















// TXT FILTERS > MOVE ALL THIS TO SERVER for what's passed to the client for entrieslist >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// title filters DONT change the actual db record

// function formatTitle(titleIndex) {
//   console.log('formatting title ' + titleIndex.title); // checks out
//   var entryID = titleIndex._id;
//   var title = titleIndex.title;

//     dottify(title);
//     capitalize(title);
//     $(".entriesList").append('<li data-id = "' + entryID + '">' + title + '</li>');
//   }
// }
// 
// 
//filter 1:
// function dottify(title) {
//   var lastLetter = title.substring(title.length - 1);
//   if (lastLetter !== '.' and also '?' and also '!' and also '~' ) <- may need to use html codes for these? hopefulyl not.
//) {
//     var dottedTitle = title.concat(title, '.'); // the full title with a .
//   }
// }
// 
//filter 2:
// function capitalize(title) {
//   var firstLetter = title.substring(0,1);
//   var capitalizedTitle = title.replace(firstLetter, firstLetter.toUpperCase());
// }

// CONTENT TXT FILTERS formatting and dotifying not working. this actually changes the db record ==============================> server

// function formatContent() {
  // firstchar check..
  // change to content soap filter on server >>>>>>>>>>>>
// }



}); // close domready



















































