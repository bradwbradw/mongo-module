const _ = require('lodash');
const when = require('when');

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
  console.log("set up test db ", options);
  db = mongoModule(options);
});

function newCollectionForTesting(name) {
  return mongoModule(_.extend(_.cloneDeep(options)), {
    collection: name || _.random(0, 1000000000)
  })
}

describe('db operations', () => {

  describe('inserting one document', () => {

    before(done => {
      console.log("inserting test tocument", testDocument);
      db.upsert([testDocument]).then(() => done())
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

      db.upsert([{
        id: testDocument.id,
        person: "davey"
      }])
        .then(() => {
          debugger;
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
          return db.upsert([testDocument]);
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

      db.upsert([{
        id: 22,
        person: "tuck"
      }])
        .then(() => {
          return db2.upsert([{
            id: 33,
            person: "cal"
          }]);
        })
        .then(() => {
          return db.get();
        })
        .then(results => {
          console.log('collection1', results);
          assert.equal(_.size(results), 1);
        })
        .then(() => {
          return db2.get();
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

    it('should do bulk upsert', (done) => {

      let db = newCollectionForTesting();

      when.all([
        db.upsert([{
          id: 12,
          name: 'fred'
        }]),
        db.upsert([
          {
            id: 13,
            name: 'john'
          }, {
            id: 14,
            name: 'ash'
          }
        ]),
      ])
        .then(() => {
          return db.upsert([
            {
              id: 12,
              name: 'new fred'
            },
            {
              id: 13,
              name: 'new john'
            },
            {
              id: 15,
              name: 'new person danny'
            }
          ])
        })
        .then(() => {
          return db.get()
        })
        .then(results => {
          assert.deepEqual(results, [
            {id: 12, name: 'new fred'},
            {id: 13, name: 'new john'},
            {id: 14, name: 'ash'},
            {id: 15, name: 'new person danny'}
          ]);
          done()
        })
        .catch(done)
    })
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