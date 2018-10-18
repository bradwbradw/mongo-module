let db = require('./mongo.js')({});


db.upsert({
  id:22,
  person:"jesss"
});