let Complete = require('./model/index');
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
  let value = {};
  if (res.locals.repeatData) {
    value = res.locals.repeatData;
  }

  let users = null;
  let idAgent = null;
  let id_permit = null;
  let permitForm = '';
  let id_user = null;
  let permission = '00000';
  let id_city = null;
  let districtsID = '';
  let districtsName = '';
  let districts = '';
  let regionID = '';
  let sidebar = '';
  let yesPage = true;
  let nameCity = '';
  let cityList = '';
  let titlePage = '';
  let agentList = '';
  let agentOneList = '';
  let resultList = '';
  let action = {};
  let formValue = '';
  let selectType = '';
  let section = '';
  let selectOp = '';
  let selectBalcony = '';
  let selectProject = '';
  let selectToilet = '';
  let selectMaterial = '';
  let selectCategoryLand = '';
  let selectStreet = '';
  let queryUrl = '';
  let selectStatus = '';
  let selectMain = '';
  let publicForm = false;

  let temp_apartment = false;
  let temp_cottages = false;
  let temp_commercial = false;


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

  function setUrl() {

    if((urlParsed.query.createApartment || urlParsed.query.createCottages || urlParsed.query.createCommercial) && !urlParsed.query.agent){

      req.session.flash = {
        type: 'warning',
        intro: 'Внимание!',
        message: "В начале нужно выбрать риелтора, которому нужно добавить объект недвижимости."
      };

      res.redirect(303, "/admin/template/complete");

    } else {

      if(urlParsed.query.createApartment){
        queryUrl += '&createApartment=true';
      }

      if(urlParsed.query.createCottages){
        queryUrl += '&createCottages=true';
      }

      if(urlParsed.query.createCommercial){
        queryUrl += '&createCommercial=true';
      }

      if(urlParsed.query.agent){
        queryUrl += '&agent=' + urlParsed.query.agent;
      }


      noend();
    }
  }

  function accessTemplate() {

    if (permission === '00000') {

      res.locals.flash = {
        type: 'danger',
        intro: 'Ошибка доступа!',
        message: 'У Вас нет прав доступа к шаблону "complete".'
      };

      yesPage = false;

      res.render('template/cottages/body',
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

  function editDistricts() {

    if (urlParsed.query.editDistricts) {

      Complete.setDistricts(urlParsed.query.editDistricts, req.session.uid, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Район установлен.'
          };

          queryUrl = queryUrl.substr(1, queryUrl.length);

          res.redirect(303, pathname + '?' + queryUrl);

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

      Complete.setCity(urlParsed.query.editCity, req.session.uid, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Город установлен.'
          };

          queryUrl = queryUrl.substr(1, queryUrl.length);

          res.redirect(303, pathname + '?' + queryUrl);

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

  function listDistricts() {

    Complete.getDistricts(function (err, result) {
      if (err) return next(err);

      districts += '<ul class="listDistricts">\n';

      if (result.rowCount > 0) {

        let list = '';

        for (let i = 0; i < result.rows.length; i++) {

          list += '\t<li><a href="/admin/template/complete?editDistricts=' + result.rows[i].id_districts + queryUrl + '"><b>' + result.rows[i].districts + '</b>-' + result.rows[i].title + '</a></li>\n';

        }

        districts += list;
        list = '';
        districts += '</ul>\n';
        noend();

      } else {
        districts = 'нет районов';
        districts += '</ul>\n';
        noend();
      }

    });

  }

  function listOneCity() {

    Complete.oneCity(id_city, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        nameCity = result.rows[0].title;
        noend();

      } else {
        nameCity = 'Город не установлен';
        noend();
      }
    });

  }

  function listCity() {

    async.waterfall([foo, foo1], function (err, result) {

      if (err) return next(err);
      noend();

    });


    function foo(callback) {

      Complete.getCityNoDistricts(regionID, function (err, result) {
        if (err) return callback(err);

        cityList += '<ul class="listCity">\n';

        if (result.rowCount > 0) {

          let list = '';

          for (let i = 0; i < result.rows.length; i++) {

            list += '\t<li><a href="/admin/template/complete?editCity=' + result.rows[i].id_city + queryUrl + '"><b>' + result.rows[i].title + '</b></a></li>\n';

          }

          cityList += list;

          list = '';

          callback(null);

        } else {
          callback(null);
        }

      });
    }


    function foo1(callback) {

      Complete.getCity(districtsID, function (err, result) {
        if (err) return callback(err);

        if (result.rowCount > 0) {

          let list = '';

          for (let i = 0; i < result.rows.length; i++) {

            list += '\t<li><a href="/admin/template/complete?editCity=' + result.rows[i].id_city + queryUrl + '"><b>' + result.rows[i].title + '</b>-' + result.rows[i].districts + '</a></li>\n';

          }

          cityList += list;
          cityList += '</ul>\n';

          list = '';

          callback(null);

        } else {
          cityList += '</ul>\n';
          callback(null);
        }
      })
    }
  }

  function listOneAgent() {

    if(urlParsed.query.agent){

      Complete.getOneAgent(urlParsed.query.agent, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          agentOneList = result.rows[0].title + ' | ' + result.rows[0].fio;

          noend();

        } else {
          agentOneList = 'Риелтор не выбран';
          noend();
        }

      });

    } else {
      agentOneList = 'Риелтор не выбран';
      noend();
    }

  }

  function listAgents() {

    Complete.getAgents(function (err, result) {
      if (err) return next(err);

      let list = '';

      if(result.rowCount > 0){

        agentList += '<ul class="listCity">\n';

        for(let i = 0; i < result.rows.length; i++){

          list += '\t<li><a href="/admin/template/complete?agent=' + result.rows[i].id_user + '"><b>' + result.rows[i].title + '</b> | '+result.rows[i].fio+'</a></li>\n';

        }

        agentList += list;

        list = '';

        agentList += '</ul>\n';

        noend();

      } else {
        agentList += '</ul>\n';
        noend();
      }

    })
  }

  function drop() {

    if(urlParsed.query.drop){

      Complete.deleteObject(urlParsed.query.drop, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          let id = urlParsed.query.drop;

          Complete.getCountAllPhoto(id, function (err, result) {
            if (err) return next(err);

            if(result.rowCount > 0){

              Complete.deleteAllPhoto(id, function (err, result1) {
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
                      res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

                    } else {

                      req.session.flash = {
                        type: 'success',
                        intro: 'Успех!',
                        message: 'Объект недвижимости удалён.'
                      };
                      res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
                    }

                  });

                } else {

                  req.session.flash = {
                    type: 'warning',
                    intro: 'Внимание!',
                    message: 'Не удалилась запись в таблице отвечающая за изображения.'
                  };
                  res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
                }

              });

            } else {

              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Объект недвижимости удалён.'
              };
              res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
            }

          });

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "Не удалось удалить объект недвижимости."
          };
          res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
        }

      });

    } else {
      noend();
    }
  }

  function listEdit() {

    if(urlParsed.query.edit){

      action.edit = true;
      action.create = false;

      Complete.getObject(urlParsed.query.edit, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          formValue = result.rows[0];

          if(result.rows[0].template === 'apartment'){

            temp_apartment = true;

            value.temp = result.rows[0].template;
            value.type = result.rows[0].type;
            value.section = result.rows[0].section;
            value.agent = result.rows[0].agent;
            value.street = result.rows[0].street;
            value.op = result.rows[0].op;
            value.balcony = result.rows[0].balcony;
            value.project = result.rows[0].project;
            value.toilet = result.rows[0].toilet;
            value.status = result.rows[0].status;
            value.main = result.rows[0].main;


            function op(callback) {

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
              callback(null);
            }

            function project(callback) {

              Complete.getAllProject(function (err, result) {
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

                  callback(null);

                } else {
                  callback(null);
                }
              });
            }

            function toilet(callback) {

              Complete.getAllToilet(function (err, result) {
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

                  callback(null);

                } else {
                  callback(null);
                }

              });
            }

            function balcony(callback) {
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
              callback(null);
            }

            async.waterfall([op, project, toilet, balcony], function (err, result) {

              if (err) return next(err);
              noend();

            });
          }

          if(result.rows[0].template === 'cottages'){

            temp_cottages = true;

            value.temp = result.rows[0].template;
            value.type = result.rows[0].type;
            value.agent = result.rows[0].agent;
            value.street = result.rows[0].street;
            value.material = result.rows[0].material;
            value.status = result.rows[0].status;
            value.main = result.rows[0].main;
            value.storey = result.rows[0].storey;
            value.area_house = result.rows[0].area_house;
            value.area_land = result.rows[0].area_land;
            value.section = result.rows[0].section;
            value.categoryLand = result.rows[0].category_land;
            value.kdn = result.rows[0].kdn;

            async.waterfall([material, category_land], function (err, result) {

              if (err) return next(err);
              noend();

            });

            function material(callback) {

              Complete.getAllMaterial(function (err, result) {
                if (err) return next(err);

                if (result.rowCount > 0) {

                  selectMaterial += '<option value="">-Не указан-</option>' + '\n';

                  for (let i = 0; i < result.rows.length; i++) {

                    if ((value.material * 1) === result.rows[i].id_material) {
                      selectMaterial += '<option value="' + result.rows[i].id_material + '" selected>' + result.rows[i].title + '</option>' + '\n';
                    } else {
                      selectMaterial += '<option value="' + result.rows[i].id_material + '">' + result.rows[i].title + '</option>' + '\n';
                    }
                  }

                  callback(null);

                } else {
                  callback(null);
                }
              });

            }

            function category_land(callback) {

              Complete.getAllCategoryLand(function (err, result) {
                if (err) return next(err);

                if (result.rowCount > 0) {

                  selectCategoryLand += '<option value="">-Не указан-</option>' + '\n';

                  for (let i = 0; i < result.rows.length; i++) {

                    if ((value.categoryLand * 1) === result.rows[i].id_category_land) {
                      selectCategoryLand += '<option value="' + result.rows[i].id_category_land + '" selected>' + result.rows[i].title + '</option>' + '\n';
                    } else {
                      selectCategoryLand += '<option value="' + result.rows[i].id_category_land + '">' + result.rows[i].title + '</option>' + '\n';
                    }
                  }

                  callback(null);

                } else {
                  callback(null);
                }
              });

            }

          }


          if(result.rows[0].template === 'commercial'){

            temp_commercial = true;

            value.temp = result.rows[0].template;
            value.type = result.rows[0].type;
            value.agent = result.rows[0].agent;
            value.street = result.rows[0].street;
            value.status = result.rows[0].status;
            value.main = result.rows[0].main;
            value.area_house = result.rows[0].area_house;
            value.section = result.rows[0].section;

            noend();

          }

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "Не удалось определить объект недвижимости."
          };
          res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
        }

      });

    } else {
      noend();
    }
  }

  function listCreate() {

    if(urlParsed.query.createApartment){

      action.edit = false;
      action.create = true;
      value.temp = 'apartment';

      temp_apartment = true;


      function op(callback) {

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
        callback(null);
      }

      function project(callback) {

        Complete.getAllProject(function (err, result) {
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

            callback(null);

          } else {
            callback(null);
          }
        });
      }

      function toilet(callback) {

        Complete.getAllToilet(function (err, result) {
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

            callback(null);

          } else {
            callback(null);
          }

        });
      }

      function balcony(callback) {
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
        callback(null);
      }

      async.waterfall([op, project, toilet, balcony], function (err, result) {

        if (err) return next(err);
        noend();

      });

    } else if(urlParsed.query.createCottages){

      action.edit = false;
      action.create = true;

      value.temp = 'cottages';

      temp_cottages = true;

      async.waterfall([material, category_land], function (err, result) {

        if (err) return next(err);
        noend();

      });

      function material(callback) {

        Complete.getAllMaterial(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            selectMaterial += '<option value="">-Не указан-</option>' + '\n';

            for (let i = 0; i < result.rows.length; i++) {

              if ((value.material * 1) === result.rows[i].id_material) {
                selectMaterial += '<option value="' + result.rows[i].id_material + '" selected>' + result.rows[i].title + '</option>' + '\n';
              } else {
                selectMaterial += '<option value="' + result.rows[i].id_material + '">' + result.rows[i].title + '</option>' + '\n';
              }
            }

            callback(null);

          } else {
            callback(null);
          }
        });

      }

      function category_land(callback) {

        Complete.getAllCategoryLand(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            selectCategoryLand += '<option value="">-Не указан-</option>' + '\n';

            for (let i = 0; i < result.rows.length; i++) {

              if ((value.categoryLand * 1) === result.rows[i].id_category_land) {
                selectCategoryLand += '<option value="' + result.rows[i].id_category_land + '" selected>' + result.rows[i].title + '</option>' + '\n';
              } else {
                selectCategoryLand += '<option value="' + result.rows[i].id_category_land + '">' + result.rows[i].title + '</option>' + '\n';
              }
            }

            callback(null);

          } else {
            callback(null);
          }
        });

      }

    } else if(urlParsed.query.createCommercial){

      action.edit = false;
      action.create = true;

      value.temp = 'commercial';

      temp_commercial = true;

      noend();

    } else if(!urlParsed.query.createApartment && !urlParsed.query.createCottages && !urlParsed.query.createCommercial){
      noend();
    }
  }

  function type() {

    let type = {};

    Complete.getIdLabel(id_permit, function (err, result) {
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

        res.redirect(303, "/admin/template/admin");
      }

    });
  }

  function selectSections() {

    let section_obj = new Complete({
      temp: value.temp
    });

    section_obj.selectSection(function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        if (result.rowCount > 1) {
          section += '<option value="">-Раздел не выбран-</option>' + '\n';
        }

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

  function streetSelect() {

    if(urlParsed.query.createApartment || urlParsed.query.createCottages || urlParsed.query.createCommercial){

      let street = new Complete({});

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
    } else {
      noend();
    }
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

  function editPublish() {

    if (permission.indexOf('1', 0) === 0) {
      publicForm = true;
    }

    noend();
  }

  function listTable() {

    if(urlParsed.query.agent){


      Complete.list(urlParsed.query.agent, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          resultList += Complete.tableListComplete(urlParsed.query.agent, result);

          noend();

        } else {
          noend();
        }

      });

    } else {
      noend();
    }
  }

  function listRender() {

    titlePage = nameTemplate;
    titlePage += '<span class="btn btn-primary selectCity" data-toggle="modal" data-target=".districts-modal">' + districtsName + '</span>';
    titlePage += '<span class="btn btn-primary selectCity" data-toggle="modal" data-target=".city-modal">Выбрать город-поселение</span>';
    titlePage += '<span class = "city">' + nameCity + '</span>';

    let btnAgent = '';

    if(agentOneList === 'Риелтор не выбран'){
      btnAgent = '<span class="btn btn-default selectAgent" data-toggle="modal" data-target=".agent-modal">' + agentOneList + '</span>';
    } else {
      btnAgent = '<span class="btn btn-success selectAgent" data-toggle="modal" data-target=".agent-modal">' + agentOneList + '</span>';
    }

    let urlAgent = '';

    if(urlParsed.query.agent){
      urlAgent = '&agent='+ urlParsed.query.agent;
    }

    let btnCreateApartment = '';

    if(urlParsed.query.createApartment){
      btnCreateApartment = '<a href="/admin/template/complete?createApartment=true'+urlAgent+'" style="margin-left:15px" class="btn btn-success">Добавить квартиру</a>';
    } else {
      btnCreateApartment = '<a href="/admin/template/complete?createApartment=true'+urlAgent+'" style="margin-left:15px" class="btn btn-default">Добавить квартиру</a>';
    }

    let btnCreateCottages = '';

    if(urlParsed.query.createCottages){
      btnCreateCottages = '<a href="/admin/template/complete?createCottages=true'+urlAgent+'" style="margin-left:15px" class="btn btn-success">Добавить дом, участок</a>';
    } else {
      btnCreateCottages = '<a href="/admin/template/complete?createCottages=true'+urlAgent+'" style="margin-left:15px" class="btn btn-default">Добавить дом, участок</a>';
    }

    let btnCreateCommercial = '';

    if(urlParsed.query.createCommercial){
      btnCreateCommercial = '<a href="/admin/template/complete?createCommercial=true'+urlAgent+'" style="margin-left:15px" class="btn btn-success">Добавить коммерческую недвижимость</a>';
    } else {
      btnCreateCommercial = '<a href="/admin/template/complete?createCommercial=true'+urlAgent+'" style="margin-left:15px" class="btn btn-default">Добавить коммерческую недвижимость</a>';
    }


    res.render('template/complete/body', {
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
      cityList: cityList,
      districtsList: districts,
      districtsName: districtsName,
      btnAgent: btnAgent,
      agentList: agentList,
      action: action,
      table: resultList,
      formValue: formValue,
      selectStatus: selectStatus,
      selectMain: selectMain,
      publicForm: publicForm,
      temp_apartment: temp_apartment,
      temp_cottages: temp_cottages,
      temp_commercial: temp_commercial,
      selectType: selectType,
      sections: section,
      selectStreet: selectStreet,
      selectProject: selectProject,
      selectToilet: selectToilet,
      selectOp: selectOp,
      selectBalcony: selectBalcony,
      selectMaterial: selectMaterial,
      selectCategoryLand: selectCategoryLand,
      btnCreateApartment: btnCreateApartment,
      btnCreateCottages: btnCreateCottages,
      btnCreateCommercial: btnCreateCommercial,

      back: '/admin/template/complete?agent=' + urlParsed.query.agent
    });
  }


  let tasks = [getSection, initialization, accessValue, userMenu, setUrl, accessTemplate, editDistricts, editCity, listDistricts, listOneCity, listCity, listOneAgent, listAgents, drop, listEdit, listCreate, type, selectSections, streetSelect, listTable, status, main, editPublish, listRender];

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
  let temp = '';
  let nameTemplate = '';
  let value = {};
  let idSection = '';
  let page = '';
  let id_agency = null;
  let id_moderator_agency = null;
  let id_user = null;
  let administrator = true;
  let users = null;
  let sidebar = '';
  let yesPage = true;
  let id_city = null;
  let title = '';
  let idAgentCottages = null;
  let back = '';

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
        message: 'У Вас нет прав доступа к шаблону "complete".'
      };

      yesPage = false;

      res.render('template/cottages/body',
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
          message: "У Вас нет прав на создание объекта недвижимости."
        };
        res.redirect(303, '/admin/template/admin');
      }

    } else if (value.edit) {

      if (permission.indexOf('1', 2) === 2) {

        noend();

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на правку объекта недвижимости."
        };
        res.redirect(303, '/admin/template/admin');
      }

    } else if (value.drop) {

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

  function getCity() {

    if(value.create){

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
    } else {
      noend();
    }
  }

  function getOneObject() {

    if(value.edit) {

      let id = urlParsed.query.edit;

      Complete.getObject(id, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          value.temp = result.rows[0].template;
          value.agent = String(result.rows[0].agent);
          value.street = String(result.rows[0].street);
          noend();

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "Не удалось определить объект недвижимости."
          };
          res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
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

    if(urlParsed.query.createApartment || urlParsed.query.createCottages || urlParsed.query.createCommercial){

      value.agent = urlParsed.query.agent;

    }

    if(value.temp === 'apartment' || urlParsed.query.createApartment){

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

    if(value.temp === 'cottages' || urlParsed.query.createCottages){

      if (value.type === '') {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errType: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.type.length > 19) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более девятнадцати символов."
        };
        req.session.repeatData = {
          errType: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.section === '') {

        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errSection: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.section.length > 19) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более девятнадцати символов."
        };
        req.session.repeatData = {
          errSection: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.agent === '') {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errAgent: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.agent.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errAgent: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.street.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errStreet: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.street === '') {

        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errStreet: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.price === '') {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (!(/^[0-9]*$/.test(value.price))) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число."
        };
        req.session.repeatData = {
          errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.price.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');


      } else if (value.area_house.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errArea_house: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (!(/^[0-9]*\.*\d?$/.test(value.area_house))) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число, либо десятичное."
        };
        req.session.repeatData = {
          errArea_house: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.area_land.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errArea_land: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (!(/^[0-9]*\.*\d?$/.test(value.area_land))) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число, либо десятичное."
        };
        req.session.repeatData = {
          errArea_land: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (!(/^[0-9]*$/.test(value.storey))) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число."
        };
        req.session.repeatData = {
          errStorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.storey.length > 2) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более двух символов."
        };
        req.session.repeatData = {
          errStorey: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.material.length > 5) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errMaterial: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.categoryLand.length > 5) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errCategoryLand: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.kdn.length > 30) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более тридцати символов."
        };
        req.session.repeatData = {
          errKdn: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.note.length > 1000) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более одной тысячи символов."
        };
        req.session.repeatData = {
          errNote: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, categoryLand: value.categoryLand, kdn: value.kdn, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else {
        noend();
      }
    }

    if(value.temp === 'commercial' || urlParsed.query.createCommercial){
      if (value.type === '') {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errType: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.type.length > 19) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более девятнадцати символов."
        };
        req.session.repeatData = {
          errType: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.section === '') {

        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errSection: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.section.length > 19) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более девятнадцати символов."
        };
        req.session.repeatData = {
          errSection: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.agent === '') {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errAgent: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.agent.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errAgent: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.street.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errStreet: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.street === '') {

        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errStreet: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.price === '') {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (!(/^[0-9]*$/.test(value.price))) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число."
        };
        req.session.repeatData = {
          errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.price.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errPrice: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');


      } else if (value.area_house.length > 10) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errArea_house: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (!(/^[0-9]*\.*\d?$/.test(value.area_house))) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать целое число, либо десятичное."
        };
        req.session.repeatData = {
          errArea_house: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else if (value.note.length > 1000) {
        req.session.flash = {
          type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более одной тысячи символов."
        };
        req.session.repeatData = {
          errNote: true, type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, note: value.note, status: value.status, main: value.main
        };
        res.redirect('back');

      } else {
        noend();
      }
    }
  }

  function joinTitle() {

    if (value.create || value.edit) {

      if(value.temp === 'apartment' || urlParsed.query.createApartment){

        for (let key in value) {
          value[key] = value[key].trim();
        }

        Complete.getTitleSection(value.section, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            title = result.rows[0].title + ", " + value.area1 + " м<sup><small>2</small></sup>, " + value.storey + "/" + value.numstorey + " - " +
              "этаж/этажей";
          } else {
            title = value.area1 + " м<sup><small>2</small></sup>, " + value.storey + "/" + value.numstorey + " - этаж/этажей";
          }

          noend();

        });
      }

      if(value.temp === 'cottages' || urlParsed.query.createCottages){
        for (let key in value) {
          value[key] = value[key].trim();
        }

        Complete.getTitleSection(value.section, function (err, resultSection) {
          if (err) return next(err);

          if (resultSection.rowCount > 0) {

            let str = '';
            let str1 = '';

            Complete.getTitleStreett(value.street, function (err, resultDistrict) {
              if (err) return next(err);

              if(resultSection.rows[0].title === 'Земельные участки'){

                if(value.area_land === '0'){
                  value.area_land = null;
                }

                if(value.area_land){
                  title = "Участок " + value.area_land + " сот. ";
                } else {
                  title = "Участок";
                }
                noend();

              } else {
                if(value.area_house === '0'){
                  value.area_house = null;
                }

                if(value.area_house){
                  str =" " + value.area_house + " м<sup><small>2</small></sup>";
                }

                if(value.area_land === '0'){
                  value.area_land = null;
                }

                if(value.area_land){
                  str1 = " на участке " + value.area_land + " сот. ";
                }

                if (resultDistrict.rowCount > 0) {

                  title = resultSection.rows[0].title + str + str1;

                } else {

                  title = resultSection.rows[0].title + str + str1;
                }
                noend();
              }


            });

          }

        });
      }

      if(value.temp === 'commercial' || urlParsed.query.createCommercial){

        for (let key in value) {
          value[key] = value[key].trim();
        }

        Complete.getTitleSection(value.section, function (err, resultSection) {
          if (err) return next(err);

          if (value.area_house !== '') {
            title = resultSection.rows[0].title + ", " + value.area_house + " м<sup><small>2</small></sup>";
          } else {
            title = resultSection.rows[0].title;
          }
          noend();
        });

      }

    } else {
      noend();
    }
  }

  function submitEdit() {

    if (value.edit) {

      if(value.temp === 'apartment'){

        let create = new Complete({
          id: urlParsed.query.edit,
          value: value,
          date_edit: Date.now(),
          author_edit: id_user,
          title: title
        });

        create.editApartment(function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Объект недвижимости изменён.'
            };

            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Не найдены объекты недвижимости. Ошибка в скором времени будет устранена."
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          }

        });
      }

      if(value.temp === 'cottages'){

        let create = new Complete({
          id: urlParsed.query.edit,
          value: value,
          date_edit: Date.now(),
          author_edit: id_user,
          title: title,
          permission: permission
        });

        create.editCottages(function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Объект недвижимости изменён.'
            };

            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Не найдены объекты недвижимости. Ошибка в скором времени будет устранена."
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          }

        });
      }

      if(value.temp === 'commercial'){

        let create = new Complete({
          id: urlParsed.query.edit,
          value: value,
          date_edit: Date.now(),
          author_edit: id_user,
          title: title,
          permission: permission
        });

        create.editCommercial(function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Объект недвижимости изменён.'
            };

            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Не найдены объекты недвижимости. Ошибка в скором времени будет устранена."
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          }

        });

      }

    } else {
      noend();
    }

  }

  function submitCreate() {

    if (value.create) {

      if(urlParsed.query.createApartment){

        let create = new Complete({
          value: value,
          date_create: Date.now(),
          author: id_user,
          template: 'apartment',
          title: title
        });

        create.saveApartment(function (err, result, id) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Объект недвижимости сохранён.'
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Не найдены объекты недвижимости. Ошибка в скором времени будет устранена."
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
          }
        });
      }

      if(urlParsed.query.createCottages){

        let create = new Complete({
          value: value,
          date_create: Date.now(),
          author: id_user,
          template: 'cottages',
          title: title,
          permission: permission
        });

        create.saveCottages(function (err, result, id) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Объект недвижимости сохранён.'
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Не найдены объекты недвижимости. Ошибка в скором времени будет устранена."
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
          }
        });
      }

      if(urlParsed.query.createCommercial){

        let create = new Complete({
          value: value,
          date_create: Date.now(),
          author: id_user,
          template: 'commercial',
          title: title,
          permission: permission
        });

        create.saveCommercial(function (err, result, id) {
          if (err) return next(err);

          if(result.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Объект недвижимости сохранён.'
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Не найдены объекты недвижимости. Ошибка в скором времени будет устранена."
            };
            res.redirect(303, pathname + '?agent='+urlParsed.query.agent);
          }
        });

      }

    } else {
      next();
    }
  }


  let tasks = [getSection, initialization, accessValue, userMenu, accessTemplate, submitAccess, getCity, getOneObject, submitValidate, joinTitle, submitEdit, submitCreate];

   function noend() {
   let currentTask = tasks.shift();
   if (currentTask) currentTask();
   }

   noend();

};