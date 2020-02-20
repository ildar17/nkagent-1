let url = require('url');
let co = require("co");
let XLS = require('xlsjs');
let conf = require('../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let Parser = require('./model/index');
let menu = require('../../../lib/menu');
let Permit = require('../../../lib/permit');

exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let resultList = '';
  let id_user = null;
  let administrator = true;
  let permission = '';
  let users = null;
  let sidebar = null;
  let formValue = null;
  let priceOld = null;
  let selectType = '';
  let temp = '';
  let selectSection = '';
  let selectAgents = '';
  let selectMaterial = '';
  let back = '';
  if(urlParsed.query.page){
    back = '?page=' + urlParsed.query.page;
  }
  let nameCity = '';
  let cityList = '';
  let id_agency = null;
  let id_moderator_agency = null;
  let id_city = null;
  let selectEndStreet = '';


  function accessAdministrator() {

    if (conf.get('administrator') !== req.session.uid) {
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

  function getSection() {

    Permit.getSection('/admin/template/cottages', function (err, result) {
      if (err) return next(err);
      if (result.rowCount === 1) {

        temp = result.rows[0].temp;

        noend();

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка администрирования!',
          message: "Нет зарегистрированного шаблона."
        };
        res.redirect(303, '/admin/template/admin');
      }
    });
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
            res.redirect(303, '/admin/template/admin');

          } else {

            id_city = result;
            noend();
          }
        });
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

  function editCity() {

    if (urlParsed.query.editCity) {

      Parser.setCity(urlParsed.query.editCity, req.session.uid, function (err, result) {
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

  function listParser() {

    let workbook = XLS.readFile(__dirname + '/1.xls');

    function to_json(workbook) {

      pool.connect( function(err, client, done) {

        workbook.SheetNames.forEach(function(sheetName) {
          let roa = XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);

          for(let i=0; i < roa.length; i++ ){

            if(sheetName === 'Дома и коттеджи'){

              roa[i]['раздел'] = sheetName;

              client.query('INSERT INTO parser_cottages (note, price, tel, section) VALUES($1, $2, $3, $4)', [roa[i]["Дома и коттеджи"], roa[i]["цена"], roa[i]["телефоны агенства, риэлтора"], roa[i]["раздел"]], function (err, result) {
                  done();
                if (err) return next(err);

                });
            }
          }
        });
      });
    }

    //to_json(workbook);

    noend();
  }

  function listEdit() {

    if ( urlParsed.query.edit ) {

      Parser.getOneRecord(urlParsed.query.edit, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          formValue = result.rows[0];
          noend();

        } else {

          req.session.flash = {
            type: 'warning',
            intro: 'Предупреждение базы данных!',
            message: "Таблица \"parser\" пустая."
          };
          res.redirect(303, pathname);

        }
      })

    } else {
      noend();
    }

  }

  function type() {

    if ( urlParsed.query.edit ) {

      co(function*() {

        let arrAlias = ['prodam', 'sdam', 'kuplyu', 'snimu'];

        for (let i = 0; i < arrAlias.length; i++) {

          let type = yield new Promise(function (resolve, reject) {

            Parser.getSection(arrAlias[i], function (err, result) {
              if (err) return next(err);
              resolve(result.rows[0]);
            });
          });

          selectType += '<option value="' + type.id + '">' + type.title + '</option>' + '\n';
        }
        noend();
      });
    } else {
      noend();
    }
  }

  function section() {
    if ( urlParsed.query.edit ) {

      Parser.selectSection(temp, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          for (let i = 0; i < result.rows.length; i++) {

            let str = formValue.note.toLowerCase();
            let str1 = result.rows[i].section.toLowerCase();


            if(str.indexOf(str1) >= 0){
              selectSection += '<option value="' + result.rows[i].section_id + '" selected>' + result.rows[i].section + '</option>' + '\n';
            } else {
              selectSection += '<option value="' + result.rows[i].section_id + '">' + result.rows[i].section + '</option>' + '\n';
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

  function listSelectAgents() {

    if ( urlParsed.query.edit ) {
      let getUser = new Parser({});

      getUser.getUser(function (err, result) {
        if (err) return next(err);
        if(result.rowCount > 0){

          selectAgents = '';
          let str = '';
          let tel = '';

          let arrTel = formValue.tel.split('');
          for(let i=0; i < arrTel.length; i++){

            arrTel[i] = arrTel[i] * 1;

            if(arrTel[i] === 0 || arrTel[i] === 1 || arrTel[i] === 2 || arrTel[i] === 3 || arrTel[i] === 4 || arrTel[i] === 5 || arrTel[i] === 6 || arrTel[i] === 7 || arrTel[i] === 8 || arrTel[i] === 9){
              str += arrTel[i];
            }
          }

          selectAgents += '<option value="">-не определено-</option>' + '\n';

          for(let i=0; i < result.rows.length; i++){

            tel = result.rows[i].tel.replace(/^(\+7)/,'');

            if(str.indexOf(tel) > 0){
              selectAgents += '<option selected value="' +result.rows[i].id_user + '">' + result.rows[i].tel + ' | ' + result.rows[i].fio1 + '</option>' + '\n';
            } else {
              selectAgents += '<option value="' +result.rows[i].id_user + '">' + result.rows[i].tel + ' | ' + result.rows[i].fio1 + '</option>' + '\n';
            }
          }
          noend();

        } else {
          noend();
        }
      })

    } else {
      noend();
    }
  }

  function streetSelect() {

    if(urlParsed.query.edit){
      let street = new Parser({});

      street.getStreet(id_city, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          selectEndStreet += '<option value="">-Улица не выбрана-</option>' + '\n';

          let str = formValue.note.toLowerCase();

          for (let i = 0; i < result.rows.length; i++) {

            let strSelect = result.rows[i].street.toLowerCase();

            if(str.indexOf(strSelect) < 0){
              selectEndStreet += '<option value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
            } else {
              selectEndStreet += '<option value="' + result.rows[i].id_street + '" selected>' + result.rows[i].street + '</option>' + '\n';
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

  function price() {

    if (urlParsed.query.edit) {
      let result = '';
      let val = formValue.price;

      if(formValue.price !== null){
        let resArr = val.match(/[0-9]/ig);
        for (let i = 0; i < resArr.length; i++) {
          result += resArr[i];
        }
        priceOld = formValue.price;
        formValue.price = Number(result);

        noend();
      } else {
        noend();
      }

    } else {
      noend();
    }
  }

  function material() {

    if ( urlParsed.query.edit ) {

      Parser.getMaterial(function (err, result) {
        if (err) return next(err);

        selectMaterial += '<option value="">-не определено-</option>' + '\n';

        let str = formValue.note.toLowerCase();

        for (let i = 0; i < result.rows.length; i++) {

          let strSelect = result.rows[i].title.toLowerCase();

          if(str.indexOf(strSelect) < 0){
            selectMaterial  += '<option value="' + result.rows[i].id_material + '">' + result.rows[i].title + '</option>' + '\n';
          } else {
            selectMaterial  += '<option value="' + result.rows[i].id_material + '" selected>' + result.rows[i].title + '</option>' + '\n';
          }

        }

        noend();

      })

    } else {
      noend();
    }
  }

  function listCity() {

    let city = '';

    Parser.oneCity(id_city, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {
        nameCity = result.rows[0].title;

        let objCity = {};
        let objRegion = {};

        Parser.getAllCity(function (err, result) {
          if (err) return next(err);

          for(let i = 0; i < result.rows.length; i++){
            objCity[result.rows[i].id_city] = result.rows[i].title;
          }

          for(let i = 0; i < result.rows.length; i++){
            objRegion[result.rows[i].id_city] = result.rows[i].region;
          }

          Parser.getMainCity('Нижнекамск', permission, id_agency, id_moderator_agency, id_user, function (err, result) {
            if (err) return next(err);

            if(result.rowCount > 0){

              delete objCity[result.rows[0].id_city];
              delete objRegion[result.rows[0].id_city];

              city += '<ul class="listCity">\n';

              if(result.rowCount > 0){
                city += '\t<li><a href="/admin/administrator/parser-cottages?editCity=' + result.rows[0].id_city + '">[' + result.rows[0].sum + '] '+'<b>' + result.rows[0].title + '</b> - ' + result.rows[0].region + '</a></li>\n';
              }

              Parser.listCity('Нижнекамск', permission, id_agency, id_moderator_agency, id_user, function (err, result) {
                if (err) return next(err);

                if(result.rowCount > 0){
                  cityList = result.rows;

                  for (let i = 0; i < cityList.length; i++) {

                    delete objCity[cityList[i].id_city];
                    delete objRegion[cityList[i].id_city];

                    city += '\t<li><a href="/admin/administrator/parser-cottages?editCity=' + cityList[i].id_city + '">[' + result.rows[i].sum  + '] '+'<b>' + cityList[i].title + '</b> - ' + cityList[i].region + '</a></li>\n';
                  }

                  for(let key in objCity){
                    city += '\t<li><a href="/admin/administrator/parser-cottages?editCity=' + key + '"><b>' + objCity[key] + '</b> - ' + objRegion[key] + '</a></li>\n';
                  }

                  city += '</ul>\n';
                  cityList = city;

                  noend();

                } else {

                  for(let key in objCity){
                    city += '\t<li><a href="/admin/administrator/parser-cottages?editCity=' + key + '"><b>' + objCity[key] + '</b> - ' + objRegion[key] + '</a></li>\n';
                  }

                  city += '</ul>\n';
                  cityList = city;

                  noend();
                }

              });

            } else {

              city += '<ul class="listCity">\n';

              for(let key in objCity){
                city += '\t<li><a href="/admin/administrator/parser-cottages?editCity=' + key + '"><b>' + objCity[key] + '</b> - ' + objRegion[key] + '</a></li>\n';
              }

              city += '</ul>\n';
              cityList = city;

              noend();
            }

          });

        });

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

  function listTable(){

    Parser.list(function (err, result) {
      if (err) return next(err);

      if(result.rowCount < 1){
        req.session.flash = {
          type: 'warning',
          intro: 'Предупреждение базы данных!',
          message: "Таблица \"parser\" пустая."
        };
        res.redirect(303, 'back');

      } else {

        resultList = result;

        let urlPage = urlParsed.query.page;
        let limit = 30;
        let linkLimit = 20;
        let offset = urlPage * limit - limit;

        if (offset < 0 || !offset) offset = 0;


        Parser.listLimit(limit, offset, function (err, result) {

          if (err) return next(err);

          resultList = Parser.tableParser(resultList, urlParsed, limit, linkLimit, urlPage, result, req);

          noend();

        });
      }
    });
  }

  function listRender() {

    let nameTemplate = 'Дома, дачи, коттеджи. Парсер XLS. ';

    let titlePage = nameTemplate + '<span class = "city">' + nameCity + '</span>';
    titlePage += '<span class="btn btn-primary selectCity" data-toggle="modal" data-target=".bs-example-modal-lg">Выбрать город</span>';

    res.render('administrator/parser-cottages/body', {

      layout: 'administrator',
      title: titlePage,
      sidebar: sidebar,
      priceTab : resultList,
      administrator: administrator,
      formValue: formValue,
      selectType: selectType,
      selectSection: selectSection,
      selectAgents: selectAgents,
      selectEndStreet: selectEndStreet,
      selectMaterial: selectMaterial,
      back: back,
      cityList: cityList,
      priceOld: priceOld

    });

  }


  let tasks = [ accessAdministrator, getSection, accessValue, userMenu, editCity, listParser, listEdit, type, section, listSelectAgents, streetSelect, price, material, listCity, listTable, listRender ];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();


};

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


exports.submit = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let value = req.body.administrator;
  let pathname = urlParsed.pathname;
  let title = '';
  let pathnameSave = '';
  let id_user = null;

  function accessAdministrator() {
    if (conf.get('administrator') !== req.session.uid) {
      res.redirect('/');
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
      noend();
    });
  }

  function validate() {


    if(value.create){

      for(let key in value) {
        value[key] = value[key].trim();
      }

      for(let key in value) {
        if (value[key] === ' ') {
          value[key] = '';
        }
      }

      if(value.type === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errType: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.type.length > 19){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более девятнадцати символов."
        };
        req.session.repeatData = {
          errType: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.section === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errSection: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.section.length > 19){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более девятнадцати символов."
        };
        req.session.repeatData = {
          errSection: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.agent === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errAgent: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.agent.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errAgent: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.street === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errStreet: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.street.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errStreet: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.storey.length > 2){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более двух символов."
        };
        req.session.repeatData = {
          errStorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(!(/^[0-9]*$/.test(value.storey))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать число."
        };
        req.session.repeatData = {
          errStorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(!(/^[0-9]*$/.test(value.price))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать целое число."
        };
        req.session.repeatData = {
          errPrice: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.price.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errPrice: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.area_house.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errArea_house: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(!(/^[0-9]*\.*\d{0,1}$/.test(value.area_house))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать целое число, либо десятичное."
        };
        req.session.repeatData = {
          errArea_house: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.area_land.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errArea_land: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(!(/^[0-9]*\.*\d{0,1}$/.test(value.area_land))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать целое число, либо десятичное."
        };
        req.session.repeatData = {
          errArea_land: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.material.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errMaterial: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.note.length > 1000){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более одной тысячи символов."
        };
        req.session.repeatData = {
          errNote: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, price: value.price, area_house: value.area_house, area_land: value.area_land, storey: value.storey, material: value.material, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else {
        noend();
      }

    } else {
      noend();
    }
  }

  function joinTitle() {

    if (value.create || value.edit) {

      for (let key in value) {
        value[key] = value[key].trim();
      }

      Parser.getTitleSection(value.section, function (err, resultSection) {
        if (err) return next(err);

        if (resultSection.rowCount > 0) {

          let str = '';
          let str1 = '';

          Parser.getTitleStreett(value.street, function (err, resultDistrict) {
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

    } else {
      noend();
    }
  }

  function create() {

    if (value.create && urlParsed.query.edit) {

      if(urlParsed.query.page){
        pathnameSave = pathname + '?' + 'page=' + urlParsed.query.page
      } else {
        pathnameSave = pathname;
      }


      let create = new Parser({
        id_parser: urlParsed.query.edit,
        value: value,
        date_create: Date.now(),
        author: id_user,
        template: 'cottages',
        title: title
      });

      create.save(function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Объект недвижимости перезаписан.'
          };

          res.redirect(303, pathnameSave);


        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Объект недвижимости не перезаписан"
          };
          res.redirect(303,'back');
        }

      });

    } else {
      return next();
    }
  }

  let tasks = [ accessAdministrator, accessValue, validate, joinTitle, create ];
  function noend(result) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(result);
  }
  noend();

};