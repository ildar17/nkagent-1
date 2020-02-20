let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let ms = require('../../../../lib/msDate');
let nav = require('../../../../lib/navigation');

module.exports = Label;

function Label(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Label.prototype.issetCreate = function (fn) {

  let label = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node WHERE alias = $1', [label.alias], function (err, result) {
      done();
      if (err) return fn(err, null);

      if (result.rowCount > 0) {

        return fn(null, result);

      } else {
        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('SELECT alias FROM city WHERE alias = $1', [label.alias], function (err, result) {
            done();
            if (err) return fn(err, null);

            if (result.rowCount > 0) {

              return fn(null, result);

            } else {

              pool.connect(function (err, client, done) {
                if (err) return fn(err);

                client.query('SELECT alias FROM country WHERE alias = $1', [label.alias], function (err, result) {
                  done();
                  if (err) return fn(err, null);

                  if (result.rowCount > 0) {

                    return fn(null, result);

                  } else {

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query('SELECT alias FROM region WHERE alias = $1', [label.alias], function (err, result) {
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


Label.prototype.issetEdit = function (fn) {

  let label = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT alias FROM region WHERE alias = $1', [label.alias], function (err, result) {
      done();
      if (err) return fn(err, null);

      if (result.rowCount > 0) {

        return fn(null, result);

      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('SELECT alias FROM country WHERE alias = $1', [label.alias], function (err, result) {
            done();
            if (err) return fn(err, null);

            if (result.rowCount > 0) {

              return fn(null, result);

            } else {

              pool.connect(function (err, client, done) {
                if (err) return fn(err);

                client.query('SELECT alias FROM city WHERE alias = $1', [label.alias], function (err, result) {
                  done();
                  if (err) return fn(err, null);

                  if (result.rowCount > 0) {

                    return fn(null, result);

                  } else {

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query('SELECT id FROM node WHERE alias = $1', [label.alias], function (err, result) {
                        done();
                        if (err) return fn(err, null);

                        if (result.rowCount > 0) {

                          if (label.id === result.rows[0].id) {
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


Label.prototype.save = function (fn) {

  let label = this;

  if( label.permission.indexOf('1', 4) === 4){

    label.status = 1;
    label.main = 1;

    co(function* () {

      let client = yield pool.connect();

      try {

        yield client.query('BEGIN');

        let result = yield client.query('INSERT INTO node (title, alias, date_create, author, status, main, template) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [label.title, label.alias, label.date_create, label.author, label.status, label.main, label.template]);

        if(label.line === 0 || label.line === null){
          label.line = result.rows[0].id;
        }

        let result1 = yield client.query('UPDATE node SET line = $1 WHERE id = $2', [label.line, result.rows[0].id]);

        yield client.query('COMMIT');
        client.release();


        return fn(null, result1);

      } catch (e) {

        client.release(true);
        return fn(e, null);

      }
    })
  }
};

Label.prototype.list = function (fn) {
  let label = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id AS Редактирование, title AS Метка, alias AS Псевдоним, (SELECT email FROM users WHERE id_user = author) AS Автор, date_create as "Дата создания", (SELECT email FROM users WHERE id_user = author_edit) as "Автор правки", date_edit as "Дата правки",  line as Приоритет FROM node WHERE template = $1 ORDER BY line DESC', [label.template], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Label.getIdLabel = function (id, template, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1 AND template = $2', [id, template], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Label.prototype.edit = function (fn) {
  let label = this;

  if(label.line === 0){
    label.line = label.id;
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, line = $5, template = $6 WHERE id = $7',
      [label.title, label.alias, label.date_create, label.author, label.line, label.template, label.id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Label.getLabelAndTemplate = function (id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_labelandtemplate AS Редактирование, (SELECT title FROM node WHERE id = node_id) AS "Имя метки", (SELECT name FROM permit WHERE id_permit = permit_id) AS "Наименование шаблона" FROM labelandtemplate WHERE node_id = $1', [id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Label.addTemplate = function (id_node, id_permit, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO labelandtemplate (node_id, permit_id) VALUES ($1, $2)', [id_node, id_permit], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Label.deleteStrLabelandtemplate = function (id_labelandtemplate, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM labelandtemplate WHERE id_labelandtemplate = $1', [id_labelandtemplate], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Label.prototype.deleteLabel = function (fn) {

  let label = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM labelandtemplate WHERE node_id = $1', [label.node_id], function (err, result) {
      done();
      if (err) return fn(err, null);

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('DELETE FROM node WHERE id = $1', [label.node_id], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });
    });
  });
};

Label.selectTemplates = function(id, fn){

  let str = '';

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_permit, name FROM permit WHERE temp_sort = 1 EXCEPT SELECT permit_id, (SELECT name FROM permit WHERE id_permit = permit_id) FROM labelandtemplate WHERE node_id = $1', [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        for(let i = 0; i < result.rows.length; i++){

          str += '<option value="' + result.rows[i].id_permit + '">' + result.rows[i].name  + '</option>' + '\n';

        }

        return fn(null, str);

      } else {
        str += '<option value="">шаблонов нет</option>' + '\n';
        return fn(null, str);
      }

    });
  });

};

Label.tableListLable = function (result, permission) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed">' + '\n';
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

        if (result.fields[i].name === 'Редактирование') {

          str += '<span class="td230">';

          if (permission.indexOf('1', 2) === 2) {
            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/label?edit=' + row[cols] + '">править</a>';
          }

          if (permission.indexOf('1', 1) === 1) {
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/label?drop=' + row[cols] + '">удалить</a>';
          }

          if (permission.indexOf('1', 3) === 3) {
            str += '<a class="btn btn-success btn-xs btn-margins" role="button" href="/admin/template/label?addTemplate=' + row[cols] + '">добавить шаблоны к метке</a>';
          }

          str += '</span>';

        } else if (result.fields[i].name === 'id_layerandblock') {

          if (row[cols] == null) {
            str += row[cols] = '';
          } else {

            if (permission.indexOf('1', 1) === 1) {
              str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/label?dropStr=' + row[cols] + '">удалить строку</a>';
            }

          }

        } else if (result.fields[i].name === 'Метка') {

          str += '<b>' + row[cols] + '</b>';

        } else if (result.fields[i].name === 'Автор') {

          if (row[cols] === conf.get('administrator')) {
            str += 'администратор';
          } else if (row[cols] == null) {
            str += '<span class="noData">удалён</span>';
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

        } else if (result.fields[i].name === 'Дата создания' || result.fields[i].name === 'Дата правки') {
          str += ms.clip(ms.msDateYear(row[cols]));
        } else if (row[cols] == null) {
          str += row[cols] = '';

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

Label.tableLabelAndTemplate = function (result, permission, addTemplate) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed">' + '\n';
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

        if (result.fields[i].name === 'Редактирование') {

          if (permission.indexOf('1', 1) === 1) {
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button"  href="/admin/template/label?addTemplate='+addTemplate+'&dropStr=' + row[cols] + '">удалить строку</a>';
          }

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


