let crypto = require('crypto');
let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

module.exports = Admin;

function Admin(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Admin.prototype.getUser = function (fn) {

  let user = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM users, userdata  WHERE id_user = user_id and email=$1", [user.email],
      function (err, result) {

        done();
        if (err) return fn(err, null);

        fn(null, result);
      });

  });
};

Admin.getAccess = function (email, users, fn) {

  if (users === 1) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT r.users AS Статус, CASE WHEN( SELECT agency FROM users, userdata WHERE id_user = user_id AND email =" +
        " $1) > 0 THEN 'Агент недвижимости' ELSE r.name_role END AS Роль, p.name AS Разделы, p.url_temp AS"+' "Путь к разделам", CASE WHEN ((' +
        ' select agency from users, userdata where id_user=user_id AND email = '+"$1) >= 0 AND p.temp = 'apartment' ) THEN '01110' ELSE a.code END AS"+' "Права доступа к разделам" FROM access a LEFT JOIN permit p ON(p.id_permit = a.permit_id) LEFT JOIN role r ON(r.id_role = a.role_id) WHERE (r.users = 1 '+"AND a.code != '00000') OR (r.users = 1 AND p.temp = 'apartment' AND ( select agency from users, userdata where id_user=user_id AND email = $1) >= 0) ORDER BY p.priority DESC", [email], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });

    });

  } else if (users === 0) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT r.users as Статус, r.name_role as Роль, p.name as Разделы, ' +
        'p.url_temp as "Путь к разделам", a.code as "Права доступа к разделам" FROM access a JOIN ' +
        'permit p on(p.id_permit = a.permit_id) JOIN role r on(r.id_role = a.role_id) JOIN ' +
        'users u on(r.id_role = u.role_id) WHERE u.email = $1 '+"AND a.code != '00000' ORDER BY p.priority DESC",
        [email], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
    });
  } else if (users === null) {
    fn(null, {rows: [{name_role: 'Администратор'}]});
  }

};

Admin.prototype.drop = function (fn) {

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

Admin.getListRealty = function (permission, id_user, id_moderator_agency, id_agency, fn ) {

  if(permission.indexOf('1', 4) === 4){


    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN apartment ON(id = node_id) WHERE template = 'apartment' UNION SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN cottages ON(id = node_id) WHERE template = 'cottages' UNION SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN commercial ON(id = node_id) WHERE template = 'commercial'", function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);

        });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN apartment ON(id = node_id) LEFT JOIN userdata ON(agent = user_id) WHERE template = 'apartment' AND agency = $1 UNION SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN cottages ON(id = node_id) LEFT JOIN userdata ON(agent = user_id) WHERE template = 'cottages' AND agency = $1 UNION SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN commercial ON(id = node_id) LEFT JOIN userdata ON(agent = user_id) WHERE template = 'commercial' AND agency = $1", [id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN apartment ON(id = node_id) WHERE template = 'apartment' AND agent = $1 UNION SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN cottages ON(id = node_id) WHERE template = 'cottages' AND agent = $1 UNION SELECT DISTINCT template AS Псевдоним, (SELECT name FROM permit WHERE temp = template) AS Раздел, count(*) OVER (PARTITION BY template) AS \"Количество объектов\" FROM node LEFT JOIN commercial ON(id = node_id) WHERE template = 'commercial' AND agent = $1",
        [id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);

        });
    });
  }

};

Admin.tableRealty = function (result) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';

    for (let k = 0; k < result.fields.length; k++) {

      str += '\t\t' + '<th>' + result.fields[k].name + '</th>' + '\n';

    }

    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {

      let row = result.rows[j];

      str += '\t' + '<tr>' + '\n';

      for (let i = 0; i < result.fields.length; i++) {

        let cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        str += row[cols];

        str += '\t\t' + '</td>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';

    return str;
  }
};

Admin.updateUserPass = function (pass, id_user, fn) {

  let hashPass = crypto.createHmac('sha1', conf.get('salt')).update(pass).digest('hex');

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE users SET pass = $1 WHERE id_user = $2",
      [hashPass, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);

      });
  });
};

Admin.getEmail = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT email FROM users WHERE email = $1", [email], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);

      });
  });
};

Admin.prototype.userUpdate = function (fn) {
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

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("UPDATE userdata SET fio = $1, tel = $2, note = $3 WHERE user_id = $4",
            [user.fio, user.tel, user.note, user.id], function (err, result) {
              done();
              if (err) return fn(err, null);

              fn(null, result);

            });
        });
      });
  });
};

Admin.prototype.temporarilySave = function (fn) {

  let user = this;

  for (let key in user) {
    if (user[key] === '') {
      user[key] = null;
    }
  }

  let nowDate = Date.now();
  nowDate = String(nowDate);
  user.url_hash = crypto.createHmac('sha1', conf.get('salt')).update(nowDate).digest('hex');


  pool.connect( function(err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM temporarily_users_userdata WHERE id_user = $1', [user.id_user], function (err, result) {
      done();
      if (err) return fn(err, null, null);

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('INSERT INTO temporarily_users_userdata (email, now_date, url_hash, id_user, fio, tel, note) ' +
          'VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [user.email, user.now_date, user.url_hash, user.id_user, user.fio, user.tel, user.note], function (err, result) {
            done();
            if (err) return fn(err, null, null);

            return fn(null, user.url_hash, result);

          });

        });
      });

    });
};

Admin.getTel = function (tel, id_user, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT tel FROM userdata WHERE tel = $1 AND user_id != $2", [tel, id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};


Admin.getCountPhoto = function (temp, id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE template_photo = $1 AND user_id_photo = $2", [temp, id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Admin.getCountAllPhoto = function (id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE user_id_photo = $1", [id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Admin.saveImg = function (title, imgPath, temp, id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("INSERT INTO photo (path_photo, title_photo, template_photo, user_id_photo) VALUES ($1, $2, $3, $4)", [imgPath, title, temp, id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Admin.getPhoto = function (id, id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE id_photo = $1 AND user_id_photo = $2", [id, id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Admin.deletePhoto = function (id_photo, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE id_photo = $1", [id_photo], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Admin.deleteAllPhoto = function (id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE user_id_photo = $1", [id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};
