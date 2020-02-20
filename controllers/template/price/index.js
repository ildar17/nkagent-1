let url = require('url');
let conf = require('../../../config/index');
let Price = require('./model/index');
let ms = require('../../../lib/msDate');
let table = require('../../../lib/tableList');
let Permit = require('../../../lib/permit');
let co = require("co");
let nodeExcel = require('excel-export');


exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let temp = '';
  let nameSection = '';
  let permission = '00000';
  let users = null;
  let permitForm = '';
  let resultList = '';
  let sortingType = '';
  let sortingCity = '';
  let sortingStreet = '';
  let sortingSection = '';
  let sortingAgent = '';
  let sortingOp = '';
  let value = {};
  let sortingMinPrice = '';
  let sortingMaxPrice = '';
  let minPrice = '';
  let maxPrice = '';
  if (urlParsed.query.min) minPrice = urlParsed.query.min * 1;
  if (urlParsed.query.max) maxPrice = urlParsed.query.max * 1;
  let inPrice = '';
  let yesPage = true;
  let administrator = true;

  let code = '';

  let col = {};
  col.type = '';
  col.section = '';
  col.city = '';
  col.street = '';
  col.house = '';
  col.liter = '';
  col.storey = '';
  col.project = '';
  col.price = '';
  col.area = '';
  col.toilet = '';
  col.balcony = '';
  col.op = '';
  col.note = '';
  col.agent = '';
  col.photo = '';



  function getSection() {

    Permit.getSection(pathname, function (err, result) {
      if (err) return next(err);

      if (result.rowCount === 1) {

        temp = result.rows[0].temp;
        nameSection = result.rows[0].name;

        noend();

      } else {

        noend();
      }
    });
  }

  function initialization() {

    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

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

        if (!temp) {
          return next();
        } else {
          noend();
        }
      }
    }
  }

  function accessValue() {
    let permit = new Permit({
      url: pathname,
      email: req.session.uid
    });

    permit.accessModerator(function (err, result) {
      if (err) return next(err);

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
    });
  }

  function accessTemplate() {

    if (permission === '00000') {

      res.locals.flash = {
        type: 'danger',
        intro: 'Ошибка доступа!',
        message: 'У Вас нет прав доступа к шаблону "price".'
      };

      yesPage = false;

      res.render('template/price/body',
        {
          layout: 'admin',
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

      Price.getAddress(urlParsed.query.map, function (err, result, house, liter) {

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

  function listAccess() {
    noend();
  }

  function typeSelect() {

    value.type = urlParsed.query.type;

    Price.getSectionType(function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        if (result.rowCount > 1) {
          sortingType += '<option value="">-Тип объяв. не выбран-</option>' + '\n';
        }

        for (let i = 0; i < result.rows.length; i++) {

          if (value.type) {

            if ((value.type * 1) === (result.rows[i].id * 1)) {
              sortingType += '<option value="' + result.rows[i].id + '" selected>' + result.rows[i].title + '</option>' + '\n';
            } else {
              sortingType += '<option value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
            }

          } else {
            sortingType += '<option value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
          }

        }

        noend();
      } else {
        sortingType += '<option value="">-Тип объяв. не выбран-</option>' + '\n';
        noend();
      }
    });
  }

  function sectionSelect() {

    value.sections = urlParsed.query.sections;

    Price.getSectionSorting(function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        if (result.rowCount > 1) {
          sortingSection += '<option value="">-Категория не выбрана-</option>' + '\n';
        }

        for (let i = 0; i < result.rows.length; i++) {

          if (value.sections === result.rows[i].id) {
            sortingSection += '<option selected value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
          } else {
            sortingSection += '<option value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
          }

        }

        noend();

      } else {
        sortingSection += '<option value="">-Категория не выбрана-</option>' + '\n';
        noend();
      }
    });
  }

  function citySelect() {

    value.city = urlParsed.query.city;

    Price.getCitySorting(function (err, result) {
      if (err) return next(err);


      if (result.rowCount > 0) {

        if (result.rowCount > 1) {
          sortingCity += '<option value="">-Город не выбран-</option>' + '\n';
        }

        for (let i = 0; i < result.rows.length; i++) {

          if (value.city * 1 === result.rows[i].id_city) {
            sortingCity += '<option selected value="' + result.rows[i].id_city + '">' + result.rows[i].title + '</option>' + '\n';
          } else {
            sortingCity += '<option value="' + result.rows[i].id_city + '">' + result.rows[i].title + '</option>' + '\n';
          }
        }

        noend();
      } else {
        sortingCity += '<option value="">-Город не выбран-</option>' + '\n';
        noend();
      }
    });

  }

  function streetSelect() {

    value.street = urlParsed.query.street;


    Price.getStreetSorting(function (err, result) {
      if (err) return next(err);


      if (result.rowCount > 0) {

        if (result.rowCount > 1) {
          sortingStreet += '<option value="">-Улица не выбрана-</option>' + '\n';
        }

        for (let i = 0; i < result.rows.length; i++) {

          if (value.street * 1 === result.rows[i].id_street) {
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


  }

  function agentSelect() {

    value.agent = urlParsed.query.agent;

    Price.getAgentSorting(function (err, result) {
      if (err) return next(err);


      if (result.rowCount > 0) {

        if (result.rowCount > 1) {
          sortingAgent += '<option value="">-Агент не выбран-</option>' + '\n';
        }

        for (let i = 0; i < result.rows.length; i++) {

          if (value.agent * 1 === result.rows[i].id_user) {
            sortingAgent += '<option selected value="' + result.rows[i].id_user + '">' + result.rows[i].fio + '</option>' + '\n';
          } else {
            sortingAgent += '<option value="' + result.rows[i].id_user + '">' + result.rows[i].fio + '</option>' + '\n';
          }
        }

        noend();

      } else {
        sortingAgent += '<option value="">-Агент не выбран-</option>' + '\n';
        noend();
      }

    });

  }

  function opSelect() {

    co(function*() {

      value.op = urlParsed.query.op;

      let sortingOpResult = yield new Promise(function (resolve) {
        Price.getOpSorting(function (err, result) {
          if (err) return next(err);
          resolve(result);
        })
      });

      if(sortingOpResult.rowCount > 0){

        sortingOp += '<option value="">-Опека не выбрана-</option>' + '\n';

        for(let i = 0; i < sortingOpResult.rows.length; i++){

          if(sortingOpResult.rows[i].op === null){


            if(String(sortingOpResult.rows[i].op) === value.op){
              sortingOp += '<option selected value="null">Нет записи</option>' + '\n';
            } else {
              sortingOp += '<option value="null">Нет записи</option>' + '\n';
            }

          }

          if(sortingOpResult.rows[i].op === 1){

            if(sortingOpResult.rows[i].op === value.op*1){
              sortingOp += '<option selected value="1">Да</option>' + '\n';
            } else {
              sortingOp += '<option value="1">Да</option>' + '\n';
            }


          }

          if(sortingOpResult.rows[i].op === 0){

            if(String(sortingOpResult.rows[i].op) === value.op){
              sortingOp += '<option selected value="0">Нет</option>' + '\n';
            } else {
              sortingOp += '<option value="0">Нет</option>' + '\n';
            }
          }
        }

        noend();

      } else {
        noend();
      }

    });

  }

  function minMax() {

    co(function*() {

      let sortingMinPriceResult = yield new Promise(function (resolve) {
        Price.getMinPrice(function (err, result) {
          if (err) return next(err);
          resolve(result);
        })
      });

      if (sortingMinPriceResult.rowCount > 0) {
        sortingMinPrice = sortingMinPriceResult.rows[0].min;
      }

      let sortingMaxPriceResult = yield new Promise(function (resolve) {
        Price.getMaxPrice(function (err, result) {
          if (err) return next(err);
          resolve(result);
        })
      });

      if (sortingMaxPriceResult.rowCount > 0) {
        sortingMaxPrice = sortingMaxPriceResult.rows[0].max;
      }

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

    });

  }

  function columnPrice() {

    Price.colPrice(req.session.uid, function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){

        code = result.rows[0].code_price;

        if(code.indexOf('1', 0) === 0){
          col.type = 'checked';
        }

        if(code.indexOf('1', 1) === 1){
          col.section = 'checked';
        }

        if(code.indexOf('1', 2) === 2){
          col.city = 'checked';
        }

        if(code.indexOf('1', 3) === 3){
          col.street = 'checked';
        }

        if(code.indexOf('1', 4) === 4){
          col.house = 'checked';
        }

        if(code.indexOf('1', 5) === 5){
          col.liter = 'checked';
        }

        if(code.indexOf('1', 6) === 6){
          col.storey = 'checked';
        }

        if(code.indexOf('1', 7) === 7){
          col.project = 'checked';
        }

        if(code.indexOf('1', 8) === 8){
          col.price = 'checked';
        }

        if(code.indexOf('1', 9) === 9){
          col.area = 'checked';
        }

        if(code.indexOf('1', 10) === 10){
          col.toilet = 'checked';
        }

        if(code.indexOf('1', 11) === 11){
          col.balcony = 'checked';
        }

        if(code.indexOf('1', 12) === 12){
          col.op = 'checked';
        }

        if(code.indexOf('1', 13) === 13){
          col.note = 'checked';
        }

        if(code.indexOf('1', 14) === 14){
          col.agent = 'checked';
        }

        if(code.indexOf('1', 15) === 15){
          col.photo = 'checked';
        }

        noend();
      } else {
        noend();
      }

    })
  }

  function listTable() {

    co(function*() {

      if(code === '0000000000000000'){

        noend();

      } else {


        let result = yield new Promise(function (resolve) {

          let list = new Price({email: req.session.uid, type: value.type, sections: value.sections, city: value.city, street: value.street, agent: value.agent, op: value.op, price: inPrice});

          list.list(function (err, result) {
            if (err) return next(err);
            resolve(result);
          });
        });

        if(result.rowCount > 0){

          resultList = result;

          let urlPage = urlParsed.query.page;
          let limit = 30;
          let linkLimit = 10;
          let offset = urlPage * limit - limit;

          if (offset < 0 || !offset) offset = 0;

          let resultLimit = yield new Promise(function (resolve) {

            let listLimit = new Price({email: req.session.uid, type: value.type, sections: value.sections, city: value.city, street: value.street, agent: value.agent, op: value.op, price: inPrice, limit: limit, offset: offset});

            listLimit.listLimit(function (err, result) {
              if (err) return next(err);

              resolve(result);
            });

          });


          let a1='';
          let a2='';
          let a3='';
          let a4='';
          let a5='';

          for(let i = 0; i < resultLimit.rows.length; i++){

            if(resultLimit.rows[i]['Этаж/Этажн'] > 0){
              a4 = String(resultLimit.rows[i]['Этаж/Этажн']);
            } else {
              a4 = '-';
            }

            if(resultLimit.rows[i].Этажность > 0){
              a5 = String(resultLimit.rows[i].Этажность);
            } else {
              a5 = '-';
            }


            if(resultLimit.rows[i]['Общ/Жил/Кух'] > 0){
              a1 = String(resultLimit.rows[i]['Общ/Жил/Кух']);
            } else {
              a1 = '-';
            }

            if(resultLimit.rows[i].area2 > 0){
              a2 = String(resultLimit.rows[i].area2);
            } else {
              a2 = '-';
            }

            if(resultLimit.rows[i].area3 > 0){
              a3 = String(resultLimit.rows[i].area3);
            } else {
              a3 = '-';
            }

            resultLimit.rows[i]['Этаж/Этажн'] = a4 + "/" + a5;

            resultLimit.rows[i]['Общ/Жил/Кух'] = a1 + "/" + a2 + "/" + a3;


            delete resultLimit.rows[i].Этажность;
            delete resultLimit.rows[i].area2;
            delete resultLimit.rows[i].area3;

            a4='';
            a5='';
            a1='';
            a2='';
            a3='';
          }


          for(let j = 0; j < resultLimit.fields.length; j++){

            if(resultLimit.fields[j].name === 'Этажность'){
              resultLimit.fields.splice(j, 1);
            }

            if(resultLimit.fields[j].name === 'area2'){
              resultLimit.fields.splice(j, 1);
            }
            if(resultLimit.fields[j].name === 'area3'){
              resultLimit.fields.splice(j, 1);
            }
          }

          resultList = table.tableListPrice(permission, resultList, urlParsed, limit, linkLimit, urlPage, resultLimit);


          noend();
        } else {
          noend();
        }
      }

    });
  }

  function listRender() {

    //Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

    res.render('template/price/body',
      {
        layout: 'admin',
        title: 'Администрирование. ' + nameSection + '.  <button class="btn btn-primary btn-sm" data-toggle="modal" data-target="#myModal">Настроить вывод колонок</button> <button form="csvForm" type="submit" class="btn btn-success btn-sm" name="price[csv]" value="1">Скачать таблицу в Excel</button> <a' +
        ' href="/admin/template/apartment"' +
        ' class="btn btn-warning' +
        ' btn-sm" role="button">Выйти из прайса</a>',
        permit: permitForm,
        permission: permission,
        table: resultList,
        back: '/admin/template/price',
        sortingType: sortingType,
        sortingSection: sortingSection,
        sortingCity: sortingCity,
        sortingStreet: sortingStreet,
        sortingAgent: sortingAgent,
        sortingOp: sortingOp,
        sortingMinPrice: sortingMinPrice,
        sortingMaxPrice: sortingMaxPrice,
        minPrice: minPrice,
        maxPrice: maxPrice,
        column: col,
        yesPage: yesPage

      });
  }


  let tasks = [ getSection, initialization, accessValue, accessTemplate, mapAjax, listAccess, typeSelect, sectionSelect, citySelect, streetSelect, agentSelect, opSelect, minMax, columnPrice, listTable, listRender ];

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
  let nameSection = '';
  let value = {};
  let valueQuery = {};
  let inPrice = '';
  let sortingMinPrice = '';
  let sortingMaxPrice = '';
  let minPrice = '';
  let maxPrice = '';
  if (urlParsed.query.min) minPrice = urlParsed.query.min * 1;
  if (urlParsed.query.max) maxPrice = urlParsed.query.max * 1;
  let code = '';

  function getSection() {

    Permit.getSection(pathname, function (err, result) {
      if (err) return next(err);

      if (result.rowCount === 1) {

        temp = result.rows[0].temp;
        nameSection = result.rows[0].name;
        value = req.body[temp];
        valueQuery = urlParsed.query;

        noend();

      } else {
        return next();
      }
    });
  }

  function initialization() {
    if (!req.session.uid) {

      res.redirect(303, '/admin/login');

    } else {

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
    }
  }

  function accessValue() {

    let permit = new Permit({
      url: pathname,
      email: req.session.uid
    });

    permit.accessModerator(function (err, result) {
      if (err) return next(err);

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

  function stringSQL() {

    if(value.button === '1'){

      let code = '';
      let arrPrice = ['type', 'section', 'city', 'street', 'house', 'liter', 'storey', 'project', 'price', 'area', 'toilet', 'balcony', 'op', 'note', 'agent', 'photo'];

      for(let i=0; i<arrPrice.length; i++){
        if(value[arrPrice[i]] === '1'){
          code += '1';
        } else {
          code += '0';
        }
      }

      Price.updatePriceCode(code, req.session.uid, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          res.redirect(303, 'back');
        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка данных!',
            message: "Код настройки колонок прайса не изменился."
          };
          res.redirect(303, 'back');
        }

      });

    } else {
      noend();
    }
  }

  function minMax() {

    co(function*() {

      let sortingMinPriceResult = yield new Promise(function (resolve) {
        Price.getMinPrice(function (err, result) {
          if (err) return next(err);
          resolve(result);
        })
      });

      if (sortingMinPriceResult.rowCount > 0) {
        sortingMinPrice = sortingMinPriceResult.rows[0].min;
      }

      let sortingMaxPriceResult = yield new Promise(function (resolve) {
        Price.getMaxPrice(function (err, result) {
          if (err) return next(err);
          resolve(result);
        })
      });

      if (sortingMaxPriceResult.rowCount > 0) {
        sortingMaxPrice = sortingMaxPriceResult.rows[0].max;
      }

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

    });

  }

  function columnPrice() {

    Price.colPrice(req.session.uid, function (err, result) {
      if (err) return next(err);

      code = result.rows[0].code_price;

      if(code === '0000000000000000'){

        res.redirect(303, 'back');

      } else {
        noend();
      }

    });
  }

  function getPrice() {

    if(value.csv === '1') {

      co(function*() {

        let result = yield new Promise(function (resolve) {

          let list = new Price({email: req.session.uid, type: valueQuery.type, sections: valueQuery.sections, city: valueQuery.city, street: valueQuery.street, agent: valueQuery.agent, op: valueQuery.op, price: inPrice});

          list.listExcel(function (err, result) {
            if (err) return next(err);
            resolve(result);
          });
        });


        result = Price.editResults(result);

        let conf = {};
        conf.name = "mysheet";
        conf.cols = [];

        for(let c = 1; c < result.fields.length; c++){

          conf.cols.push({caption:result.fields[c].name, type:'string', width:28.7109375});
        }

        conf.rows = [];
        let row = [];

        for(let r = 0; r < result.rows.length; r++){

          for(let key in result.rows[r]){

            if(result.rows[r][key] === null || result.rows[r][key] === 0){
              result.rows[r][key] = '-';
            }

            row.push(String(result.rows[r][key]));
            //row.push(result.rows[r][key]);
          }

          conf.rows.push(row);
          row = [];

        }


        let date = Date.now();
        date = ms.msDateYear(date);
        let str = 'attachment; filename = '+date+'_apartment.xlsx';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", str);

     let arrIndex = [];
        for(let i = 0; i < conf.rows.length; i++){
          arrIndex.push(conf.rows[i][0])
        }
        arrIndex = Price.unique(arrIndex);

        let mainArr = [];

        for(let c = 0; c < arrIndex.length; c++){
          let conf3 = {};
          conf3.rows = [];
          conf3.cols = conf.cols;

          let result = yield new Promise(function (resolve) {
            Price.getSectionName(arrIndex[c], function (err, result) {
              if (err) return next(err);
              resolve(result);
            })
          });

          conf3.name = translite(result.rows[0].title);

          for(let i = 0; i < conf.rows.length; i++) {

            if (arrIndex[c] === conf.rows[i][0]) {
              let arr = [];
              for (let j = 1; j < conf.rows[i].length; j++) {
                arr.push(conf.rows[i][j])
              }

              conf3.rows.push(arr);

            }
          }

          mainArr.push(conf3);

        }


        let resultConf = nodeExcel.execute(mainArr);
        res.end(resultConf, 'binary');


      });

    } else {
      return next();
    }

  }

  let tasks = [ getSection, initialization, accessValue, stringSQL, minMax, columnPrice, getPrice ];

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