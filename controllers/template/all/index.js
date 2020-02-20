let All = require('./model/index');
let conf = require('../../../config');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');
let url = require('url');
let async = require('async');
let fs = require('fs');

exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let administrator = true;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let temp = '';
  let nameTemplate = '';
  let permitForm = '';
  let id_user = null;
  let id_agency = null;
  let id_moderator_agency = null;
  let id_role = null;
  let users = null;
  let districtsName = '';
  let permission = '00000';
  let id_city = null;
  let districtsID = '';
  let regionID = '';
  let sidebar = '';
  let yesPage = true;
  let titlePage = '';
  let resultList = '';
  let inAgent = '';
  let idAgentApartment = null;

  function getSection() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);
        if (result.rowCount === 1) {

          temp = result.rows[0].temp;
          nameTemplate = result.rows[0].name;

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

      id_user = Number(result.rows[0].id_user);
      id_agency = Number(result.rows[0].agency);
      id_moderator_agency = Number(result.rows[0].moderator);
      id_role = Number(result.rows[0].role_id);

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

        if (req.admin !== req.session.uid) {
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
            res.redirect(303, '/admin/template/admin');

          } else {

            id_city = result;
            Permit.getDistricts(req.session.uid, function (err, districts, districts_id, region_id) {

              if (err) return next(err);

              districtsName = districts;
              districtsID = districts_id;
              regionID = region_id;

              noend();

            });
          }
        });
      });
    });
  }

  function redirectAdministrator() {
    /*    if(permission.indexOf('1', 4) === 4){
          res.redirect(303, '/admin/template/complete');
        } else {
          noend();
        }*/

    noend();
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
        message: 'У Вас нет прав доступа к шаблону "all".'
      };

      yesPage = false;

      res.render('template/all/body',
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

  function mapAjax() {

    if(urlParsed.query.map){

      All.getAddress(urlParsed.query.map, function (err, result, house, liter) {

        if (err) return next(err);

        if(result.rowCount > 0){

          let region = result.rows[0].region;
          let districts = result.rows[0].districts;
          let city = result.rows[0].title;
          let street = result.rows[0].street;
          let dom ='';


          if(house){

            if(liter){
              dom = house + liter;
            } else {
              dom = house;
            }
          }

          let street1 = street;

          street1 = street1.toLowerCase();

          if(street1.indexOf('не указано') > -1 || street1.indexOf('не указана') > -1){
            street = '';
          }

          if(!districts){
            districts = '';
          }


          let str = region +'+'+districts+'+'+city+'+'+street+ '+' + dom;

          let str1 = '';


          str1 += '<div class="row">' + "\n";

          str1 += '<iframe width="900" height="700" frameborder="0" style="border:0"' +
            ' src="https://www.google.com/maps/embed/v1/search?key=AIzaSyBn9-_IOheen9bUW9lmVWKtXBPAqARU-c0&q='+str+'"' +
            ' allowfullscreen>';
          str1 += '</iframe>';

          str1 += '</div>' + "\n";

          res.set('Cache-Control', 'no-store, no-cache');
          res.send(str1);


        } else {
          res.set('Cache-Control', 'no-store, no-cache');
          res.send("Ошибка сервера");
        }

      });

    } else {
      noend();
    }
  }

  function existIdNode() {

    if(urlParsed.query.drop){

      let id = urlParsed.query.drop;

      if (permission.indexOf('1', 4) === 4) {

        let idNode = new All({id: id, template: temp});

        idNode.getIdNode(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            noend();
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Нет такой записи."
            };

            res.redirect(303, pathname);
          }

        })

      } else if (permission.indexOf('0', 4) === 4) {

        let idNode = new All({id: id, template: temp});

        idNode.getIdNode(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {


            let template = result.rows[0].template;

            All.getIdAgent(template, id, function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {

                idAgentApartment = result.rows[0].agent;

                if (id_user === idAgentApartment) {

                  noend();

                } else {

                  All.getIdAgency(idAgentApartment, function (err, result) {
                    if (err) return next(err);

                    let agencyUser = result.rows[0].agency;

                    if (result.rowCount > 0) {

                      All.getIdAgency(id_user, function (err, result) {
                        if (err) return next(err);

                        if (result.rowCount > 0) {

                          if (agencyUser === result.rows[0].agency) {
                            noend();
                          } else {
                            req.session.flash = {
                              type: 'danger',
                              intro: 'Ошибка доступа!',
                              message: "Вы не можете просматривать чужой объект недвижимости, не хватает прав."
                            };

                            res.redirect(303, pathname);
                          }
                        }
                      });
                    }
                  });
                }

              } else {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка правки!',
                  message: "Не удалось найти заданный объект недвижимости."
                };

                res.redirect(303, pathname);
              }
            });

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Нет такой записи."
            };

            res.redirect(303, pathname);
          }

        });
      }

    } else {
      noend();
    }
  }

  function dropObject() {

    if(urlParsed.query.drop){

      let id = urlParsed.query.drop;

      All.deleteObject(id, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          All.getCountAllPhoto(id, function (err, result) {
            if (err) return next(err);

            if(result.rowCount > 0){

              All.deleteAllPhoto(id, function (err, result1) {
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
                      res.redirect(303, pathname);

                    } else {

                      req.session.flash = {
                        type: 'success',
                        intro: 'Успех!',
                        message: 'Объект недвижимости удалён.'
                      };

                      res.redirect(303, pathname);
                    }

                  });

                } else {

                  req.session.flash = {
                    type: 'warning',
                    intro: 'Внимание!',
                    message: 'Не удалилась запись в таблице отвечающая за изображения.'
                  };
                  res.redirect(303, pathname);
                }

              });

            } else {

              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Объект недвижимости удалён.'
              };

              res.redirect(303, pathname);
            }

          });

        } else {
          noend();
        }

      });
    } else {
      noend();
    }
  }

  function editObject() {

    if(urlParsed.query.edit){

      let id = urlParsed.query.edit;

      All.getObject(id, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          let section = result.rows[0].section;
          let street = result.rows[0].street;
          let template = result.rows[0].template;

          All.setCity(id_user, street, function (err, result) {
            if (err) return next(err);

            if(result.rowCount > 0){

              All.listSaveEdit(template, id_city, section, permission, id_agency, id_moderator_agency, id_user, function (err, result) {
                if (err) return next(err);
                if(result.rowCount > 0){

                  let j = null;
                  for (let i = 0; i < result.rows.length; i++) {

                    if (id === result.rows[i].id) {

                      j = i + 1;
                      continue;
                    }
                  }

                  let navApartment = conf.get('apartment');

                  let limit = navApartment.limit;

                  let page = Math.ceil(j / limit);

                  if (page < 1) {
                    page = 1;
                  }

                  res.redirect(303, '/admin/template/'+template+'?section='+section+'&edit='+id+'&page='+page);

                } else {

                  res.redirect(303, '/admin/template/'+template+'?section='+section+'&edit='+id);
                }

              });

            } else {
              noend();
            }

          });

        } else {
          noend();
        }

      });
    } else {
      noend();
    }

  }

  function selectAgent() {

    if(id_moderator_agency){

      All.getAgent(id_agency, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          for(let i = 0; i < result.rows.length; i++){
            inAgent += result.rows[i].user_id + ', ';
          }

          inAgent = inAgent.slice(0, -2);
          inAgent = 'IN(' + inAgent + ')';
          noend();

        } else {
          noend();
        }

      });

    } else {
      inAgent = 'IN(' + id_user + ')';
      noend();
    }
  }

  function listTable() {

    /*    console.log('id_user', id_user, typeof id_user);
        console.log('id_agency', id_agency, typeof id_agency);
        console.log('id_moderator_agency', id_moderator_agency, typeof id_moderator_agency);
        console.log('id_role', id_role, typeof id_role);*/

    All.list(inAgent, function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){

        resultList += All.tableListComplete(id_user, result);

        noend();

      } else {
        noend();
      }

    });
  }

  function listRender() {

    titlePage = nameTemplate;

    res.render('template/all/body', {
      layout: 'admin',
      urlPage: req.url,
      titleHead: nameTemplate,
      title: titlePage,
      permit: permitForm,
      permission: permission,
      sidebar: sidebar,
      template: temp,
      administrator: administrator,
      yesPage: yesPage,
      table: resultList
    });
  }



  let tasks = [getSection, initialization, accessValue, redirectAdministrator, userMenu, accessTemplate, mapAjax, existIdNode, dropObject, editObject, selectAgent, listTable, listRender];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

/////////////////////////////////////////////
/////////////////////////////////////////////

exports.submit = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let permission = '00000';
  let temp = '';
  let nameTemplate = '';
  let value = '';
  let id_agency = null;
  let id_moderator_agency = null;
  let id_user = null;
  let administrator = true;
  let users = null;
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

      id_agency = result.rows[0].agency;
      id_moderator_agency = Number(result.rows[0].moderator);
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
        message: 'У Вас нет прав доступа к шаблону "all".'
      };

      yesPage = false;

      res.render('template/all/body',
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

    if (value.drop) {

      if (permission.indexOf('1', 1) === 1) {

        noend();

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на удаление объекта недвижимости."
        };
        res.redirect(303, '/admin/template/admin');
      }

    } else {

      noend();

    }

  }

  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, submitAccess];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};