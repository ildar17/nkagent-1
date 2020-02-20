let Article = require('./model/index');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');
let url = require('url');
let co = require('co');
let conf = require('../../../config');
let nav = require('../../../lib/navigation');
let ms = require('../../../lib/msDate');

let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);


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
  let idSection = '';
  let id_user = null;
  let publicForm = null;
  let yesPage = true;
  let nameTemplate = '';
  let nameSection = '';
  let value = {};
  let idOnePage = false;
  let onePage = null;
  let nameOneOrMorePage = '';
  let titleHead = '';
  let back = '';
  let page = urlParsed.query.page;
  let sectionForm = '';
  let viewsTemplate = conf.get('article');
  viewsTemplate = viewsTemplate.viewsTemplate;
  let reject = '';


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
        message: 'У Вас нет прав доступа к шаблону "article".'
      };

      yesPage = false;

      res.render('template/article/body',
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

  function sectionAndPageCompliance() {

    let id = null;

    if (urlParsed.query.edit) {
      id = urlParsed.query.edit;
    }

    if (urlParsed.query.drop) {
      id = urlParsed.query.drop;
    }

    if(urlParsed.query.section === 'null'){

      noend()

    } else if(urlParsed.query.section && id === null){

      let section = urlParsed.query.section;
      section = Number(section);

      Permit.templateAndSection(temp, section, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          noend();

         } else {
          res.locals.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: 'Несоответствие раздела шаблону.'
          };

          yesPage = false;

          res.render('template/' + viewsTemplate + '/body',
            {
              layout: 'admin',
              titleHead: 'Администрирование. ' + nameTemplate + '. ',
              title: 'Администрирование. ' + nameTemplate + '. ',
              sidebar: sidebar,
              yesPage: yesPage,
              administrator: administrator
            }
          );
        }
      });

    } else if(urlParsed.query.section && id !== null){

      let section = urlParsed.query.section;
      section = Number(section);
      id = Number(id);

      Permit.sectionAndPage(id, temp, section, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          noend();

        } else {

          res.locals.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: 'Несоответствие страницы разделу.'
          };

          yesPage = false;

          res.render('template/' + viewsTemplate + '/body',
            {
              layout: 'admin',
              titleHead: 'Администрирование. ' + nameTemplate + '. ',
              title: 'Администрирование. ' + nameTemplate + '. ',
              sidebar: sidebar,
              yesPage: yesPage,
              administrator: administrator
            }
          );
        }
      });
    } else {
      noend()
    }

  }

  function urlAccess() {

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


  function setSection() {

    if (urlParsed.query.section) {

      idSection = urlParsed.query.section;

      if (idSection === 'null') {
        idSection = null;
      } else {
        idSection = Number(idSection);
      }

      if (idSection !== null) {

        Article.getSectionTemp(idSection, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0 && result.rows[0].one_page !== null) {
            idOnePage = true;
          }


          Article.getSectionPage(idSection, function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {

              nameSection = result.rows[0].title;
              onePage = result.rows[0].one_page;

              if (onePage) {
                nameOneOrMorePage = '<strong>Одностраничный</strong>';
                titleHead = 'Одностраничный';

              } else {
                nameOneOrMorePage = '<strong>Многостраничный</strong>';
                titleHead = 'Многостраничный';
              }

              noend();

            } else {

              res.locals.flash = {
                type: 'danger',
                intro: 'Ошибка доступа!',
                message: "Раздела под номером <b>" + idSection + "</b> не существует."
              };

              yesPage = false;

              res.render('template/' + viewsTemplate + '/body',
                {
                  layout: 'admin',
                  sidebar: sidebar,
                  yesPage: yesPage,
                  administrator: administrator
                }
              );
            }

          });
        });

      } else {
        noend();
      }

    } else {
      res.render('template/' + viewsTemplate + '/pathtemp',
        {
          layout: 'admin',
          titleHead: 'Руководство пользователя: шаблон "' + nameTemplate + '".',
          title: 'Руководство пользователя: шаблон "' + nameTemplate + '".',
          sidebar: sidebar,
          template: temp,
          permit: permitForm,
          administrator: administrator
        }
      )
    }
  }

  function editPublish() {

    if (permission.indexOf('1', 4) === 4) {
      publicForm = true;
    }

    noend();
  }

  function setSelectForm() {

    if (!onePage) {

      if (permission.indexOf('1', 4) === 4) {
        sectionSelect(id_user, idSection, users, req.session.uid, temp, function (err, result) {
          if (err) return next(err);
          sectionForm = result;
          noend();
        })
      } else {
        noend();
      }

    } else {
      noend();
    }
  }

  function listEditDrop() {

    if (urlParsed.query.edit || urlParsed.query.drop) {

      let id = urlParsed.query.edit || urlParsed.query.drop;


      if (permission.indexOf('0', 4) === 4) {

        let editDrop = new Article({id: id, author_edit: id_user});

        editDrop.getPageUser(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            formValue = result.rows[0];

            if (urlParsed.query.edit) {

              action.create = false;
              action.edit = true;
              action.drop = false;
              action.backward = true;
              action.submit = true;
            }

            if (urlParsed.query.drop) {

              action.create = false;
              action.edit = false;
              action.drop = true;
              action.backward = true;
              action.submit = true;
            }

            noend();
          } else {
            res.locals.flash = {
              type: 'warning',
              intro: 'Ошибка проверки!',
              message: "Страница не найдена."
            };

            yesPage = false;

            res.render('template/' + viewsTemplate + '/body', {layout: 'admin', sidebar: sidebar, yesPage: yesPage});
          }
        })

      } else if (permission.indexOf('1', 4) === 4) {

        reject = '<div class="btn btn-danger btn-margin btn-margins" data-toggle="modal" data-target="#myModal">Отклонить статью</div>';

        let editDrop = new Article({id: id});

        editDrop.getPage(function (err, result) {

          if (err) return next(err);
          if (result.rowCount > 0) {
            formValue = result.rows[0];

            if (urlParsed.query.edit) {

              action.create = false;
              action.edit = true;
              action.drop = false;
              action.backward = true;
              action.submit = true;
            }

            if (urlParsed.query.drop) {

              sectionForm = '';
              action.create = false;
              action.edit = false;
              action.drop = true;
              action.backward = true;
              action.submit = true;
            }

            noend();
          } else {
            res.locals.flash = {
              type: 'warning',
              intro: 'Ошибка проверки!',
              message: "Страница не найдена."
            };

            yesPage = false;

            res.render('template/' + viewsTemplate + '/body', {layout: 'admin', sidebar: sidebar, yesPage: yesPage});
          }
        })
      }

    } else {
      noend();
    }
  }

  function listRender() {

    let articleList = new Article({
      template: temp,
      users: users,
      section: idSection,
      email: req.session.uid,
      author: id_user,
      permission: permission
    });

    articleList.list(function (err, result) {
      if (err) return next(err);

      let count = result.rowCount;
      let strCount = '';

      resultList = result;

      let urlPage = null;
      let limit = null;
      let linkLimit = null;
      let offset = null;


      if (onePage) {
        urlPage = urlParsed.query.page;
        limit = 1;
        linkLimit = 1;
        offset = urlPage * limit - limit;

        if (count > 1) {
          if (permission.indexOf('1', 4) === 4) {
            strCount = '<span class="strCount">Внимание! В разделе больше одной страницы.</span>\n';

          }
        }

      } else {

        let navArticle = conf.get('article');
        limit = navArticle.limit;
        linkLimit = navArticle.linkLimit;

        urlPage = urlParsed.query.page;
        limit = 10; // также нужно править в стороке
        linkLimit = 8;
        offset = urlPage * limit - limit;
      }

      if (offset < 0 || !offset) offset = 0;

      articleList.listLimit(limit, offset, function (err, resultLimit) {
        if (err) return next(err);

        tableListArticle(req, resultList, urlParsed, permission, limit, linkLimit, urlPage, resultLimit, onePage, strCount, function (err, resultList) {
          if (err) return next(err);

          if (permission.indexOf('0', 0) === 0) {
            resultList = '';
          }

          if (!action.submit) {
            sectionForm = '';
            action.create = true;
            action.edit = false;
            action.drop = false;
            action.backward = false;
          }

          if (!action.submit && idOnePage) {

            action.create = false;
            action.edit = false;
            action.drop = false;
            action.backward = false;
          }

          if (permission.indexOf('0', 3) === 3) {
            action.create = false;
          }


          if (idSection) {
            back = '?section=' + idSection;
          }

          if (page) {
            back = '?page=' + page;
          }

          if (idSection && page) {
            back = '?section=' + idSection + '&page=' + page;
          }

          //Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)
          res.render('template/' + viewsTemplate + '/body',
            {
              layout: 'admin',
              urlPage: req.url,
              titleHead: titleHead + ' шаблон ' + nameTemplate + ',  раздел ' + nameSection + '. ',
              title: nameOneOrMorePage + ' шаблон ' + nameTemplate + ',  раздел ' + nameSection + '. ',
              formValue: formValue,
              permit: permitForm,
              action: action,
              permission: permission,
              sidebar: sidebar,
              template: temp,
              sections: sectionForm,
              table: resultList,
              publicForm: publicForm,
              administrator: administrator,
              back: '/admin/template/' + temp + back,
              yesPage: yesPage,
              reject: reject
            }
          );

        });

      });

    });
  }

  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, sectionAndPageCompliance, urlAccess, setSection, editPublish, setSelectForm, listEditDrop, listRender];

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
  let nameSection = '';
  let administrator = true;
  let value = {};
  let id_user = null;
  let onePage = null;
  let idOnePage = null;
  let nameTemplate = '';
  let sidebar = '';
  let yesPage = true;
  let idSection = null;
  let viewsTemplate = 'article';

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
        message: 'У Вас нет прав доступа к шаблону "article".'
      };

      yesPage = false;

      res.render('template/article/body',
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

  function sectionAndPageCompliance() {

    let id = null;

    if (urlParsed.query.edit) {
      id = urlParsed.query.edit;
    }

    if (urlParsed.query.drop) {
      id = urlParsed.query.drop;
    }

    if(urlParsed.query.section === 'null'){

      noend()

    } else if(urlParsed.query.section && id === null){

      let section = urlParsed.query.section;
      section = Number(section);

      Permit.templateAndSection(temp, section, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          noend();

        } else {
          res.locals.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: 'Несоответствие раздела шаблону.'
          };

          yesPage = false;

          res.render('template/' + viewsTemplate + '/body',
            {
              layout: 'admin',
              sidebar: sidebar,
              yesPage: yesPage,
              administrator: administrator
            }
          );
        }
      });

    } else if(urlParsed.query.section && id !== null){

      let section = urlParsed.query.section;
      section = Number(section);
      id = Number(id);

      Permit.sectionAndPage(id, temp, section, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          noend();

        } else {

          res.locals.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: 'Несоответствие страницы разделу.'
          };

          yesPage = false;

          res.render('template/' + viewsTemplate + '/body',
            {
              layout: 'admin',
              sidebar: sidebar,
              yesPage: yesPage,
              administrator: administrator
            }
          );
        }
      });
    } else {
      noend()
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
          message: "У Вас нет прав на сохранение."
        };
        res.redirect(pathname);
      }

    } else if (urlParsed.query.edit) {

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

  function setSection() {

    if (urlParsed.query.section) {

      idSection = urlParsed.query.section;

      if (idSection === 'null') {
        idSection = null;
      } else {
        idSection = Number(idSection);
      }
      if (idSection !== null) {

        Article.getSectionTemp(idSection, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0 && result.rows[0].one_page !== null) {
            idOnePage = true;
          }

          Article.getSectionPage(idSection, function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {

              nameSection = result.rows[0].title;
              onePage = result.rows[0].one_page;

              noend();

            } else {

              res.locals.flash = {
                type: 'danger',
                intro: 'Ошибка доступа!',
                message: "Раздела под номером <b>" + idSection + "</b> не существует."
              };

              yesPage = false;

              res.render('template/' + viewsTemplate + '/body',
                {
                  layout: 'admin',
                  sidebar: sidebar,
                  yesPage: yesPage,
                  administrator: administrator
                }
              );
            }

          });
        });
      } else {
        noend();
      }
    } else {
      res.render('template/' + viewsTemplate + '/pathtemp',
        {
          layout: 'admin',
          titleHead: 'Руководство пользователя: шаблон "' + nameTemplate + '".',
          title: 'Руководство пользователя: шаблон "' + nameTemplate + '".',
          sidebar: sidebar,
          template: temp,
          administrator: administrator
        }
      )
    }
  }

  function submitValidate() {

    value.priority = Number(value.priority);
    value.status = Number(value.status);
    value.main = Number(value.main);

    if (value.title === ' ' || value.description === ' ' || value.content === ' ' || value.priority === ' ' || value.alias === ' ') {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Полe не может быть пробелом."
      };
      req.session.repeatData = {
        title: value.title,
        alias: value.alias,
        description: value.description,
        priority: value.priority,
        content: value.content,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else if (value.title.length < 1) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Поля отмеченные звёздочкой обязательны для заполнения."
      };

      req.session.repeatData = {
        errTitle: true,
        title: value.title,
        alias: value.alias,
        description: value.description,
        priority: value.priority,
        content: value.content,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else if (value.content.length < 1) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Поля отмеченные звёздочкой обязательны для заполнения."
      };

      req.session.repeatData = {
        errContent: true,
        title: value.title,
        alias: value.alias,
        description: value.description,
        priority: value.priority,
        content: value.content,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else if (value.title.length > 120) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: value.title + ' - должно быть не более 120 символов.'
      };
      req.session.repeatData = {
        errTitle: true,
        title: value.title,
        alias: value.alias,
        description: value.description,
        priority: value.priority,
        content: value.content,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else if (value.alias.length > 120) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: value.alias + ' - должно быть не более 120 символов.'
      };
      req.session.repeatData = {
        errAlias: true,
        title: value.title,
        alias: value.alias,
        description: value.description,
        priority: value.priority,
        content: value.content,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else if (value.description.length > 1000) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Описание должно быть не более 1000 символов.'
      };
      req.session.repeatData = {
        errDescription: true,
        title: value.title,
        alias: value.alias,
        description: value.description,
        priority: value.priority,
        content: value.content,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');
    } else if (value.content.length > 10000) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Контент должнен составлять не более 10000 символов включая пробелы.'
      };
      req.session.repeatData = {
        errContent: true,
        title: value.title,
        alias: value.alias,
        description: value.description,
        priority: value.priority,
        content: value.content,
        status: value.status,
        main: value.main
      };
      res.redirect(303, 'back');

    } else {

      noend();
    }
  }

  function alias() {

    if (value.latin === '2') {

      noend();

    } else if (value.latin === '1') {

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
          message: 'Если поле "Псевдоним" отмечено как "original", то поле обязательно для заполнения.'
        };
        req.session.repeatData = {
          errAlias: true,
          title: value.title,
          alias: value.alias,
          description: value.description,
          priority: value.priority,
          content: value.content,
          status: value.status,
          main: value.main
        };
        res.redirect(303, 'back');

      } else {
        noend();
      }
    }
  }

  function submitCreate() {

    if (value.create) {

      let create = new Article({
        section: idSection,
        title: value.title.trim(),
        alias: value.alias.trim(),
        description: value.description.trim(),
        content: value.content.trim(),
        priority: value.priority,
        date_create: Date.now(),
        author: id_user,
        template: temp,
        status: value.status,
        main: value.main,
        latin: value.latin,
        permission: permission

      });

      create.isset(function (err, result) {
        if (err) return next(err);

        if (result === 0) {

          req.session.repeatData = {
            errAlias: true,
            title: value.title,
            alias: value.alias,
            description: value.description,
            priority: value.priority,
            content: value.content,
            status: value.status,
            main: value.main
          };

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Псевдоним не уникален."
          };

          req.session.repeatData = {
            errAlias: true,
            title: value.title,
            alias: value.alias,
            description: value.description,
            priority: value.priority,
            content: value.content,
            status: value.status,
            main: value.main
          };

          res.redirect(303, 'back');

        } else {

          create.expectIdArticle(function (err, resultExpect) {
            if (err) return next(err);

            if (resultExpect.rowCount > 0 && permission.indexOf('0', 4) === 4) {

              create.list(function (err, result) {
                if (err) return next(err);

                let j = null;
                for (let i = 0; i < result.rows.length; i++) {

                  if (resultExpect.rows[0].id === result.rows[i]['Редактировать']) {

                    j = i + 1;
                    continue;
                  }
                }

                let navArticle = conf.get('article');

                let limit = navArticle.limit;

                let page = Math.ceil(j / limit);

                if (page < 1) {
                  page = 1;
                }

                req.session.flash = {
                  type: 'warning',
                  intro: 'Внимание!',
                  message: 'Вы не можете добавлять статьи, пока у Вас есть статья ожидающая публикацию.'
                };
                res.redirect(pathname + '?edit=' + resultExpect.rows[0].id + '&section=' + resultExpect.rows[0].section + '&page=' + page);

              });

            } else {

              create.save(function (err, result) {
                if (err) return next(err);

                if (result.rowCount > 0 && permission.indexOf('0', 4) === 4) {
                  req.session.flash = {
                    type: 'success',
                    intro: 'Успех!',
                    message: 'Статья будет опубликована после проверки модератором.'
                  };
                  res.redirect(303, urlParsed.pathname + '?section=' + idSection);

                } else if (result.rowCount > 0) {
                  req.session.flash = {
                    type: 'success',
                    intro: 'Успех!',
                    message: 'Запись сохранена.'
                  };
                  res.redirect(303, urlParsed.pathname + '?section=' + idSection);

                } else {
                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "Запись не сохранена."
                  };
                  res.redirect(303, urlParsed.pathname + '?section=' + idSection);
                }
              });
            }
          });
        }
      });

    } else {
      noend();
    }
  }

  function submitEditReject() {

    if (urlParsed.query.edit && permission.indexOf('1', 4) === 4 && value.submitReject) {

      if (value.reject === ' ') {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "При указании причины отклонения статьи, поле не может быть пробелом."
        };
        req.session.repeatData = {
          title: value.title,
          alias: value.alias,
          description: value.description,
          priority: value.priority,
          content: value.content,
          status: value.status,
          main: value.main
        };
        res.redirect('back');
      } else if (value.reject.length < 1) {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поле не может быть пустым, нужно обязательно указать причину отклонения статьи."
        };
        req.session.repeatData = {
          title: value.title,
          alias: value.alias,
          description: value.description,
          priority: value.priority,
          content: value.content,
          status: value.status,
          main: value.main
        };
        res.redirect('back');

      } else {

        let reject = new Article({
          id: urlParsed.query.edit,
          message: value.reject,
          date_message: Date.now()
        });

        reject.createRejectArticle(function (err, result) {
          if (err) return next(err);
          res.redirect('back');
        });
      }

    } else {
      noend();
    }
  }

  function submitEdit() {

    if (urlParsed.query.edit) {

      let edit = new Article({

        id: urlParsed.query.edit.trim(),
        section: idSection,
        title: value.title.trim(),
        alias: value.alias.trim(),
        description: value.description.trim(),
        priority: value.priority,
        content: value.content.trim(),
        date_edit: Date.now(),
        author_edit: id_user,
        template: temp,
        status: value.status,
        main: value.main,
        latin: value.latin,
        permission: permission

      });

      edit.isset(function (err, result) {
        if (err) return next(err);

        if (result === 0) {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Псевдоним не уникален."
          };
          req.session.repeatData = {
            errAlias: true,
            title: value.title,
            alias: value.alias,
            description: value.description,
            priority: value.priority,
            content: value.content,
            status: value.status,
            main: value.main
          };
          res.redirect(303, 'back');

        } else {

          if (permission.indexOf('1', 4) === 4) {

            if (!onePage) {

              if (value.section === 'null') {
                edit.section = null;
              } else {
                edit.section = Number(value.section);
              }

              idSection = edit.section;
            }

            edit.editPage(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {

                edit.list(function (err, result) {
                  if (err) return next(err);

                  if (result.rowCount > 0) {

                    let j = null;
                    for (let i = 0; i < result.rows.length; i++) {

                      if (edit.id === result.rows[i]['Редактировать']) {

                        j = i + 1;
                        continue;
                      }
                    }

                    let navArticle = conf.get('article');

                    let limit = navArticle.limit;

                    let page = Math.ceil(j / limit);

                    if (page < 1) {
                      page = 1;
                    }

                    req.session.flash = {
                      type: 'success',
                      intro: 'Успех!',
                      message: 'Запись изменена.'
                    };
                    res.redirect(pathname + '?edit=' + urlParsed.query.edit + '&section=' + idSection + '&page=' + page);

                  }

                });

              } else {
                // ошибка сервера
              }

            });

          } else if (permission.indexOf('0', 4) === 4) {

            edit.getPageUser(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {

                edit.editPage(function (err, result) {
                  if (err) return next(err);

                  if (result.rowCount > 0) {
                    req.session.flash = {
                      type: 'success',
                      intro: 'Успех!',
                      message: 'Запись изменена.'
                    };
                    res.redirect('back');

                  } else {
                    // ошибка сервера
                  }

                });

              } else {

                req.session.flash = {
                  type: 'warning',
                  intro: 'Ошибка доступа!',
                  message: 'Вы не можете редактировать эту сраницу.'
                };
                res.redirect(303, urlParsed.pathname + '?section=' + idSection);
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

    if (urlParsed.query.drop) {
      let drop = new Article({
        id: urlParsed.query.drop,
        author_edit: id_user
      });

      if (permission.indexOf('0', 4) === 4) {

        drop.getPageUser(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            drop.drop(function (err, result) {
              if (err) return next(err);

              if (result.rowCount === 1) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Запись удалена'
                };
                res.redirect(303, urlParsed.pathname + '?section=' + idSection);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: 'Запись не удалена.'
                };
                res.redirect(303, urlParsed.pathname + '?section=' + idSection);
              }

            });

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка доступа!',
              message: "Недостаточно прав для удаление записи."
            };
            res.redirect(303, urlParsed.pathname + '?section=' + idSection);
          }
        });

      } else if (permission.indexOf('1', 4) === 4) {

        drop.drop(function (err, result) {
          if (err) return next(err);

          if (result.rowCount === 1) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена'
            };
            res.redirect(303, urlParsed.pathname + '?section=' + idSection);

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: 'Запись не удалена.'
            };
            res.redirect(303, urlParsed.pathname + '?section=' + idSection);
          }

        });
      }

    } else {
      next();
    }
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, sectionAndPageCompliance, urlAccess, setSection, submitValidate, alias, submitCreate, submitEditReject, submitEdit, submitDrop];

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


function sectionSelect(id_user, section_id, users, email, temp, fn) {

  let str = '';

  function action1() {

    let select = new Article({
      temp: temp,
      users: users,
      author: id_user
    });

    select.selectSection(function (err, result) {
      if (err) return fn(err);

      if (result.rowCount > 0) {

        let sections = result.rows;


        str += '<label style="font-size: 12px;" class="col-sm-2  control-label">Выбрать раздел:</label>' + '\n';
        str += '<div class="col-sm-3">' + '\n';

        str += '<select class="form-control" name="' + temp + '[section]">' + '\n';
        str += '<option value="null">Раздел не присвоен</option>' + '\n';

        for (let i = 0; i < sections.length; i++) {

          str += '<option value="' + sections[i].section_id + '" ';

          if (Number(sections[i].section_id) === section_id) {
            str += 'selected';
          }

          str += '>' + sections[i].section + '</option>' + '\n';

        }
        str += '</select>' + '\n';
        str += '</div>' + '\n';

        noend()

      } else {

        str += '<label style="font-size: 12px;" class="col-sm-3 control-label">Выбрать раздел: </label>' + '\n';
        str += '<div class="col-sm-3">' + '\n';
        str += '<select class="form-control" name="' + temp + '[section]">' + '\n';
        str += '<option value="">Нет разделов в шаблоне</option>' + '\n';
        str += '<option value="null">Раздел не присвоен</option>' + '\n';
        str += '</select>' + '\n';
        str += '</div>' + '\n';

        noend()
      }

    });
  }

  function action2() {

    return fn(null, str);

  }


  let tasks = [action1, action2];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

}

function tableListArticle(req, row, urlParsed, permission, limit, linkLimit, urlPage, result, onePage, strCount, fn) {

  let str = '';

  let pathname = urlParsed.pathname;

  let active = '';

  if (urlParsed.query.edit) {
    active = urlParsed.query.edit;
  }

  if (urlParsed.query.drop) {
    active = urlParsed.query.drop;
  }

  let strPath = nav.linkQuery('edit', 'drop', 'party', req);

  function returnEmpty() {

    if (result.rowCount === 0 || !result) {
      return fn(null, str);
    } else {
      noend();
    }
  }

  function headTR() {

    str += strCount + '\n';
    str += '<div class="clearfix"></div>' + '\n';
    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';

    for (let i = 0; i < result.fields.length; i++) {

      if (result.fields[i].name === 'Приоритет') continue;

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }

    str += '\t' + '</tr>' + '\n';

    noend();
  }

  function initNav() {

    if (!onePage) {
      nav.navpageArticle(str, urlParsed, row.rowCount, limit, linkLimit, urlPage, 'page', function (err, resultNav) {
        if (err) return fn(err);
        str += resultNav;
        noend();
      });
    } else {
      noend();
    }

  }

  function bodyTR() {

    co(function* () {

      for (let j = 0; j < result.rows.length; j++) {

        let row = result.rows[j];

        if (result.rows[j]['Редактировать'] === active && !onePage) {
          str += '\t' + '<tr bgcolor="#f0e68c">' + '\n';
        } else {
          str += '\t' + '<tr>' + '\n';
        }

        let id = null;

        for (let i = 0; i < result.fields.length; i++) {

          if (result.fields[i].name === 'Приоритет') continue;

          let cols = result.fields[i].name;

          str += '\t\t' + '<td>';

          if (result.fields[i].name === 'Редактировать') {

            id = row[cols];

            str += '<span class="td200">';

            if (permission.indexOf('1', 2) === 2) {
              str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="'+pathname+'?edit=' + row[cols] + strPath +'">править</a>';
            }

            if (permission.indexOf('1', 1) === 1) {
              str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="'+pathname+'?drop=' + row[cols] + strPath + '">удалить</a>';
            }

            str += '</span>';

          } else if (result.fields[i].name === 'Дата создания' || result.fields[i].name === 'Дата правки') {
            str += ms.clip(ms.msDate(row[cols]));
          } else if (result.fields[i].name === 'Автор') {

            if (row[cols] === conf.get('administrator')) {
              str += 'администратор';
            } else if (row[cols] == null) {
              str += '';
            } else {
              str += row[cols];
            }
          } else if (result.fields[i].name === 'Автор правки') {

            if (row[cols] === conf.get('administrator')) {
              str += 'администратор';
            } else if (row[cols] == null) {
              str += '';
            } else {
              str += row[cols];
            }

          } else if (result.fields[i].name === 'Статус') {

            if (row[cols] === 1) {
              str += '<span class="yes">public</span>';
            }

            if (row[cols] === 0) {

              let client = yield pool.connect();
              let result;
              try {
                result = yield client.query('SELECT * FROM article_reject WHERE node_id = ' + id);
                client.release();

                if (result.rowCount > 0) {

                  str += '<span class="btn btn-danger btn-xs" data-toggle="modal" data-target="#modalReject">отклонено</span>\n';
                  str += '<div class="modal fade" id="modalReject">\n';
                  str += '\t<div class="modal-dialog">\n';
                  str += '\t\t<div class="modal-content">\n';
                  str += '\t\t\t<div class="modal-header">\n';
                  str += '\t\t\t\t<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\n';
                  str += '\t\t\t\t<h4 class="modal-title">Сообщение от модератора</h4>\n';
                  str += '\t\t\t</div>\n';
                  str += '\t\t\t<div class="modal-body">\n';
                  str += '\t\t\t\t<p>' + result.rows[0].message + '</p>\n';
                  str += '\t\t\t</div>\n';
                  str += '\t\t\t<div class="modal-footer">\n';
                  str += '\t\t\t\t<button type="button" class="btn btn-default" data-dismiss="modal">Закрыть</button>\n';
                  str += '\t\t\t</div>\n';
                  str += '\t\t\</div><!-- /.modal-content -->\n';
                  str += '\t</div><!-- /.modal-dialog -->\n';
                  str += '</div><!-- /.modal -->\n';
                } else {
                  str += '<span class="expect">ожидает</span>';
                }

              } catch (err) {
                if (err) return fn(err);
              }
            }

          } else if (result.fields[i].name === 'Главная') {
            if (row[cols] === 1) {
              str += '<span class="yes">да</span>';
            }

            if (row[cols] === 0) {
              str += '<span class="no">нет</span>';
            }
          } else if (result.fields[i].name === 'Раздел') {
            if (row[cols] == null) {
              str += 'раздел не выбран';
            } else {
              str += row[cols];
            }
          } else if (row[cols] == null) {
            str += row[cols] = '';
          } else {
            str += ms.clip(row[cols]);
          }

          str += '</td>' + '\n';

        }
        id = null;
        str += '\t' + '</tr>' + '\n';
      }

      noend();

    });
  }

  function returnStr() {

    str += '</table>' + '\n';
    str += '</div>' + '\n';

    return fn(null, str);

  }

  let tasks = [returnEmpty, initNav, headTR, bodyTR, returnStr];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

}
