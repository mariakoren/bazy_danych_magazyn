const { MongoClient, MongoExpiredSessionError } = require("mongodb");
const Db = process.env.MONGO_URI;
console.log(Db);
const client = new MongoClient(Db);

var _db;

const connectDb = async () => {
  try {
    await client.connect();
    _db = client;
    console.log("Succesfully connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
};

const getDb = () => _db.db("products");

module.exports = {
  connectDb,
  getDb,
};