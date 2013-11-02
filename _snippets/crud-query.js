var MongoClient = require('mongodb').MongoClient;
// var mu = require('mu2'); 

// connect to the db
MongoClient.connect('mongodb://localhost/pirijan', function(err, db) {
  if (err) {return console.log(err);}

  // successfull connection actions
  console.log('yay');
  var collection = db.collection('test');

  var docs = [{mykey:1}, {mykey:2}, {mykey:3}];

  collection.insert(docs, {w:1}, function(err, result){
    
    collection.find().toArray(function(err, items){});
    // finds all in collection, returns as array
    
    var stream = collection.find({mykey:{$ne:2}}).stream(); // can add sorting
    // finds all keys, so long as keys still exist/true, steam events
    stream.on('date', function(item) {});
    stream.on('end', function() {});
    
    collection.findOne({mykey:1}, function(err, item) {});
    // retrieve just one specific object
    
  });
});
