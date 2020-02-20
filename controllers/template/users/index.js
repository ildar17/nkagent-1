let conf = require('../../../config/index');
let Auth = require('../../auth/model/index');
let Admin = require('../admin/model/index');
let Userss = require('./model/index');
let menu = require('../../../lib/menu');
let dataFormat = require('../../../lib/dataFormat');
let Permit = require('../../../lib/permit');
let url = require('url');
let co = require("co");
let Mailer = require('../../../lib/mailer');
const callsites = require('callsites');
let async = require('async');
let fs = require('fs');


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let temp = '';
  let nameSection = '';
  let resultList = '';
  let permission = '00000';
  let users = null;
  let sidebar = '';
  let permitForm = '';
  let formValue = '';
  let select = '';
  let form = false;
  let administrator = true;
  let action = {};
  let idUsers = null;
  let urlPage = '';
  let yesPage = true;


  function getSection() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          temp = result.rows[0].temp;
          nameSection = result.rows[0].name;

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
      url: pathname,
      email: req.session.uid
    });

    permit.accessModerator(function (err, result) {
      if (err) return next(err);

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
        message: 'У Вас нет прав доступа к шаблону "user".'
      };

      res.render('template/users/body',
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

  function listAccess() {

    if (permission.indexOf('1', 3) === 3 || users == null) {
      form = true;
    }

    if (urlParsed.query.edit) {

      if (permission.indexOf('1', 2) === 2) {
        form = true;
        noend();

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на правку."
        };
        res.redirect(303, pathname);
      }

    } else if (urlParsed.query.drop) {

      if (permission.indexOf('1', 1) === 1) {

        form = true;
        noend();

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "У Вас нет прав на удаление!"
        };
        res.redirect(303, pathname);
      }

    } else {
      noend();
    }
  }

  function listEditRole() {

    if (urlParsed.query.editRole) {

      let page = urlParsed.query.page;

      let user = new Userss({id: urlParsed.query.editRole});

      user.getUser(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          if (result.rows[0].role_id === null) {

            user.assignModeratorRole(function (err, result) {
              if (err) return next(err);

              if (result === null) {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка проверки!',
                  message: "Не создана роль риелтора без оплаты прайса."
                };
                res.redirect(pathname);

              } else if (result.rowCount > 0) {

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Роль присвоена.'
                };
                res.redirect(303, pathname + '?page=' + page);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Роль не присвоилась, обратитесь к администратору сайта."
                };
                res.redirect(pathname);
              }

            })

          } else {

            user.assignUserRole(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Роль присвоена.'
                };
                res.redirect(303, pathname + '?page=' + page);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Роль не присвоилась, обратитесь к администратору сайта."
                };
                res.redirect(pathname);
              }
            })
          }

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Роль не присвоилась, обратитесь к администратору сайта."
          };
          res.redirect(pathname);
        }
      })

    } else {
      noend();
    }
  }

  function listEdit() {

    if (urlParsed.query.edit) {

      action.edit = true;
      action.drop = false;
      action.create = false;

      let edit = new Userss(
        {
          id: urlParsed.query.edit,
          template: temp
        }
      );

      edit.getUserForm(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          formValue = result.rows[0];
          noend();

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нет такого пользователя!"
          };
          res.redirect(303, pathname);
        }

      });

    } else {
      noend();
    }
  }

  function listDrop() {

    if (urlParsed.query.drop) {

      action.drop = true;
      action.create = false;
      action.edit = false;

      let drop = new Userss(
        {
          id: urlParsed.query.drop,
          template: temp
        }
      );

      drop.getUserForm(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          formValue = result.rows[0];
          noend();

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нет такого пользователя!"
          };
          res.redirect(303, pathname);
        }

      });

    } else {
      noend();
    }
  }

  function selectAgency() {

    Userss.getAgency(function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        select += '<option value="">Не состоит в агенстве</option>' + '\n';

        for (let i = 0; i < result.rows.length; i++) {

          if (formValue.agency === Number(result.rows[i].id)) {
            select += '<option selected value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
          } else {
            select += '<option value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
          }
        }

        noend();
      } else {
        select += '<option value="">Нет агенств для присвоения</option>' + '\n';
        noend();
      }
    })
  }

  function listTable() {

    let userTable = new Userss({
      users: users,
      email: req.session.uid,
      permission: permission
    });

    userTable.list(function (err, result) {
      if (err) return next(err);

      if (result === '') {

        resultList = '';

        noend();

      } else if (result.rowCount > 0) {

        resultList = result;


        urlPage = urlParsed.query.page;
        let limit = 50;
        let linkLimit = 10;
        let offset = urlPage * limit - limit;

        if (offset < 0 || !offset) offset = 0;


        userTable.listLimit(limit, offset, function (err, resultLimit) {
          if (err) return next(err);

          if (result === '') {

            resultList = '';

            noend();

          } else if (result.rowCount > 0) {

            resultList = Userss.tableListUsers(permission, resultList, urlParsed, limit, linkLimit, urlPage, resultLimit, req);

            noend();
          }

        });

      } else {
        noend();
      }

    });
  }

  function nextPass() {

    Userss.maxIdUsers(function (err, result) {
      if (err) return next(err);
      if (result.rowCount > 0) {
        idUsers = result.rows[0].max * 1 + 1;
        noend();
      } else {
        noend();
      }

    })

  }

  function listRender() {

    //Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

    if (action.edit || action.drop) {

      action.create = false;
    } else {
      action.create = true;
    }

    let backward = '';

    if (urlPage) {
      backward = '?page=' + urlPage
    }

    if(permission.indexOf('1', 4) !== 4){
      form = false;
    }


    res.render('template/' + temp + '/body',
      {
        layout: 'admin',
        title: 'Администрирование. ' + nameSection,
        tableUsers: resultList,
        permit: permitForm,
        sidebar: sidebar,
        formValue: formValue,
        template: temp,
        selectAgency: select,
        form: form,
        administrator: administrator,
        action: action,
        idUsers: idUsers,
        backward: backward
      }
    );

  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, listAccess, listEditRole, listEdit, listDrop, selectAgency, listTable, nextPass, listRender];

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
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let permission = '00000';
  let users = null;
  let temp = '';
  let nameSection = '';
  let value = {};
  let idUser = null;
  let tel = '';
  let sumMs = null;
  let administrator = true;
  let yesPage = true;
  let sidebar = '';
  let email = '';


  function getSection() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {

          temp = result.rows[0].temp;
          nameSection = result.rows[0].name;
          value = req.body[temp];

          noend();

        } else {
          return next();
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
      url: pathname,
      email: req.session.uid
    });

    permit.accessModerator(function (err, result) {
      if (err) return next(err);

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
        message: 'У Вас нет прав доступа к шаблону "user".'
      };

      yesPage = false;

      res.render('template/user/body',
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
          message: "У Вас нет прав на сохранение."
        };
        res.redirect(303, pathname);
      }
    } else if (value.edit) {
      if (permission.indexOf('1', 2) === 2) {
        noend();
      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на правку."
        };
        res.redirect(303, pathname);
      }
    } else if (value.drop) {
      if (permission.indexOf('1', 1) === 1) {
        noend();
      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на удаление."
        };
        res.redirect(303, pathname);
      }
    } else {
      res.redirect(303, pathname);
    }
  }

  function submitValidate() {

    for (let key in value) {
      value[key] = value[key].trim();
    }

    for (let key in value) {
      if (value[key] === ' ') {
        value[key] = '';
      }
    }

    if (value.email.length < 1) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Поля отмеченные звёздочкой обязательны для заполнения."
      };
      req.session.repeatData = {
        errEmail: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        agency: value.agency,
        note: value.note,
        paymentPrice: value.paymentPrice
      };
      res.redirect(303, 'back');

    } else if (value.email.length > 40) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Должно быть не более 40 символов."
      };
      req.session.repeatData = {
        errEmail: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        agency: value.agency,
        note: value.note,
        paymentPrice: value.paymentPrice
      };
      res.redirect(303, 'back');

    } else if (!(value.email.indexOf('.') > 0 && value.email.indexOf('@') > 0) || /[^a-zA-Z0-9.@_-]/.test(value.email)) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Электронный адрес имеет неверный формат."
      };
      req.session.repeatData = {
        errEmail: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        agency: value.agency,
        note: value.note,
        paymentPrice: value.paymentPrice
      };
      res.redirect(303, 'back');

    } else if (!(/^(\+7)*([0-9]{10})*$/.test(value.tel))) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Номер телефона указан в неверном формате."
      };
      req.session.repeatData = {
        errTel: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        agency: value.agency,
        note: value.note,
        paymentPrice: value.paymentPrice
      };
      res.redirect(303, 'back');

    } else if (!(/^[0-9]*$/.test(value.paymentPrice))) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Оплату за прайс нужно вписать цифрами."
      };
      req.session.repeatData = {
        errPaymentPrice: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        agency: value.agency,
        note: value.note,
        paymentPrice: value.paymentPrice
      };
      res.redirect(303, 'back');

    } else if (value.fio.length > 60) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Должно быть не более 60 символов."
      };
      req.session.repeatData = {
        errFio: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        agency: value.agency,
        note: value.note,
        paymentPrice: value.paymentPrice
      };
      res.redirect(303, 'back');

    } else if (value.agency.length > 10) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Должно быть не более 10 символов."
      };
      req.session.repeatData = {
        errAgency: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        agency: value.agency,
        note: value.note,
        paymentPrice: value.paymentPrice
      };
      res.redirect(303, 'back');

    } else if (value.note.length > 1000) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Должно быть не более 1000 символов."
      };
      req.session.repeatData = {
        errNote: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        agency: value.agency,
        note: value.note,
        paymentPrice: value.paymentPrice
      };
      res.redirect(303, 'back');

    } else {
      noend();
    }

  }

  function getIdUser() {

    if (value.edit) {

      let user = new Userss({id: urlParsed.query.edit});

      user.getUser(function (err, result) {
        if (err) return next(err);
        if (result.rowCount > 0) {

          idUser = result.rows[0].id_user;
          tel = result.rows[0].tel;
          email = result.rows[0].email;
          noend();

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "В ближайшее время ошибка будет устранена."
          };

          let mailer = new Mailer({
            from: conf.get('mailerFrom'), // адрес отправителя
            to: conf.get('mailWebMaster'), // список получателей
            subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
            html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
          });

          mailer.mail(function (err, info, nodemailer) {
          });

          res.redirect('back');
        }
      })

    } else {
      noend();
    }
  }

  function emailTest() {

    if (value.edit) {

      Userss.getEmail(value.email, function(err, result){
        if (err) return next(err);

        if(result.rowCount > 0){

          if(result.rows[0].id_user === idUser){

            noend();

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: 'Запись <b>' + value.email + '</b> зарегестрирована на сайте ' + conf.get('siteName') + ' у другого пользователя.'
            };
            req.session.repeatData = {
              errEmail: true,
              email: value.email,
              pass: value.pass,
              tel: value.tel,
              fio: value.fio,
              agency: value.agency,
              note: value.note,
              paymentPrice: value.paymentPrice

            };

            res.redirect('back');
          }

        } else {
          noend();
        }
      });
    } else {
      noend();
    }
  }

  function phoneTest() {

    if (value.edit) {

      if (value.tel === '') {
        noend();
      } else if (value.tel !== '' && tel === value.tel) {
        noend();
      } else {

        Userss.getTel(value.tel, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {


            if (result.rows[0].email !== value.email) {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка проверки!',
                message: 'Запись <b>' + value.tel + '</b> зарегестрирована на сайте ' + conf.get('siteName') + ' у другого пользователя.'
              };
              req.session.repeatData = {
                errTel: true,
                email: value.email,
                pass: value.pass,
                fio: value.fio,
                tel: value.tel,
                agency: value.agency,
                note: value.note,
                paymentPrice: value.paymentPrice
              };

              res.redirect('back');

            } else {
              noend();
            }
          } else {
            noend();
          }
        })
      }

    } else if (value.create) {

      if (value.tel === '') {
        noend();
      } else if (value.tel !== '' && tel === value.tel) {
        noend();
      } else {
        Userss.getTel(value.tel, function (err, result) {
          if (err) return next(err);
          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: 'Запись <b>' + value.tel + '</b> зарегестрирована на сайте ' + conf.get('siteName') + ' у другого пользователя.'
            };
            req.session.repeatData = {
              errAgency: true,
              email: value.email,
              pass: value.pass,
              fio: value.fio,
              agency: value.agency,
              note: value.note,
              paymentPrice: value.paymentPrice
            };

            res.redirect('back');
          } else {
            noend();
          }
        })
      }
    } else {
      noend();
    }
  }

  function calculatePaymentPrice() {

    if (value.paymentPrice) {

      let sum = Number(value.paymentPrice);

      let msValue = 100 / (1000 * 60 * 60 * 24 * 30.5);

      let msMs = sum / msValue;

      let paymentMs = Math.round(msMs);

      sumMs = Date.now() + paymentMs;

      noend();

    } else {
      noend();
    }
  }

  function submitCreate() {

    co(function* () {

      if (value.create) {

        if (permission.indexOf('1', 3) === 3 && permission.indexOf('1', 4) === 4) {

          let submitEmail = value.email;
          let submitPass = value.pass;
          let submitFio = value.fio;
          let submitTel = value.tel;
          let submitAgency = value.agency;
          let submitNote = value.note;
          let id_user = null;

          id_user = yield new Promise(function (resolve) {
            Userss.maxIdUsers(function (err, result) {
              if (err) return next(err);
              resolve(result);
            });
          });

          if (id_user.rowCount > 0) {
            if (value.pass * 1 === id_user.rows[0].max * 1 + 1) {
              id_user = id_user.rows[0].max * 1 + 1;
            } else {
              id_user = null;
            }
          }

          if (value.pass.length < 1) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Поля отмеченные звёздочкой обязательны для заполнения."
            };
            req.session.repeatData = {
              errPass: true,
              email: value.email,
              pass: value.pass,
              fio: value.fio,
              tel: value.tel,
              agency: value.agency,
              note: value.note,
              paymentPrice: value.paymentPrice
            };
            res.redirect(pathname);

          } else if (value.pass.length > 12) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Должно быть не более 12 символов."
            };
            req.session.repeatData = {
              errPass: true,
              email: value.email,
              pass: value.pass,
              fio: value.fio,
              tel: value.tel,
              agency: value.agency,
              note: value.note,
              paymentPrice: value.paymentPrice
            };
            res.redirect(pathname);

          } else {

            Userss.getEmail(submitEmail, function (err, result) {
              if (err) return next(err);

              if (result.rowCount === 1) {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка проверки!',
                  message: submitEmail + "Почтовый ящик зарегестрирован у другого пользователя!"
                };

                req.session.repeatData = {
                  errEmail: true,
                  email: value.email,
                  pass: value.pass,
                  fio: value.fio,
                  tel: value.tel,
                  agency: value.agency,
                  note: value.note,
                  paymentPrice: value.paymentPrice
                };

                res.redirect(pathname);

              } else {

                let auth = new Auth({
                  email: submitEmail,
                  pass: submitPass,
                  tel: submitTel,
                  fio: submitFio,
                  agency: submitAgency,
                  note: submitNote,
                  login: dataFormat.emailLogin(submitEmail),
                  date_registration: Date.now(),
                  sumMs: sumMs,
                  id_user: id_user,

                });

                auth.save(function (err, result) {
                  if (err) return next(err);

                  if (result !== 0) {

                    req.session.flash = {
                      type: 'success',
                      intro: 'Успех!',
                      message: 'Учётные данные пользователя сохранены.'
                    };
                    res.redirect(pathname);

                  } else {
                    req.session.flash = {
                      type: 'danger',
                      intro: 'Ошибка проверки!',
                      message: submitEmail + "Учётные данные пользователя не сохранились, произошла ошибка при записи в базу данных!"
                    };
                    res.redirect(pathname);
                  }
                });
              }
            });
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: 'У Вас нет прав на создание и сохранение.'
          };
          res.redirect(pathname);
        }

      } else {
        noend();
      }
    });
  }

  function submitEdit() {

    if (value.edit) {

      if (permission.indexOf('1', 2) === 2 && permission.indexOf('1', 4) === 4) {

        let submitEmail = value.email;
        let submitFio = value.fio;
        let submitTel = value.tel;
        let submitAgency = value.agency;
        let submitNote = value.note;

        let edit = new Userss(
          {
            id: urlParsed.query.edit,
            template: temp,
            email: submitEmail,
            fio: submitFio,
            tel: submitTel,
            agency: submitAgency,
            sumMs: sumMs,
            note: submitNote
          }
        );

        edit.getUserForm(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            edit.userUpdate(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Данные пользователя отредактированы.'
                };

                let get = '';

                if (urlParsed.query.page) {
                  get = '?page=' + urlParsed.query.page
                }

                res.redirect(urlParsed.pathname + get);

              } else {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Данные пользователя не отредактированы."
                };

                res.redirect(urlParsed.pathname);
              }
            })

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Нет такого пользователя!"
            };

            res.redirect(303, pathname);
          }

        });

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'У Вас нет прав на правку.'
        };
        res.redirect(pathname);
      }

    } else {
      noend();
    }
  }

  function submitDrop() {

    if (permission.indexOf('1', 2) === 2 && permission.indexOf('1', 4) === 4) {

      if (value.drop) {

        let id = urlParsed.query.drop;
        let counter = 0;
        let strPath = '';

        if (urlParsed.query.drop) {
          delete urlParsed.query.drop;
        }

        for (let key in urlParsed.query) {

          if (key) {

            counter++;

            if (counter === 1) {
              strPath += '?' + key + '=' + urlParsed.query[key];
            } else {
              strPath += '&' + key + '=' + urlParsed.query[key];
            }
          }
        }

        let drop = new Userss({id: id});

        drop.getUserForm(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            drop.drop(function (err, result) {
              if (err) return next(err);

              if (result > 0) {

                Userss.getCountAllPhoto(id, function (err, result) {
                  if (err) return next(err);

                  if(result.rowCount > 0){

                    Userss.deleteAllPhoto(id, function (err, result1) {
                      if (err) return next(err);

                      if(result1.rowCount > 0){

                        async.each(result.rows, function (rows, callback) {

                          fs.unlink(rows.path_photo, function (err) {

                            if(err){
                              callback(true);
                            } else {
                              callback();
                            }
                          });

                        }, function (err) {

                          if(err){

                            req.session.flash = {
                              type: 'warning',
                              intro: 'Внимание!',
                              message: 'Не удалился файл изображения.'
                            };
                            res.redirect(303, pathname + strPath);

                          } else {

                            req.session.flash = {
                              type: 'success',
                              intro: 'Успех!',
                              message: 'Пользователь удалён.'
                            };

                            res.redirect(303, pathname + strPath);
                          }

                        });

                      } else {

                        req.session.flash = {
                          type: 'warning',
                          intro: 'Внимание!',
                          message: 'Не удалилась запись в таблице отвечающая за изображения.'
                        };
                        res.redirect(303, pathname + strPath);
                      }

                    });

                  } else {

                    req.session.flash = {
                      type: 'success',
                      intro: 'Успех!',
                      message: 'Пользователь удалён.'
                    };

                    res.redirect(303, pathname + strPath);
                  }

                });

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка данных!',
                  message: "Пользователь не удалён."
                };
                res.redirect(303, pathname);
              }

            })

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Нет такого пользователя!"
            };
            res.redirect(303, pathname);
          }

        });
      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'У Вас нет прав на удаление.'
        };
        res.redirect(pathname);
      }
    } else {
      return next();
    }
  }

  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, submitAccess, calculatePaymentPrice, submitValidate, getIdUser, emailTest, phoneTest, submitCreate, submitEdit, submitDrop];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};
