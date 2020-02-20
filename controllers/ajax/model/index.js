let conf = require('../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = Ajax;

function Ajax(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Ajax.getAllUser = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM users, userdata WHERE id_user = user_id ORDER BY fio", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });

};

Ajax.getOneUser = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM users, userdata WHERE id_user = user_id AND email = $1", [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });

};

Ajax.getNode = function (edit, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node WHERE id = $1", [edit], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Ajax.getNodeTemplate = function (edit, template, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node, "+template+" WHERE id = node_id AND id = $1", [edit], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Ajax.getPhoto = function (edit, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE node_id_photo = $1", [edit], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Ajax.savePhoto = function(idEdit, template, agent, title, imgPath, fn){

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("INSERT INTO photo (path_photo, title_photo, template_photo, node_id_photo, user_id_photo) VALUES ($1, $2, $3, $4, $5)", [imgPath, title, template, idEdit, agent], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Ajax.getImg = function (idDrop, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE id_photo = $1 ORDER BY title_photo", [idDrop], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Ajax.dropImg = function (idDrop, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE id_photo = $1", [idDrop], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};