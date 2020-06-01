const SERVER = '127.0.0.1:27017';
const DB = 'airbnb';
const URI = `mongodb://${SERVER}/${DB}`;
const OPTIONS = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
};

module.exports = {
  OPTIONS,
  URI,
};
