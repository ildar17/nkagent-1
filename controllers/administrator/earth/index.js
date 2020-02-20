let url = require('url');
let conf = require('../../../config');
let pg = require('pg');
let co = require("co");
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let Earth = require('./model/index');
let menu = require('../../../lib/menu');
let table = require('../../../lib/tableList');
let sidebar = null;
let aliasEarth = require('../../../lib/aliasEarth');


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let administrator = true;
  let formValue = null;
  let resultList = {};
  resultList.rowCount = 0;
  let action = {};
  let id_region = null;
  let id_city = null;
  let selectCountry = '';
  let selectRegion = '';
  let selectDistricts = '';
  let id_user = null;
  let users = null;
  let permission = '';
  let Permit = require('../../../lib/permit');

  function accessAdministrator() {

    if (conf.get('administrator') != req.session.uid) {
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

  function map() {

    if (urlParsed.query.map == 1) {

      let map = new Earth({});
      let resultList1 = '';

      Earth.getEarthMap1(function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          resultList1 = result;
        }


        Earth.getEarthMap(function (err, result) {
          if (err) return next(err);

          if(result.rowCount > 0){
            resultList = result;
          }

          res.render('administrator/earth/body-map', {
            layout: 'administrator',
            title: 'Сводная таблица всего раздела<a href="' + pathname + '" class="btn-sm btn-warning btn-h1" role="button"> В начало</a>',
            title1: 'Сводная таблица улиц',
            sidebar: sidebar,
            administrator: administrator,
            table: table.tableListEarthMap(resultList),
            table1: table.tableListEarthMap1(resultList1),
          });
        });
      });

    } else {
      noend();
    }
  }

  function metro() {

    if (urlParsed.query.metro) {

      co(function*() {



        let country = yield new Promise(function (resolve, reject) {

          let oneCountry = new Earth({id: urlParsed.query.country});

          oneCountry.getOneCountry(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой страны.'
              };
              res.redirect(303, pathname);
            }
          });
        });


        let region = yield new Promise(function (resolve, reject) {

          let oneRegion = new Earth({id_region: urlParsed.query.region});

          oneRegion.getOneRegion(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой области.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let city = yield new Promise(function (resolve, reject) {

          let oneCity = new Earth({id_city: urlParsed.query.metro});

          oneCity.getOneCity(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такого города.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let getMetro = yield new Promise(function (resolve, reject) {

          let listMetro = new Earth({city_id: urlParsed.query.metro});

          listMetro.getAllMetro(function (err, result) {
            if (err) return next(err);
            resolve(result);
          });
        });

        if (getMetro.rowCount > 0) {
          resultList = getMetro;
        }

        let id = urlParsed.query.drop || urlParsed.query.edit;

        let getOneMetro = yield new Promise(function (resolve, reject) {

          let oneMetro = new Earth({id_metro: id});

          oneMetro.getOneMetro(function (err, result) {
            if (err) return next(err);
            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              resolve(0)
            }
          });
        });

        if (urlParsed.query.edit) {
          action.edit = true;
          action.drop = false;
          action.create = false;

          formValue = getOneMetro;
        }

        if (urlParsed.query.drop) {
          action.drop = true;
          action.create = false;
          action.edit = false;

          formValue = getOneMetro;
        }


        let titlePage = 'Администратор. Страна: <span class="content-edit">' + country.title + '</span>. Область: <span class="content-edit">' + region.title + '</span>. Город: <span class="content-edit">' + city.title + '</span> <a href="/admin/administrator/earth?country=' + urlParsed.query.country + '&region=' + urlParsed.query.region + '" class="btn-sm btn-warning btn-h1" role="button"> В начало</a>';

        if (action.edit || action.drop) {
          action.create = false;
        } else {
          action.create = true;
        }

        res.render('administrator/earth/body-metro', {
          layout: 'administrator',
          title: titlePage,
          sidebar: sidebar,
          administrator: administrator,
          formValue: formValue,
          table: table.tableListMetro(resultList, urlParsed.query.country, urlParsed.query.region, urlParsed.query.metro),
          action: action,
          country: urlParsed.query.country,
          region: urlParsed.query.region
        });
      });

    } else {
      noend();
    }
  }

  function districts() {

    Earth.getDistricts (urlParsed.query.region, function(err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){

        selectDistricts += '<option value="">-не выбрано-</option>' + '\n';

        for (let i = 0; i < result.rows.length; i++) {

          selectDistricts += '<option value="' + result.rows[i].id_districts + '">' + result.rows[i].districts + '</option>' + '\n';

        }

        noend();

      } else {
        noend();
      }
    });
  }

  function district() {

    if (urlParsed.query.district) {

      co(function*() {

        let country  = yield new Promise(function (resolve, reject) {

          let oneCountry = new Earth({id: urlParsed.query.country});

          oneCountry.getOneCountry(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой страны.'
              };
              res.redirect(303, pathname);
            }
          });
        });


        let region = yield new Promise(function (resolve, reject) {

          let oneRegion = new Earth({id_region: urlParsed.query.region});

          oneRegion.getOneRegion(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой области.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let city = yield new Promise(function (resolve, reject) {

          let oneCity = new Earth({id_city: urlParsed.query.district});

          oneCity.getOneCity(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такого города.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let getDistrict = yield new Promise(function (resolve, reject) {

          let listDistrict = new Earth({city_id: urlParsed.query.district});

          listDistrict.getAllDistrict(function (err, result) {
            if (err) return next(err);
            resolve(result);
          });
        });

        if (getDistrict.rowCount > 0) {
          resultList = getDistrict;
        }

        let id = urlParsed.query.drop || urlParsed.query.edit;


        let getOneDistrict = yield new Promise(function (resolve, reject) {

          let oneDistrict = new Earth({id_district: id});

          oneDistrict.getOneDistrict(function (err, result) {
            if (err) return next(err);
            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              resolve(0)
            }
          });
        });

        if (urlParsed.query.edit) {
          action.edit = true;
          action.drop = false;
          action.create = false;

          formValue = getOneDistrict;
        }

        if (urlParsed.query.drop) {
          action.drop = true;
          action.create = false;
          action.edit = false;

          formValue = getOneDistrict;
        }


        let titlePage = 'Администратор. Страна: <span class="content-edit">' + country.title + '</span>. Область: <span class="content-edit">' + region.title + '</span>. Город: <span class="content-edit">' + city.title + '</span> <a href="/admin/administrator/earth?country=' + urlParsed.query.country + '&region=' + urlParsed.query.region + '" class="btn-sm btn-warning btn-h1" role="button"> В начало</a>';

        if (action.edit || action.drop) {
          action.create = false;
        } else {
          action.create = true;
        }

        res.render('administrator/earth/body-district', {
          layout: 'administrator',
          title: titlePage,
          sidebar: sidebar,
          administrator: administrator,
          formValue: formValue,
          table: table.tableListDistrict(resultList, urlParsed.query.country, urlParsed.query.region, urlParsed.query.district),
          action: action,
          country: urlParsed.query.country,
          region: urlParsed.query.region
        });
      });

    } else {
      noend();
    }
  }

  function street() {

    if (urlParsed.query.street) {

      co(function*() {

        let country = yield new Promise(function (resolve, reject) {

          let oneCountry = new Earth({id: urlParsed.query.country});

          oneCountry.getOneCountry(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой страны.'
              };
              res.redirect(303, pathname);
            }
          });
        });


        let region = yield new Promise(function (resolve, reject) {

          let oneRegion = new Earth({id_region: urlParsed.query.region});

          oneRegion.getOneRegion(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой области.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let city = yield new Promise(function (resolve, reject) {

          let oneCity = new Earth({id_city: urlParsed.query.street});

          oneCity.getOneCity(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такого города.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let getStreet = yield new Promise(function (resolve, reject) {

          let listStreet = new Earth({city_id: urlParsed.query.street});

          listStreet.getAllStreet(function (err, result) {
            if (err) return next(err);
            resolve(result);
          });
        });

        if (getStreet.rowCount > 0) {
          resultList = getStreet;
        }

        let id = urlParsed.query.drop || urlParsed.query.edit;


        let getOneStreet = yield new Promise(function (resolve, reject) {

          let oneStreet = new Earth({id_street: id});

          oneStreet.getOneStreet(function (err, result) {
            if (err) return next(err);
            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              resolve(0)
            }
          });
        });

        if (urlParsed.query.edit) {
          action.edit = true;
          action.drop = false;
          action.create = false;

          formValue = getOneStreet;
        }

        if (urlParsed.query.drop) {
          action.drop = true;
          action.create = false;
          action.edit = false;

          formValue = getOneStreet;
        }


        let titlePage = 'Администратор. Страна: <span class="content-edit">' + country.title + '</span>. Область: <span class="content-edit">' + region.title + '</span>. Город: <span class="content-edit">' + city.title + '</span> <a href="/admin/administrator/earth?country=' + urlParsed.query.country + '&region=' + urlParsed.query.region + '" class="btn-sm btn-warning btn-h1" role="button"> В начало</a>';

        if (action.edit || action.drop) {
          action.create = false;
        } else {
          action.create = true;
        }

        res.render('administrator/earth/body-street', {
          layout: 'administrator',
          titleHead:"Улицы",
          title: titlePage,
          sidebar: sidebar,
          administrator: administrator,
          formValue: formValue,
          table: table.tableListStreet(resultList, urlParsed.query.country, urlParsed.query.region, urlParsed.query.street),
          action: action,
          country: urlParsed.query.country,
          region: urlParsed.query.region
        });
      });

    } else {
      noend();
    }
  }

  function region() {

    let regional_city = '';

    if (urlParsed.query.country && !urlParsed.query.region) {

      co(function*() {

        let getOneCountry = yield new Promise(function (resolve, reject) {

          let oneCountry = new Earth({id: urlParsed.query.country});

          oneCountry.getOneCountry(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой страны.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let getAllRegion = yield new Promise(function (resolve, reject) {

          let allRegion = new Earth({id: urlParsed.query.country});

          allRegion.getAllRegion(function (err, result) {
            if (err) return next(err);
            resolve(result);

          });
        });

        if (getAllRegion.rowCount > 0) {
          resultList = getAllRegion;
        }


        id_region = urlParsed.query.drop || urlParsed.query.edit;


        let getOneRegion = yield new Promise(function (resolve, reject) {

          let oneRegion = new Earth({id_region: id_region});

          oneRegion.getOneRegion(function (err, result) {
            if (err) return next(err);
            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              resolve('')
            }
          });
        });


        let selectNull = yield new Promise(function (resolve, reject) {

          let selectNullStr = false;

          let regionNull = new Earth({id: urlParsed.query.edit});

          regionNull.selectRegionNull(function (err, result) {
            if (err) return next(err);

            if (result.rows[0].count == 0) {
              selectNullStr = '<option selected value="">Не внесены города для этой страны</option>' + '\n';
              resolve(selectNullStr);
            } else {
              resolve(selectNullStr);
            }
          });
        });

        if (selectNull == false) {

          selectRegion = yield new Promise(function (resolve, reject) {

            let select = '';

            let oneRegion = new Earth({id: urlParsed.query.edit});

            oneRegion.selectCityForRegion(function (err, result) {
              if (err) return next(err);

              select += '<option selected value="">- Не выбрано -</option>' + '\n';

              for (var i = 0; i < result.rows.length; i++) {
                if (result.rows[i].id_city != null) {

                  if (result.rows[i].regional_city == result.rows[i].id_city) regional_city = ' selected';

                  select += '<option value="' + result.rows[i].id_city + '"' + regional_city + '>' + result.rows[i].title + '</option>' + '\n';

                  regional_city = '';

                } else {
                  select += '<option selected value="">Не внесены города для этой страны</option>' + '\n';
                }
              }
              resolve(select);
            });
          });

        } else {
          selectRegion = selectNull
        }


        if (urlParsed.query.edit) {
          action.edit = true;
          action.drop = false;
          action.create = false;

          formValue = getOneRegion;
        }

        if (urlParsed.query.drop) {
          action.drop = true;
          action.create = false;
          action.edit = false;

          formValue = getOneRegion;
        }

        let titlePage = 'Администратор. Страна: <span class="content-edit">' + getOneCountry.title + '</span> <a href="/admin/administrator/earth" class="btn-sm btn-warning btn-h1" role="button"> В начало</a>';

        resultList = getAllRegion;


        if (action.edit || action.drop) {
          action.create = false;
        } else {
          action.create = true;
        }


        res.render('administrator/earth/body-region', {
          layout: 'administrator',
          title: titlePage,
          sidebar: sidebar,
          administrator: administrator,
          formValue: formValue,
          table: table.tableListRegion(resultList, urlParsed.query.country),
          action: action,
          country: urlParsed.query.country,
          selectRegion: selectRegion

        });
      });
    } else {
      noend();
    }
  }

  function city() {

    if (urlParsed.query.region) {

      co(function*() {

        let getOneCountry = yield new Promise(function (resolve, reject) {

          let oneCountry = new Earth({id: urlParsed.query.country});

          oneCountry.getOneCountry(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой страны.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let getOneRegion = yield new Promise(function (resolve, reject) {

          let oneRegion = new Earth({id_region: urlParsed.query.region});

          oneRegion.getOneRegion(function (err, result) {
            if (err) return next(err);

            if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка данных!',
                message: 'Нет такой области.'
              };
              res.redirect(303, pathname);
            }
          });
        });

        let getAllCity = yield new Promise(function (resolve, reject) {

          let allCity = new Earth({id: urlParsed.query.region});

          allCity.getAllCity(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        resultList = getAllCity;

        id_city = urlParsed.query.drop || urlParsed.query.edit;

        let getOneCity = yield new Promise(function (resolve, reject) {

          let oneCity = new Earth({id_city: id_city});

          oneCity.getOneCity(function (err, result) {
            if (err) return next(err);
            resolve(result.rows[0]);
          });
        });

        let getSelectDistricts = yield new Promise(function (resolve, reject) {

          Earth.getDistricts(urlParsed.query.region, function (err, result) {
            if (err) return next(err);
            resolve(result);
          });
        });

        if(getOneCity){

          if(getSelectDistricts.rowCount > 0){

            selectDistricts = '';

            selectDistricts += '<option value="">-не выбрано-</option>' + '\n';

            for (let i = 0; i < getSelectDistricts.rows.length; i++) {

              if(getOneCity.districts_id === getSelectDistricts.rows[i].id_districts){
                selectDistricts += '<option selected value="' + getSelectDistricts.rows[i].id_districts + '">' + getSelectDistricts.rows[i].districts + '</option>' + '\n';
              } else {
                selectDistricts += '<option value="' + getSelectDistricts.rows[i].id_districts + '">' + getSelectDistricts.rows[i].districts + '</option>' + '\n';
              }
            }
          }
        }


        if (urlParsed.query.edit) {
          action.edit = true;
          action.drop = false;
          action.create = false;

          formValue = getOneCity;
        }

        if (urlParsed.query.drop) {
          action.drop = true;
          action.create = false;
          action.edit = false;

          formValue = getOneCity;
        }

        let titlePage = 'Администратор. Страна: <span class="content-edit">' + getOneCountry.title + '</span>. Область: <span class="content-edit">' + getOneRegion.title + '</span> <a href="/admin/administrator/earth?country=' + urlParsed.query.country + '" class="btn-sm btn-warning btn-h1" role="button"> В начало</a>';

        if (action.edit || action.drop) {
          action.create = false;
        } else {
          action.create = true;
        }

        res.render('administrator/earth/body-city', {
          layout: 'administrator',
          titleHead: "Города",
          title: titlePage,
          sidebar: sidebar,
          administrator: administrator,
          formValue: formValue,
          table: table.tableListCity(resultList, urlParsed.query.country, urlParsed.query.region),
          action: action,
          country: urlParsed.query.country,
          region: urlParsed.query.region,
          selectDistricts: selectDistricts

        });
      });
    } else {
      noend();
    }
  }

  function listEdit() {

    let metropolis = '';

    if (urlParsed.query.edit) {

      action.edit = true;
      action.drop = false;
      action.create = false;

      let edit = new Earth(
        {
          id: urlParsed.query.edit
        }
      );

      edit.getOneCountry(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {
          formValue = result.rows[0];
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка данных!',
            message: 'Нет такой записи.'
          };
          res.redirect(303, pathname);
        }

        edit.selectCountryNull(function (err, result) {
          if (err) return next(err);

          if (result.rows[0].count == 0) {
            selectCountry += '<option selected value="">Не внесены города для этой страны</option>' + '\n';
            noend();
          } else {

            edit.selectCityForCountry(function (err, result) {
              if (err) return next(err);

              selectCountry += '<option selected value="">- Не выбрано -</option>' + '\n';

              for (let i = 0; i < result.rows.length; i++) {

                if (result.rows[i].id_city != null) {
                  if (result.rows[i].metropolis == result.rows[i].id_city) metropolis = ' selected';

                  selectCountry += '<option value="' + result.rows[i].id_city + '"' + metropolis + '>' + result.rows[i].title + '</option>' + '\n';

                  metropolis = '';

                }
              }
              noend();
            });
          }
        });

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

      var drop = new Earth(
        {
          id: urlParsed.query.drop
        }
      );

      drop.getOneCountry(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {
          formValue = result.rows[0];
          noend();
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка данных!',
            message: 'Нет такой записи.'
          };
          res.redirect(303, pathname);
        }

      });

    } else {
      noend();
    }
  }

  function listTable() {

    let allCountry = new Earth();

    allCountry.getAllCountry(function (err, result) {
      if (err) return next(err);
      if (result.rowCount > 0) {
        resultList = result;
        noend();
      } else {
        noend();
      }
    });
  }

  function listRender() {

    if (action.edit || action.drop) {
      action.create = false;
    } else {
      action.create = true;
    }

    let titlePage = 'Администратор. Страна -> Область -> Город(метро, район, улица).' + '<a href="/admin/administrator/earth?map=1" class="btn-sm btn-warning btn-h1" role="button">Показать все записи</a>';


    res.render('administrator/earth/body', {
      layout: 'administrator',
      title: titlePage,
      sidebar: sidebar,
      administrator: administrator,
      formValue: formValue,
      table: table.tableListCountry(resultList),
      action: action,
      selectCountry: selectCountry,
    });

  }


  var tasks = [accessAdministrator, accessValue, userMenu, map, metro, districts, district, street, region, city, listEdit, listDrop, listTable, listRender];

  function noend() {
    var currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

exports.submit = function (req, res, next) {
  res.locals.urlPage = req.url;
  var urlParsed = url.parse(req.url, true);
  var pathname = urlParsed.pathname;
  var value = '';

  function accessAdministrator() {
    if (conf.get('administrator') != req.session.uid) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка доступа!',
        message: 'Вы не администратор сайта.'
      };

      res.redirect(303, '/admin/template/admin');
    } else {

      value = req.body['administrator'];

      noend();
    }
  }

  function submitValidate() {

    if (value.title == ' ') {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Полe не может быть пробелом."
      };
      req.session.repeatData = {
        errTitle: true,
        title: value.title,
        alias: value.alias
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
        alias: value.alias
      };
      res.redirect(303, 'back');

    } else if (value.title.length > 60) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: value.title + ' - должно быть не более 60 символов.'
      };
      req.session.repeatData = {
        errTitle: true,
        title: value.title,
        alias: value.alias
      };
      res.redirect(303, 'back');

    } else {
      noend();
    }
  }

  function submitCreate() {

    if (value.create) {

      if (urlParsed.query.district) {

        let create = new Earth({title: value.title.trim(), city_id: urlParsed.query.district});

        create.getDistrictDistrict(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Такая запись существует."
            };
            req.session.repeatData = {
              errTitle: true,
              title: value.title
            };
            res.redirect(303, 'back');

          } else {

            create.saveDistrict(function (err, result) {
              if (err) return next(err);

              if (result.rowCount == 1) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Район сохранен в базе данных.'
                };
                res.redirect(303, 'back');
              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка данных!',
                  message: "Район не сохранен в базе данных."
                };
                res.redirect(303, 'back');
              }
            });
          }
        });
      } else if (urlParsed.query.street) {

        let create = new Earth({title: value.title.trim(), city_id: urlParsed.query.street});

        create.getStreetStreet(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Такая запись существует."
            };
            req.session.repeatData = {
              errTitle: true,
              title: value.title
            };
            res.redirect(303, 'back');

          } else {

            create.saveStreet(function (err, result) {
              if (err) return next(err);

              if (result.rowCount == 1) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Улица сохранена в базе данных.'
                };
                res.redirect(303, 'back');
              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Улица не сохранена в базе данных."
                };
                res.redirect(303, 'back');
              }
            });
          }
        });

      } else if (urlParsed.query.metro) {

        let create = new Earth({title: value.title.trim(), city_id: urlParsed.query.metro});

        create.getMetroMetro(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Такая запись существует."
            };
            req.session.repeatData = {
              errTitle: true,
              title: value.title
            };
            res.redirect(303, 'back');

          } else {

            create.saveMetro(function (err, result) {
              if (err) return next(err);

              if (result.rowCount == 1) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Метро сохранено в базе данных.'
                };
                res.redirect(303, 'back');
              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: "Метро не сохранено в базе данных."
                };
                res.redirect(303, 'back');
              }
            });
          }
        });

      } else if (urlParsed.query.country && !urlParsed.query.region) {

        function valid() {

          if (value.alias.length > 60) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: value.alias + ' - должно быть не более 60 символов.'
            };
            req.session.repeatData = {
              errAlias: true,
              title: value.title,
              alias: value.alias
            };
            res.redirect(303, 'back');

          } else {
            noendCreate();
          }
        }

        function validAlias() {

          if (value.latin == 1) {
            if (value.alias.length < 1) {
              value.alias = translite(value.title.trim()).toLowerCase();
              noendCreate();
            } else {
              value.alias = translite(value.alias.trim()).toLowerCase();
              noendCreate();
            }

          } else {

            if (value.alias.length < 1) {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка проверки!',
                message: 'Если поле "Псевдоним" отмечено как "original", то поле обязательно для заполнения.'
              };
              req.session.repeatData = {
                errTitle: true,
                title: value.title.trim(),
                alias: value.alias.trim()
              };
              res.redirect(303, 'back');

            } else {
              noendCreate();
            }
          }
        }

        function save() {

          let create = new Earth({title: value.title, alias: value.alias, id_country: urlParsed.query.country});

          create.isset(function (err, result) {
            if (err) return next(err);

            if (result == 1) {

              aliasEarth.getCreateAliasEarth(value.alias, function (err, result) {
                if (err) return next(err);

                if (result == 1) {

                  create.saveRegion(function (err, result) {
                    if (err) return next(err);
                    if (result.rowCount > 0) {
                      req.session.flash = {
                        type: 'success',
                        intro: 'Успех!',
                        message: 'Область сохранена в базе данных.'
                      };
                      res.redirect(303, 'back');
                    } else {
                      req.session.flash = {
                        type: 'danger',
                        intro: 'Ошибка записи!',
                        message: "Область не сохранена в базе данных."
                      };
                      res.redirect(303, 'back');
                    }
                  });

                } else {

                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "Псевдоним не уникален."
                  };
                  req.session.repeatData = {
                    errAlias: true,
                    title: value.title,
                    alias: value.alias
                  };
                  res.redirect(303, 'back');
                }
              });

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка записи!',
                message: "Псевдоним не уникален."
              };
              req.session.repeatData = {
                errAlias: true,
                title: value.title,
                alias: value.alias
              };
              res.redirect(303, 'back');
            }
          });
        }

        let tasks = [valid, validAlias, save];

        function noendCreate(result) {
          let currentTask = tasks.shift();
          if (currentTask) currentTask(result);
        }

        noendCreate();


      } else if (urlParsed.query.region) {

        function valid() {

          if (value.alias.length > 60) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: value.alias + ' - должно быть не более 60 символов.'
            };
            req.session.repeatData = {
              errAlias: true,
              title: value.title,
              alias: value.alias
            };
            res.redirect(303, 'back');

          } else if (!(/^[0-9]{0,10}$/.test(value.districts))) {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: 'Либо не число, либо в число входит более десяти символов'
            };
            req.session.repeatData = {
              errDistricts: true,
              title: value.title,
              alias: value.alias
            };
            res.redirect(303, 'back');

          } else {
            noendCreate();
          }
        }

        function validAlias() {

          if (value.latin == 1) {
            if (value.alias.length < 1) {
              value.alias = translite(value.title.trim()).toLowerCase();
              noendCreate();
            } else {
              value.alias = translite(value.alias.trim()).toLowerCase();
              noendCreate();
            }

          } else {

            if (value.alias.length < 1) {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка проверки!',
                message: 'Если поле "Псевдоним" отмечено как "original", то поле обязательно для заполнения.'
              };
              req.session.repeatData = {
                errTitle: true,
                title: value.title.trim(),
                alias: value.alias.trim()
              };
              res.redirect(303, 'back');

            } else {
              noendCreate();
            }
          }
        }

        function save() {

          let create = new Earth({title: value.title, alias: value.alias, id_region: urlParsed.query.region, id_districts: value.districts});

          create.isset(function (err, result) {
            if (err) return next(err);

            if (result == 1) {

              aliasEarth.getCreateAliasEarth(value.alias, function (err, result) {
                if (err) return next(err);

                if (result == 1) {

                  create.saveCity(function (err, result) {
                    if (err) return next(err);
                    if (result.rowCount == 1) {
                      req.session.flash = {
                        type: 'success',
                        intro: 'Успех!',
                        message: 'Город сохранен в базе данных.'
                      };
                      res.redirect(303, 'back');
                    } else {
                      req.session.flash = {
                        type: 'danger',
                        intro: 'Ошибка записи!',
                        message: "Город не сохранен в базе данных."
                      };
                      res.redirect(303, 'back');
                    }
                  });

                } else {

                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "Псевдоним не уникален."
                  };
                  req.session.repeatData = {
                    errAlias: true,
                    title: value.title,
                    alias: value.alias
                  };
                  res.redirect(303, 'back');
                }
              });

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка записи!',
                message: "Псевдоним не уникален."
              };
              req.session.repeatData = {
                errAlias: true,
                title: value.title,
                alias: value.alias
              };
              res.redirect(303, 'back');
            }
          });
        }

        let tasks = [valid, validAlias, save];

        function noendCreate(result) {
          let currentTask = tasks.shift();
          if (currentTask) currentTask(result);
        }

        noendCreate();

      } else {

        function valid() {

          if (value.alias.length > 60) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: value.alias + ' - должно быть не более 60 символов.'
            };
            req.session.repeatData = {
              errAlias: true,
              title: value.title,
              alias: value.alias
            };
            res.redirect(303, 'back');

          } else {
            noendCreate();
          }
        }

        function validAlias() {

          if (value.latin == 1) {
            if (value.alias.length < 1) {
              value.alias = translite(value.title.trim()).toLowerCase();
              noendCreate();
            } else {
              value.alias = translite(value.alias.trim()).toLowerCase();
              noendCreate();
            }

          } else {

            if (value.alias.length < 1) {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка проверки!',
                message: 'Если поле "Псевдоним" отмечено как "original", то поле обязательно для заполнения.'
              };
              req.session.repeatData = {
                errTitle: true,
                title: value.title.trim(),
                alias: value.alias.trim()
              };
              res.redirect(303, 'back');

            } else {
              noendCreate();
            }
          }
        }

        function save() {

          let create = new Earth({title: value.title, alias: value.alias});

          create.isset(function (err, result) {
            if (err) return next(err);

            if (result == 1) {

              aliasEarth.getCreateAliasEarth(value.alias, function (err, result) {
                if (err) return next(err);

                if (result == 1) {

                  create.saveCountry(function (err, result) {
                    if (err) return next(err);
                    if (result.rowCount == 1) {
                      req.session.flash = {
                        type: 'success',
                        intro: 'Успех!',
                        message: 'Страна сохранена в базе данных.'
                      };
                      res.redirect(303, 'back');
                    } else {
                      req.session.flash = {
                        type: 'danger',
                        intro: 'Ошибка записи!',
                        message: "Страна не сохранена в базе данных."
                      };
                      res.redirect(303, 'back');
                    }
                  });

                } else {

                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "Псевдоним не уникален."
                  };
                  req.session.repeatData = {
                    errAlias: true,
                    title: value.title,
                    alias: value.alias
                  };
                  res.redirect(303, 'back');
                }

              });

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка записи!',
                message: "Псевдоним не уникален."
              };
              req.session.repeatData = {
                errAlias: true,
                title: value.title,
                alias: value.alias
              };
              res.redirect(303, 'back');
            }
          });
        }

        let tasks = [valid, validAlias, save];

        function noendCreate(result) {
          let currentTask = tasks.shift();
          if (currentTask) currentTask(result);
        }

        noendCreate();
      }
    } else {
      noend();
    }
  }

  function submitEdit() {

    if (value.edit) {

      if (urlParsed.query.district) {

        let edit = new Earth({title: value.title.trim(), id_district: urlParsed.query.edit});

        edit.getDistrictDistrict(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Такая запись существует."
            };
            req.session.repeatData = {
              errTitle: true,
              title: value.title
            };
            res.redirect(303, 'back');

          } else {

            edit.editDistrict(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Запись изменена.'
                };
                res.redirect(303, 'back');

              } else {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка базы данных!',
                  message: "Запись не изменена."
                };
                res.redirect(303, 'back');
              }
            });
          }
        });

      } else if (urlParsed.query.metro) {

        let edit = new Earth({title: value.title.trim(), id_metro: urlParsed.query.edit});

        edit.getMetroMetro(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Такая запись существует."
            };
            req.session.repeatData = {
              errTitle: true,
              title: value.title
            };
            res.redirect(303, 'back');

          } else {

            edit.editMetro(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Запись изменена.'
                };
                res.redirect(303, 'back');

              } else {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка базы данных!',
                  message: "Запись не изменена."
                };
                res.redirect(303, 'back');
              }
            });
          }
        });

      } else if (urlParsed.query.street) {

        let edit = new Earth({title: value.title.trim(), id_street: urlParsed.query.edit});

        edit.getStreetStreet(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Такая запись существует."
            };
            req.session.repeatData = {
              errTitle: true,
              title: value.title
            };
            res.redirect(303, 'back');

          } else {

            edit.editStreet(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Запись изменена.'
                };
                let str = "/admin/administrator/earth?country="+urlParsed.query.country+"&region="+urlParsed.query.region+"&street="+urlParsed.query.street;
                res.redirect(303, str);

              } else {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка базы данных!',
                  message: "Запись не изменена."
                };
                res.redirect(303, 'back');
              }
            });
          }
        });

      } else if (urlParsed.query.country && !urlParsed.query.region) {

        function valid() {

          if (value.regional == '') {
            value.regional = null;
          }

          if (value.alias.length > 60) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: value.alias + ' - должно быть не более 60 символов.'
            };
            req.session.repeatData = {
              errAlias: true,
              title: value.title,
              alias: value.alias,
              regional: value.regional
            };
            res.redirect(303, 'back');

          } else {
            noendCreate();
          }
        }

        function validAlias() {

          if (value.latin == 1) {
            if (value.alias.length < 1) {
              value.alias = translite(value.title.trim()).toLowerCase();
              noendCreate();
            } else {
              value.alias = translite(value.alias.trim()).toLowerCase();
              noendCreate();
            }

          } else {

            if (value.alias.length < 1) {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка проверки!',
                message: 'Если поле "Псевдоним" отмечено как "original", то поле обязательно для заполнения.'
              };
              req.session.repeatData = {
                errTitle: true,
                title: value.title.trim(),
                alias: value.alias.trim()
              };
              res.redirect(303, 'back');

            } else {
              noendCreate();
            }
          }
        }

        function edit() {

          let edit = new Earth({
            title: value.title,
            alias: value.alias,
            id: urlParsed.query.edit,
            regional_city: value.regional
          });

          edit.isset(function (err, result) {
            if (err) return next(err);

            if (result == 1) {

              aliasEarth.getEditAliasRegionEarth(value.alias, urlParsed.query.edit, function (err, result) {
                if (err) return next(err);

                if (result == 1) {

                  edit.editRegion(function (err, result) {
                    if (err) return next(err);
                    if (result.rowCount > 0) {
                      req.session.flash = {
                        type: 'success',
                        intro: 'Успех!',
                        message: 'Запись изменена.'
                      };
                      res.redirect(303, 'back');
                    } else {
                      req.session.flash = {
                        type: 'danger',
                        intro: 'Ошибка записи!',
                        message: "Запись не изменена."
                      };
                      res.redirect(303, 'back');
                    }
                  });

                } else {

                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "Псевдоним не уникален."
                  };
                  req.session.repeatData = {
                    errAlias: true,
                    title: value.title,
                    alias: value.alias
                  };
                  res.redirect(303, 'back');
                }
              });

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка записи!',
                message: "Псевдоним не уникален."
              };
              req.session.repeatData = {
                errAlias: true,
                title: value.title,
                alias: value.alias
              };
              res.redirect(303, 'back');
            }
          });
        }

        let tasks = [valid, validAlias, edit];

        function noendCreate(result) {
          let currentTask = tasks.shift();
          if (currentTask) currentTask(result);
        }

        noendCreate();

      } else if (urlParsed.query.region) {

        function valid() {

          if (value.alias.length > 60) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: value.alias + ' - должно быть не более 60 символов.'
            };
            req.session.repeatData = {
              errAlias: true,
              title: value.title,
              alias: value.alias,
              regional: value.regional
            };
            res.redirect(303, 'back');

          } else if (!(/^[0-9]{0,10}$/.test(value.districts))) {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: 'Либо не число, либо в число входит более десяти символов'
            };
            req.session.repeatData = {
              errDistricts: true,
              title: value.title,
              alias: value.alias
            };
            res.redirect(303, 'back');

          } else {
            noendCreate();
          }
        }

        function validAlias() {

          if (value.latin == 1) {
            if (value.alias.length < 1) {
              value.alias = translite(value.title.trim()).toLowerCase();
              noendCreate();
            } else {
              value.alias = translite(value.alias.trim()).toLowerCase();
              noendCreate();
            }

          } else {

            if (value.alias.length < 1) {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка проверки!',
                message: 'Если поле "Псевдоним" отмечено как "original", то поле обязательно для заполнения.'
              };
              req.session.repeatData = {
                errTitle: true,
                title: value.title.trim(),
                alias: value.alias.trim()
              };
              res.redirect(303, 'back');

            } else {
              noendCreate();
            }
          }
        }

        function edit() {

          let edit = new Earth({
            title: value.title,
            alias: value.alias,
            districts_id: value.districts,
            id: urlParsed.query.edit
          });

          edit.isset(function (err, result) {
            if (err) return next(err);

            if (result == 1) {

              aliasEarth.getEditAliasCityEarth(value.alias, urlParsed.query.edit, function (err, result) {
                if (err) return next(err);

                if (result == 1) {

                  edit.editCity(function (err, result) {
                    if (err) return next(err);
                    if (result.rowCount > 0) {
                      req.session.flash = {
                        type: 'success',
                        intro: 'Успех!',
                        message: 'Запись изменена.'
                      };
                      res.redirect(303, 'back');
                    } else {
                      req.session.flash = {
                        type: 'danger',
                        intro: 'Ошибка записи!',
                        message: "Запись не изменена."
                      };
                      res.redirect(303, 'back');
                    }
                  });

                } else {

                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "Псевдоним не уникален."
                  };
                  req.session.repeatData = {
                    errAlias: true,
                    title: value.title,
                    alias: value.alias
                  };
                  res.redirect(303, 'back');
                }
              });

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка записи!',
                message: "Псевдоним не уникален."
              };
              req.session.repeatData = {
                errAlias: true,
                title: value.title,
                alias: value.alias
              };
              res.redirect(303, 'back');
            }
          });
        }

        let tasks = [valid, validAlias, edit];

        function noendCreate(result) {
          let currentTask = tasks.shift();
          if (currentTask) currentTask(result);
        }

        noendCreate();

      } else {

        function valid() {

          if (value.metropolis == '') {
            value.metropolis = null;
          }

          if (value.alias.length > 60) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: value.alias + ' - должно быть не более 60 символов.'
            };
            req.session.repeatData = {
              errAlias: true,
              title: value.title,
              alias: value.alias,
              regional: value.regional
            };
            res.redirect(303, 'back');

          } else {
            noendCreate();
          }
        }

        function validAlias() {

          if (value.latin == 1) {
            if (value.alias.length < 1) {
              value.alias = translite(value.title.trim()).toLowerCase();
              noendCreate();
            } else {
              value.alias = translite(value.alias.trim()).toLowerCase();
              noendCreate();
            }

          } else {

            if (value.alias.length < 1) {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка проверки!',
                message: 'Если поле "Псевдоним" отмечено как "original", то поле обязательно для заполнения.'
              };
              req.session.repeatData = {
                errTitle: true,
                title: value.title.trim(),
                alias: value.alias.trim()
              };
              res.redirect(303, 'back');

            } else {
              noendCreate();
            }
          }
        }

        function edit() {

          let edit = new Earth({
            title: value.title,
            alias: value.alias,
            id: urlParsed.query.edit,
            metropolis: value.metropolis
          });

          edit.isset(function (err, result) {
            if (err) return next(err);

            if (result == 1) {

              aliasEarth.getEditAliasCountryEarth(value.alias, urlParsed.query.edit, function (err, result) {
                if (err) return next(err);

                if (result == 1) {

                  edit.editCountry(function (err, result) {
                    if (err) return next(err);
                    if (result.rowCount > 0) {
                      req.session.flash = {
                        type: 'success',
                        intro: 'Успех!',
                        message: 'Запись изменена.'
                      };
                      res.redirect(303, 'back');
                    } else {
                      req.session.flash = {
                        type: 'danger',
                        intro: 'Ошибка записи!',
                        message: "Запись не изменена."
                      };
                      res.redirect(303, 'back');
                    }
                  });

                } else {

                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка записи!',
                    message: "Псевдоним не уникален."
                  };
                  req.session.repeatData = {
                    errAlias: true,
                    title: value.title,
                    alias: value.alias
                  };
                  res.redirect(303, 'back');
                }
              });

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка записи!',
                message: "Псевдоним не уникален."
              };
              req.session.repeatData = {
                errAlias: true,
                title: value.title,
                alias: value.alias
              };
              res.redirect(303, 'back');
            }
          });
        }

        let tasks = [valid, validAlias, edit];

        function noendCreate(result) {
          let currentTask = tasks.shift();
          if (currentTask) currentTask(result);
        }

        noendCreate();

      }
    } else {
      noend();
    }
  }

  function submitDrop() {

    if (value.drop) {

      var drop = new Earth({id: urlParsed.query.drop});

      if (urlParsed.query.district) {

        drop.dropDistrict(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена.'
            };
            res.redirect(303, pathname + "?country=" + urlParsed.query.country + "&region=" + urlParsed.query.region + "&district=" + urlParsed.query.district);
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Запись не удалена."
            };
            res.redirect(303, pathname + "?country=" + urlParsed.query.country + "&region=" + urlParsed.query.region + "&district=" + urlParsed.query.district);
          }
        })

      } else if (urlParsed.query.street) {

        drop.dropStreet(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена.'
            };
            res.redirect(303, pathname + "?country=" + urlParsed.query.country + "&region=" + urlParsed.query.region + "&street=" + urlParsed.query.street);
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Запись не удалена."
            };
            res.redirect(303, pathname + "?country=" + urlParsed.query.country + "&region=" + urlParsed.query.region + "&street=" + urlParsed.query.street);
          }
        })

      } else if (urlParsed.query.metro) {

        drop.dropMetro(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена.'
            };
            res.redirect(303, pathname + "?country=" + urlParsed.query.country + "&region=" + urlParsed.query.region + "&metro=" + urlParsed.query.metro);
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка данных!',
              message: "Запись не удалена."
            };
            res.redirect(303, pathname + "?country=" + urlParsed.query.country + "&region=" + urlParsed.query.region + "&metro=" + urlParsed.query.metro);
          }
        })

      } else if (urlParsed.query.country && !urlParsed.query.region) {

        drop.dropRegion(function (err, result) {
          if (err) return next(err);
          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена.'
            };
            res.redirect(303, pathname + "?country=" + urlParsed.query.country);
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Регион не удалился."
            };
            res.redirect(303, 'back');
          }
        })

      } else if (urlParsed.query.region) {

        drop.dropCity(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена.'
            };
            res.redirect(303, pathname + "?country=" + urlParsed.query.country + "&region=" + urlParsed.query.region);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Город не удалился."
            };
            res.redirect(303, 'back');
          }
        })

      } else {

        drop.dropCountry(function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена.'
            };
            res.redirect(303, pathname);

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Страна не удалилась."
            };
            res.redirect(303, 'back');
          }
        })
      }
    }
  }


  var tasks = [accessAdministrator, submitValidate, submitCreate, submitEdit, submitDrop];

  function noend(result) {
    var currentTask = tasks.shift();
    if (currentTask) currentTask(result);
  }

  noend();
};


function translite(str) {

  var arr = {
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


  var strstr = '';

  for (var i = 0; i < str.length; i++) {

    if (arr[str[i]]) {

      strstr += arr[str[i]];

    } else {

      if (arr[str[i]] == '') {
        strstr += arr[str[i]];
      } else {
        strstr += str[i];
      }
    }
  }

  if (strstr.indexOf('-', strstr.length - 1) == strstr.length - 1) {
    strstr = strstr.substring(0, strstr.length - 1);
  }

  return strstr;

}