let Label = require('./model/index');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');
let url = require('url');


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
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
  let titlePage = '';
  let administrator = true;
  let id_user = null;
  let nameTemplate = '';
  let value = {};
  let id_city = null;

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

        if( req.admin !== req.session.uid) {
          permitForm = '';
        }

        Permit.getCity(req.session.uid, function (err, result) {
          if (err) return next(err);

          if (result === 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка администрирования!',
              message: 'В разделе "Настройки сайта" нужно установить город по умолчанию.'
            };
            res.redirect('/admin/template/admin');

          } else {

            id_city = result;
            noend();
          }
        });
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
        message: 'У Вас нет прав доступа к шаблону "label".'
      };

      yesPage = false;

      res.render('template/label/body',
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

  function deleteStr() {

    if(urlParsed.query.dropStr){

      if(permission.indexOf('1', 1) === 1 && permission.indexOf('1', 4) === 4){

        Label.deleteStrLabelandtemplate(urlParsed.query.dropStr, function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Строка удалена.'
            };
            res.redirect(pathname + '?addTemplate=' + urlParsed.query.addTemplate);

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "В ближайшее время ошибка будет устранена."
            };
            res.redirect(pathname);
          }
        });

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на удаление."
        };
        res.redirect(pathname);
      }

    } else {
      noend();
    }

  }

  function addTemplates() {

    if (urlParsed.query.addTemplate) {

      if (permission.indexOf('1', 2) === 2 && permission.indexOf('1', 1) === 1 && permission.indexOf('1', 3) === 3) {

        let resultForm = {};
        let select = '';

        Label.getIdLabel(urlParsed.query.addTemplate, temp, function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){

            resultForm = result;

            Label.selectTemplates(urlParsed.query.addTemplate, function (err, result) {
              if (err) return next(err);

              select = result;

              Label.getLabelAndTemplate(urlParsed.query.addTemplate, function (err, result) {
                if (err) return next(err);

                res.render('template/label/body-edit', {
                  layout: 'admin',
                  urlPage: req.url,
                  titleHead: nameTemplate,
                  title: nameTemplate,
                  permit: permitForm,
                  permission: permission,
                  sidebar: sidebar,
                  template: temp,
                  labelTitle: resultForm.rows[0].title,
                  labelAlias: resultForm.rows[0].alias,
                  select: select,
                  label: '',
                  templates: Label.tableLabelAndTemplate(result, permission, urlParsed.query.addTemplate),
                  administrator: administrator
                });
              });
            });

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес страницы в браузере."
            };
            res.redirect(pathname);
          }

        });

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на редактирование."
        };
        res.redirect(pathname);
      }

    } else {
      noend();
    }
  }

  function listEdit() {

    if (urlParsed.query.edit) {

      action.edit = true;
      action.drop = false;
      action.create = false;
      action.submit = true;

      Label.getIdLabel(urlParsed.query.edit, temp, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          formValue = result.rows[0];
          noend();
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: 'Такой записи нет.'
          };
          res.redirect('back');
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
      action.submit = true;

      Label.getIdLabel(urlParsed.query.drop, temp, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          formValue = result.rows[0];
          noend();
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: 'Такой записи нет.'
          };
          res.redirect('back');
        }
      });
    } else {
      noend();
    }
  }

  function listTable() {

    let labelList = new Label({
      template: temp,
      permission: permission
    });

    labelList.list(function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){

        resultList = Label.tableListLable(result, permission);
        noend();

      } else {
        noend();
      }

    });
  }


  function listRender() {

    if (!action.submit) {
      action.create = true;
      action.edit = false;
      action.drop = false;
    }

    if (permission.indexOf('0', 3) === 3) action.create = false;
    if (permission.indexOf('0', 2) === 2) action.edit = false;
    if (permission.indexOf('0', 1) === 1) action.drop = false;


    res.render('template/label/body', {

      layout: 'admin',
        urlPage: req.url,
        title: titlePage,
        formValue: formValue,
        permit: permitForm,
        action: action,
        permission: permission,
        sidebar: sidebar,
        template: temp,
        table: resultList,
        administrator: administrator,
        yesPage: yesPage

    });
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, deleteStr, addTemplates, listEdit, listDrop, listTable, listRender];

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
  let nameTemplate = '';
  let value = {};
  let id_user = null;
  let administrator = true;
  let yesPage = true;
  let sidebar = '';
  let id_city = null;

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
          res.redirect(pathname);

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

        Permit.getCity(req.session.uid, function (err, result) {
          if (err) return next(err);

          if (result === 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка администрирования!',
              message: 'В разделе "Настройки сайта" нужно установить город по умолчанию.'
            };
            res.redirect('/admin/template/admin');

          } else {

            id_city = result;
            noend();
          }
        });
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
        message: 'У Вас нет прав доступа к шаблону "agency".'
      };

      yesPage = false;

      res.render('template/agency/body',
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

  function submitValidate() {

    value.line = Number(value.line);

    if (value.title === ' ' || value.alias === ' ' || value.line === ' ') {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Полe не может быть пробелом!"
      };
      req.session.repeatData = {
        title: value.title,
        alias: value.alias,
        line: value.line,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');

    } else if (value.title.length < 1) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Поля отмеченные звёздочкой обязательны для заполнения!"
      };
      req.session.repeatData = {
        errTitle: true,
        title: value.title,
        alias: value.alias,
        line: value.line,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else if (value.title.length > 40) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: value.title + ' - должно быть не более 40 символов!'
      };
      req.session.repeatData = {
        errTitle: true,
        title: value.title,
        alias: value.alias,
        line: value.line,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else if (value.alias.length > 40) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: value.alias + ' - должно быть не более 40 символов!'
      };
      req.session.repeatData = {
        errAlias: true,
        title: value.title,
        alias: value.alias,
        line: value.line,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else {
      noend();
    }
  }

  function alias() {

    if (value.latin === '1') {

      if (value.alias.length < 1) {

        value.alias = translite(value.title.trim()).toLowerCase();

        noend();

      } else {

        value.alias = translite(value.alias.trim()).toLowerCase();

        noend();
      }

    } else {

      if (value.alias.length < 1) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Если поле "Псевдоним" отмечено как "original", то поле обязательно для заполнения!'
        };

        req.session.repeatData = {
          errAlias: true,
          title: value.title,
          alias: value.alias,
          line: value.line,
          status: value.status,
          main: value.main
        };
        res.redirect(303, 'back');

      } else {
        noend();
      }
    }
  }
  
  function submitAddTemplate() {

    if(value.createLabel){

      if(permission.indexOf('1', 2) === 2 && permission.indexOf('1', 1) === 1 && permission.indexOf('1', 3) === 3){

        Label.addTemplate(urlParsed.query.addTemplate, value.select, function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Шаблон прибавлен к метке.'
            };
            res.redirect(pathname + '?addTemplate=' + urlParsed.query.addTemplate);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: 'В ближайшее время ошибка будет устранена.'
            };
            res.redirect(pathname);
          }

        });

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'У Вас не прав на сохранение.'
        };
        res.redirect(pathname);
      }
    } else {
      noend();
    }
  }

  function submitCreate() {

    if (value.create) {

      if(permission.indexOf('1', 3) === 3){

        let save = new Label({

          title: value.title.trim(),
          alias: value.alias.trim(),
          line: value.line,
          date_create: Date.now(),
          author: id_user,
          template: temp,
          permission: permission

        });

        save.issetCreate(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Псевдоним не уникален!"
            };
            req.session.repeatData = {
              errAlias: true,
              title: value.title,
              alias: value.alias,
              line: value.line
            };
            res.redirect(303, 'back');

          } else {

            save.save(function (err, result) {
              if (err) return next(err);

              if (result.rowCount === 1) {

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Запись сохранена.'
                };
                res.redirect(pathname);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Запись не сохранена!"
                };
                req.session.repeatData = {
                  title: value.title,
                  alias: value.alias,
                  line: value.line,
                  status: value.status,
                  main: value.main
                };
                res.redirect(pathname);
              }
            })
          }
        })

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Вы не можете сохранять, создавать."
        };
        res.redirect(pathname);
      }

    } else {
      noend();
    }
  }

  function submitEdit() {

    if(urlParsed.query.edit){

      if(permission.indexOf('1', 2) === 2){

        let save = new Label({
          id: urlParsed.query.edit.trim(),
          title: value.title.trim(),
          alias: value.alias.trim(),
          line: value.line,
          date_create: Date.now(),
          author: id_user,
          template: temp,
          permission: permission

        });

        save.issetEdit(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Псевдоним не уникален!"
            };
            req.session.repeatData = {
              errAlias: true,
              title: value.title,
              alias: value.alias,
              line: value.line
            };
            res.redirect(303, 'back');

          } else {

            save.edit(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Запись сохранена.'
                };
                res.redirect(pathname);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Запись не сохранена!"
                };
                req.session.repeatData = {
                  title: value.title,
                  alias: value.alias,
                  line: value.line,
                  status: value.status,
                  main: value.main
                };
                res.redirect(pathname);
              }
            })
          }
        })

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Вы не можете править."
        };
        res.redirect(pathname);
      }

    } else {
      noend();
    }
  }

  function submitDrop() {

    if(urlParsed.query.drop){

      if (permission.indexOf('1', 1) === 1) {

        let drop = new Label({
          node_id: urlParsed.query.drop.trim()
        });

        drop.deleteLabel(function (err, result) {
          if (err) return next(err);

          if (result.rowCount === 1) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена'
            };
            res.redirect(pathname);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Запись не удалена!"
            };
            res.redirect(pathname);
          }

        });

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Вы не можете удалять."
        };
        res.redirect(pathname);
      }

    } else {
      next();
    }
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, submitValidate, alias, submitAddTemplate, submitCreate, submitEdit, submitDrop];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

function translite(str) {

  let arr = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'g',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'ы': 'i', 'э': 'e',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'G', 'З': 'Z',
    'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
    'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Ы': 'I', 'Э': 'E', 'ё': 'yo',
    'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ь': '', 'ю': 'yu',
    'я': 'ya', 'Ё': 'YO', 'Х': 'H', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ъ': '',
    'Ь': '', 'Ю': 'YU', 'Я': 'YA', ' ': '-'
  };

  let replacer = function (a) {
    return arr[a] || a
  };

  return str.replace(/[А-яёЁ ]/g, replacer)

}