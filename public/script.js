$(document).ready(function () {
  $('.title').on('click', function() {
    alert('hi')
  });
  
  $('.editable').on('click', function() {
      alert('title change')
  });
  
  $('.child').on('keyup', function() {
    alert('content change')
  });
  
  // $('body').on('focus', '[contenteditable]', function() {
  //   var $this = $(this);
  //       $this.data('before', $this.html());
  //       return $this;
  // }).on('blur keyup paste', '[contenteditable]', function() {
  //     var $this = $(this);
  //     if ($this.data('before') !== $this.html()) {
  //         $this.data('before', $this.html());
  //         $this.trigger('change');
  //     }
  //     return $this;
  // });
  
  $('.editable').on('click', function() {
    alert('content change')
  });

  
}); //close doc ready

var socket = io.connect('http://localhost:8000');
socket.on('news', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});
