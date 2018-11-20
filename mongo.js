const MongoClient = require('mongodb').MongoClient,
  _ = require('lodash'),
  when = require('when');

let mongoConnection;
let mongoConnectionPromise;

module.exports = function (userProvidedOptions) {
// defaults
  const options = {
    url: 'mongodb://localhost',
    collection: 'default-collection',
    indexes: [],
    db: 'test-db'
  };

  _.extend(options, userProvidedOptions);

  let collection;
  let collectionPromise;

  function connection() {
    if (mongoConnection) {
      return when.resolve(mongoConnection)
    } else if (mongoConnectionPromise){
      return mongoConnectionPromise
    } else {
      console.log('creating new mongo connection', options.url);
      mongoConnectionPromise = MongoClient.connect(options.url, {useNewUrlParser: true});
      return mongoConnectionPromise;
    }
  }

  function mongo() {
    if (!collection && !collectionPromise) {

      collectionPromise = connection()
        .then(mongoConnection => {
          console.log('getting collection ' + options.collection);
          collection = mongoConnection.db(options.db).collection(options.collection);
          return collection;
        })
        .then(collection => {
          return _.map(options.indexes, name => {
            indexObj = {};
            indexObj[name] = 1;
            return collection.createIndex(indexObj);
          })
        })
        .then(() => {
          return collection;
        })
        .catch(err => {
          console.error('cant connect to mongo ', err);
          throw new Error(err);
        });
      return collectionPromise;
    } else if (collection) {
//    console.log('returning resolve of collection');
      return when.resolve(collection);//collectionPromise
    } else if (collectionPromise) {
//    console.log('returning collection promise');
      return collectionPromise;
    }
  }

  const upsert = recordsArr => {
    let ids = [];
    let records = _.map(recordsArr, record => {
      if (record.id) {
        record._id = record.id;
        ids = _.concat(ids, record._id);
        return _.omit(record, 'id');
      } else {
        return record;
      }
    });

    return mongo()
      .then(collection => {
        return collection.insertMany(records, {ordered:false})
          .catch((err, result) => {
            if (err.code === 11000) {
              console.log('there was a duplicate'); //TODO remove me
              return when.resolve(result);
            } else {
              console.error('insertOne error', err);
              return when.reject(err);
            }
          })
          .then(result => {
            console.log({resulty: result});

            let insertedIDs = _.values(_.get(result, 'insertedIds', {}));
            let updateIDs = _.filter(ids, id => {
              return !_.includes(insertedIDs, id);
            });

            let updateRecords = _.map(updateIDs, id => _.find(records, {_id: id}));

            console.log({updateRecords});
            return when.map(updateRecords, r => {
              console.log('replacing',r);
              return collection.replaceOne({_id: r._id}, r)
                .catch(err => {
                  console.log('replace err', err);
                });
            });
          })

      });
  };

  const get = query => {
    return mongo()
      .then(collection => {
        return collection.find(query)
          .toArray()
      })
  };

  const getById = id => {
    return mongo()
      .then(collection => {
        return collection.findOne({_id: id})
      });
  };

  const count = () => {

    return mongo()
      .then(collection => {
        return collection.find({}).count();
      });

  };

  const remove = () => {
    return mongo()
      .then(collection => {
        return collection.findOneAndDelete({}, {
          sort: {datetaken: 1}
        })
      })
  };

  const collectionAsync = () => {
    return mongo();
  };

  const collectionSync = () => {
    return collection;
  };



  return {
    upsert,
    get,
    getById,
    remove,
    count,
    collectionAsync,
    collectionSync
  };
};
