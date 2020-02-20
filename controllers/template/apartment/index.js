let Apartment = require('./model/index');
let conf = require('../../../config');
let table = require('../../../lib/tableList');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');
let url = require('url');
let co = require("co");
let async = require('async');
let fs = require('fs');
let googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyB0RF33ODUlSYG464lchO1kg3NGi5uJIoI'
});


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let temp = '';
  let nameTemplate = ''; // Наименование раздела первого уровня
  let idSection = ''; // id раздела второго уровня
  let page = '';
  let back = '';
  let resultList = '';
  let formValue = '';
  let permission = '00000';
  let users = null;
  let action = {};
  let sidebar = '';
  let permitForm = '';
  let section = '';
  let titlePage = '';
  let administrator = true;
  let selectStreet = '';
  let selectProject = '';
  let selectToilet = '';
  let selectOp = '';
  let selectBalcony = '';
  let selectType = '';
  let selectAgent = '';
  let value = {};
  if (res.locals.repeatData) {
    value = res.locals.repeatData;
  }
  let selectStatus = '';
  let selectMain = '';
  let sortingStreet = '';
  let sortingAgent = '';
  let sortingSection = '';
  let sortingMinPrice = '';
  let sortingMaxPrice = '';

  let idAgent = '';
  let minPrice = '';
  let maxPrice = '';
  if (urlParsed.query.min) minPrice = urlParsed.query.min * 1;
  if (urlParsed.query.max) maxPrice = urlParsed.query.max * 1;
  let id_user = null;
  let id_role = null;
  let publicForm = false;
  let id_permit = null;
  let id_city = null;
  let yesPage = true;
  let idAgentApartment = null;
  let cityList = '';
  let nameCity = '';
  let id_agency = null;
  let id_moderator_agency = null;
  let inSection = '';
  let inAgent = '';
  let inPrice = '';
  let inStreet = '';
  let resultLimit = '';
  let districtsName = '';
  let districtsID = '';
  let districts = '';
  let regionID = '';


  function getSection() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

      Permit.getSection(pathname, function (err, result) {
        if (err) return next(err);
        if (result.rowCount === 1) {

          temp = result.rows[0].temp;
          nameTemplate = result.rows[0].name;
          id_permit = Number(result.rows[0].id_permit);
          idAgent = Number(urlParsed.query.agent);

          if (urlParsed.query.section && !urlParsed.query.page) {
            back = '?section=' + urlParsed.query.section;
          }

          if (urlParsed.query.page && !urlParsed.query.section) {
            back = '?page=' + urlParsed.query.page;
          }

          if (urlParsed.query.section && urlParsed.query.page) {
            back = '?section=' + urlParsed.query.section + '&page=' + urlParsed.query.page;
          }

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
        message: 'У Вас нет прав доступа к шаблону "apartment".'
      };

      yesPage = false;

      res.render('template/apartment/body',
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

      Apartment.getAddress(temp, urlParsed.query.map, function (err, result, house, liter) {
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

          //console.log(str);

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

  function editDistricts() {

    if (urlParsed.query.editDistricts) {

      Apartment.setDistricts(urlParsed.query.editDistricts, req.session.uid, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Район установлен.'
          };
          res.redirect(303, pathname);

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "В ближайшее время ошибка будет устранена."
          };
          res.redirect(303, pathname);
        }
      })

    } else {
      noend();
    }
  }

  function editCity() {

    if (urlParsed.query.editCity) {

      Apartment.setCity(urlParsed.query.editCity, req.session.uid, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Город установлен.'
          };
          res.redirect(303, pathname);

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "В ближайшее время ошибка будет устранена."
          };
          res.redirect(303, pathname);
        }
      })

    } else {
      noend();
    }
  }

  function dateEntry() {

    if (!administrator) {

      let date = Date.now();

      let idPayAgent = null;
      let idNotPayAgent = null;


      Apartment.getIdPayAgent(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          idPayAgent = result.rows[0].id_role;


          Apartment.getIdNotPayAgent(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {

              idNotPayAgent = result.rows[0].id_role;

              if (id_role === idNotPayAgent || id_role === idPayAgent) {

                if (id_moderator_agency) {

                  Apartment.transferAgencyStaff(id_moderator_agency, function (err, result) {
                    if (err) return next(err);

                    if (result.rowCount > 0) {

                      let employees = result.rows;

                      Apartment.recordVisitTimeGroup(date, employees, function (err, result) {
                        if (err) return next(err);

                        if (result === 1) {

                          noend();

                        } else {

                          req.session.flash = {
                            type: 'danger',
                            intro: 'Ошибка сервера!',
                            message: "Для группы риелторов в агенстве не удалось записать время посещения."
                          };
                          res.redirect(303, pathname);
                        }
                      })

                    } else {

                      req.session.flash = {
                        type: 'danger',
                        intro: 'Ошибка сервера!',
                        message: "Ошибка скоро будет устранена."
                      };
                      res.redirect(303, pathname);
                    }

                  });

                } else {


                  Apartment.recordVisitTimOneAgent(date, id_user, function (err, result) {
                    if (err) return next(err);

                    if (result.rowCount > 0) {

                      noend();

                    } else {

                      req.session.flash = {
                        type: 'danger',
                        intro: 'Ошибка сервера!',
                        message: "Для одного риелтора не удалось записать время посещения."
                      };
                      res.redirect(303, pathname);

                    }
                  })
                }

              } else {
                noend();
              }

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка доступа!',
                message: "Не создана роль риелтора, который не оплатил прайс."
              };
              res.redirect(303, pathname);
            }
          });

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "Не создана роль риелтора, который оплатил прайс."
          };
          res.redirect(303, pathname);

        }
      });

    } else {
      noend();
    }
  }

  function existIdNode() {

    if (urlParsed.query.edit || urlParsed.query.drop) {

      let id = urlParsed.query.edit || urlParsed.query.drop;

      if (permission.indexOf('1', 4) === 4) {

        let idNode = new Apartment({id: id, template: temp});

        idNode.getIdNode(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            idAgentApartment = result.rows[0].agent;
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

        Apartment.getIdAgentApartment(id, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            idAgentApartment = result.rows[0].agent;

            if (id_user === idAgentApartment) {

              noend();

            } else {

              Apartment.getIdAgency(idAgentApartment, function (err, result) {
                if (err) return next(err);

                let agencyUser = result.rows[0].agency;

                if (result.rowCount > 0) {

                  Apartment.getIdAgency(id_user, function (err, result) {

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

      let edit = new Apartment({id: urlParsed.query.edit});

      edit.listEditDrop(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          formValue = result.rows[0];

          value.type = result.rows[0].type;
          value.agent = result.rows[0].agent;
          value.street = result.rows[0].street;
          value.op = result.rows[0].op;
          value.balcony = result.rows[0].balcony;
          value.project = result.rows[0].project;
          value.toilet = result.rows[0].toilet;
          value.status = result.rows[0].status;
          value.main = result.rows[0].main;

          noend();
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка правки!',
            message: "Не удалось перейти к правке объекта недвижимости."
          };

          res.redirect(303, pathname);
        }
      })
    } else {
      noend();
    }
  }

  function listDrop() {

    if (urlParsed.query.drop) {

      action.drop = true;
      action.create = false;
      action.edit = false;

      let drop = new Apartment({id: urlParsed.query.drop});

      drop.listEditDrop(function (err, result) {

        if (err) return next(err);

        if (result.rowCount > 0) {

          formValue = result.rows[0];

          value.type = result.rows[0].type;
          value.agent = result.rows[0].agent;
          value.street = result.rows[0].street;
          value.op = result.rows[0].op;
          value.project = result.rows[0].project;
          value.toilet = result.rows[0].toilet;
          value.status = result.rows[0].status;
          value.main = result.rows[0].main;

          noend();
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка правки!',
            message: "Не удалось перейти к удалению объекта недвижимости."
          };

          res.redirect(303, pathname);
        }
      })
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

  function listDistricts() {

    async.waterfall([foo, foo1, foo2, foo3], function (err, result) {
      if (err) return next(err);
      noend();
    });

    function foo(callback) {

      Apartment.getDistrictsMain('Татарстан', permission, id_agency, id_moderator_agency, id_user, function (err, result) {
        if (err) return callback(err);

        districts += '<ul class="listDistricts">\n';

        if (result.rowCount > 0) {

          for (let i = 0; i < result.rows.length; i++) {

            districts += '\t<li><a href="/admin/template/apartment?editDistricts=' + result.rows[i].districts_id + '">['+result.rows[i].sum+']<b>' + result.rows[i].districts  + '</b>-' + result.rows[i].title + '</a></li>\n';

          }

          callback(null);

        } else {
          callback(null);
        }

      });
    }

    function foo1(callback) {

      Apartment.getDistricts('Татарстан', permission, id_agency, id_moderator_agency, id_user, function (err, result) {
        if (err) return callback(err);

        if (result.rowCount > 0) {

          for (let i = 0; i < result.rows.length; i++) {

            districts += '\t<li><a href="/admin/template/apartment?editDistricts=' + result.rows[i].districts_id + '">['+result.rows[i].sum+']<b>' + result.rows[i].districts  + '</b>-' + result.rows[i].title + '</a></li>\n';

          }

          callback(null);

        } else {

          callback(null);
        }

      });
    }

    function foo2(callback) {

      Apartment.getDistrictsLastMain('Татарстан', permission, id_agency, id_moderator_agency, id_user, function (err, result) {
        if (err) return callback(err);

        if (result.rowCount > 0) {

          for (let i = 0; i < result.rows.length; i++) {

            districts += '\t<li><a href="/admin/template/apartment?editDistricts=' + result.rows[i].districts_id + '"><b>' + result.rows[i].districts  + '</b>-' + result.rows[i].title + '</a></li>\n';

          }

          callback(null);

        } else {

          callback(null);
        }

      });
    }

    function foo3(callback) {

      Apartment.getDistrictsLast('Татарстан', permission, id_agency, id_moderator_agency, id_user, function (err, result) {
        if (err) return callback(err);

        if (result.rowCount > 0) {

          for (let i = 0; i < result.rows.length; i++) {

            districts += '\t<li><a href="/admin/template/apartment?editDistricts=' + result.rows[i].districts_id + '"><b>' + result.rows[i].districts  + '</b>-' + result.rows[i].title + '</a></li>\n';

          }

          districts += '</ul>\n';

          callback(null);

        } else {

          districts += '</ul>\n';

          callback(null);
        }

      });
    }

  }

  function listCity() {

    let city = '';

    Apartment.oneCity(id_city, function (err, result) {
      if (err) return next(err);
      if (result.rowCount > 0) {
        nameCity = result.rows[0].title;

        city += '<ul class="listCity">\n';

        async.waterfall([foo, foo1, foo2, foo3, foo4], function (err, result) {

          if (err) return next(err);
          noend();
        });

        function foo(callback) {

          Apartment.getCityNoDistricts(permission, regionID, id_agency, id_moderator_agency, id_user, function (err, result) {
            if (err) return callback(err);

            if (result.rowCount > 0) {

              for (let i = 0; i < result.rows.length; i++) {
                city += '\t<li><a href="/admin/template/apartment?editCity=' + result.rows[i].id_city + '">[' + result.rows[i].sum + '] ' + '<b>' + result.rows[i].title + '</b></a></li>\n';
              }

              callback(null);

            } else {

              callback(null);

            }
          });
        }

        function foo1(callback) {

          Apartment.getMainCity('Нижнекамск', permission, id_agency, id_moderator_agency, id_user, districtsID, function (err, result) {
            if (err) return callback(err);


            if (result.rowCount > 0) {

              if (result.rowCount > 0) {
                city += '\t<li><a href="/admin/template/apartment?editCity=' + result.rows[0].id_city + '">[' + result.rows[0].sum + '] ' + '<b>' + result.rows[0].title + '</b>-' + result.rows[0].districts + '</a></li>\n';
              }

              callback(null);

            } else {
              callback(null);
            }

          });
        }

        function foo2(callback) {

          Apartment.listFirstCity('Нижнекамск', permission, id_agency, id_moderator_agency, id_user, districtsID, function (err, result) {
            if (err) return callback(err);

            if (result.rowCount > 0) {
              cityList = result.rows;

              for (let i = 0; i < cityList.length; i++) {

                city += '\t<li><a href="/admin/template/apartment?editCity=' + cityList[i].id_city + '">[' + result.rows[i].sum + '] ' + '<b>' + cityList[i].title + '</b>-' + cityList[i].districts + '</a></li>\n';

              }

              callback(null);

            } else {

              callback(null);
            }

          });
        }

        function foo3(callback) {

          Apartment.getCityNoDistrictsLast(permission, regionID, id_agency, id_moderator_agency, id_user, function (err, result) {
            if (err) return callback(err);

            if (result.rowCount > 0) {

              for (let i = 0; i < result.rows.length; i++) {

                city += '\t<li><a href="/admin/template/apartment?editCity=' + result.rows[i].id_city + '"><b>' + result.rows[i].title + '</b>-' + result.rows[i].districts + '</a></li>\n';

              }

              callback(null);

            } else {
              callback(null);
            }

          })

        }


        function foo4(callback) {

          Apartment.listLastCity(permission, id_agency, id_moderator_agency, id_user, districtsID, function (err, result) {
            if (err) return callback(err);

            if (result.rowCount > 0) {
              cityList = result.rows;

              for (let i = 0; i < cityList.length; i++) {

                city += '\t<li><a href="/admin/template/apartment?editCity=' + cityList[i].id_city + '"><b>' + cityList[i].title + '</b>-' + cityList[i].districts + '</a></li>\n';

              }

              city += '</ul>\n';
              cityList = city;

              callback(null);

            } else {

              city += '</ul>\n';
              cityList = city;

              callback(null);
            }

          });
        }

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка администрирования!',
          message: "Не определяется город."
        };
        res.redirect(303, '/admin/template/admin');
      }
    })
  }

  function type() {

    let type = {};

    Apartment.getIdLabel(id_permit, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {
        type = result.rows;

        for (let i = 0; i < type.length; i++) {

          if (value.type) {

            if ((value.type * 1) === type[i].id * 1) {
              selectType += '<option value="' + type[i].id + '" selected>' + type[i].title + '</option>' + '\n';
            } else {
              selectType += '<option value="' + type[i].id + '">' + type[i].title + '</option>' + '\n';
            }
          } else {
            selectType += '<option value="' + type[i].id + '">' + type[i].title + '</option>' + '\n';
          }
        }

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка администрирования!',
          message: "Нужно для шаблона создать метки."
        };

        res.redirect(303, 'back');
      }

    });
  }

  function selectSection() {

    let section_obj = new Apartment({
      temp: temp
    });

    if (urlParsed.query.section) {

      section_obj.selectSection(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          section += '<option value="">-Раздел не выбран-</option>' + '\n';

          for (let i = 0; i < result.rows.length; i++) {

            if (result.rows[i].section_id === urlParsed.query.section) {
              section += '<option value="' + result.rows[i].section_id + '" selected>' + result.rows[i].section + '</option>' + '\n';
            } else {
              section += '<option value="' + result.rows[i].section_id + '">' + result.rows[i].section + '</option>' + '\n';
            }
          }
          noend();
        }
      });

    } else {

      section_obj.selectSection(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          section += '<option value="">-Раздел не выбран-</option>' + '\n';

          for (let i = 0; i < result.rows.length; i++) {

            if (value.section === result.rows[i].section_id) {

              section += '<option value="' + result.rows[i].section_id + '" selected>' + result.rows[i].section + '</option>' + '\n';

            } else {

              section += '<option value="' + result.rows[i].section_id + '">' + result.rows[i].section + '</option>' + '\n';

            }

          }
          noend();
        } else {
          noend();
        }
      });
    }
  }

  function sectionSorting() {

    Apartment.getSectionSorting(permission, id_city, id_user, id_agency, id_moderator_agency, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        if (result.rowCount > 1) {
          sortingSection += '<option value="">-Раздел не выбран-</option>' + '\n';
        }

        for (let i = 0; i < result.rows.length; i++) {

          inSection += result.rows[i].id + ', ';

          if (urlParsed.query.sections === result.rows[i].id) {
            sortingSection += '<option selected value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
          } else {
            sortingSection += '<option value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
          }

        }

        noend();

      } else {
        noend();
      }
    });

  }

  function agentSelect() {

    if (permission.indexOf('1', 4) === 4) {

      Apartment.getAgentAllSelect(function (err, result) {

        if (result.rowCount > 0) {

          let nameAgency = '';

          if (result.rowCount > 1) {
            selectAgent += '<option value="">-Агент не выбран-</option>' + '\n';
          }

          for (let i = 0; i < result.rows.length; i++) {

            if (result.rows[i].title) {
              nameAgency = result.rows[i].title + ' - ';
            } else {
              nameAgency = 'Ин. Агент - ';
            }

            if (idAgentApartment === result.rows[i].user_id || value.agent * 1 === result.rows[i].user_id) {

              selectAgent += '<option value="' + result.rows[i].user_id + '" selected>' + nameAgency + result.rows[i].fio + '</option>' + '\n';

            } else {

              selectAgent += '<option value="' + result.rows[i].user_id + '">' + nameAgency + result.rows[i].fio + '</option>' + '\n';

            }

            nameAgency = '';

          }

          noend();

        } else {
          noend();
        }
      });

    } else if (permission.indexOf('0', 4) === 4) {

      if (!id_agency) {

        Apartment.getIdUser(req.session.uid, function (err, result) {
          if (err) return next(err);

          selectAgent += '<option value="' + result.rows[0].id_user + '" selected>' + result.rows[0].fio + '</option>' + '\n';

          noend();

        });

      } else {

        Apartment.getAgentSelect(id_agency, id_moderator_agency, id_user, function (err, result) {

          if (err) return next(err);

          let nameAgency = '';

          if (result.rowCount > 1) {
            selectAgent += '<option value="">-Агент не выбран-</option>' + '\n';
          }

          for (let i = 0; i < result.rows.length; i++) {

            if (result.rows[i].title) {
              nameAgency = result.rows[i].title + ' - ';
            }


            if (idAgent === result.rows[i].user_id || value.agent * 1 === result.rows[i].user_id) {

              selectAgent += '<option value="' + result.rows[i].user_id + '" selected>' + nameAgency + result.rows[i].fio + '</option>' + '\n';
            } else {

              if (idAgentApartment === result.rows[i].user_id) {


                selectAgent += '<option value="' + result.rows[i].user_id + '" selected>' + nameAgency + result.rows[i].fio + '</option>' + '\n';
              } else {

                selectAgent += '<option value="' + result.rows[i].user_id + '">' + nameAgency + result.rows[i].fio + '</option>' + '\n';

              }
            }
          }

          noend();

        });
      }

    }

  }

  function agentSorting() {

    if (permission.indexOf('1', 4) === 4) {

      Apartment.getAgentAllSorting(id_city, function (err, result) {

        if (result.rowCount > 0) {

          let nameAgency = '';

          if (result.rowCount > 1) {
            sortingAgent += '<option value="">-Агент не выбран-</option>' + '\n';
          }


          for (let i = 0; i < result.rows.length; i++) {

            inAgent += result.rows[i].user_id + ', ';

            if (result.rows[i].title) {
              nameAgency = result.rows[i].title + ' - ';
            }

            if (idAgent === result.rows[i].user_id) {

              sortingAgent += '<option value="' + result.rows[i].user_id + '" selected>' + nameAgency + result.rows[i].fio + '</option>' + '\n';

            } else {

              sortingAgent += '<option value="' + result.rows[i].user_id + '">' + nameAgency + result.rows[i].fio + '</option>' + '\n';

            }

            nameAgency = '';
          }

          noend();

        } else {
          noend();
        }
      });

    } else if (permission.indexOf('0', 4) === 4) {


      if (!id_agency) {

        if (permission.indexOf('0', 4) === 4) {

          Apartment.getIdUser(req.session.uid, function (err, result) {
            if (err) return next(err);

            sortingAgent += '<option value="">-Агент не выбран-</option>' + '\n';

            sortingAgent += '<option value="' + result.rows[0].id_user + '" >' + result.rows[0].fio + '</option>' + '\n';

            noend();

          });
        }

      } else {

        Apartment.getAgentSorting(id_agency, id_moderator_agency, id_user, id_city, function (err, result) {

          if (err) return next(err);

          let nameAgency = '';

          if (result.rowCount > 1) {
            sortingAgent += '<option value="">-Агент не выбран-</option>' + '\n';
          }


          for (let i = 0; i < result.rows.length; i++) {

            inAgent += result.rows[i].user_id + ', ';

            if (result.rows[i].title) {
              nameAgency = result.rows[i].title + ' - ';
            }


            if (idAgent === result.rows[i].user_id) {

              sortingAgent += '<option value="' + result.rows[i].user_id + '" selected>' + nameAgency + result.rows[i].fio + '</option>' + '\n';

            } else {

              sortingAgent += '<option value="' + result.rows[i].user_id + '">' + nameAgency + result.rows[i].fio + '</option>' + '\n';

            }
          }

          noend();

        });

      }
    }
  }

  function streetSelect() {

    let street = new Apartment({});

    street.getStreet(id_city, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        selectStreet += '<option value="">-Улица не выбрана-</option>' + '\n';

        for (let i = 0; i < result.rows.length; i++) {

          if ((value.street * 1) === result.rows[i].id_street) {
            selectStreet += '<option value="' + result.rows[i].id_street + '" selected>' + result.rows[i].street + '</option>' + '\n';
          } else {
            selectStreet += '<option value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
          }

        }
        noend();

      } else {
        noend();
      }
    });
  }

  function streetSorting() {

    if (permission.indexOf('1', 4) === 4) {

      Apartment.getStreetSortingAll(id_city, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          if (result.rowCount > 1) {
            sortingStreet += '<option value="">-Улица не выбрана-</option>' + '\n';
          }

          for (let i = 0; i < result.rows.length; i++) {

            inStreet += result.rows[i].id_street + ', ';

            if (urlParsed.query.street * 1 === result.rows[i].id_street) {
              sortingStreet += '<option selected value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
            } else {
              sortingStreet += '<option value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
            }
          }

          noend();

        } else {
          noend();
        }

      })

    } else if (permission.indexOf('0', 4) === 4) {

      if (!id_agency) {

        Apartment.getStreetSortingUser(id_city, id_user, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            if (result.rowCount > 1) {
              sortingStreet += '<option value="">-Улица не выбрана-</option>' + '\n';
            }

            for (let i = 0; i < result.rows.length; i++) {

              inStreet += result.rows[i].id_street + ', ';

              if (urlParsed.query.street * 1 === result.rows[i].id_street) {
                sortingStreet += '<option selected value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
              } else {
                sortingStreet += '<option value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
              }
            }

            noend();

          } else {
            sortingStreet += '<option value="">-Улица не выбрана-</option>' + '\n';
            noend();
          }
        });

      } else {

        Apartment.getStreetSortingAgency(id_agency, id_moderator_agency, id_user, id_city, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            if (result.rowCount > 1) {
              sortingStreet += '<option value="">-Улица не выбрана-</option>' + '\n';
            }

            for (let i = 0; i < result.rows.length; i++) {

              inStreet += result.rows[i].id_street + ', ';

              if (urlParsed.query.street * 1 === result.rows[i].id_street) {
                sortingStreet += '<option selected value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
              } else {
                sortingStreet += '<option value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
              }
            }
            noend();
          } else {
            sortingStreet += '<option value="">-Улица не выбрана-</option>' + '\n';
            noend();
          }

        })
      }
    }
  }

  function priceSelect() {

    Apartment.getMinPrice(permission, id_agency, id_moderator_agency, id_user, inAgent, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {
        sortingMinPrice = result.rows[0].min;
      }

      Apartment.getMaxPrice(permission, id_agency, id_moderator_agency, id_user, inAgent, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {
          sortingMaxPrice = result.rows[0].max;

          noend();

        } else {
          noend();
        }
      })
    });
  }

  function priceSorting() {

    if (minPrice && !maxPrice) {
      inPrice = ' AND price >= ' + minPrice;
    }

    if (!minPrice && maxPrice) {
      inPrice = ' AND price <= ' + maxPrice + ' AND price >= ' + sortingMinPrice;
    }

    if (minPrice && maxPrice) {
      inPrice = ' AND price <= ' + maxPrice + ' AND price >= ' + minPrice;
    }

    noend();
  }

  function op() {

    let arrOp = [];

    arrOp[0] = 'Нет';
    arrOp[1] = 'Да';

    for (let i = 0; i < arrOp.length; i++) {


      if ((value.op * 1) === i) {

        selectOp += '<option value="' + i + '" selected>' + arrOp[i] + '</option>' + '\n';

      } else {

        selectOp += '<option value="' + i + '">' + arrOp[i] + '</option>' + '\n';

      }
    }
    noend();
  }

  function Balcony() {

    let arrBalcony = [];

    arrBalcony[0] = 'Нет';
    arrBalcony[1] = 'Да';

    selectBalcony += '<option value="">-Не указан-</option>' + '\n';

    for (let i = 0; i < arrBalcony.length; i++) {

      if ((value.balcony * 1) === i) {

        selectBalcony += '<option value="' + i + '" selected>' + arrBalcony[i] + '</option>' + '\n';

      } else {

        selectBalcony += '<option value="' + i + '">' + arrBalcony[i] + '</option>' + '\n';

      }
    }
    noend();
  }

  function project() {

    Apartment.getAllProject(function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        selectProject += '<option value="">-Не указан-</option>' + '\n';

        for (let i = 0; i < result.rows.length; i++) {

          if ((value.project * 1) === result.rows[i].id_project) {
            selectProject += '<option value="' + result.rows[i].id_project + '" selected>' + result.rows[i].title + '</option>' + '\n';
          } else {
            selectProject += '<option value="' + result.rows[i].id_project + '">' + result.rows[i].title + '</option>' + '\n';
          }
        }

        noend();

      } else {
        noend();
      }
    });
  }

  function toilet() {

    Apartment.getAllToilet(function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        selectToilet += '<option value="">-Не указан-</option>' + '\n';

        for (let i = 0; i < result.rows.length; i++) {

          if ((value.toilet * 1) === result.rows[i].id_toilet) {
            selectToilet += '<option value="' + result.rows[i].id_toilet + '" selected>' + result.rows[i].title + '</option>' + '\n';
          } else {
            selectToilet += '<option value="' + result.rows[i].id_toilet + '">' + result.rows[i].title + '</option>' + '\n';
          }
        }

        noend();

      } else {
        noend();
      }

    });
  }

  function status() {

    let arrStatus = [];

    arrStatus[0] = 'Нет';
    arrStatus[1] = 'Да';

    for (let i = 0; i < arrStatus.length; i++) {

      if (arrStatus[i] == 'Нет') {
        if (value.status == null) {
          selectStatus += '<option value="" selected>' + arrStatus[i] + '</option>' + '\n';
        } else {
          selectStatus += '<option value="" >' + arrStatus[i] + '</option>' + '\n';
        }

      } else {
        if (value.status == i) {
          selectStatus += '<option value="' + i + '" selected>' + arrStatus[i] + '</option>' + '\n';
        } else {
          selectStatus += '<option value="' + i + '">' + arrStatus[i] + '</option>' + '\n';
        }
      }
    }
    noend();
  }

  function main() {

    let arrMain = [];

    arrMain[0] = 'Нет';
    arrMain[1] = 'Да';

    for (let i = 0; i < arrMain.length; i++) {

      if (arrMain[i] == 'Нет') {

        if (value.main == null) {
          selectMain += '<option value="" selected>' + arrMain[i] + '</option>' + '\n';
        } else {
          selectMain += '<option value="" >' + arrMain[i] + '</option>' + '\n';
        }

      } else {

        if (value.main == i) {
          selectMain += '<option value="' + i + '" selected>' + arrMain[i] + '</option>' + '\n';
        } else {
          selectMain += '<option value="' + i + '">' + arrMain[i] + '</option>' + '\n';
        }
      }

    }
    noend();
  }

  function listTable() {

    let list = new Apartment({
      permission: permission,
      id_agency: id_agency,
      id_moderator_agency: id_moderator_agency,
      id_user: id_user,
      id_city: id_city,
      idAgent: idAgent,
      inSection: inSection,
      querySection: urlParsed.query.sections || urlParsed.query.section,
      inAgent: inAgent,
      inStreet: inStreet,
      queryStreet: urlParsed.query.street,
      price: inPrice
    });


    list.list(function (err, result) {

      if (err) return next(err);

      if (result.rowCount > 0) {

        resultList = result;

        let urlPage = urlParsed.query.page;

        let navApartment = conf.get('apartment');

        let limit = navApartment.limit;
        let linkLimit = navApartment.linkLimit;
        let offset = urlPage * limit - limit;

        if (offset < 0 || !offset) offset = 0;

        let listLimit = new Apartment({
          limit: limit,
          offset: offset,
          permission: permission,
          id_agency: id_agency,
          id_moderator_agency: id_moderator_agency,
          id_user: id_user,
          id_city: id_city,
          idAgent: idAgent,
          inSection: inSection,
          querySection: urlParsed.query.sections || urlParsed.query.section,
          inAgent: inAgent,
          inStreet: inStreet,
          queryStreet: urlParsed.query.street,
          minPrice: minPrice,
          maxPrice: maxPrice,
          price: inPrice
        });

        listLimit.listLimit(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            resultLimit = result;

            resultList = table.tableListApartment(permission, resultList, urlParsed, limit, linkLimit, urlPage, resultLimit, req);

            noend();

          } else {
            noend();
          }
        })

      } else {
        noend();
      }

    });

  }

  function listRender() {

    //Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

    if (action.edit || action.drop) {
      action.create = false;
    } else {
      action.create = true;
    }


    titlePage = nameTemplate;
    titlePage += '<span class="btn btn-primary selectCity" data-toggle="modal" data-target=".districts-modal">'+districtsName+'</span>';
    titlePage += '<span class="btn btn-primary selectCity" data-toggle="modal" data-target=".city-modal">Выбрать город-поселение</span>';
    titlePage += '<span class = "city">' + nameCity + '</span>';

    res.render('template/apartment/body',
      {
        layout: 'admin',
        urlPage: req.url,
        titleHead: nameTemplate,
        title: titlePage,
        formValue: formValue,
        permit: permitForm,
        action: action,
        permission: permission,
        sidebar: sidebar,
        template: temp,
        sections: section,
        back: '/admin/template/apartment' + back,
        table: resultList,
        administrator: administrator,
        selectStreet: selectStreet,
        selectProject: selectProject,
        selectToilet: selectToilet,
        selectOp: selectOp,
        selectBalcony: selectBalcony,
        selectType: selectType,
        selectAgent: selectAgent,
        selectStatus: selectStatus,
        selectMain: selectMain,
        sortingStreet: sortingStreet,
        sortingAgent: sortingAgent,
        sortingSection: sortingSection,
        sortingMinPrice: sortingMinPrice,
        sortingMaxPrice: sortingMaxPrice,
        minPrice: minPrice,
        maxPrice: maxPrice,
        publicForm: publicForm,
        yesPage: yesPage,
        cityList: cityList,
        districtsList: districts,
        districtsName: districtsName
      }
    );
  }

  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, mapAjax, editDistricts, editCity, dateEntry, existIdNode, listEdit, listDrop, editPublish, listDistricts, listCity, type, selectSection, sectionSorting, agentSelect, agentSorting, streetSelect, streetSorting, priceSelect, priceSorting, op, Balcony, project, toilet, status, main, listDrop, listTable, listRender];

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
  let section = null;
  let agent = false;
  let title = '';
  let idSection = '';
  let back = '';
  let page = '';
  let id_user = null;
  let administrator = true;
  let sidebar = '';
  let yesPage = true;
  let idAgentApartment = null;
  let id_city = null;
  let id_agency = null;
  let id_moderator_agency = null;

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
          idSection = urlParsed.query.section;
          page = urlParsed.query.page;

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
        message: 'У Вас нет прав доступа к шаблону "apartment".'
      };

      yesPage = false;

      res.render('template/apartment/body',
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

    Apartment.getAgent(req.session.uid, function (err, result) {
      if (err) return next(err);
      if (result.rowCount > 0) {
        agent = true;
      }

      if (value.section) {
        back = '?section=' + value.section;
      }

      if (value.create) {
        if (permission.indexOf('1', 3) === 3 || agent) {
          noend();
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "У Вас нет прав на создание объекта недвижимости."
          };
          res.redirect(303, pathname + back);
        }
      } else if (value.edit) {
        if (permission.indexOf('1', 2) === 2 || agent) {
          noend();
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "У Вас нет прав на правку объекта недвижимости."
          };
          res.redirect(303, pathname + back);
        }
      } else if (value.drop) {
        if (permission.indexOf('1', 1) === 1 || agent) {
          noend();
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: "У Вас нет прав на удаление объекта недвижимости."
          };
          res.redirect(303, pathname + back);
        }
      } else {
        res.redirect(303, '/admin/template/admin');
      }
    });
  }

  function existIdNode() {

    if (urlParsed.query.edit || urlParsed.query.drop) {

      let id = urlParsed.query.edit || urlParsed.query.drop;

      if (permission.indexOf('1', 4) === 4) {

        let idNode = new Apartment({id: id, template: temp});

        idNode.getIdNode(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            idAgentApartment = result.rows[0].agent;
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

        Apartment.getIdAgentApartment(id, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            idAgentApartment = result.rows[0].agent;

            if (id_user === idAgentApartment) {

              noend();

            } else {

              Apartment.getIdAgency(idAgentApartment, function (err, result) {
                if (err) return next(err);

                let agencyUser = result.rows[0].agency;

                if (result.rowCount > 0) {

                  Apartment.getIdAgency(id_user, function (err, result) {

                    if (err) return next(err);

                    if (result.rowCount > 0) {

                      if (agencyUser === result.rows[0].agency) {
                        noend();
                      } else {
                        req.session.flash = {
                          type: 'danger',
                          intro: 'Ошибка доступа!',
                          message: "Вы не можете редактировать чужой объект недвижимости, не хватает прав."
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
      }

    } else {
      noend();
    }
  }

  function getCity() {

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
        noend();
      }
    });
  }

  function submitDrop() {

    if (value.drop) {

      if (idSection) {
        back = '?section=' + idSection;
      }

      if (page) {
        back = '?page=' + page;
      }

      if (idSection && page) {
        back = '?section=' + idSection + '&page=' + page;
      }


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

      let drop = new Apartment({id: id});

      drop.delete(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          Apartment.getCountAllPhoto(id, function (err, result) {
            if (err) return next(err);

            if(result.rowCount > 0){

              Apartment.deleteAllPhoto(id, function (err, result1) {
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
                        message: 'Объект недвижимости удалён.'
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
                message: 'Объект недвижимости удалён.'
              };

              res.redirect(303, pathname + strPath);
            }

          });

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Объект недвижимости не удалён, сообщите пожалуйста о возникшей проблеме администратору сайта."
          };
          res.redirect('back');
        }
      })

    } else {
      noend();
    }
  }

  function submitValidate() {

    for (let key in value) {
      if (value[key] === ' ') {
        value[key] = '';
      }
    }

    if (value.type === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errType: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.type.length > 19) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более девятнадцати символов."
      };
      req.session.repeatData = {
        errType: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.section === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errSection: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.section.length > 19) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более девятнадцати символов."
      };
      req.session.repeatData = {
        errSection: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.agent === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errAgent: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.agent.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errAgent: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.street === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errStreet: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.street.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errStreet: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.house === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errHouse: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.house.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errHouse: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.storey === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errStorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.storey.length > 2) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более двух символов."
      };
      req.session.repeatData = {
        errStorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (!(/^[0-9]*$/.test(value.storey))) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать число."
      };
      req.session.repeatData = {
        errStorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.numstorey === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errNumstorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (!(/^[0-9]*$/.test(value.numstorey))) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число."
      };
      req.session.repeatData = {
        errNumstorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.numstorey.length > 2) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более двух символов."
      };
      req.session.repeatData = {
        errNumstorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.storey * 1 > value.numstorey * 1) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Этажность дома должна быть ровна этажам, либо больше этажей."
      };
      req.session.repeatData = {
        errNumstorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.price === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (!(/^[0-9]*$/.test(value.price))) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число."
      };
      req.session.repeatData = {
        errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.price.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.area1 === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errArea1: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.area1.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errArea1: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (!(/^[0-9]*\.*\d?$/.test(value.area1))) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число, либо десятичное."
      };
      req.session.repeatData = {
        errArea1: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.area2.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errArea2: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.area2.length > 0 && !(/^[0-9]*\.*\d?$/.test(value.area2))) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число, либо десятичное."
      };
      req.session.repeatData = {
        errArea2: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.area3.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errArea3: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.area3.length > 0 && !(/^[0-9]*\.*\d?$/.test(value.area3))) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число, либо десятичное."
      };
      req.session.repeatData = {
        errArea3: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.op === '') {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
      };
      req.session.repeatData = {
        errOp: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.op.length > 1) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более одного символа."
      };
      req.session.repeatData = {
        errOp: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.project.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errProject: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.toilet.length > 10) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
      };
      req.session.repeatData = {
        errToilet: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.balcony.length > 60) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более шестидесяти символов."
      };
      req.session.repeatData = {
        errBalcony: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else if (value.note.length > 1000) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более одной тысячи символов."
      };
      req.session.repeatData = {
        errNote: true, type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
      };
      res.redirect('back');

    } else {
      noend();
    }
  }

  function joinTitle() {

    if (value.create || value.edit) {

      for (let key in value) {
        value[key] = value[key].trim();
      }

      Apartment.getTitleSection(value.section, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {
          title = result.rows[0].title + ", " + value.area1 + " м<sup><small>2</small></sup>, " + value.storey + "/" + value.numstorey + " - " +
            "этаж/этажей";
        } else {
          title = value.area1 + " м<sup><small>2</small></sup>, " + value.storey + "/" + value.numstorey + " - этаж/этажей";
        }

        noend();

      });

    } else {
      noend();
    }
  }

  function submitCreate() {

    if (value.create) {

      if (value.section) {
        back = '?section=' + value.section;
      }

      let create = new Apartment({
        value: value,
        date_create: Date.now(),
        author: id_user,
        template: temp,
        title: title
      });

      create.save(function (err, result, id) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          Apartment.listSaveEdit(id_city, Number(value.section), permission, id_agency, id_moderator_agency, id_user, function (err, result) {
            if (err) return next(err);
            if (result.rowCount > 0) {

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

              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Объект недвижимости сохранён.'
              };

              res.redirect(303, '/admin/template/apartment?section=' + value.section + '&edit=' + id + '&page=' + page);

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка сервера!',
                message: "Не найдены объекты недвижимости. Ошибка в скором времени будет устранена."
              };
              res.redirect('back');
            }

          });

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Объект недвижимости не сохранён, сообщите пожалуйста о возникшей проблеме администратору сайта."
          };
          res.redirect('back');
        }

      });

    } else {
      noend();
    }
  }

  function submitEdit() {

    if (value.edit) {

      if (value.section) {
        back = '?section=' + value.section + '&edit=' + urlParsed.query.edit;
      }

      let create = new Apartment({
        id: urlParsed.query.edit,
        value: value,
        date_edit: Date.now(),
        author_edit: id_user,
        title: title
      });

      create.edit(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          let id = urlParsed.query.edit;

          Apartment.listSaveEdit(id_city, Number(value.section), permission, id_agency, id_moderator_agency, id_user, function (err, result) {
            if (err) return next(err);
            if (result.rowCount > 0) {

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

              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Объект недвижимости изменён.'
              };

              res.redirect(303, '/admin/template/apartment?section=' + value.section + '&edit=' + id + '&page=' + page);

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка сервера!',
                message: "Не найдены объекты недвижимости. Ошибка в скором времени будет устранена."
              };
              res.redirect('back');
            }

          });

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Объект недвижимости не изменён, сообщите пожалуйста о возникшей проблеме администратору сайта."
          };
          res.redirect('back');
        }

      });

    } else {
      return next();
    }
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, submitAccess, existIdNode, getCity, submitDrop, submitValidate, joinTitle, submitCreate, submitEdit];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

