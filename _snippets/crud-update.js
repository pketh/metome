var MongoClient = require('mongodb').MongoClient;

// connect to the db
MongoClient.connect('mongodb://localhost/pirijan', function(err, db) {
  if (err) {return console.log(err);}
  
  // successfull connection actions
  console.log('yay');
  var collection = db.collection('test');
  
  var doc = { mykey:1, fieldtoupdate:1 };

  collection.insert(doc, {w:1}, function(err, result){
    collection.update({mykey:1}, {$set:{fieldtoupdate:2}}, {w:1}, function(err, result){});
    // update {what}, {set}, {write correctly returns result=1}, callback funcs {then do}
  }); 
  

  var doc2 = { mykey:2, docs:[{doc1:1}] };
  collection.insert(doc2, {w:1}, function(err, result) {
    collection.update({mykey:1}, {$push:{docs:{docs2:1}}}, {w:1}, function(err, result) {
      // update {what} {push onto array} {w = result 1}, callback funcs    
    });
  }); 
});
