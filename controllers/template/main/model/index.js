let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let ms = require('../../../../lib/msDate');

module.exports = Main;

function Main(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Main.getPage = function (temp, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node, main WHERE id = node_id AND template = $1", [temp], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Main.prototype.save = function (fn) {

  let main = this;

  let title = main.value.title;
  let date_create = main.date_create;
  let author = main.author;
  let template = main.template;
  let h1 = main.value.h1;
  let content = main.value.content;

  (async () => {

    const client = await pool.connect();

    try {

      await client.query('BEGIN');

      let result = await client.query('INSERT INTO node (title, date_create, author, template) VALUES ($1, $2, $3, $4) RETURNING id', [title, date_create, author, template]);

      let id = result.rows[0].id;

      let result1 = await client.query('INSERT INTO main (h1, content, node_id) VALUES ($1, $2, $3)', [h1, content, id]);

      await client.query('COMMIT');

      client.release();

      return fn(null, result1);

    } catch (err) {
      await client.query('ROLLBACK');
      return fn(err, null);
    }
  })()

};

Main.prototype.edit = function (fn) {

  let main = this;

  let title = main.value.title;
  let date_edit = main.date_edit;
  let author_edit = main.author_edit;
  let template = main.template;
  let h1 = main.value.h1;
  let content = main.value.content;

  (async () => {

    const client = await pool.connect();

    try {

      await client.query('BEGIN');

      let result = await client.query('	SELECT * FROM node, main WHERE id = node_id AND template = $1', [template]);

      let id = result.rows[0].id;

      await client.query('UPDATE node SET title = $1, date_edit = $2, author_edit = $3 WHERE id = $4', [title, date_edit, author_edit, id]);


      let result1 = await client.query('UPDATE main SET h1 = $1, content = $2 WHERE node_id = $3', [h1, content, id]);

      await client.query('COMMIT');

      client.release();

      return fn(null, result1);

    } catch (err) {
      await client.query('ROLLBACK');
      return fn(err, null);
    }
  })()

};