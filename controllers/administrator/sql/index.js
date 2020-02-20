var SQL = require('./model/index');
var table = require('../../../lib/tableList');
var conf = require('../../../config');
var url = require('url');
var menu = require('../../../lib/menu');
var sidebar = null;


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  var urlParsed = url.parse(req.url, true);
  var pathname = urlParsed.pathname;
  var administrator = true;
  let id_user = null;
  let users = null;
  let permission = '';
  let Permit = require('../../../lib/permit');

  function entrance() {

    if (conf.get('administrator') != req.session.uid) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка доступа!',
        message: 'Вы не администратор сайта.'
      };

      res.redirect(303, '/admin/template/admin');
    } else {
      noend();
    }
  }

  function accessValue() {

    let permit = new Permit({
      url: urlParsed.pathname,
      email: req.session.uid
    });

    permit.accessModerator(function (err, result) {
      if (err) return next(err);

      id_user = result.rows[0].id_user;

      if (req.admin !== req.session.uid) {

        if (result.rows[0].role_id == null) {
          administrator = false;
          users = 1;
        } else {
          administrator = false;
          users = 0;
        }
      }

      permit.access(function (err, result) {
        if (err) return next(err);

        permission = result;

        noend();
      });
    });
  }

  function userMenu() {

    menu.adminMenu(permission, null, req.session.uid, urlParsed, function (err, result) {
      if (err) return next(err);

      sidebar = result;

      noend();
    });
  }

  function viewsQuery() {

    if (urlParsed.query.viewsQuery) {

      SQL.getQuery(urlParsed.query.viewsQuery, function (err, result) {
        if (err) return next(err);

        if (result.rowCount == 1) {

          req.session._viewsQuery = result.rows[0].query;

          res.redirect(303, '/admin/administrator/sql');

        } else {

          noend();
        }
      })

    } else {
      noend();
    }
  }

  function saveQuery() {

    if (urlParsed.query.saveQuery) {

      SQL.saveQueryNotebook(urlParsed.query.saveQuery, function (err, result) {
        if (err) return next(err);

        if (result.rowCount == 1) {
          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Запрос добавлен в блокнот.'
          };
          res.redirect(pathname);
        }
      })

    } else if (urlParsed.query.editQuery) {

      SQL.getOneNotebook(urlParsed.query.editQuery, function (err, result) {
        if (err) return next(err);

        res.render('administrator/sql/body-edit', {
          layout: 'administrator',
          title: "Администратор. Внести пометки в блокнот.",
          tableEditQuery: table.tableEditQuery(result),
          formEditQuery: result.rows[0],
          sidebar: sidebar,
          administrator: administrator

        });

      });

    } else {

      noend();

    }
  }

  function deleteQuery() {


    if (urlParsed.query.dropQuery) {

      SQL.deleteQueryArchive(urlParsed.query.dropQuery, function (err, result) {
        if (err) return next(err);

        if (result.rowCount == 1) {
          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Запрос удалён.'
          };
          res.redirect(pathname);
        }
      })

    } else {

      noend();
    }
  }

  function listRender() {

    SQL.getArchive(function (err, resultArchive) {
      if (err) return next(err);


      SQL.getNotebook(function (err, resultNotebook) {
        if (err) return next(err);

        res.render('administrator/sql/body', {
          layout: 'administrator',
          title: "Администратор. Работа с SQL запросами.",
          archive: table.tableArchiveSQL(resultArchive),
          notebook: table.tableNotebookSQL(resultNotebook),
          sidebar: sidebar,
          administrator: administrator

        });

      });
    });
  }

  var tasks = [entrance, accessValue, userMenu, viewsQuery, saveQuery, deleteQuery, listRender];

  function noend() {
    var currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();
};

///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

exports.submit = function (req, res, next) {

  res.locals.urlPage = req.url;
  var urlParsed = url.parse(req.url, true);
  var pathname = urlParsed.pathname;
  var query = '';
  var error = null;
  var title = '';
  var horizontally = null;
  var administrator = true;

  function entrance() {

    if (conf.get('administrator') != req.session.uid) {
      res.redirect('/');
    } else {
      noend();
    }
  }

  function editQuery() {

    if (req.body.sql.editQuery) {

      var id_sql = urlParsed.query.editQuery;

      if (req.body.sql.tags.length > 60) {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: req.body.sql.tags + ' - должно быть не боле 60 символов!'
        };
        res.redirect(303, 'back');
      } else if (req.body.sql.tags == ' ') {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: req.body.sql.tags + ' - не может быть пробелом!'
        };
        res.redirect(303, 'back');
      } else if (req.body.sql.description.length > 1000) {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: req.body.sql.description + ' - должно быть не боле 1000 символов!'
        };
        res.redirect(303, 'back');
      } else if (req.body.sql.description == ' ') {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: req.body.sql.description + ' - не может быть пробелом!'
        };
        res.redirect(303, 'back');
      } else if (req.body.sql.priority.length > 12) {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: req.body.sql.priority + ' - должно быть не боле 12 символов!'
        };
        res.redirect(303, 'back');
      } else if (req.body.sql.priority == ' ') {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: req.body.sql.priority + ' - не может быть пробелом!'
        };
        res.redirect(303, 'back');
      } else {

        var editSQL = new SQL({

          id_sql: id_sql,
          tags: req.body.sql.tags.trim(),
          description: req.body.sql.description.trim(),
          priority: (req.body.sql.priority * 1)

        });

        editSQL.editSQL(function (err, result) {
          if (err) return next(err);

          if (result.rowCount == 1) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Поля формы изменены.'
            };
            res.redirect(303, 'back');
          }
        })
      }
    }

    noend();
  }

  function createSQL() {

    var sqltable = '';

    if (req.body.sql.horizontally == 1) horizontally = 1;
    if (req.body.sql.horizontally == 0) horizontally = 0;

    if (req.body.sql.create) {

      query = req.body.sql.query;
      var hidden = req.body.sql.hidden;

      if (query == ' ') {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Полe не может быть пробелом!"
        };
        res.redirect(303, 'back');
      } else if (query.length < 1) {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Полe обязательно для заполнения!"
        };
        res.redirect(303, 'back');
      } else {

        query = query.trim();

        if (query.indexOf(';', query.length - 1) == query.length - 1) {
          query = query.substring(0, query.length - 1);
        }

        SQL.resultQuery(query, function (err, result) {

          //console.log(result);

///////////////ERROR///////////////
          if (err) {

            error = err.message;

            var sql = new SQL({
              command: 'ERROR',
              error: error,
              query: query,
              date: Date.now()
            });

            sql.saveArchive(function (errSave, resultSave) {
              if (errSave) return next(errSave);

              if (resultSave.rowCount != 1) {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "В архив не сохраняются запросы!"
                };
                res.redirect(pathname);
              }

              SQL.getArchive(function (errArchive, resultArchive) {
                if (errArchive) return next(errArchive);

                SQL.getNotebook(function (errNotebook, resultNotebook) {
                  if (errNotebook) return next(errNotebook);

                  table.tableSQL(title, hidden, horizontally, query, error, result, function (err, result) {
                    if (err) return next(err);
                    sqltable = result;

                    res.render('administrator/sql/body', {
                      layout: 'administrator',
                      table: sqltable,
                      archive: table.tableArchiveSQL(resultArchive),
                      notebook: table.tableNotebookSQL(resultNotebook),
                      sidebar: sidebar,
                      administrator: administrator

                    });
                  });

                });

              });

            });
////////////////SELECT//////////////////////////////////////
          } else {

            if (result.command == 'SELECT') {

              title = '<h5><em>Строк</em>: <span class="res">' + result.rowCount + '</span><br> <em>Запрос</em>: <span class="res">' + query + '</span></h5>\n';

              var sql = new SQL({
                command: result.command,
                error: error,
                query: query,
                date: Date.now()
              });

              sql.saveArchive(function (errSave, resultSave) {
                if (errSave) return next(errSave);

                if (resultSave.rowCount != 1) {
                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "В архив не сохраняются запросы!"
                  };
                  res.redirect(pathname);
                }

                SQL.getArchive(function (errArchive, resultArchive) {
                  if (errArchive) return next(errArchive);

                  SQL.getNotebook(function (errNotebook, resultNotebook) {
                    if (errNotebook) return next(errNotebook);

                    table.tableSQL(title, hidden, horizontally, query, error, result, function (err, result) {
                      if (err) return next(err);
                      sqltable = result;


                      res.render('administrator/sql/body', {
                        layout: 'administrator',
                        table: sqltable,
                        archive: table.tableArchiveSQL(resultArchive),
                        notebook: table.tableNotebookSQL(resultNotebook),
                        sidebar: sidebar,
                        administrator: administrator

                      });
                    });
                  });
                });
              });
            }
/////////////////DELETE INSERT UPDATE CREATE DROP////////////////////////////////

            if (result.command == 'DELETE' || result.command == 'UPDATE' || result.command == 'DROP'
              || result.command == 'INSERT' || result.command == 'CREATE' || result.command == 'ALTER') {

              title = '<h5><em>Строк</em>: <span class="res">' + result.rowCount + '</span><br> <em>Запрос</em>: <span class="res">' + query + '</span></h5>\n';

              var sql = new SQL({
                command: result.command,
                error: error,
                query: query,
                date: Date.now()
              });

              sql.saveArchive(function (errSave, resultSave) {
                if (errSave) return next(errSave);

                if (resultSave.rowCount != 1) {
                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "В архив не сохраняются запросы!"
                  };
                  res.redirect(pathname);
                }

                SQL.getArchive(function (errArchive, resultArchive) {
                  if (errArchive) return next(errArchive);

                  SQL.getNotebook(function (errNotebook, resultNotebook) {
                    if (errNotebook) return next(errNotebook);

                    table.tableSQL(title, hidden, horizontally, query, error, result, function (err, result) {
                      if (err) return next(err);
                      sqltable = result;

                      res.render('administrator/sql/body', {
                        layout: 'administrator',
                        table: sqltable,
                        archive: table.tableArchiveSQL(resultArchive),
                        notebook: table.tableNotebookSQL(resultNotebook),
                        sidebar: sidebar,
                        administrator: administrator
                      });

                    });

                  });

                });

              });
            }
/////////////////////////////////////////////////////////////////////
          }
        });
      }
    }

    noend();
  }

  var tasks = [entrance, editQuery, createSQL];

  function noend() {
    var currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};


