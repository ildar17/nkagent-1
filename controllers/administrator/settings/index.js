let url = require('url');
let conf = require('../../../config');
let Template = require('./model/index');
let table = require('../../../lib/tableList');
let menu = require('../../../lib/menu');

exports.list = function (req, res, next) {
  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let sidebar = '';
  let tableTemplate = '';
  let resultLesson = '';
  let administrator = true;
  let id_user = null;
  let users = null;
  let permission = '';
  let Permit = require('../../../lib/permit');

  function accessAdministrator() {

    if (conf.get('administrator') !== req.session.uid) {
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

  function getTableTemplate() {

    let template = new Template({});

    template.getTemplateSort(function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        tableTemplate = result;
        tableTemplate = table.tableTemplate(tableTemplate);
        noend();

      } else {
        noend();
      }
    });
  }

  function updateTemplateSort() {

    if (urlParsed.query.name && urlParsed.query.sort) {

      let templateUpdate = new Template({
        template: urlParsed.query.name,
        template_sort: urlParsed.query.sort
      });

      templateUpdate.setTemplateSort(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          res.redirect(pathname);

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Правка записи не удалась!"
          };
          res.redirect(pathname);
        }
      })

    } else {
      noend();
    }
  }

  function action1() {
    let lesson = new Template({name_role: urlParsed.query.lesson});

    lesson.Lesson(function (err, result) {
      if (err) return next(err);
      if (result.rowCount > 0) {
        resultLesson = result;
        resultLesson = table.tableLesson(resultLesson);
        noend();
      } else {
        noend();
      }
    });
  }


  function listRender() {

    setTimeout(function () {
      res.render('administrator/settings/body', {
        layout: 'administrator',
        title: "Настройка шаблонов",
        sidebar: sidebar,
        tableTemplate: tableTemplate,
        tableLesson: resultLesson,
        administrator: administrator
      });
    }, 100)

  }


  let tasks = [accessAdministrator, accessValue, userMenu, getTableTemplate, updateTemplateSort, action1, listRender];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};