let url = require('url');
let conf = require('../../../config');
let Configure_access = require('./model/index');
let menu = require('../../../lib/menu');
let table = require('../../../lib/tableList');
let sidebar = null;
let Permit = require('../../../lib/permit');
let co = require('co');
let async = require('async');


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let nameRole = null;
  let tableRole = null;
  let id_role = null;
  let administrator = true;
  let id_user = null;
  let users = null;
  let permission = '';


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

  function actionPermit1() {

    id_role = urlParsed.query.tuneRole;

    if (urlParsed.query.tuneRole) {

      Permit.getOneRole(id_role, function (err, result) {
        if (err) return next(err);
        if (result.rowCount === 1) {
          nameRole = result.rows[0].name_role;
          noend();
        } else if (result.rowCount === 0) {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нет такой роли."
          };
          res.redirect(303, '/admin/administrator/configure-access');
        }
      });

    } else {
      noend();
    }
  }


  function action2() {

    if (urlParsed.query.tuneRole) {

      Permit.getPermit(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          let tableTuneRole = '';

          table.tableTuneRole(result, id_role, req.hostname, function (err, result) {
            if (err) return next(err);

            tableTuneRole = result;

            res.render('administrator/configure-access/body-edit', {
              layout: 'administrator',
              title: "Администратор. Настроить роль:" + ' "' + nameRole + '".',
              tableTuneRole: tableTuneRole,
              sidebar: sidebar,
              administrator: administrator
            });

          });

        } else if (result.rowCount === 0) {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нет регистрации страниц с правами доступа."
          };

          res.redirect(303, '/admin/administrator/configure-access');
        }
      });

    } else {

      let adm = new Configure_access({});

      adm.getRole(function (err, result) {
        if (err) return next(err);
        tableRole = result;
        noend();
      });
    }
  }

  function action3() {

    res.render('administrator/configure-access/body', {
      layout: 'administrator',
      title: "Администратор. Присвоение прав доступа роли.",
      tableRole: table.tableListRole1(tableRole),
      sidebar: sidebar,
      administrator: administrator
    });

  }


  let tasks = [action1, accessValue, userMenu, actionPermit1, action2, action3];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

exports.submit = function (req, res, next) {

  function action1() {
    if (conf.get('administrator') !== req.session.uid) {
      res.redirect('/');
    } else {
      noend();
    }
  }

  function lengthObject() {

    let objRole = req.body.administrator;
    let id_role = req.body.administrator.id_role;
    let arrCheck = unique(objRole.check.split(','));

    delete objRole.id_role;
    delete objRole.check;
    delete objRole.createTuneRole;

    async.every(arrCheck, (value, callback) => {
      let code = 0;
      let arrCode = objRole[value];

      if (!arrCode) {
        objRole[value] = '0';
      }
      arrCode = objRole[value];

      if(typeof arrCode === 'object'){

        for(let prop in arrCode){
          code += Number(arrCode[prop]);
        }

      } else if(typeof arrCode === 'string'){
        code += Number(arrCode);
      }

      let len = String(code).length;
      if (len === 1) code = '0000' + code.toString();
      if (len === 2) code = '000' + code.toString();
      if (len === 3) code = '00' + code.toString();
      if (len === 4) code = '0' + code.toString();
      if (len === 5) code = code.toString();

      Permit.setAccess(id_role, value, code, function (err, result) {
        if (err) return callback(err);
        if(result.rowCount > 0){
          callback(null, !err)
        }
      });

    }, function(err, result) {
      if(err) next(err);
      if(result){
        req.session.flash = {
          type: 'success',
          intro: 'Успех!',
          message: 'Изменения сохранены.'
        };
        res.redirect('back');
      }
    })
  }

  let tasks = [action1, lengthObject];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

function unique(arr) {
  let result = [];

  nextInput:
    for (let i = 0; i < arr.length; i++) {
      let str = arr[i]; // для каждого элемента
      for (let j = 0; j < result.length; j++) { // ищем, был ли он уже?
        if (result[j] == str) continue nextInput; // если да, то следующий
      }
      result.push(str);
    }

  return result;
}





