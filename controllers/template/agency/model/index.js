let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let ms = require('../../../../lib/msDate');
let nav = require('../../../../lib/navigation');

module.exports = Agency;

function Agency(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Agency.prototype.list = function (fn) {
  let agency = this;

  if (agency.permission === '00000') {

    return fn(null, '');

  } else if (agency.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id AS "Редактировать", title AS "Название агенства", (SELECT title FROM city WHERE id_city = city_id) AS "Город", (SELECT email FROM users WHERE id_user = author) AS "Автор", date_create AS "Дата создания", (SELECT email FROM users WHERE id_user = author_edit) AS "Автор правки", date_edit AS "Дата правки", line AS "Приоритет", note AS "Примечание" FROM node JOIN agency ON (id = node_id) WHERE city_id = $1 ORDER BY title', [agency.id_city], function (err, result) {
        done();
        if (err) {
          return fn(err, null)
        } else {
          return fn(null, result);
        }
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id AS "Редактировать", title AS "Название агенства", (SELECT title FROM city WHERE id_city = city_id) AS "Город", date_create AS "Дата создания", (SELECT email FROM users WHERE id_user = author_edit) AS "Автор правки", date_edit AS "Дата правки", line AS "Приоритет", note AS "Примечание" FROM node JOIN agency ON (id = node_id) WHERE author = $1 AND city_id = $2', [agency.email, agency.id_city], function (err, result) {
        done();
        if (err) {
          return fn(err, null)
        } else {
          return fn(null, result);
        }
      });
    });
  }
};

Agency.prototype.listLimit = function (limit, offset, fn) {

  let agency = this;

  if (agency.permission === '00000') {

    return fn(null, '');

  } else if (agency.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id AS "Редактировать", title AS "Название агенства", (SELECT title FROM city WHERE id_city = city_id) AS "Город", (SELECT email FROM users WHERE id_user = author) AS "Автор", date_create AS "Дата создания", (SELECT email FROM users WHERE id_user = author_edit) AS "Автор правки", date_edit AS "Дата правки", line AS "Приоритет", note AS "Примечание" FROM node JOIN agency ON (id = node_id) WHERE city_id = $1 ORDER BY title LIMIT $2 OFFSET $3', [agency.id_city, limit, offset], function (err, result) {
        done();
        if (err) {
          return fn(err, null)
        } else {
          return fn(null, result);
        }
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id AS "Редактировать", title AS "Название агенства", (SELECT title FROM city WHERE id_city = city_id) AS "Город", date_create AS "Дата создания", (SELECT email FROM users WHERE id_user = author_edit) AS "Автор правки", date_edit AS "Дата правки", line AS "Приоритет", note AS "Примечание" FROM node JOIN agency ON (id = node_id) WHERE author = $1 AND city_id = $2 LIMIT $3 OFFSET $4', [agency.email, agency.id_city, limit, offset], function (err, result) {
        done();
        if (err) {
          return fn(err, null)
        } else {
          return fn(null, result);
        }
      });
    });
  }
};

Agency.prototype.getOneRecord = function (fn) {
  let agency = this;

  let temp = agency.template;


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT author FROM node, ' + temp + ' WHERE id = node_id AND id = $1', [agency.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Agency.prototype.getOneForm = function (fn) {
  let agency = this;

  let temp = agency.template;


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node, ' + temp + ' WHERE id = node_id AND id = $1', [agency.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Agency.prototype.save = function (fn) {
  let agency = this;

  for (let key in agency) {
    if (agency[key] == '') {
      agency[key] = null;
    }
  }

  agency.line = agency.line * 1;

  if (!agency.line) {
    agency.line = null;
  }

  co(function* () {
    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('INSERT INTO node (title, alias, date_create, author, template, line) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [agency.title, agency.alias, agency.date_create, agency.author, agency.template, agency.line]);

      let result1 = yield client.query('INSERT INTO agency ( note, node_id, city_id ) VALUES ( $1, $2, $3 )', [agency.note, result.rows[0].id, agency.id_city]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result1);

    } catch (e) {

      client.release(true);
      return fn(e, null);
    }

  })

  /*  pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('INSERT INTO node (title, alias, date_create, author, template, line) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [agency.title, agency.alias, agency.date_create, agency.author, agency.template, agency.line], function (err, result) {
        done();
        if (err) return fn(err, null);

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('INSERT INTO node (title, alias, date_create, author, template, line) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [agency.title, agency.alias, agency.date_create, agency.author, agency.template, agency.line], function (err, result) {
            done();
            if (err) return fn(err, null);


          });
        });


      });
    });*/

};

Agency.prototype.edit = function (fn) {
  let agency = this;

  for (let key in agency) {
    if (agency[key] == '') {
      agency[key] = null;
    }
  }

  agency.line = agency.line * 1;

  if (!agency.line) {
    agency.line = null;
  }

  co(function* () {
    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, template = $5, line = $6 WHERE id' +
        ' = $7', [agency.title, agency.alias, agency.date_create, agency.author_edit, agency.template, agency.line, agency.id]);

      let result1 = yield client.query('UPDATE ' + agency.template + ' SET note = $1, city_id = $2 WHERE node_id = $3', [agency.note, agency.id_city, agency.id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result1);

    } catch (e) {

      client.release(true);
      return fn(e, null);
    }

  })
};

Agency.prototype.drop = function (fn) {

  let agency = this;
  let valnull = null;

  co(function* () {
    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('DELETE FROM node WHERE id = $1', [agency.id]);

      let result1 = yield client.query('UPDATE userdata SET agency = $1, moderator = $2 WHERE agency = $3', [valnull, valnull, agency.id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (e) {

      client.release(true);
      return fn(e, null);
    }

  })
};

Agency.prototype.issetCreate = function (fn) {

  let agency = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node WHERE alias = $1', [agency.alias], function (err, result) {
      done();
      if (err) return fn(err, null);

      if (result.rowCount > 0) {

        return fn(null, result);

      } else {
        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('SELECT alias FROM city WHERE alias = $1', [agency.alias], function (err, result) {
            done();
            if (err) return fn(err, null);

            if (result.rowCount > 0) {

              return fn(null, result);

            } else {

              pool.connect(function (err, client, done) {
                if (err) return fn(err);

                client.query('SELECT alias FROM country WHERE alias = $1', [agency.alias], function (err, result) {
                  done();
                  if (err) return fn(err, null);

                  if (result.rowCount > 0) {

                    return fn(null, result);

                  } else {

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query('SELECT alias FROM region WHERE alias = $1', [agency.alias], function (err, result) {
                        done();
                        if (err) return fn(err, null);

                        if (result.rowCount > 0) {

                          return fn(null, result);

                        } else {
                          return fn(null, 0);
                        }
                      });

                    });
                  }
                });
              });
            }
          });
        });
      }
    });
  });
};

Agency.prototype.issetEdit = function (fn) {

  let agency = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT alias FROM region WHERE alias = $1', [agency.alias], function (err, result) {
      done();
      if (err) return fn(err, null);

      if (result.rowCount > 0) {

        return fn(null, result);

      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('SELECT alias FROM country WHERE alias = $1', [agency.alias], function (err, result) {
            done();
            if (err) return fn(err, null);

            if (result.rowCount > 0) {

              return fn(null, result);

            } else {

              pool.connect(function (err, client, done) {
                if (err) return fn(err);

                client.query('SELECT alias FROM city WHERE alias = $1', [agency.alias], function (err, result) {
                  done();
                  if (err) return fn(err, null);

                  if (result.rowCount > 0) {

                    return fn(null, result);

                  } else {

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query('SELECT id FROM node WHERE alias = $1', [agency.alias], function (err, result) {
                        done();
                        if (err) return fn(err, null);

                        if (result.rowCount > 0) {

                          if (agency.id === result.rows[0].id) {
                            return fn(null, 0);
                          } else {
                            return fn(null, result);
                          }

                        } else {
                          return fn(null, 0);
                        }
                      });
                    });
                  }
                });
              });
            }
          });
        });
      }
    });
  });
};

Agency.prototype.listAgency = function (fn) {
  let agency = this;


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_user as id, fio as "Ф.И.О", tel as "Телефон", email as "E-mail", moderator as' +
      ' "Модератор" FROM' +
      ' users,' +
      ' userdata WHERE id_user =user_id AND agency = $1 ORDER BY id',
      [agency.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);
      });
  });
};

Agency.prototype.allEmptyAgency = function (fn) {
  let agency = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE userdata SET moderator = null WHERE agency = $1",
      [agency.party], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);

      });

  });

};

Agency.prototype.oneAgency = function (fn) {
  let agency = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE userdata SET moderator = $1 WHERE user_id = $2",
      [agency.party, agency.user], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);

      });

  });

};

Agency.oneCity = function (id_city, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM city WHERE id_city = $1", [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Agency.listCity = function (fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_city, title, (SELECT title FROM region WHERE id_region = region_id) as region FROM city ORDER BY select_default, title", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Agency.setCity = function (id_city, email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE users SET default_city = $1 WHERE email = $2", [id_city, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Agency.getIdPage = function (temp, id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id FROM node WHERE template = $1 AND id = $2", [temp, id], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Agency.getCountPhoto = function (temp, id_edit, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE template_photo = $1 AND node_id_photo = $2", [temp, id_edit], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Agency.saveImg = function (title, imgPath, temp, id_edit, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("INSERT INTO photo (path_photo, title_photo, template_photo, node_id_photo) VALUES ($1, $2, $3, $4)", [imgPath, title, temp, id_edit], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });

};

Agency.getPhoto = function (id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE id_photo = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Agency.deletePhoto = function (id_photo, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE id_photo = $1", [id_photo], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};


Agency.deleteAllPhoto = function (id_node, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE node_id_photo = $1", [id_node], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });

};

Agency.tableListAgency = function (req, row, urlParsed, permission, limit, linkLimit, urlPage, result, temp) {

  let strPath = nav.linkQuery('edit', 'drop', 'party', req);

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    nav.navpage(str, urlParsed, row.rowCount, limit, linkLimit, urlPage, 'page', function (err, resultNav) {
      str += resultNav;
      str += '<div class="clearfix"></div>' + '\n';
      str += '<div class="table-responsive">' + '\n';
      str += '<table class="table table-striped table-bordered table-hover table-condensed' +
        ' tables-top">' + '\n';
      str += '\t' + '<tr>' + '\n';

      for (let i = 0; i < result.fields.length; i++) {

        str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';

      for (let j = 0; j < result.rows.length; j++) {
        let row = result.rows[j];

        str += '\t' + '<tr>' + '\n';


        for (let i = 0; i < result.fields.length; i++) {

          let cols = result.fields[i].name;


          str += '\t\t' + '<td>';


          if (result.fields[i].name === 'Редактировать') {

            str += '<span class="td210">';

            if (permission.indexOf('1', 2) === 2) {
              str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/' + temp + '?edit=' + row[cols] + strPath + '">править</a>';
            }

            if (permission.indexOf('1', 2) === 2 && permission.indexOf('1', 3) === 3) {
              str += '<a class="btn btn-success btn-xs btn-margins" role="button" href="/admin/template/' + temp + '?party=' + row[cols] + strPath + '">сотрудники</a>';
            }

            if (permission.indexOf('1', 1) === 1) {
              str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/' + temp + '?drop=' + row[cols] + strPath + '">удалить</a>';
            }


            str += '</span>';

          } else if (result.fields[i].name === 'Название агенства') {

            str += '<b>' + row[cols] + '</b>';

          } else if (result.fields[i].name === 'Дата создания' || result.fields[i].name === 'Дата правки') {

            str += ms.clip(ms.msDateYear(row[cols]));

          } else if (result.fields[i].name === 'Автор') {

            if (row[cols] === conf.get('administrator')) {
              str += 'администратор';
            } else if (row[cols] == null) {
              str += '';
            } else {
              str += row[cols];
            }
          } else if (result.fields[i].name === 'Автор правки') {

            if (row[cols] === conf.get('administrator')) {
              str += 'администратор';
            } else if (row[cols] == null) {
              str += '';
            } else {
              str += row[cols];
            }

          } else if (row[cols] == null) {
            str += row[cols] = '';
          } else {
            str += ms.clip(row[cols]);
          }

          str += '</td>' + '\n';

        }
        str += '\t' + '</tr>' + '\n';
      }

      str += '</table>' + '\n';
      str += '</div>' + '\n';

    });

    return str;
  }
};


