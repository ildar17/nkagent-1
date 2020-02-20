let url = require('url');
let conf = require('../../../config');
let Assign_role = require('./model/index');
let menu = require('../../../lib/menu');
let table = require('../../../lib/tableList');
let sidebar = null;


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let tableUsers = null;
  let roleUsers = null;
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

    if (urlParsed.query.assignRole) {

      let id_user = urlParsed.query.assignRole;

      Assign_role.getOneUser(id_user, function (err, result) {
        if (err) return next(err);

        Assign_role.getAllRoleModerator(function (err, allRoleModerator) {
          if (err) return next(err);

          Assign_role.getRoleUsers(function (err, oneRoleUsers) {

            res.render('administrator/assign-role/body-edit', {
              layout: 'administrator',
              title: "Администратор. Присвоить роль пользователю.",
              tableOneUser: table.tableOneUsers(result, allRoleModerator, oneRoleUsers),
              sidebar: sidebar,
              administrator: administrator
            });
          });
        });
      });

    } else {

      Assign_role.getUsers(function (err, result) {
        if (err) return next(err);
        tableUsers = result;

        Assign_role.getRoleUsers(function (err, result) {
          if (err) return next(err);
          roleUsers = result;
          noend();
        });
      });
    }
  }

  function action3() {

    res.render('administrator/assign-role/body', {
      layout: 'administrator',
      title: "Администратор. Присвоение роли пользователю.",
      tableUsers: table.tableUsers(tableUsers, roleUsers),
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


  function action1() {
    if (conf.get('administrator') !== req.session.uid) {
      res.redirect('/');
    } else {
      noend();
    }
  }


  function action2() {

    if (req.body.administrator.assignRole) {

      let adm = new Assign_role({
        id_user: req.body.administrator.id_user,
        role_id: req.body.administrator.selectRole,
        usersRoleId: req.body.administrator.usersRoleId
      });

      adm.assignRole(function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {
          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Роль присвоена.'
          };
          res.redirect(303, '/admin/administrator/assign-role');
        }
      })

    }
  }


  let tasks = [action1, action2];

  function noend(result) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(result);
  }

  noend();
};