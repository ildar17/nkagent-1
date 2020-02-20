let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = Section_name;

function Section_name(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}


Section_name.prototype.getRoleUrl = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_permit as "Администр.", name as "Название раздела", priority as "Приор.", ' +
      'temp as "Псевдоним шаблона", url_temp as "Адрес страницы", browse as "Просм.", ' +
      'make as "Сохр.", update as Править, delete as "Уд.", publication as "Публ." ' +
      'FROM permit ORDER BY priority DESC',
      function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
  });
};

Section_name.prototype.getOnePermit = function (fn) {

  let administrator = this;


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM permit WHERE id_permit = $1 ORDER BY priority DESC',
      [administrator.id_permit], function (err, result) {
        done();
        if (err) {
          return fn(err, null)
        } else {
          fn(null, result.rows[0]);
        }
      });
  });

};

Section_name.prototype.addNamePermit = function (fn) {

  let administrator = this;

  if (administrator.priority === '') {
    administrator.priority = null;
  }


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE permit SET name = $1, priority = $2 WHERE id_permit = $3',
      [administrator.name, administrator.priority, administrator.id_permit], function (err, result) {
        done();
        if (err) {
          return fn(err, null)
        } else {
          fn(null, result);
        }
      });
  });
};

Section_name.dropRolePage = function (dropRolePage, fn) {

  (async () => {

    const client = await pool.connect();

    try {

      await client.query('BEGIN');

      let result = await client.query('SELECT * FROM permit WHERE id_permit = $1', [dropRolePage]);

      if (result.rowCount > 0) {
        await client.query('DELETE FROM sectionandtemplate WHERE template_name = $1', [result.rows[0].temp]);
      }

      await client.query('DELETE FROM access WHERE permit_id = $1', [dropRolePage]);

      let result1 = await client.query('DELETE FROM permit WHERE id_permit = $1', [dropRolePage]);

      await client.query('DELETE FROM labelandtemplate WHERE permit_id = $1', [dropRolePage]);

      await client.query('COMMIT');
      client.release();

      return fn(null, result1);

    } catch (err) {
      await client.query('ROLLBACK');
      return fn(err, null);
    }
  })();


};