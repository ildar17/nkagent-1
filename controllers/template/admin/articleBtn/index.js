let crypto = require('crypto');
let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let ms = require('../../../../lib/msDate');
let Article = require('../../article/model');

module.exports = btnArticle;

function btnArticle(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

btnArticle.access = function (email, url, fn) {


  if (email === conf.get('administrator')) {

    fn(null, '11111');

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT u.email, a.code, p.url_temp  FROM users u, role r, access a, permit p WHERE u.role_id = a.role_id ' +
        'AND p.id_permit = a.permit_id AND r.id_role = a.role_id AND u.email = $1 AND p.url_temp = $2',
        [email, url], function (err, result) {
          done();
          if (err) return fn(err, null);

          if (result.rowCount === 1) {

            fn(null, result.rows[0].code);

          } else {

            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query("SELECT a.code, p.url_temp, users FROM role r, access a, permit p " +
                "WHERE p.id_permit = a.permit_id AND r.id_role = a.role_id AND r.users = 1 AND p.url_temp = $1",
                [url], function (err, result) {
                  done();
                  if (err) return fn(err, null);

                  if (result.rowCount === 1) {

                    fn(null, result.rows[0].code);

                  } else {

                    fn(null, '00000');
                  }
                });
            });
          }
        });
    });
  }
};

btnArticle.getArticle = function (author, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT section AS "УрлРаздел", (SELECT message FROM article_reject WHERE node_id = n.id) AS "Сообщение", id AS "ID-статьи", date_create AS "Дата создания", (SELECT title FROM node WHERE id = n.section) AS "Раздел", title AS "Заголовок статьи", status AS "Статус Перейти" FROM node n, article a WHERE n.id = a.node_id AND author = $1 ORDER BY status, priority DESC', [author], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

btnArticle.getArticleAll = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT section AS "УрлРаздел", (SELECT message FROM article_reject WHERE node_id = n.id) AS "Сообщение", id AS "ID-статьи", date_create AS "Дата создания", (SELECT title FROM node WHERE id = n.section) AS "Раздел", (SELECT email FROM users WHERE id_user = author) AS email, title AS "Заголовок статьи", status AS "Статус Перейти" FROM node n, article a WHERE n.id = a.node_id AND status = 0 ORDER BY "Раздел", priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

btnArticle.tableListArticle = function (result, articlePath, template, id_user, permission, fn) {

  co(function* () {

      let str = '';

      if (result === '') {

        return str;

      } else {

        str += '<div class="table-responsive">' + '\n';
        str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
        str += '\t' + '<tr>' + '\n';
        for (let i = 0; i < result.fields.length; i++) {

          if (result.fields[i].name === 'ID-статьи') {
            continue;
          }

          if (result.fields[i].name === 'Сообщение') {
            continue;
          }

          if (result.fields[i].name === 'УрлРаздел') {
            continue;
          }

          str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

        }
        str += '\t' + '</tr>' + '\n';

        for (let j = 0; j < result.rows.length; j++) {

          let row = result.rows[j];
          let cols = '';

          str += '\t' + '<tr>' + '\n';

          let id;
          let message;
          let section;
          let page;

          for (let i = 0; i < result.fields.length; i++) {

            cols = result.fields[i].name;

            if (result.fields[i].name === 'ID-статьи') {
              id = row[cols];
              continue;
            }

            if (result.fields[i].name === 'Сообщение') {
              message = row[cols];
              continue;
            }

            if (result.fields[i].name === 'УрлРаздел') {
              section = row[cols];
              continue;
            }

            str += '\t\t' + '<td>';

            if (result.fields[i].name === 'Дата создания') {

              str += ms.msDateYear(row[cols])

            } else if (result.fields[i].name === 'Раздел') {

              str += '<b>' + row[cols] + '</b>';

            } else if (result.fields[i].name === 'Статус Перейти') {

              if (message && row[cols] === 0) {
                let list = new Article({section: section, template: template, author: id_user, permission: permission});
                let resultList = '';

                try {
                  resultList = yield new Promise(function (resolve, reject) {
                    list.list(function (err, result) {
                      if (err) return reject(err);
                      if (result.rowCount > 0) {
                        return resolve(result);
                      } else {
                        return resolve(null);
                      }
                    });
                  });
                } catch (err) {
                  if (err) return fn(err);
                }

                if (resultList.rowCount > 0) {

                  let j = null;
                  for (let i = 0; i < resultList.rows.length; i++) {

                    if (id === resultList.rows[i]['Редактировать']) {

                      j = i + 1;
                      continue;
                    }
                  }

                  let navArticle = conf.get('article');

                  let limit = navArticle.limit;

                  page = Math.ceil(j / limit);

                  if (page < 1) {
                    page = 1;
                  }

                }
                str += '<a class  ="btn btn-danger btn-xs" href="' + articlePath + '?section=' + section + '&edit=' + id + '&page=' + page + '">отклонено</a>';

              } else if (!message && row[cols] === 0) {

                let list = new Article({section: section, template: template, author: id_user, permission: permission});
                let resultList = '';

                try {
                  resultList = yield new Promise(function (resolve, reject) {
                    list.list(function (err, result) {
                      if (err) return reject(err);
                      if (result.rowCount > 0) {
                        return resolve(result);
                      } else {
                        return resolve('');
                      }
                    });
                  });
                } catch (err) {
                  if (err) return fn(err);
                }

                if (resultList.rowCount > 0) {

                  let j = null;
                  for (let i = 0; i < resultList.rows.length; i++) {

                    if (id === resultList.rows[i]['Редактировать']) {

                      j = i + 1;
                      continue;
                    }
                  }

                  let navArticle = conf.get('article');

                  let limit = navArticle.limit;

                  page = Math.ceil(j / limit);

                  if (page < 1) {
                    page = 1;
                  }

                }

                str += '<a class="btn btn-warning btn-xs" href="' + articlePath + '?section=' + section + '&edit=' + id + '&page=' + page + '">ожидает</a>';

              } else if (row[cols] === 1) {

                let list = new Article({section: section, template: template, author: id_user, permission: permission});
                let resultList = '';

                try {
                  resultList = yield new Promise(function (resolve, reject) {
                    list.list(function (err, result) {
                      if (err) return reject(err);
                      if (result.rowCount > 0) {
                        return resolve(result);
                      } else {
                        return resolve('');
                      }
                    });
                  });
                } catch (err) {
                  if (err) return fn(err);
                }

                if (resultList.rowCount > 0) {

                  let j = null;
                  for (let i = 0; i < resultList.rows.length; i++) {

                    if (id === resultList.rows[i]['Редактировать']) {

                      j = i + 1;
                      continue;
                    }
                  }

                  let navArticle = conf.get('article');

                  let limit = navArticle.limit;

                  page = Math.ceil(j / limit);

                  if (page < 1) {
                    page = 1;
                  }
                }

                str += '<a class="btn btn-success btn-xs" href="' + articlePath + '?section=' + section + '&edit=' + id + '&page=' + page + '">public</a>';
              }

            } else {

              if (row[cols]) {
                str += row[cols];
              }

            }

            str += '</td>' + '\n'
          }

          str += '\t' + '</tr>' + '\n';
        }

        str += '</table>' + '\n';
        str += '</div>' + '\n';
        return fn(null, str);
      }
    }
  );
};

btnArticle.tableListArticleAll = function (result, articlePath, template, id_user, permission, fn) {

  co(function* () {

      let str = '';

      if (result === '') {

        return str;

      } else {

        str += '<div class="table-responsive">' + '\n';
        str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
        str += '\t' + '<tr>' + '\n';
        for (let i = 0; i < result.fields.length; i++) {

          if (result.fields[i].name === 'ID-статьи') {
            continue;
          }

          if (result.fields[i].name === 'Сообщение') {
            continue;
          }

          if (result.fields[i].name === 'УрлРаздел') {
            continue;
          }

          str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

        }
        str += '\t' + '</tr>' + '\n';

        for (let j = 0; j < result.rows.length; j++) {

          let row = result.rows[j];
          let cols = '';

          str += '\t' + '<tr>' + '\n';

          let id;
          let message;
          let section;
          let page;

          for (let i = 0; i < result.fields.length; i++) {

            cols = result.fields[i].name;

            if (result.fields[i].name === 'ID-статьи') {
              id = row[cols];
              continue;
            }

            if (result.fields[i].name === 'Сообщение') {
              message = row[cols];
              continue;
            }

            if (result.fields[i].name === 'УрлРаздел') {
              section = row[cols];
              continue;
            }

            str += '\t\t' + '<td>';

            if (result.fields[i].name === 'Дата создания') {

              str += ms.msDateYear(row[cols])

            } else if (result.fields[i].name === 'Раздел') {

              str += '<b>' + row[cols] + '</b>';

            } else if (result.fields[i].name === 'Статус Перейти') {

              if (message && row[cols] === 0) {
                let list = new Article({section: section, template: template, author: id_user, permission: permission});
                let resultList = '';

                try {
                  resultList = yield new Promise(function (resolve, reject) {
                    list.list(function (err, result) {
                      if (err) return reject(err);
                      if (result.rowCount > 0) {
                        return resolve(result);
                      } else {
                        return resolve(null);
                      }
                    });
                  });
                } catch (err) {
                  if (err) return fn(err);
                }

                if (resultList.rowCount > 0) {

                  let j = null;
                  for (let i = 0; i < resultList.rows.length; i++) {

                    if (id === resultList.rows[i]['Редактировать']) {

                      j = i + 1;
                      continue;
                    }
                  }

                  let navArticle = conf.get('article');

                  let limit = navArticle.limit;

                  page = Math.ceil(j / limit);

                  if (page < 1) {
                    page = 1;
                  }

                }
                str += '<a class  ="btn btn-danger btn-xs" href="' + articlePath + '?section=' + section + '&edit=' + id + '&page=' + page + '">отклонено</a>';

              } else if (!message && row[cols] === 0) {

                let list = new Article({section: section, template: template, author: id_user, permission: permission});
                let resultList = '';

                try {
                  resultList = yield new Promise(function (resolve, reject) {
                    list.list(function (err, result) {
                      if (err) return reject(err);
                      if (result.rowCount > 0) {
                        return resolve(result);
                      } else {
                        return resolve(null);
                      }
                    });
                  });
                } catch (err) {
                  if (err) return fn(err);
                }

                if (resultList.rowCount > 0) {

                  let j = null;
                  for (let i = 0; i < resultList.rows.length; i++) {

                    if (id === resultList.rows[i]['Редактировать']) {

                      j = i + 1;
                      continue;
                    }
                  }

                  let navArticle = conf.get('article');

                  let limit = navArticle.limit;

                  page = Math.ceil(j / limit);

                  if (page < 1) {
                    page = 1;
                  }

                }

                str += '<a class="btn btn-warning btn-xs" href="' + articlePath + '?section=' + section + '&edit=' + id + '&page=' + page + '">ожидает</a>';

              } else if (row[cols] === 1) {

                let list = new Article({section: section, template: template, author: id_user, permission: permission});
                let resultList = '';

                try {
                  resultList = yield new Promise(function (resolve, reject) {
                    list.list(function (err, result) {
                      if (err) return reject(err);
                      if (result.rowCount > 0) {
                        return resolve(result);
                      } else {
                        return resolve(null);
                      }
                    });
                  });
                } catch (err) {
                  if (err) return fn(err);
                }

                if (resultList.rowCount > 0) {

                  let j = null;
                  for (let i = 0; i < resultList.rows.length; i++) {

                    if (id === resultList.rows[i]['Редактировать']) {

                      j = i + 1;
                      continue;
                    }
                  }

                  let navArticle = conf.get('article');

                  let limit = navArticle.limit;

                  page = Math.ceil(j / limit);

                  if (page < 1) {
                    page = 1;
                  }
                }

                str += '<a class="btn btn-success btn-xs" href="' + articlePath + '?section=' + section + '&edit=' + id + '&page=' + page + '">public</a>';
              }

            } else {

              if (row[cols]) {
                str += row[cols];
              }

            }

            str += '</td>' + '\n'
          }

          str += '\t' + '</tr>' + '\n';
        }

        str += '</table>' + '\n';
        str += '</div>' + '\n';
        return fn(null, str);
      }
    }
  );
};