let conf = require('../../../config');
let Section = require('./model/index');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');
let url = require('url');
const co = require('co');


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let temp = '';
  let nameTemplate = '';
  let resultList = '';
  let formValue = '';
  let permission = '00000';
  let users = null;
  let action = {};
  let sidebar = '';
  let permitForm = '';
  let administrator = true;
  let value = '';
  let id_user = null;
  let publicForm = false;
  let select = '';
  let yesPage = true;

  function getSection() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {

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
        message: 'У Вас нет прав доступа к шаблону "section".'
      };

      yesPage = false;

      res.render('template/section/body',
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

    } else if (urlParsed.query.onePage && urlParsed.query.idSectionandtemplate) {

      if (permission.indexOf('1', 2) === 2 || permission.indexOf('1', 3) === 3) {

        noend();

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на настройку шаблонов!"
        };
        res.redirect(303, pathname);
      }

    } else {

      noend();
    }
  }

  function accessUrl() {

    if (urlParsed.query.edit) {

      Section.accessSectionID(urlParsed.query.edit, function (err, result) {
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

      Section.accessSectionID(urlParsed.query.drop, function (err, result) {
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

    } else if (urlParsed.query.deleteTemplate) {

      Section.accessSectionandtemplateID(urlParsed.query.deleteTemplate, function (err, result) {

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

    } else if (urlParsed.query.createTemplate) {

      Section.accessSectionID(urlParsed.query.createTemplate, function (err, result) {

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

    } else if (urlParsed.query.idSectionandtemplate) {

      Section.accessSectionandtemplateID(urlParsed.query.idSectionandtemplate, function (err, result) {

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


  function createEditOnePage() {

    if (urlParsed.query.onePage && urlParsed.query.idSectionandtemplate && permission.indexOf('1', 2) === 2) {

      let updateOnePage = new Section(
        {
          id_sectionandtemplate: urlParsed.query.idSectionandtemplate,
          one_page: urlParsed.query.onePage
        }
      );

      updateOnePage.createOnePage(function (err, result) {
        if (err) return next(err);

        if (result.rowCount === 1) {
          res.redirect(303, pathname);
        } else {
          res.redirect(303, pathname);
        }
      })

    } else {
      noend();
    }
  }

  function createTemplate() {

    if (urlParsed.query.createTemplate && !urlParsed.query.deleteTemplate && permission.indexOf('1', 2) === 2) {

      let sections = new Section(
        {
          id: urlParsed.query.createTemplate,
          author: id_user
        }
      );

      if (permission.indexOf('0', 4) === 4) {

        sections.getIdEmail(function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){

            sections.getTemplateId(function (err, resultTemplate) {
              if (err) return next(err);

              sections.getTableId(function (err, resultTable) {
                if (err) return next(err);

                templateSelect(resultTemplate.rows, req.session.uid, function (err, resultSelect) {
                  if (err) return next(err);

                  select = resultSelect;

                  res.render('template/section/body-edit', {
                    layout: 'admin',
                    urlPage: req.url,
                    titleHead: nameTemplate,
                    title: nameTemplate,
                    permit: permitForm,
                    permission: permission,
                    sidebar: sidebar,
                    template: temp,
                    sectionTitle: result.rows[0].title,
                    sectionAlias: result.rows[0].alias,
                    temp: select,
                    sections: Section.tableSectionAndTemplate(resultTable, permission, urlParsed.query.createTemplate),
                    yesPage: yesPage,
                    administrator: administrator
                  });

                });
              });
            });
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Неправильно указан адрес в браузере."
            };
            res.redirect(pathname);
          }
        });

      } else {

        sections.getId(function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0) {

            sections.getTemplateId(function (err, resultTemplate) {
              if (err) return next(err);

              sections.getTableId(function (err, resultTable) {
                if (err) return next(err);

                let email = '';
                co(function* () {

                  email = yield new Promise(function (resolve) {

                    Section.getEmailAuthor(result.rows[0].author, function (err, result) {
                      if (err) return next(err);

                      if (result.rowCount > 0) {
                        resolve(result.rows[0].email);
                      } else {
                        resolve();
                      }
                    })
                  });

                  select = yield new Promise(function (resolve) {
                    templateSelect(resultTemplate.rows, req.session.uid, function (err, result) {
                      if (err) return next(err);
                      resolve(result);
                    })
                  });

                  let userTitle = '';

                  if (conf.get('administrator') === email) {
                    userTitle = 'администратор';
                  } else {
                    userTitle = email;
                  }

                  res.render('template/section/body-edit', {
                    layout: 'admin',
                    urlPage: req.url,
                    titleHead: 'Раздел: ' + result.rows[0].title + '. Псевдоним раздела: ' + result.rows[0].alias + '. Владелец: ' + userTitle + '.',
                    title: 'Раздел: ' + result.rows[0].title + '. Псевдоним раздела: ' + result.rows[0].alias + '. Владелец: ' + userTitle + '.',
                    permit: permitForm,
                    permission: permission,
                    sidebar: sidebar,
                    template: temp,
                    sectionTitle: result.rows[0].title,
                    sectionAlias: result.rows[0].alias,
                    temp: select,
                    sections: Section.tableSectionAndTemplate(resultTable, permission, urlParsed.query.createTemplate),
                    yesPage: yesPage,
                    administrator: administrator
                  });

                });
              });
            });

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Неправильно указан адрес в браузере."
            };
            res.redirect(pathname);
          }
        });
      }

    } else {

      noend();
    }
  }

  function deleteTemplate() {

    if (urlParsed.query.deleteTemplate) {

      if( permission.indexOf('1', 2) === 2 || permission.indexOf('1', 3) === 3){

        Section.deleteTemplate(urlParsed.query.deleteTemplate, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Шаблон открепили от раздела.'
            };

            if(urlParsed.query.createTemplate){
              res.redirect(pathname + '?createTemplate=' + urlParsed.query.createTemplate);
            } else {
              res.redirect(pathname);
            }

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Не удалось открепить шаблон от раздела!"
            };

            if(urlParsed.query.createTemplate){
              res.redirect(pathname + '?createTemplate=' + urlParsed.query.createTemplate);
            } else {
              res.redirect(pathname);
            }
          }
        });

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на редактирование или создание привязки к шаблону."
        };
        res.redirect(pathname);
      }

    } else {
      noend();
    }
  }

  function listEdit() {

    if (urlParsed.query.edit && permission.indexOf('1', 2) === 2) {

      action.create = false;
      action.edit = true;
      action.drop = false;
      action.submit = true;

      let edit = new Section(
        {
          id: urlParsed.query.edit,
          author: id_user
        }
      );

      if (permission.indexOf('0', 4) === 4) {

        edit.getIdEmail(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            formValue = result.rows[0];
            noend();

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
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

    if (urlParsed.query.drop && permission.indexOf('1', 1) === 1) {

      action.create = false;
      action.edit = false;
      action.drop = true;
      action.submit = true;

      let drop = new Section(
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

            noend();

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
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

  function editPublish() {

    if (permission.indexOf('1', 0) === 0) {
      publicForm = true;
    }

    noend();
  }

  function listRender() {

    let sectionList = new Section({
      template: temp,
      users: users,
      email: req.session.uid,
      id_user: id_user,
      permission: permission
    });

    let form = false;

    sectionList.list(function (err, result) {
      if (err) return next(err);

      resultList = Section.tableListSection(result, permission);

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

      res.render('template/section/body',
        {
          layout: 'admin',
          urlPage: req.url,
          titleHead: 'Администрирование. ' + nameTemplate + '. ',
          title: 'Администрирование. ' + nameTemplate + '. ',
          form: form,
          formValue: formValue,
          permit: permitForm,
          action: action,
          permission: permission,
          sidebar: sidebar,
          template: temp,
          sections: resultList,
          administrator: administrator,
          yesPage: yesPage,
          publicForm: publicForm
        }
      );
    });
  }

  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, getAccess, accessUrl, createEditOnePage, createTemplate, deleteTemplate, listEdit, listDrop, editPublish, listRender];

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
  let value = '';
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
        message: 'У Вас нет прав доступа к шаблону "section".'
      };

      yesPage = false;

      res.render('template/section/body',
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

    } else if (urlParsed.query.createTemplate) {

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

    if (urlParsed.query.edit) {

      Section.accessSectionID(urlParsed.query.edit, function (err, result) {
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

      Section.accessSectionID(urlParsed.query.drop, function (err, result) {
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

    } else if (urlParsed.query.deleteTemplate) {

      Section.accessSectionandtemplateID(urlParsed.query.deleteTemplate, function (err, result) {

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

    } else if (urlParsed.query.createTemplate) {

      Section.accessSectionID(urlParsed.query.createTemplate, function (err, result) {

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

    } else if (urlParsed.query.idSectionandtemplate) {

      Section.accessSectionandtemplateID(urlParsed.query.idSectionandtemplate, function (err, result) {

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


  function submitValidate() {

    if (urlParsed.query.createTemplate) {

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
          main: value.mai
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
          main: value.mai
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

    if (urlParsed.query.createTemplate) {

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

      let save = new Section({

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
            title: value.title,
            alias: value.alias
          };
          res.redirect(303, pathname);

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
              res.redirect(303, pathname);
            }
          });
        }
      });

    } else if (value.createTemplate && urlParsed.query.createTemplate) {

      if (value.selectTemplate) {

        let sectionandtemplate = new Section(
          {
            section_id: urlParsed.query.createTemplate,
            template: value.selectTemplate
          }
        );

        sectionandtemplate.addSectionAndTemplate(function (err, result) {
          if (err) return next(err);

          if (result.rowCount === 1) {
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
          message: "Нет шаблона для записи!"
        };
        req.session.repeatData = {
          title: value.title,
          alias: value.alias
        };
        res.redirect(303, 'back');
      }

    } else {
      noend();
    }
  }


  function submitEdit() {

    if (value.edit && urlParsed.query.edit && permission.indexOf('1', 2) === 2) {

      let edit = new Section({

        id: urlParsed.query.edit.trim(),
        title: value.title.trim(),
        alias: value.alias.trim(),
        line: value.line,
        date_create: Date.now(),
        author: id_user,
        template: temp,
        status: value.status,
        main: value.main,
        permission:permission

      });

      edit.isset(function (err, result) {
        if (err) return next(err);

        if (result === 0) {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Псевдоним не уникален!"
          };
          req.session.repeatData = {
            title: value.title,
            alias: value.alias
          };
          res.redirect(303, pathname);

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

      let drop = new Section({
        id: urlParsed.query.drop.trim(),
      });

      drop.dropSection(function (err, result) {
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
    'Ь': '', 'Ю': 'YU', 'Я': 'YA', ' ': '-', ';': '', ':': '', '?': '', "'": '', '"': '',
    '}': '', '{': '', ']': '', '[': '', '+': '', '_': '', '*': '', '&': '', '%': '',
    '^': '', '$': '', '#': '', '@': '', '!': '', '~': '', ')': '', '(': '', '|': '', '\\': '',
    '/': '', '.': '', ',': '', '<': '', '>': '', '«': '', '»': ''
  };

  str = str.split('');


  let strstr = '';

  for (let i = 0; i < str.length; i++) {

    if (arr[str[i]]) {

      strstr += arr[str[i]];

    } else {

      if (arr[str[i]] === '') {
        strstr += arr[str[i]];
      } else {
        strstr += str[i];
      }
    }
  }

  if (strstr.indexOf('-', strstr.length - 1) === strstr.length - 1) {
    strstr = strstr.substring(0, strstr.length - 1);
  }

  return strstr;

}

function templateSelect(sections, email, fn) {

  let str = '';

  co(function* () {

    for (let i = 0; i < sections.length; i++) {

      let code = yield new Promise(function (resolve, reject) {
        menu.getCode(sections[i].id_permit, email, function (err, result) {
          if (err) reject(err);
          resolve(result);
        })
      }).catch(function (err) {
        return fn(err, null);
      });

      if (conf.get('administrator') === email) {

        str += '<option value="' + sections[i].temp + '">' + sections[i].temp + '</option>' + '\n';

      } else if (code !== '00000') {

        str += '<option value="' + sections[i].temp + '">' + sections[i].temp + '</option>' + '\n';

      }

    }

    if (str.length > 0) {
      return fn(null, str);
    } else {
      str += '<option value="">Нет шаблонов</option>' + '\n';
      return fn(null, str);
    }
  });
}
