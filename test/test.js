const _ = require('lodash');


const mongoModule = require('.././mongo.js');


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
  id: 22,
  person: "jesss"
};

let options = {
  url: 'mongodb://localhost',
  collection: 'default-collection',
  indexes: [],
  db: dbName
};

before(() => {
  db = mongoModule(options);
});

describe('db operations', () => {

  describe('inserting one document', () => {

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

      db.upsert({
        id: testDocument.id,
        person: "davey"
      })
        .then(() => {
          return db.getById(testDocument.id);
        })
        .then(result => {
          assert.equal(result.person, "davey");
        })
        .then(() => {
          return db.count()
        })
        .then(count => {
          assert.equal(count, 1);
          return db.upsert(testDocument);
        })
        .then(() => {

          done()
        })
        .catch(done)
    });

  });

  describe('second collection', () => {
    let db2;
    let db;

    before((done) => {
      dropDB()
        .then(() => {

          db = new mongoModule({
            url: 'mongodb://localhost',
            collection: 'collection1',
            indexes: [],
            db: dbName
          });

          db2 = new mongoModule({
            url: 'mongodb://localhost',
            collection: 'collection2',
            indexes: [],
            db: dbName
          });
          done();
        });
    });

    it('should insert new record into new collection', (done) => {
      let err;

      db.upsert({
        id: 22,
        person: "tuck"
      })
        .then(() => {
          return db2.upsert({
            id: 33,
            person: "cal"
          });
        })
        .then(() => {
          return db.get();
        })
        .then(results => {
          console.log('collection1', results);
          assert.equal(_.size(results), 1);
        })
        .then(() => {
          return  db2.get();
        })
        .then(results => {
          console.log('collection2', results);
          assert.equal(_.size(results), 1);
        })
        .catch(e => {
          err = e;
          return Promise.resolve();
        })
        .then(() => {
          return dropDB();
        })
        .then(() => {
          done(err)
        });
    });
  })

});

after((done) => {

  dropDB()
    .then(() => {
      done()
    });
});

function dropDB() {

  return require('mongodb').MongoClient.connect(options.url, {useNewUrlParser: true})
    .then(mongoConnection => {
      return mongoConnection.db(options.db).dropDatabase();
    })

}