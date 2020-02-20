let Main = require('./model/index');
let main_menu = require("../../../lib/mainMenu");
let url = require('url');
let async = require('async');

exports.list = function (req, res, next) {

  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;
  let list_menu = '';
  let resultOne = '';
  let resultAll = '';
  let title = '';
  let h1 = '';
  let content = '';
  let resultSection = '';

  function listPermit() {

    main_menu.menu(pathname, function (err, result) {
      if (err) return next(err);

      list_menu = result;
      noend();

    });

  }

  function listMain() {

    if(pathname === '/'){

      Main.getMainPage(function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){

          title = result.rows[0].title;
          h1 = result.rows[0].h1;
          content = result.rows[0].content;
          noend(null);

        } else {
          noend(null);
        }

      });

    } else {
      noend();
    }
  }

  function listApartment() {

    if(pathname === '/apartment'){

      title = 'Недвижимость Нижнекамска. Комнаты, квартиры. Таблица разделов, городов с количеством объектов.';
      h1 = '<strong><i>Комнаты, квартиры.</i></strong> Выборка базы данных внесённых объектах недвижимости города Нижнекамска.';

      async.waterfall([sectionApartment, oneCity, allCity], function (err, result) {
        if (err) return next(err);
        noend();
      });


      function sectionApartment(callback) {

        Main.getSectionApartment(function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultSection = result;
            callback(null);

          } else {
            callback(null);
          }

        });

      }


      function oneCity(callback) {

        Main.getOneCity('Нижнекамск', function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultOne = result;
            callback(null);

          } else {
            callback(null);
          }

        });

      }

      function allCity(callback) {

        Main.getAllCity('Нижнекамск', function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultAll = result;
            callback(null);

          } else {
            callback(null);
          }

        });
      }

    } else {
      noend();
    }
  }

  function listCottages() {

    if(pathname === '/cottages'){

      title = 'Недвижимость Нижнекамска. Дома, коттеджи, дачи, участки. Таблица разделов, городов с количеством объектов.';
      h1 = '<strong><i>Дома, коттеджи, дачи, участки.</i></strong> Выборка базы данных внесённых объектах недвижимости города Нижнекамска.';

      async.waterfall([sectionCottages, oneCity, allCity], function (err, result) {
        if (err) return next(err);
        noend();
      });


      function sectionCottages(callback) {

        Main.getSectionCottages(function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultSection = result;
            callback(null);

          } else {
            callback(null);
          }

        });

      }


      function oneCity(callback) {

        Main.getOneCityCottages('Нижнекамск', function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultOne = result;
            callback(null);

          } else {
            callback(null);
          }

        });

      }

      function allCity(callback) {

        Main.getAllCityCottages('Нижнекамск', function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultAll = result;
            callback(null);

          } else {
            callback(null);
          }

        });
      }

    } else {
      noend();
    }
  }

  function listCommercial() {

    if(pathname === '/commercial'){

      title = 'Недвижимость Нижнекамска. Коммерческая недвижимость. Таблица разделов, городов с количеством объектов.';
      h1 = '<strong><i>Коммерческая недвижимость.</i></strong> Выборка базы данных внесённых объектах недвижимости города Нижнекамска.';

      async.waterfall([sectionCommercial, oneCity, allCity], function (err, result) {
        if (err) return next(err);
        noend();
      });


      function sectionCommercial(callback) {

        Main.getSectionCommercial(function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultSection = result;
            callback(null);

          } else {
            callback(null);
          }

        });

      }


      function oneCity(callback) {

        Main.getOneCityCommercial('Нижнекамск', function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultOne = result;
            callback(null);

          } else {
            callback(null);
          }

        });

      }

      function allCity(callback) {

        Main.getAllCityCommercial('Нижнекамск', function (err, result) {
          if (err) return callback(err);

          if(result.rowCount > 0){

            resultAll = result;
            callback(null);

          } else {
            callback(null);
          }

        });
      }

    } else {
      noend();
    }
  }

  function listAgency() {

    if(pathname === '/agency'){

      Main.getAgency(function (err, result) {
        if (err) return next(err);

        title = 'Агенства Нижнекамска. База данных агенств и риелторов.';
        h1 = '<strong><i>Агенства Нижнекамска.</i></strong> База данных агенств и риелторов Нижнекамска.';
        content +='<h5 class="black">Сводная таблица агенств и риелторов. В графе email почтовые ящики обрезаны до четырёх символов, чтобы не светить на просторах интернета полное наименование почтовых ящиков. Если напротив Вашего ФИО email совпадает, Вы можете самостоятельно восстановить пароль, для этого пройдите по ссылке "Войти" затем кликните на ссылку "Забыли пароль" и т.д. Если напротив Вашего ФИО email не совпадает, а Вы являетесь риелтором и отправляете так называемые сетки, позвоните Римме' +
          ' Зуфаровне 8-987-2650365 , сообщите верный электронный почтовый адрес.' +
          ' Форма регистрации простая настолько, насколько это возможно. Также Вы можете зайти в личный кабинет, просматривать и скачивать прайсы, вносить изменения своих объектов недвижимости, как риелтор города Нижнекамска. В случае если email не совпадает, позвоните Римме Зуфаровне или Галине Сергеевне чтобы поправить вымышленный почтовый ящик на Ваш реальный.</h5>\n';

        //content += Main.tableAgency(result);

        content += '<h4>Так как многие зашли, список убран. Если список "Агенства и риелтора" нужен в личном кабинете, сообщите, так же вносите свои' +
          ' предложения по расширению функциональности ресурса.</h4>'

        noend();

      });

    } else {
      noend();
    }
  }

  function listTableApartment() {

    if(pathname === '/apartment' || pathname === '/cottages' || pathname === '/commercial'){

      content +='<h5 class="black">Сводная таблица с количеством объектов недвижимости по каждому разделу.</h5>\n';
      content += Main.tableSection(resultSection);
      content += '<br>\n';
      content +='<h5 class="black">Сводная таблица с количеством объектов по каждому городу - поселению.</h5>\n';
      content += Main.tableCity(resultOne, resultAll);

      noend();

    } else {
      noend();
    }
  }

  function listRender() {

    res.render('home/index',
      {
        layout: 'main',
        title: title,
        h1: h1,
        content: content,
        listMenu: list_menu
      }
    );

  }


  let tasks = [listPermit, listMain, listApartment, listCottages, listCommercial, listTableApartment, listAgency, listRender];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};