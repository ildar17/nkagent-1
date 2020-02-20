let url = require('url');
let conf = require('../../../config');
let Section_name = require('./model/index');
let menu = require('../../../lib/menu');
let table = require('../../../lib/tableList');
let sidebar = null;
let tableRoleUrl = null;
let valid = true;


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let administrator = true;
  let pathname = urlParsed.pathname;
  let id_user = null;
  let users = null;
  let permission = '';
  let Permit = require('../../../lib/permit');

  function action1() {

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

  function action2() {

    if (urlParsed.query.addName) {

      let id_permit = urlParsed.query.addName;

      let adm = new Section_name({
        id_permit: id_permit
      });


      adm.getOnePermit(function (err, result) {
        if (err) return next(err);

        let url = req.hostname + result.url_temp;
        let temp = result.temp;
        let reference = 'Псевдоним раздела: ' + '<strong>' + temp + '.</strong> ' + 'Путь к разделу: ' + '<strong>' + url + '</strong>. ';

        res.render('administrator/section-name/body-edit', {

          layout: 'administrator',
          title: "Администратор. Переименование раздела, присвоение приоритета.",
          reference: reference,
          formNamePermit: result.name,
          priority: result.priority,
          sidebar: sidebar,
          administrator: administrator

        });
      });

    } else if (urlParsed.query.dropRolePage) {

      Section_name.dropRolePage(urlParsed.query.dropRolePage, function (err, result) {
        if (err) return next(err);
        if (result.rowCount > 0) {
          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Раздел и все связанные с ним данные удалены.'
          };
          res.redirect(303, '/admin/administrator/section-name');
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "Шаблон не удалился."
          };
          res.redirect(303, pathname);
        }
      })

    } else {

      let adm = new Section_name({});

      adm.getRoleUrl(function (err, result) {
        if (err) return next(err);
        tableRoleUrl = result;
        noend();
      });
    }
  }

  function action3() {

    res.render('administrator/section-name/body', {
      layout: 'administrator',
      title: "Администратор. Переименование разделов.",
      tableRoleUrl: table.tableListRoleUrl(tableRoleUrl, req.hostname),
      sidebar: sidebar,
      administrator: administrator
    });

  }


  let tasks = [action1, accessValue, userMenu, action2, action3];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////


exports.submit = function (req, res, next) {
  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);

  function action1() {
    if (conf.get('administrator') !== req.session.uid) {
      res.redirect('/');
    } else {
      noend();
    }
  }

  function validate() {

    if (req.body.administrator.name.length > 60) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: req.body.administrator.name + ' - должно быть не более 60 символов!'
      };
      res.redirect(303, 'back');
    } else if (req.body.administrator.priority.length > 12) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: req.body.administrator.priority + ' - должно быть не более 12 символа!'
      };

      res.redirect(303, 'back');
    } else if (req.body.administrator.name === ' ' || req.body.administrator.name === '') {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Поле \"Название раздела\" не может быть пустым"
      };
      res.redirect(303, 'back');
    } else if (req.body.administrator.priority === ' ' || req.body.administrator.priority === '') {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Поле \"Приоритет\" не может быть пустым"
      };
      res.redirect(303, 'back');
    } else if (valid) {
      noend();
    }
  }

  function action2() {

    if (req.body.administrator.addName) {

      let id_permit = urlParsed.query.addName;

      let adm = new Section_name({
        id_permit: id_permit,
        name: req.body.administrator.name,
        priority: req.body.administrator.priority
      });

      adm.addNamePermit(function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Название раздела сохранено.'
          };

          res.redirect(303, '/admin/administrator/section-name');
        }
      })

    }
  }

  let tasks = [action1, validate, action2];

  function noend(result) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(result);
  }

  noend();
};