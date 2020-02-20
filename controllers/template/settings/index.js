let Settings = require('./model/index');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');
let url = require('url');
let co = require('co');
let conf = require('../../../config');
let ms = require('../../../lib/msDate')

exports.list = function (req, res, next) {


  res.locals.urlPage = req.url;
  let administrator = true;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let temp = '';
  let resultList = '';
  let formValue = '';
  let permission = '00000';
  let users = null;
  let action = {};
  let sidebar = '';
  let permitForm = '';
  let id_user = null;
  let publicForm = null;
  let yesPage = true;
  let nameTemplate = '';
  let value = '';
  let titleHead = '';
  let start;
  let final;
  let resultStrDate = '';
  let citySelect = '';

  function getSection() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          nameTemplate = result.rows[0].name;
          temp = result.rows[0].temp;
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

        if (conf.get('administrator') !== req.session.uid) {
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
        message: 'У Вас нет прав доступа к шаблону "settings".'
      };

      yesPage = false;

      res.render('template/settings/body',
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

  function getDate() {

    Settings.listDate(function (err, result) {

      if (err) return next(err);

      if (result.rowCount > 0) {

        start = result.rows[0].date_start;
        final = result.rows[0].date_final;

        start = ms.msDateYear(start);
        final = ms.msDateYear(final);

        if (start || final) {
          resultStrDate = '<p><b>Начальная дата: ' + start + ', конечная дата ' + final + '</b></p>'
        } else {
          resultStrDate = '<p><b>Начальная и конечная дата не установлены</b></p>'
        }
        noend();

      } else {
        noend();
      }
    })
  }

  function getCity() {

    selectSity(function (err, result) {
      if (err) return next(err);

      citySelect = result;

      noend();

    })
  }

  function listRender() {

    action.create = true;
    action.edit = false;
    action.drop = false;
    action.backward = false;

    res.render('template/' + temp + '/body',
      {
        layout: 'admin',
        urlPage: req.url,
        titleHead: nameTemplate,
        title: nameTemplate,
        formValue: formValue,
        permit: permitForm,
        action: action,
        permission: permission,
        sidebar: sidebar,
        template: temp,
        table: resultList,
        publicForm: publicForm,
        administrator: administrator,
        yesPage: yesPage,
        resultStrDate: resultStrDate,
        selectCity: citySelect
      }
    );

  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, getDate, getCity, listRender];

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
  let users = null;
  let temp = '';
  let administrator = true;
  let value = '';
  let id_user = null;
  let nameTemplate = '';
  let sidebar = '';
  let yesPage = true;

  function getSection() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          nameTemplate = result.rows[0].name;
          temp = result.rows[0].temp;
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
        message: 'У Вас нет прав доступа к шаблону "settings".'
      };

      yesPage = false;

      res.render('template/settings/body',
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

  //Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

  function submitCreateCity() {

    if (value.defaultCity) {

      if (permission.indexOf('1', 3) === 3) {

        Settings.setDefaultCity(value.defaultCity, function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Город по умолчанию установлен.'
            };
            res.redirect(pathname);

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Город по умолчанию не удалось установить."
            };
            res.redirect(pathname);

          }
        })
      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "У Вас нет прав на сохранение."
        };
        res.redirect(pathname);
      }
    } else {
      noend();
    }
  }

  function submitCreateDate() {

    if (value.createDate) {

      if (permission.indexOf('1', 3) === 3) {

        let msStart = +new Date(value.start);
        let msFinal = +new Date(value.final);

        Settings.recordEntryTime(msStart, msFinal, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Даты установлены.'
            };
            res.redirect(pathname);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Даты не удалось установить."
            };
            res.redirect(pathname);
          }
        })

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на сохранение."
        };
        res.redirect(pathname);
      }

    } else {
      noend();
    }


  }

  function render() {
    res.redirect(pathname);
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, submitCreateCity, submitCreateDate, render];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};


function selectSity(fn) {

  let select;
  let selected = 'selected';


  Settings.getDefaultCity(function (err, result) {
    if (err) return fn(err);

    if(result.rowCount > 0){

      selected = '';

    }

    Settings.getCity(function (err, result) {
      if (err) return fn(err);

      if (result.rowCount > 0) {

        select += '<option '+selected+' value="0">Не выбран</option>' + '\n';

        for (let i = 0; i < result.rows.length; i++) {

          if (result.rows[i].select_default === 1) {

            select += '<option selected value="' + result.rows[i].id_city + '">' + result.rows[i].title + '</option>' + '\n';

          } else {

            select += '<option value="' + result.rows[i].id_city + '">' + result.rows[i].title + '</option>' + '\n';

          }
        }


      } else {
        select += '<option value="">Не внесены города</option>' + '\n';
      }

      return fn(null, select);
    })

  });
}