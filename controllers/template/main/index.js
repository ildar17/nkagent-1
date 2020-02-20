let Main = require('./model/index');
let conf = require('../../../config');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');
let url = require('url');
let async = require('async');
let sidebar = '';

exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let administrator = true;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let temp = '';
  let nameTemplate = '';
  let id_permit = null;
  let permitForm = '';
  let id_user = null;
  let id_role = null;
  let permission = '00000';
  let users = null;
  let yesPage = true;
  let action = {};
  let formValue = '';
  let titlePage = '';

  function getSection() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);
        if (result.rowCount === 1) {

          temp = result.rows[0].temp;
          nameTemplate = result.rows[0].name;
          id_permit = Number(result.rows[0].id_permit);

          noend();

        } else {

          noend();
        }
      });
    }
  }

  function initialization() {

    if (req.admin === req.session.uid) {

      let permit = new Permit({
        url: pathname,
        email: req.session.uid
      });

      permit.init(function (err, result) {
        if (err) return next(err);

        if (result.command === 'SELECT') {

          permit.form(function (err, result) {
            if (err) return next(err);

            if (result.rowCount !== 0) {

              permitForm = result;
              noend();
            }
          });
        }

        if (result.command === 'INSERT') {
          res.redirect(303, pathname);
        }

        if (result.command === 'UPDATE') {

          permit.form(function (err, result) {
            if (err) return next(err);

            if (result.rowCount !== 0) {
              permitForm = result;
              noend();
            }
          });
        }
      });

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

      id_user = Number(result.rows[0].id_user);
      id_role = Number(result.rows[0].role_id);

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

        if (req.admin !== req.session.uid) {
          permitForm = '';
        }

        noend();
      });
    });
  }

  function userMenu() {

    menu.adminMenu(permission, users, req.session.uid, urlParsed, function (err, result) {
      if (err) return next(err);
      sidebar = result;
      noend();
    });
  }

  function accessTemplate() {

    if (permission === '00000') {

      res.locals.flash = {
        type: 'danger',
        intro: 'Ошибка доступа!',
        message: 'У Вас нет прав доступа к шаблону "main".'
      };

      yesPage = false;

      res.render('template/cottages/body',
        {
          layout: 'admin',
          sidebar: sidebar,
          yesPage: yesPage,
          administrator: administrator
        }
      );
    } else {
      noend();
    }
  }
  
  function firstPage() {

    Main.getPage(temp, function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){

        formValue = result.rows[0];

        action.create = false;
        action.edit = true;

        noend();

      } else {

        action.create = true;
        action.edit = false;

        noend();
      }

    });
  }

  function listRender() {

    titlePage = nameTemplate;

    res.render('template/main/body', {
      layout: 'admin',
      urlPage: req.url,
      titleHead: nameTemplate,
      title: titlePage,
      formValue: formValue,
      permit: permitForm,
      action: action,
      permission: permission,
      sidebar: sidebar,
      template: temp,
      administrator: administrator,
      yesPage: yesPage
    });
  }



  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, firstPage, listRender];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};


exports.submit = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let permission = '00000';
  let temp = '';
  let nameTemplate = '';
  let value = '';
  let id_user = null;
  let administrator = true;
  let users = null;
  let sidebar = '';
  let yesPage = true;

  function getSection() {
    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {

          temp = result.rows[0].temp;
          nameTemplate = result.rows[0].name;
          value = req.body[temp];

          noend();

        } else {

          noend();

        }
      });
    }
  }

  function initialization() {

    if (req.admin === req.session.uid) {

      let permit = new Permit({
        url: pathname,
        email: req.session.uid,
        submit: req.body
      });

      permit.init(function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1 && result.command === 'UPDATE') {
          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Права доступа адреса изменены.'
          };
          res.redirect(303, pathname);

        } else {
          noend();
        }
      });

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

    menu.adminMenu(permission, users, req.session.uid, urlParsed, function (err, result) {
      if (err) return next(err);
      sidebar = result;
      noend();
    });
  }

  function accessTemplate() {

    if (permission === '00000') {

      res.locals.flash = {
        type: 'danger',
        intro: 'Ошибка доступа!',
        message: 'У Вас нет прав доступа к шаблону "cottages".'
      };

      yesPage = false;

      res.render('template/cottages/body',
        {
          layout: 'admin',
          sidebar: sidebar,
          yesPage: yesPage,
          administrator: administrator
        }
      );
    } else {
      noend();
    }
  }

  function submitAccess() {

    if (value.create) {

      if (permission.indexOf('1', 3) === 3) {

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на создание объекта недвижимости."
        };
        res.redirect(303, '/admin/template/admin');
      }

    } else if (value.edit) {

      if (permission.indexOf('1', 2) === 2) {

        noend();

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на правку объекта недвижимости."
        };
        res.redirect(303, '/admin/template/admin');
      }

    } else if (value.drop) {

      if (permission.indexOf('1', 1) === 1) {

        noend();

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на удаление объекта недвижимости."
        };
        res.redirect(303, '/admin/template/admin');
      }

    } else {

      noend();
    }

  }

  function submitCreate(){

    if(value.create){

      let create = new Main({
        value: value,
        date_create: Date.now(),
        author: id_user,
        template: temp
      });

      create.save(function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Запись сохранена.'
          };
          res.redirect(303, pathname);

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "Запись не сохранена."
          };
          res.redirect(303, pathname);
        }

      });

    } else {
      noend();
    }

  }

  function submitEdit(){

    if(value.edit){

      let create = new Main({
        value: value,
        date_edit: Date.now(),
        author_edit: id_user,
        template: temp
      });

      create.edit(function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Запись изменена.'
          };
          res.redirect(303, pathname);

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "Запись не изменена."
          };
          res.redirect(303, pathname);
        }

      });

    } else {
      next();
    }
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, submitAccess, submitCreate, submitEdit];


  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};