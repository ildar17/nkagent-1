let url = require('url');
let conf = require('../../../config');
let Create_role = require('./model/index');
let table = require('../../../lib/tableList');
let menu = require('../../../lib/menu');
let valid = true;
let sidebar = null;
let tableRole = null;


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let administrator = true;
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

    if (urlParsed.query.dropRole) {
      let dropRole = urlParsed.query.dropRole;

      let adm = new Create_role({
        dropRole: dropRole
      });

      adm.deleteRole(function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {
          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Роль удалена.'
          };
          res.redirect(303, '/admin/administrator/create-role');
        }
      });

    } else if (urlParsed.query.editRole) {

      let editRole = urlParsed.query.editRole;

      let adm = new Create_role({editRole: editRole});

      adm.getOneRole(function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {
          let nameRole = result.rows[0].name_role;
          let status = result.rows[0].users;
          let payment_price = null;
          let no_payment_price = null;
          let null_payment_price = false;

          if(result.rows[0].payment_price === null){
            null_payment_price = true;
          }

          if(result.rows[0].payment_price === 1){
            payment_price = result.rows[0].payment_price;
          }

          if(result.rows[0].payment_price === 2){
            no_payment_price = result.rows[0].payment_price;
          }


          res.render('administrator/create-role/body-edit', {
            layout: 'administrator',
            title: "Администратор. Переименование роли.",
            nameRole: nameRole,
            status: status,
            payment_price: payment_price,
            no_payment_price: no_payment_price,
            null_payment_price: null_payment_price,
            sidebar: sidebar,
            administrator: administrator

          });
        }
      });

    } else {

      let adm = new Create_role({});

      adm.getRole(function (err, result) {
        if (err) return next(err);
        tableRole = result;
        noend();
      });
    }
  }

  function action3() {

    res.render('administrator/create-role/body', {
      layout: 'administrator',
      title: "Администратор. Создание роли.",
      tableRole: table.tableListRole(tableRole),
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

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

exports.submit = function (req, res, next) {
  res.locals.urlPage = req.url;

  function action1() {
    if (conf.get('administrator') !== req.session.uid) {
      res.redirect('/');
    } else {
      noend();
    }
  }

  function validate() {

    if (req.body.administrator.nameRole.length > 60) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: req.body.administrator.nameRole + ' - должно быть не более 60 символов!'
      };
      res.redirect(303, 'back');
    } else if (req.body.administrator.users.length > 1) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: req.body.administrator.users + ' - должно быть не более 1 символа!'
      };

      res.redirect(303, 'back');
    } else if (req.body.administrator.nameRole === ' ' || req.body.administrator.nameRole === '') {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Поле \"Название роли\" не может быть пустым"
      };
      res.redirect(303, 'back');
    } else if (req.body.administrator.users === ' ') {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Поле \"Статус роли\" не может быть пробелом"
      };
      res.redirect(303, 'back');
    } else if (valid) {
      noend();
    }
  }

  function action2() {

    if (req.body.administrator.createRole) {

      let nameRole = req.body.administrator.nameRole.trim();
      let users = req.body.administrator.users;
      let paymentPrice = req.body.administrator.payment_price;

      if (valid === true) {
        let adm = new Create_role({
          nameRole: nameRole,
          users: users,
          paymentPrice: paymentPrice
        });

        let roleStatus;
        if (users) {
          roleStatus = 'пользователи';
        } else {
          roleStatus = 'модераторы';
        }

        adm.saveRole(function (err, result) {
          if (err) return next(err);

          if (result.rowCount === 1) {

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Роль ' + '"' + nameRole + '"' + ' со статусом ' + '"' + roleStatus + '"' + ' созданы.'
            };
            res.redirect(303, 'back');
          }
        })
      }

    }

    if (req.body.administrator.editRole) {

      let nameRole = req.body.administrator.nameRole.trim();
      let users = req.body.administrator.users;
      let paymentPrice = req.body.administrator.payment_price;

      if (valid === true) {

        let urlParsed = url.parse(req.url, true);

        let adm = new Create_role({
          id_role: urlParsed.query.editRole,
          nameRole: nameRole,
          users: users,
          paymentPrice: paymentPrice
        });

        let roleStatus;
        if (users) {
          roleStatus = 'пользователь после регистрации';
        } else {
          roleStatus = 'модератор';
        }

        let pricePayment;
        if (paymentPrice) {
          pricePayment = 'оплатил';
        } else {
          pricePayment = 'по умолчанию';
        }

        adm.editRole(function (err, result) {
          if (err) return next(err);

          if (result.rowCount === 1) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Роль ' + '"' + nameRole + '"' + ' статус роли ' + '"' + roleStatus + '"' + ' оплата прайса ' + '"' + pricePayment + '"' + ' сохранены.'
            };
            res.redirect(303, '/admin/administrator/create-role');
          }
        });
      }
    }

  }

  let tasks = [action1, validate, action2];

  function noend(result) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(result);
  }

  noend();
};