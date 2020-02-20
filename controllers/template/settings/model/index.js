let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

module.exports = Settings;

function Settings(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Settings.recordEntryTime = function (start, final, fn) {


  if(!start){
    start = null;
  }

  if(!final){
    final = null;
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE userdata SET date_start = $1, date_final = $2", [start, final], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Settings.listDate = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM userdata limit 1", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Settings.getCity = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM city ORDER BY title", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Settings.getDefaultCity = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM city WHERE select_default = 1", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Settings.setDefaultCity = function (id_city, fn) {

  if(id_city === '0'){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("UPDATE city SET select_default = NULL", function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("UPDATE city SET select_default = 1 WHERE id_city = $1", [id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);

      });
    });
  }
};