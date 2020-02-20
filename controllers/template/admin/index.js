let url = require('url');
let conf = require('../../../config/index');
let Admin = require('./model/index');
let btnArticle = require('./articleBtn/index');
let ms = require('../../../lib/msDate');
let menu = require('../../../lib/menu');
let table = require('../../../lib/tableList');
let Permit = require('../../../lib/permit');
let Mailer = require('../../../lib/mailer');
const callsites = require('callsites');
let valid = require('../../../lib/validPass');
let fs = require('fs');
let async = require('async');
const sharp = require('sharp');

exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let temp = '';
  let resultList = '';
  let permission = '00000';
  let users = null;
  let sidebar = '';
  let accessUser = '';
  let selectAgency = '';
  let administrator = true;
  let form = false;
  let formDrop = false;
  let permitForm = '';
  let nameTemplate = '';
  let value = '';
  let id_user = null;
  let id_agency = null;
  let id_moderator_agency = null;
  let yesPage = true;
  let tableArticle = '';
  let tableRealty = '';
  function Photo(obj) {
    for (let key in obj) {
      this[key] = obj[key];
    }
  }
  let photo = [];
  let resJSON;

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
      noend()
    }
  }

  function accessValue() {

    let permit = new Permit({
      url: pathname,
      email: req.session.uid
    });

    permit.accessModerator(function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){

        id_user = Number(result.rows[0].id_user);
        id_agency = Number(result.rows[0].agency);
        id_moderator_agency = Number(result.rows[0].moderator);

        if (req.admin !== req.session.uid) {

          if (result.rows[0].role_id === null) {
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

      } else {
        res.redirect(303, '/admin/logout');
      }

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
        message: 'У Вас нет прав доступа к шаблону "admin".'
      };

      yesPage = false;

      res.render('template/admin/body',
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

  function getAjax() {

    if(urlParsed.query.userEmail) {

      Admin.getCountPhoto(temp, id_user, function (err, result) {
        if (err) {
          photo.push({type: "error"});
          photo.push(new Photo({
            type: "alert-danger",
            intro: "Ошибка сервера!",
            message: "Не получен список изображений."
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
        }

        if (result.rowCount > 0) {

          photo.push({type: "result"});
          for (let i = 0; i < result.rows.length; i++) {
            photo.push(new Photo({
              title: result.rows[i].title_photo,
              id_photo: result.rows[i].id_photo,
              path: result.rows[i].path_photo
            }));
          }

          resJSON = JSON.stringify(photo);

          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);

        } else {

          photo.push({type: "resultNull"});
          resJSON = JSON.stringify(photo);

          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
        }
      });

    } else if(urlParsed.query.dropPhoto) {

      let dropPhoto = urlParsed.query.dropPhoto;

      Admin.getPhoto(dropPhoto, id_user, function (err, result) {
        if (err) {
          photo.push({type: "error"});
          photo.push(new Photo({
            type: "alert-danger",
            intro: "Ошибка сервера!",
            message: "Не получен список изображений."
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
        }

        if(result.rowCount > 0){

          dropPhoto = result.rows[0].id_photo;
          let path = result.rows[0].path_photo;

          Admin.deletePhoto(dropPhoto, function (err, result) {
            if (err) {
              photo.push({type: "error"});
              photo.push(new Photo({
                type: "alert-danger",
                intro: "Ошибка сервера!",
                message: "Фотография не удалена."
              }));
              resJSON = JSON.stringify(photo);
              res.set('Cache-Control', 'no-store, no-cache');
              res.send(resJSON);
            }

            if(result.rowCount > 0){
              fs.unlinkSync(path);

              Admin.getCountPhoto(temp, id_user, function (err, result) {
                if (err) {
                  photo.push({type: "error"});
                  photo.push(new Photo({
                    type: "alert-danger",
                    intro: "Ошибка сервера!",
                    message: "Не получен список изображений."
                  }));
                  resJSON = JSON.stringify(photo);
                  res.set('Cache-Control', 'no-store, no-cache');
                  res.send(resJSON);
                }

                if (result.rowCount > 0) {

                  photo.push({type: "result"});
                  for (let i = 0; i < result.rows.length; i++) {
                    photo.push(new Photo({
                      title: result.rows[i].title_photo,
                      id_photo: result.rows[i].id_photo,
                      path: result.rows[i].path_photo
                    }));
                  }

                  resJSON = JSON.stringify(photo);

                  res.set('Cache-Control', 'no-store, no-cache');
                  res.send(resJSON);

                } else {

                  photo.push({type: "resultNull"});
                  resJSON = JSON.stringify(photo);

                  res.set('Cache-Control', 'no-store, no-cache');
                  res.send(resJSON);
                }
              });

            } else {

              photo.push({type: "error"});
              photo.push(new Photo({
                type: "alert-danger",
                intro: "Ошибка сервера!",
                message: "Фотография не удалена."
              }));
              resJSON = JSON.stringify(photo);
              res.set('Cache-Control', 'no-store, no-cache');
              res.send(resJSON);
            }

          });

        } else {

          photo.push({type: "error"});
          photo.push(new Photo({
            type: "alert-danger",
            intro: "Ошибка проверки!",
            message: "Не найдена фотография для удаления."
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
        }
      });

    } else {
      noend();
    }
  }

  function urlAccess() {

    if (permission.indexOf('1', 2) === 2) {
      form = true;
    }

    if (permission.indexOf('1', 1) === 1) {
      formDrop = true;
    }

    if (users === null) {
      form = true;
      formDrop = true;
    }


    if (urlParsed.query.edit) {

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

    } else if (urlParsed.query.drop) {

      if (permission.indexOf('1', 1) === 1) {
        formDrop = true;
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

      noend();
    }
  }

  function tableAccess() {

    Admin.getAccess(req.session.uid, users, function (err, result) {
      if (err) return next(err);

      accessUser = result;

      noend();

    });

  }

  function listRealty() {

    Admin.getListRealty(permission, id_user, id_moderator_agency, id_agency, function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){
        tableRealty = Admin.tableRealty(result);
        noend();
      } else {
        tableRealty = '<p>Вы ещё не внесли ни одного объекта недвижимости.</p>';
        noend();
      }
    });

  }

  function listUser() {

    let admin = new Admin({
      email: req.session.uid
    });

    admin.getUser(function (err, result) {
      if (err) return next(err);

      if (result.rowCount === 1) {

        resultList = result.rows[0];

        noend();
      }
    });
  }

  function listArticle() {

    let permissionArticle = '00000';
    let articlePath = '/admin/template/article';
    let template = 'article';

    let user = new Admin({email: req.session.uid});

    user.getUser(function (err, result) {
      if (err) return next(err);

      id_user = result.rows[0].id_user;

      btnArticle.access(req.session.uid, articlePath, function (err, result) {
        if (err) return next(err);

        permissionArticle = result;

        if (permissionArticle.indexOf('0', 4) === 4) {

          btnArticle.getArticle(id_user, function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {

              btnArticle.tableListArticle(result, articlePath, template, id_user, permissionArticle, function (err, result) {
                if (err) return next(err);

                tableArticle = result;

                noend();

              })

            } else {
              tableArticle = '<p>У Вас нет статей.</p>';
              noend();
            }

          })
        }

        if (permissionArticle.indexOf('1', 4) === 4) {
          btnArticle.getArticleAll(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {

              btnArticle.tableListArticleAll(result, articlePath, template, id_user, permissionArticle, function (err, result) {
                if (err) return next(err);

                tableArticle = result;

                noend();

              })

            } else {
              tableArticle = '<p>Нет статей для редактирования.</p>';
              noend();
            }

          })
        }

      });
    });
  }

  function listRender() {

    //Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

    res.render('template/admin/body',
      {
        layout: 'admin',
        titleHead: 'Администрирование. ' + nameTemplate,
        title: 'Администрирование. ' + nameTemplate,
        dateReg: ms.msDate(resultList.date_registration),
        email: resultList.email,
        emailAdmin: conf.get('administrator'),
        fio: resultList.fio,
        tel: resultList.tel,
        note: resultList.note,
        permit: permitForm,
        sidebar: sidebar,
        permission: permission,
        accessUser: table.tableAccessUser(users, accessUser, req.hostname),
        selectAgency: selectAgency,
        administrator: administrator,
        form: form,
        formDrop: formDrop,
        yesPage: yesPage,
        tableArticle: tableArticle,
        tableRealty: tableRealty,
        dateEmail: conf.get('dateEmail') / 1000 / 60
      });
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, getAjax, urlAccess, tableAccess, listRealty, listUser, listArticle, listRender];

  function noend(accessUser) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(accessUser);
  }

  noend();
};

///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////


exports.submit = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let permission = '00000';
  let users = null;
  let temp = '';
  let nameTemplate = '';
  let value = {};
  let idUser = null;
  let password = '';
  let tel = '';
  let administrator = true;
  let yesPage = true;
  let sidebar = '';
  let message = {};
  let photo = [];
  let resJSON;
  let img;
  let id_user = null;
  let countImg = 1;

  function Photo(obj) {
    for (let key in obj) {
      this[key] = obj[key];
    }
  }


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

      id_user = Number(result.rows[0].id_user);

      if (req.admin !== req.session.uid) {

        if (result.rows[0].role_id === null) {
          users = 1;
        } else {
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
        message: 'У Вас нет прав доступа к шаблону "admin".'
      };

      yesPage = false;

      res.render('template/admin/body',
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

  function setAjax() {

    if (urlParsed.query.photoAdmin) {
      img = req.file;
      let mimetype = img.mimetype;
      let path = img.path;
      let date = Date.now();
      let newPath;
      let newPath1;
      let imgPath;
      let title;

      async.waterfall([validate, foo], function (err, result) {

        if (err) {
          photo.push({type: "error"});
          photo.push(new Photo({
            type: err[0], //"alert-danger"
            intro: err[1],
            message: err[2]
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
        }

        if(result){

          if(result[0] === 'result'){

            result = result[1];

            photo.push({type: "result"});
            for (let i = 0; i < result.rows.length; i++) {
              photo.push(new Photo({
                title: result.rows[i].title_photo,
                id_photo: result.rows[i].id_photo,
                path: result.rows[i].path_photo
              }));
            }
            resJSON = JSON.stringify(photo);
            res.set('Cache-Control', 'no-store, no-cache');
            res.send(resJSON);
          }

          if(result[0] === 'resultNull'){
            photo.push({type: "resultNull"});
            resJSON = JSON.stringify(photo);

            res.set('Cache-Control', 'no-store, no-cache');
            res.send(resJSON);
          }
        }
      });

      function validate(callback) {

        if (mimetype === 'image/jpeg') {

          newPath = path + '.jpg';
          newPath1 = 'controllers/ajax/tmp/' + date + '.jpg';
          imgPath = 'public/images/' + date + '.jpg';
          title = date + '.jpg';

          callback(null);

        } else if (mimetype === 'image/png') {

          newPath = path + '.png';
          newPath1 = 'controllers/ajax/tmp/' + date + '.png';
          imgPath = 'public/images/' + date + '.png';
          title = date + '.png';

          callback(null);

        } else {

          fs.unlinkSync(path);

          callback(["alert-danger", "Ошибка проверки!", "Допускаются для записи фотография с расширением .jpg .png"]);
        }
      }

      function foo(callback) {

        sharp(path)
          .resize(undefined, undefined)
          .min()
          .toFile(newPath, function (err) {

            if(err){
              fs.unlinkSync(path);
              callback(["alert-danger", "Ошибка сервера!", "Фотография не сохранилась."]);
            }

            fs.unlinkSync(path);

            fs.rename(newPath, imgPath, function (err) {

              if(err){
                fs.unlinkSync(newPath);
                callback(["alert-danger", "Ошибка сервера!", "Фотография не сохранилась."]);
              }

              Admin.getCountPhoto(temp, id_user, function (err, result) {
                if(err){
                  fs.unlinkSync(imgPath);
                  callback(["alert-danger", "Ошибка сервера!", "Internal Server Error"]);
                }

                if(result.rowCount >= countImg){
                  fs.unlinkSync(imgPath);
                  callback(["alert-danger", "Ошибка проверки!", "Допускается загрузить одну фотографию"]);
                } else {
                  Admin.saveImg(title, imgPath, temp, id_user, function (err, result) {
                    if(err){
                      fs.unlinkSync(imgPath);
                      callback(["alert-danger", "Ошибка сервера!", "Internal Server Error"]);
                    }

                    if(result.rowCount > 0){

                      Admin.getCountPhoto(temp, id_user, function (err, result) {
                        if (err) {
                          callback(["alert-danger", "Ошибка сервера!", "Не получен список изображений."]);
                        }

                        if (result.rowCount > 0) {

                          callback(null, ["result", result]);

                        } else {

                          callback(null, ["resultNull"]);

                        }
                      });
                    } else {
                      fs.unlinkSync(imgPath);
                      callback(["alert-danger", "Ошибка сервера!", "Internal Server Error"]);
                    }
                  })
                }
              });
            });
          });
        }

    } else {
      noend();
    }
  }

  function Message() {

    if(value.createMessage === 'message'){

      if(value.toWhom === '1'){

        let mailer = new Mailer({
          from: conf.get('mailerFrom'), // адрес отправителя
          to: conf.get('mailAdministrator'), // список получателей
          subject: 'Сообщение от пользователя ' + conf.get('siteName') + ' ' + req.session.uid, // Сюжетная линия
          html: '<p>' + value.message + '</p>'
        });

        mailer.mail(function (err, info, nodemailer) {
        });
        req.session.flash = {
          type: 'success',
          intro: 'Успех!',
          message: 'Сообщение администратору отправлено.'
        };
        res.redirect('back');
      }

      if(value.toWhom === '2'){

        let mailer = new Mailer({
          from: conf.get('mailerFrom'), // адрес отправителя
          to: conf.get('mailWebMaster'), // список получателей
          subject: 'Сообщение от пользователя ' + conf.get('siteName') + ' ' + req.session.uid, // Сюжетная линия
          html: '<p>' + value.message + '</p>'
        });

        mailer.mail(function (err, info, nodemailer) {
        });
        req.session.flash = {
          type: 'success',
          intro: 'Успех!',
          message: 'Сообщение программисту отправлено.'
        };
        res.redirect('back');
      }

    } else {
      noend();
    }
  }

  function submitAccess() {

    if (req.body.admin.edit) {

      if (permission.indexOf('1', 2) === 2) {
        noend();
      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на правку!"
        };
        res.redirect(303, pathname);
      }
    } else if (req.body.admin.drop) {
      if (permission.indexOf('1', 1) === 1) {
        noend();
      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на удаление!"
        };
        res.redirect(303, pathname);
      }
    } else {
      res.redirect(303, pathname);
    }
  }

  function getIdUser() {

    let user = new Admin({email: req.session.uid});

    user.getUser(function (err, result) {
      if (err) return next(err);
      if (result.rowCount > 0) {

        idUser = result.rows[0].id_user;
        tel = result.rows[0].tel;
        noend();

      } else {
        // ошибка сервера
        return next();
      }
    })

  }

  function submitDrop() {

    if (req.body.admin.drop) {

      let dropUser = new Admin({
        id: idUser
      });

      dropUser.drop(function (err, result) {
        if (err) return next(err);

        if (result > 0) {

          Admin.getCountAllPhoto(id_user, function (err, result) {
            if (err) return next(err);

            if(result.rowCount > 0){

              Admin.deleteAllPhoto(id_user, function (err, result1) {
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
                      res.redirect(303, '/admin/logout');

                    } else {
                      res.redirect(303, '/admin/logout');
                    }

                  });

                } else {

                  req.session.flash = {
                    type: 'warning',
                    intro: 'Внимание!',
                    message: 'Не удалилась запись в таблице отвечающая за изображения.'
                  };
                  res.redirect(303, '/admin/logout');
                }

              });

            } else {
              res.redirect(303, '/admin/logout');
            }

          });

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "Личный кабинет не удалился, в ближайшее время ошибка будет устранена."
          };
          res.redirect(303, '/admin/template/admin');
        }
      });

    } else {
      noend();
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
        note: value.note
      };
      res.redirect(303, 'back');

    } else if (/[а-яА-Я]/.test(value.pass) && value.pass !== '') {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'В поле "Пароль" должны быть цифры, английские буквы. Переключитесь на английскую раскладку клавиатуры.'
      };
      req.session.repeatData = {
        errPass: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
      };
      res.redirect(303, 'back');


    } else if (valid.isMin(4, value.pass) === false && value.pass !== '') {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Длина пароля должна быть не менее 4 знака.'
      };
      req.session.repeatData = {
        errPass: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
      };
      res.redirect(303, 'back');

    } else if (valid.hasLetters(value.pass) === false && value.pass !== '') {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: ' Пароль должен содержать буквы.'
      };
      req.session.repeatData = {
        errPass: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
      };
      res.redirect(303, 'back');

    } else if (valid.hasDigits(value.pass) === false && value.pass !== '') {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Пароль должен содержать цифры.'
      };
      req.session.repeatData = {
        errPass: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
      };
      res.redirect(303, 'back');

    } else if (value.email.length > 40) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Почтовый ящик должен составлять не более 40 знаков."
      };
      req.session.repeatData = {
        errEmail: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
      };
      res.redirect(303, 'back');

    } else if (value.pass.length > 12) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Пароль должен составлять не более 12 знаков."
      };
      req.session.repeatData = {
        errPass: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
      };
      res.redirect(303, 'back');

    } else if (!(value.email.indexOf('.') > 0 && value.email.indexOf('@') > 0) || /[^a-zA-Z0-9.@_-]/.test(value.email)) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Почтовый ящик имеет неверный формат."
      };
      req.session.repeatData = {
        errEmail: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
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
        note: value.note
      };
      res.redirect(303, 'back');

    } else if (value.fio.length > 60) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Поле "Ваше Ф.И.O" должно составлять не более 60 знаков.'
      };
      req.session.repeatData = {
        errFio: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
      };
      res.redirect(303, 'back');

    } else if (value.note.length > 1000) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Поле "Примечание" должно составлять не более 1000 знаков.'
      };
      req.session.repeatData = {
        errNote: true,
        email: value.email,
        pass: value.pass,
        fio: value.fio,
        tel: value.tel,
        note: value.note
      };
      res.redirect(303, 'back');

    } else {
      noend();
    }
  }

  function passEdit() {

    if (value.pass !== '') {

      Admin.updateUserPass(value.pass, idUser, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          password = value.pass;

          noend();

        } else {

          let mailer = new Mailer({
            from: conf.get('mailerFrom'), // адрес отправителя
            to: conf.get('mailWebMaster'), // список получателей
            subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
            html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
          });

          mailer.mail(function (err, info, nodemailer) {
          });
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "Пароль не удалось изменить. В ближайшее время ошибка будет устранена."
          };
          res.redirect('back');
        }
      })

    } else {
      noend();
    }
  }

  function phoneTest() {

    if (value.tel === '') {
      noend();
    } else if (value.tel !== '' && tel === value.tel) {
      noend();
    } else {
      Admin.getTel(value.tel, idUser, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

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
            note: value.note
          };

          res.redirect('back');
        } else {
          noend();
        }
      })
    }
  }

  function submitEdit() {

    if (value.edit) {

      if (value.email !== req.session.uid) {

        Admin.getEmail(value.email, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: 'Вы не можете ' + req.session.uid + ' поменять на ' + value.email + '. В данный момент почтовый ящик <b>' + value.email + '</b> как учёная запись, зарегестрирован у другого пользователя.'
            };
            res.redirect('back');

          } else {

            let user = new Admin({
              email: value.email,
              now_date: conf.get('dateEmail') + Date.now(),
              id_user: idUser,
              fio: value.fio,
              tel: value.tel,
              note: value.note
            });

            user.temporarilySave(function (err, url_hash, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {

                let date = conf.get('dateEmail') / 1000 / 60;

                let mailer = new Mailer({
                  from: conf.get('mailerFrom'), // адрес отправителя
                  to: value.email, // список получателей
                  subject: 'Запрос на изменение регистрационных данных на ' + conf.get('siteName'), // Сюжетная линия
                  html: '<p>Отправлен запрос на изменение почтового ящика ' + req.session.uid + ' на ' + value.email + '. Чтобы изменение вступило' +
                  ' в силу пройдите по <a href="http://' + conf.get('siteName') + conf.get('pathRegistrationAdmin') + '/' + url_hash + '">ссылке</a>. Запрос действителен' +
                  ' в течении ' + date + ' минут</p></br>' +
                  ' <p>Ссылка: http//:' + conf.get('siteName') + conf.get('pathRegistrationAdmin') + '/' + url_hash + '</p>'
                });

                mailer.mail(function (err, info, nodemailer) {
                });

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Ссылка на изменение регистрационных данных отправлена на почтовый ящик <b>' + value.email + '</b> . Пройдите по ссылке' +
                  ' чтобы изменения регистрационнных данных вступили в силу.'
                };
                res.redirect('back');

              } else {

                let mailer = new Mailer({
                  from: conf.get('mailerFrom'), // адрес отправителя
                  to: conf.get('mailWebMaster'), // список получателей
                  subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
                  html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
                });

                mailer.mail(function (err, info, nodemailer) {
                });

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка сервера!',
                  message: "Учётные данные не удалось изменить. В ближайшее время ошибка будет устранена."
                };
                res.redirect('back');
              }

            })
          }
        });

      } else {

        let user = new Admin({
          id: idUser,
          email: req.session.uid,
          fio: value.fio,
          tel: value.tel,
          note: value.note
        });

        user.userUpdate(function (err, result) {
          if (err) return next(err);
          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Ваши учётные данные изменены.'
            };
            res.redirect('back');

          } else {

            let mailer = new Mailer({
              from: conf.get('mailerFrom'), // адрес отправителя
              to: conf.get('mailWebMaster'), // список получателей
              subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
              html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
            });

            mailer.mail(function (err, info, nodemailer) {
            });

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Учётные данные не удалось изменить. В ближайшее время ошибка будет устранена."
            };
            res.redirect('back');
          }
        })

      }

    } else {
      next();
    }
  }

  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, setAjax, Message, submitAccess, getIdUser, submitDrop, submitValidate, passEdit, phoneTest, submitEdit];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};