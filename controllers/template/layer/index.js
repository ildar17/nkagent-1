let conf = require('../../../config');
let Layer = require('./model/index');
let table = require('../../../lib/tableList');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');
let url = require('url');
const co = require('co');


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
  let administrator = true;
  let id_user = null;
  let publicForm = false;
  let yesPage = true;
  let value = '';
  let nameTemplate = '';

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
        message: 'У Вас нет прав доступа к шаблону "layer".'
      };

      yesPage = false;

      res.render('template/layer/body',
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

  function getAccess() {

    if (urlParsed.query.edit) {

      if (permission.indexOf('1', 2) === 2) {

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на редактирование!"
        };
        res.redirect(pathname);
      }

    } else if (urlParsed.query.drop) {

      if (permission.indexOf('1', 1) === 1) {

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на удаление!"
        };
        res.redirect(pathname);
      }

    } else if (urlParsed.query.dropStr) {

      if (permission.indexOf('1', 1) === 1) {

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на удаление!"
        };
        res.redirect(pathname);
      }

    } else if (urlParsed.query.createBlocks) {

      if (permission.indexOf('1', 3) === 3) {

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на создание набора блоков!"
        };
        res.redirect(pathname);
      }

    } else {
      noend();
    }
  }

  function accessUrl() {

    if (urlParsed.query.dropStr) {

      Layer.accessLayerandblockID(urlParsed.query.dropStr, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          if (permission.indexOf('0', 4) === 4 && result.rows[0].email !== req.session.uid) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(pathname);


          } else {
            noend();
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Неправильно набрали адрес в строке браузера."
          };
          res.redirect(pathname);
        }
      })

    } else if (urlParsed.query.edit) {

      Layer.accessLayerID(urlParsed.query.edit, function (err, result) {

        if (err) return next(err);

        if (result.rowCount > 0) {

          if (permission.indexOf('0', 4) === 4 && result.rows[0].email !== req.session.uid) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(pathname);


          } else {
            noend();
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Неправильно набрали адрес в строке браузера."
          };
          res.redirect(pathname);
        }

      })

    } else if (urlParsed.query.drop) {

      Layer.accessLayerID(urlParsed.query.drop, function (err, result) {

        if (err) return next(err);

        if (result.rowCount > 0) {

          if (permission.indexOf('0', 4) === 4 && result.rows[0].email !== req.session.uid) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(pathname);


          } else {
            noend();
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Неправильно набрали адрес в строке браузера."
          };
          res.redirect(pathname);
        }

      })

    } else if (urlParsed.query.createBlocks) {

      Layer.accessLayerID(urlParsed.query.createBlocks, function (err, result) {

        if (err) return next(err);

        if (result.rowCount > 0) {

          if (permission.indexOf('0', 4) === 4 && result.rows[0].email !== req.session.uid) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(pathname);


          } else {
            noend();
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Неправильно набрали адрес в строке браузера."
          };
          res.redirect(pathname);
        }

      })

    } else {
      noend()
    }

  }

  function createBlocks() {

    if (urlParsed.query.createBlocks) {

      if (permission.indexOf('0', 4) === 4) {

        let layer_id = Number(urlParsed.query.createBlocks);

        Layer.getLayerIDAuthor(layer_id, id_user, function (err, resultForm) {
          if (err) return next(err);

          if (resultForm.rowCount > 0) {

            Layer.layerAndBlockSelect(layer_id, id_user, function (err, result) {
              if (err) return next(err);

              blocksSelect(result, function (err, blocks) {
                if (err) return next(err);

                Layer.getTableIdAuthor(layer_id, id_user, function (err, resultTable) {
                  if (err) return next(err);

                  res.render('template/layer/body-edit', {
                    layout: 'admin',
                    urlPage: req.url,
                    titleHead: nameTemplate,
                    title: nameTemplate,
                    permit: permitForm,
                    permission: permission,
                    sidebar: sidebar,
                    template: temp,
                    layerTitle: resultForm.rows[0].title,
                    layerAlias: resultForm.rows[0].alias,
                    blocks: blocks,
                    layer: Layer.tableLayerAndBlock(resultTable, permission),
                    administrator: administrator
                  });
                })
              })
            })

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(pathname);
          }
        })
      }

      if (permission.indexOf('1', 4) === 4) {

        let layer_id = Number(urlParsed.query.createBlocks);

        Layer.getLayerID(layer_id, function (err, resultForm) {
          if (err) return next(err);

          if (resultForm.rowCount > 0) {

            Layer.layerAndBlockSelectAll(layer_id, function (err, result) {
              if (err) return next(err);


              blocksSelect(result, function (err, blocks) {
                if (err) return next(err);

                Layer.getTableId(layer_id, function (err, resultTable) {
                  if (err) return next(err);

                  res.render('template/layer/body-edit', {
                    layout: 'admin',
                    urlPage: req.url,
                    titleHead: nameTemplate,
                    title: nameTemplate,
                    permit: permitForm,
                    permission: permission,
                    sidebar: sidebar,
                    template: temp,
                    layerTitle: resultForm.rows[0].title,
                    layerAlias: resultForm.rows[0].alias,
                    blocks: blocks,
                    layer: Layer.tableLayerAndBlock(resultTable, permission),
                    administrator: administrator
                  });
                })
              })
            })

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(pathname);
          }
        })
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

      let edit = new Layer({
          id: urlParsed.query.edit,
          author: id_user
      });

      if (permission.indexOf('0', 4) === 4) {

        edit.getIdEmail(function (err, result) {

          if (err) return next(err);

          if (result.rowCount === 1) {

            formValue = result.rows[0];
            noend(formValue);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Такой записи не существует!"
            };
            res.redirect(303, pathname);
          }
        });

      } else {

        edit.getId(function (err, result) {
          if (err) return next(err);

          if (result.rowCount === 1) {

            formValue = result.rows[0];
            noend();
          }
        });
      }

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

      let drop = new Layer(
        {
          id: urlParsed.query.drop,
          author: id_user
        }
      );

      if (permission.indexOf('0', 4) === 4) {

        drop.getIdEmail(function (err, result) {

          if (err) return next(err);

          if (result.rowCount === 1) {

            formValue = result.rows[0];
            noend(formValue);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Такой записи не существует!"
            };
            res.redirect(303, pathname);
          }
        });

      } else {

        drop.getId(function (err, result) {
          if (err) return next(err);

          if (result.rowCount === 1) {

            formValue = result.rows[0];
            noend();
          }
        });
      }

    } else {
      noend();
    }

  }

  function deleteStr() {

    if (urlParsed.query.dropStr) {

      let deleteStr = new Layer({
        id: urlParsed.query.dropStr,
        author: id_user
      });
      deleteStr.deleteStrLayerandblock(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Строка удалена.'
          };
          res.redirect(303, 'back');

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка данных!',
            message: "Строка не удалилась!"
          };
          res.redirect(303, 'back');
        }

      });

    } else {
      noend();
    }
  }

  function publication() {

    if (permission.indexOf('1', 0) === 0) {
      publicForm = true;
    }

    noend();
  }


  function listRender() {

    let layerList = new Layer({
      template: temp,
      users: users,
      email: req.session.uid,
      id_user: id_user,
      permission: permission
    });

    let form = false;

    layerList.list(function (err, result) {
      if (err) return next(err);

      resultList = Layer.tableListLayer(result, permission);


      if (permission.indexOf('1', 1) === 1 || permission.indexOf('1', 2) === 2 || permission.indexOf('1', 3) === 3) {
        form = true;
      }

      if (!action.submit) {
        action.create = true;
        action.edit = false;
        action.drop = false;
      }

      if (permission.indexOf('0', 3) === 3) action.create = false;
      if (permission.indexOf('0', 2) === 2) action.edit = false;
      if (permission.indexOf('0', 1) === 1) action.drop = false;

//Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

      res.render('template/layer/body',
        {
          layout: 'admin',
          titleHead: 'Администрирование. ' + nameTemplate + '. ',
          title: 'Администрирование. ' + nameTemplate + '. ',
          form: form,
          urlPage: req.url,
          formValue: formValue,
          permit: permitForm,
          action: action,
          permission: permission,
          sidebar: sidebar,
          template: temp,
          layer: resultList,
          administrator: administrator,
          yesPage: yesPage,
          publicForm: publicForm
        }
      );
    });
  }

  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, getAccess, accessUrl, createBlocks, listEdit, listDrop, deleteStr, publication, listRender];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();
};

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

exports.submit = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let permission = '00000';
  let users = null;
  let temp = '';
  let nameTemplate = '';
  let value = null;
  let id_user = null;
  let administrator = true;
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
        message: 'У Вас нет прав доступа к шаблону "layer".'
      };

      yesPage = false;

      res.render('template/layer/body',
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

  function urlAccess() {

    if (value.create) {

      if (permission.indexOf('1', 3) === 3) {

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на сохранение!"
        };
        res.redirect(303, pathname);

      }

    } else if (urlParsed.query.edit) {

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

    } else if (urlParsed.query.drop) {

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

    } else if (urlParsed.query.createBlocks) {

      if (permission.indexOf('1', 3) === 3) {

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на добавление блока!"
        };
        res.redirect(303, pathname);
      }

    } else {
      noend();
    }
  }

  function accessUrl() {

    if (urlParsed.query.dropStr) {

      Layer.accessLayerandblockID(urlParsed.query.dropStr, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          if (permission.indexOf('0', 4) === 4 && result.rows[0].email !== req.session.uid) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(303, 'back');

          } else {
            noend();
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Неправильно набрали адрес в строке браузера."
          };
          res.redirect(303, 'back');
        }
      })

    } else if (urlParsed.query.edit) {

      Layer.accessLayerID(urlParsed.query.edit, function (err, result) {

        if (err) return next(err);

        if (result.rowCount > 0) {

          if (permission.indexOf('0', 4) === 4 && result.rows[0].email !== req.session.uid) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(303, 'back');

          } else {
            noend();
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Неправильно набрали адрес в строке браузера."
          };
          res.redirect(303, 'back');
        }

      })

    } else if (urlParsed.query.drop) {

      Layer.accessLayerID(urlParsed.query.drop, function (err, result) {

        if (err) return next(err);

        if (result.rowCount > 0) {

          if (permission.indexOf('0', 4) === 4 && result.rows[0].email !== req.session.uid) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(303, 'back');


          } else {
            noend();
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Неправильно набрали адрес в строке браузера."
          };
          res.redirect(303, 'back');
        }

      })

    } else if (urlParsed.query.createBlocks) {

      Layer.accessLayerID(urlParsed.query.createBlocks, function (err, result) {

        if (err) return next(err);

        if (result.rowCount > 0) {

          if (permission.indexOf('0', 4) === 4 && result.rows[0].email !== req.session.uid) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Неправильно набрали адрес в строке браузера."
            };
            res.redirect(303, 'back');


          } else {
            noend();
          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Неправильно набрали адрес в строке браузера."
          };
          res.redirect(303, 'back');
        }

      })

    } else {
      noend()
    }

  }

  function submitValidate() {

    if (urlParsed.query.createBlocks) {

      noend();

    } else {

      value.line = Number(value.line);
      value.status = Number(value.status);
      value.main = Number(value.main);

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
  }

  function alias() {

    if (urlParsed.query.createBlocks) {

      noend();

    } else {

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
  }

  function submitCreate() {

    if (value.create && permission.indexOf('1', 3) === 3) {

      let save = new Layer({

        title: value.title.trim(),
        alias: value.alias.trim(),
        line: value.line,
        date_create: Date.now(),
        author: id_user,
        template: temp,
        status: value.status,
        main: value.main,
        permission: permission

      });

      save.isset(function (err, result) {
        if (err) return next(err);

        if (result === 0) {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Псевдоним не уникален!"
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

          save.save(function (err, result) {
            if (err) return next(err);

            if (result.rowCount === 1 && permission.indexOf('1', 4) !== 4) {

              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Набор блоков будет опубликован после проверки модератором.'
              };
              res.redirect(303, pathname);

            } else if (result.rowCount === 1) {

              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Запись сохранена.'
              };
              res.redirect(303, pathname);

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
              res.redirect(303, pathname);
            }
          });
        }
      });

    } else if (value.createBlocks && urlParsed.query.createBlocks) {

      if (value.selectBlocks) {

        let layerandblock = new Layer(
          {
            layer_id: urlParsed.query.createBlocks,
            block_id: value.selectBlocks
          }
        );

        layerandblock.addLayerAndBlock(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись сохранена.'
            };
            res.redirect(303, 'back');
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Запись не сохранена!"
            };
            res.redirect(303, 'back');
          }
        })

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка записи!',
          message: "Нет блоков для набора!"
        };
        res.redirect(303, 'back');
      }

    } else {
      noend();
    }
  }

  function submitEdit() {

    if (value.edit && urlParsed.query.edit && permission.indexOf('1', 2) === 2) {

      let edit = new Layer({

        id: urlParsed.query.edit.trim(),
        title: value.title.trim(),
        alias: value.alias.trim(),
        line: value.line,
        date_create: Date.now(),
        author: id_user,
        template: temp,
        status: value.status,
        main: value.main

      });

      edit.isset(function (err, result) {
        if (err) return next(err);

        if (result === 0) {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Псевдоним не уникален!"
          };

          req.session.repeatData = {
            title: value.title,
            alias: value.alias,
            line: value.line,
            status: value.status,
            main: value.main
          };
          res.redirect(303, 'back');

        } else {


          if (permission.indexOf('0', 4) === 4) {

            edit.editEmail(function (err, result) {
              if (err) return next(err);

              if (result.rowCount === 1 && permission.indexOf('1', 4) !== 4) {

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Набор блоков будет опубликован после проверки модератором.'
                };
                res.redirect(303, pathname);

              } else if (result.rowCount === 1) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Запись изменена.'
                };
                res.redirect(303, pathname);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Запись не изменена!"
                };
                req.session.repeatData = {
                  title: value.title,
                  alias: value.alias,
                  line: value.line,
                  status: value.status,
                  main: value.main
                };
                res.redirect(303, pathname);
              }

            });

          } else {

            edit.editId(function (err, result) {
              if (err) return next(err);

              if (result.rowCount === 1 && permission.indexOf('1', 4) !== 4) {

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Набор блоков будет опубликован после проверки модератором.'
                };
                res.redirect(303, pathname);

              } else if (result.rowCount === 1) {

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Запись изменена.'
                };
                res.redirect(303, pathname);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Запись не изменена!"
                };
                res.redirect(303, pathname);
              }

            });
          }
        }
      });

    } else {
      noend();
    }
  }

  function submitDrop() {

    if (urlParsed.query.drop && value.drop && permission.indexOf('1', 1) === 1) {

      let drop = new Layer({
        id: urlParsed.query.drop.trim()
      });

      drop.dropLayer(function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {
          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Запись удалена'
          };
          res.redirect(303, pathname);

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Запись не удалена!"
          };
          res.redirect(303, pathname);
        }

      });

    } else {
      next();
    }
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, urlAccess, accessUrl, submitValidate, alias, submitCreate, submitEdit, submitDrop];

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

function blocksSelect(blocks, fn) {
  let str = '';

  if (blocks.rowCount === 0) {

    str += '<option value="">Нет блоков для набора</option>' + '\n';
    return fn(null, str);

  } else {

    blocks = blocks.rows;

    let email = '';

    co(function* () {

      for (let i = 0; i < blocks.length; i++) {

        email = yield new Promise(function (resolve) {

          Layer.getEmailAuthor(blocks[i].author, function (err, result) {

            if (err) return fn(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0].email);
            } else {
              resolve('');
            }
          });
        });

        if (email === conf.get('administrator')) email = 'администратор';

        str += '<option value="' + blocks[i].id + '"><b>' + blocks[i].title + '</b> [' + blocks[i].alias + ']' + ' [' + email + ']' + '</option>' + '\n';

      }

      return fn(null, str);

    });

  }
}
