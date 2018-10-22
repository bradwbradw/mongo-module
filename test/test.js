let assert = require('assert');
/*

let


db.upsert({
  id:22,
  person:"jesss"
});

*/

let db;
let dbName = 'test-db';

let testDocument = {
  id:22,
  person:"jesss"
};

let options = {
  url: 'mongodb://localhost',
  collection: 'default-collection',
  indexes:[],
  db:dbName
};

before(() => {
  db = require('.././mongo.js')(options);
});

describe('db operations', function() {

  describe('inserting one document', function() {

    before(done => {

      db.upsert(testDocument).then(() => done())
    });

    it('should have been inserted', done => {
      db.getById(testDocument.id)
        .then(result => {
          assert.equal(result.person, testDocument.person);
          done()
        })
        .catch(done)
    });

    it('upsert should update the doc', done => {

      db.upsert({id:testDocument.id, person: "davey"})
        .then(()=>{
          return db.getById(testDocument.id);
        })
        .then(result => {
          assert.equal(result.person, "davey");
        })
        .then(()=>{
          return db.count()
        })
        .then(count => {
          assert.equal(count, 1);
          return db.upsert(testDocument);
        })
        .then(()=>{

          done()
        })
        .catch(done)
    });

  });

});

after((done) =>  {
  // runs after all tests in this block
  let MongoClient = require('mongodb').MongoClient;

  MongoClient.connect(options.url, {useNewUrlParser:true })
    .then(mongoConnection => {
      return mongoConnection.db(options.db).dropDatabase();
    })
    .then(() => {
      done()
    });
});