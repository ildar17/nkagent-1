let conf = require('../../../../config');
let ms = require('../../../../lib/msDate');
let nav = require('../../../../lib/navigation');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

module.exports = Users;

function Users(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}


Users.prototype.list = function (fn) {
  let users = this;

  let dateNow = Date.now();

  if (users.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT date_start, date_final, date_entry, date_entry_moderator, id_user AS Редактирование, (SELECT title FROM node WHERE id = agency) AS "Агенство", (SELECT (SELECT title FROM city WHERE id_city = city_id) FROM node, agency WHERE id = node_id AND id = agency) AS "Город", CASE WHEN moderator > 0 THEN \'M\' END AS "M", fio as "Ф.И.О", CASE WHEN date_payment_price > $1 THEN (SELECT name_role FROM role WHERE payment_price = 1) WHEN role_id IS NULL THEN (SELECT name_role FROM role WHERE users = 1) WHEN date_payment_price < $2 THEN (SELECT name_role FROM role WHERE payment_price = 2) ELSE (SELECT name_role FROM role WHERE id_role = role_id) END AS "Роль", date_payment_price AS "Оплата прайса", email, tel AS "Телефон", date_registration AS "Дата регистрации" FROM users u LEFT JOIN userdata ud ON(u.id_user = ud.user_id) LEFT JOIN node n ON(ud.agency = n.id ) WHERE email != $3 ORDER BY Агенство, fio',
        [dateNow, dateNow, conf.get('administrator')], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
    });

  } else {
    return fn(null, '');
  }
};

Users.prototype.listLimit = function (limit, offset, fn) {
  let users = this;

  let dateNow = Date.now();

  if (users.permission === '00000') {

    return fn(null, '');

  } else if (users.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT date_start, date_final, date_entry, date_entry_moderator, id_user AS Редактирование, (SELECT title FROM node WHERE id = agency) AS "Агенство", (SELECT (SELECT title FROM city WHERE id_city = city_id) FROM node, agency WHERE id = node_id AND id = agency) AS "Город", CASE WHEN moderator > 0 THEN \'M\' END AS "M", fio as "Ф.И.О", CASE WHEN date_payment_price > $1 THEN (SELECT name_role FROM role WHERE payment_price = 1) WHEN role_id IS NULL THEN (SELECT name_role FROM role WHERE users = 1) WHEN date_payment_price < $2 THEN (SELECT name_role FROM role WHERE payment_price = 2) ELSE (SELECT name_role FROM role WHERE id_role = role_id) END AS "Роль", date_payment_price AS "Оплата прайса", email, tel AS "Телефон", date_registration AS "Дата регистрации" FROM users u LEFT JOIN userdata ud ON(u.id_user = ud.user_id) LEFT JOIN node n ON(ud.agency = n.id ) WHERE email != $3 ORDER BY Агенство, fio LIMIT $4 OFFSET $5',
        [dateNow, dateNow, conf.get('administrator'), limit, offset], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
    });

  } else {
    return fn(null, '');
  }
};

Users.prototype.drop = function (fn) {

  let users = this;

  (async () => {

    const client = await pool.connect();

    try {

      await client.query('BEGIN');

      await client.query('DELETE FROM users WHERE id_user = $1', [users.id]);

      await client.query('DELETE FROM userdata WHERE user_id = $1', [users.id]);

      await client.query('DELETE FROM node WHERE id = ANY(SELECT node_id FROM apartment WHERE agent = $1)', [users.id]);

      await client.query('DELETE FROM node WHERE id = ANY(SELECT node_id FROM cottages WHERE agent = $1)', [users.id]);

      await client.query('DELETE FROM node WHERE id = ANY(SELECT node_id FROM commercial WHERE agent = $1)', [users.id]);

      await client.query('COMMIT');

      client.release();

      return fn(null, 1);

    } catch (err) {
      await client.query('ROLLBACK');
      return fn(err, null);
    }
  })()
};

Users.prototype.getUserForm = function (fn) {
  let user = this;

  user.administrator = conf.get('administrator');

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM users, userdata WHERE id_user = user_id AND id_user = $1 AND email != $2',
      [user.id, user.administrator], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Users.prototype.getUser = function (fn) {
  let user = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM users, userdata WHERE id_user = user_id AND id_user = $1',
      [user.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Users.prototype.assignModeratorRole = function (fn) {
  let user = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM role WHERE payment_price = 2', function (err, result) {
      done();
      if (err) return fn(err, null);

      if (result.rowCount > 0) {

        let id_role = result.rows[0].id_role;

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('UPDATE users SET role_id = $1 WHERE id_user = $2', [id_role, user.id], function (err, result) {
            done();
            if (err) return fn(err, null);

            return fn(null, result);

          });
        });

      } else {
        return fn(null, null);
      }
    });
  });
};

Users.prototype.assignUserRole = function (fn) {
  let user = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE users SET role_id = NULL WHERE id_user = $1', [user.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('UPDATE userdata SET date_payment_price = NULL WHERE user_id = $1', [user.id], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });

    });
  });
};

Users.getEmail = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM users WHERE email = $1',
      [email], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Users.getAgency = function (fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id, title FROM node WHERE template = 'agency' ORDER BY title",
      function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Users.prototype.userUpdate = function (fn) {
  let user = this;


  for (let key in user) {
    if (user[key] === '') {
      user[key] = null;
    }
  }


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE users SET email = $1 WHERE id_user = $2 ' + 'RETURNING email',
      [user.email, user.id], function (err, result) {
        done();

        if (err) return fn(err, null);

        if (user.sumMs !== null) {

          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query("UPDATE userdata SET fio = $1, tel = $2, agency = $3, note = $4, date_payment_price = $5 WHERE user_id = $6",
              [user.fio, user.tel, user.agency, user.note, user.sumMs, user.id], function (err, result) {
                done();
                if (err) return fn(err, null);

                fn(null, result);

              });
          });

        } else {

          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query("UPDATE userdata SET fio = $1, tel = $2, agency = $3, note = $4 WHERE user_id = $5",
              [user.fio, user.tel, user.agency, user.note, user.id], function (err, result) {
                done();
                if (err) return fn(err, null);

                fn(null, result);

              });
          });
        }
      });
  });
};

Users.maxIdUsers = function (fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT max(id_user) FROM users", function (err, result) {
      done();
      if (err) {
        return fn(err, null)
      } else {
        return fn(null, result);
      }
    });
  });
};

Users.getTel = function (tel, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT email FROM users, userdata WHERE id_user = user_id AND tel = $1", [tel], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Users.tableListUsers = function (permission, row, urlParsed, limit, linkLimit, urlPage, result, req) {

  let strPath = nav.linkQuery('edit', 'drop', 'party', req);
  let str = '';
  let dateStart;
  let dateFinal;
  let dateEntry;
  let dateEntryModerator;

  if (result.rowCount === 0 || !result) {

    return str;

  } else {


    nav.navpage(str, urlParsed, row.rowCount, limit, linkLimit, urlPage, 'page', function (err, result) {
      str += result;
    });
    str += '<div class="clearfix"></div>' + '\n';
    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      if (result.fields[i].name === 'date_start'){
        continue;
      }

      if (result.fields[i].name === 'date_final'){
        continue;
      }

      if (result.fields[i].name === 'date_entry'){
        continue;
      }

      if (result.fields[i].name === 'date_entry_moderator'){
        continue;
      }

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }

    str += '\t' + '</tr>' + '\n';



    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];

      dateStart = Number(result.rows[j]['date_start']);
      dateFinal = Number(result.rows[j]['date_final']);
      dateEntry = Number(result.rows[j]['date_entry']);
      dateEntryModerator = Number(result.rows[j]['date_entry_moderator']);



      if(dateStart < dateEntryModerator && dateEntryModerator < dateFinal && !dateEntry){
        str += '\t' + '<tr bgcolor="#c2eeb5">' + '\n';
      }

      if(dateStart < dateEntryModerator && dateEntryModerator < dateFinal && dateEntry < dateStart){
        str += '\t' + '<tr bgcolor="#c2eeb5">' + '\n';
      }

      if(dateStart < dateEntry && dateEntry < dateFinal){
        str +=  '\t' + '<tr bgcolor="#f0e68c">' + '\n';
      }


      let id = null;

      for (let i = 0; i < result.fields.length; i++) {

        let cols = result.fields[i].name;

        if (result.fields[i].name === 'date_start'){
          continue;
        }

        if (result.fields[i].name === 'date_final'){
          continue;
        }

        if (result.fields[i].name === 'date_entry'){
          continue;
        }

        if (result.fields[i].name === 'date_entry_moderator'){
          continue;
        }

        str += '\t\t' + '<td>';

        if (result.fields[i].name === 'Редактирование') {

          str += '<span class="td150">';
          str += '<b>' + row[cols] + '.</b>';

          id = row[cols];

          if (permission.indexOf('1', 2) === 2) {
            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/users?edit=' + row[cols] + strPath + '">править</a>';
          }

          if (permission.indexOf('1', 1) === 1) {
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/users?drop=' + row[cols] + strPath + '">удалить</a>';
          }
          str += '</span>';

        } else if (result.fields[i].name === 'Агенство') {

          if(row[cols] !== null){
            str += '<strong>' + row[cols] + '</strong>';
          } else {
            str += '';
          }

        } else if (result.fields[i].name === 'Ф.И.О') {

          str += '<a href="/admin/template/complete?agent='+id+'"><b>'+row[cols]+'</b></a>';

        } else if (result.fields[i].name === 'Роль') {

          str += '<a class="btn btn-primary btn-xs" role="button" href="/admin/template/users?editRole=' + id + strPath + '">' + row[cols] + '</a>';

        } else if (result.fields[i].name === 'Оплата прайса') {

          str += ms.clip(ms.msDate(row[cols]));

        } else if (result.fields[i].name === 'Дата регистрации') {

          str += ms.clip(ms.msDateYear(row[cols]));

        } else if (row[cols] == null) {

          str += '';

        } else {
          str += row[cols];
        }

        str += '</td>' + '\n';

      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';

    return str;
  }
};

Users.getCountAllPhoto = function (id_user, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE user_id_photo = $1", [id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Users.deleteAllPhoto = function (id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE user_id_photo = $1", [id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};
