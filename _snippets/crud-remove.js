var MongoClient = require('mongodb').MongoClient;
var mu = require('mu2'); // mustache

// connect to the db
MongoClient.connect('mongodb://localhost/pirijan', function(err, db) {
  if (err) {return console.log(err);}

  // successfull connection actions
  console.log('yay');
  var colletcion = db.collection('test');

  var docs = [{mykey:1}, {mykey:2}, {mykey:3}];

  collection.insert(docs, {w:1}, function(err, result){
    collection.remove({mykey:1});
    // removes doc where mykey = 1. that's all.
    
    collection.remove({mykey:2}, {w:1}, function(err, result) {});
    // removes doc , w:1 => callback on success
    
    collection.remove();
    // nuke all in collection

  }); 
});
