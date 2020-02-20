let crypto = require('crypto');
let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

module.exports = Price;

function Price(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Price.getAddress = function (id, fn) {

  let house = '';
  let liter = '';

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT template FROM node WHERE id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      let temp = result.rows[0].template;

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        let str = '';

        if(temp === 'apartment'){
          str = "SELECT street, house, liter FROM "+temp+" WHERE node_id = $1"
        } else {
          str = "SELECT street FROM "+temp+" WHERE node_id = $1"
        }

        client.query(str, [id], function (err, result) {
          done();
          if (err) return fn(err, null);

          if(result.rowCount > 0){

            let street = result.rows[0].street;
            if(temp === 'apartment'){
              house = result.rows[0].house;
              liter = result.rows[0].liter;
            }

            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query("SELECT c.title, s.street, (SELECT districts FROM districts WHERE id_districts = c.districts_id) AS districts,  (SELECT title FROM region WHERE id_region = c.region_id) AS region FROM street s LEFT JOIN city c ON(s.city_id = c.id_city) WHERE s.id_street = $1", [street], function (err, result) {
                done();
                if (err) return fn(err, null);

                fn(null, result, house, liter);

              });
            });

          } else {
            fn(null, null);
          }
        });
      });
    });
  });
};

Price.prototype.list = function (fn) {

  let price = this;
  let email = price.email;
  let type = '';
  let sections = '';
  let city = '';
  let street = '';
  let agent = '';
  let op = '';
  let priceSQL = '';

  if(price.type){
    type = 'IN('+price.type+')';
  } else {
    type = 'IN(SELECT DISTINCT type FROM apartment)';
  }

  if(price.sections){
    sections = 'IN('+price.sections+')';
  } else {
    sections = "IN(SELECT DISTINCT section FROM node WHERE template = 'apartment' )";
  }

  if(price.city){
    city  = price.city;
  } else {
    city  = 'ANY(SELECT id_city FROM city)';
  }

  if(price.street){
    street  = price.street;
  } else {
    street  = 'ANY(SELECT id_street FROM street)';
  }

  if(price.agent){
    agent  = price.agent;
  } else {
    agent  = 'ANY(SELECT agent FROM apartment)';
  }

  if(price.op){

    if(price.op === '0'){
      op = ' AND ap.op = ' + price.op*1;
    }

    if(price.op === '1'){
      op = ' AND ap.op = ' + price.op*1;
    }

    if(price.op === 'null'){
      op = ' AND ap.op IS NULL';
    }

  } else {
    op  = '';
  }

  if(price.price){
    priceSQL = price.price;
  } else {
    priceSQL = ' AND price IN(SELECT price FROM apartment)';
  }


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT code_price FROM users, userdata WHERE id_user = user_id AND email = $1', [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        let code = result.rows[0].code_price;

        let colType = '';
        let colSection = '';
        let colCity = '';
        let colStreet = '';
        let colHouse = '';
        let colLiter = '';
        let colStorey = '';
        let colProject = '';
        let colPrice = '';
        let colArea = '';
        let colToilet = '';
        let colBalcony = '';
        let colOp = '';
        let colNote = '';
        let colAgent = '';
        let colPhoto = '';


        let order = '';
        let orderSection = '';
        let orderCity = '';
        let orderStreet = '';
        let orderHouse = '';


        if(code.indexOf('1', 0) === 0){
          colType = 'n1.title AS "Тип объяв.", ';
        }

        if(code.indexOf('1', 1) === 1){
          colSection = 'n2.title AS Категория, ';
          orderSection = 'n2.line DESC, ';
        }

        if(code.indexOf('1', 2) === 2){
          colCity = "CASE WHEN character_length(ci.title) > 0 THEN ci.title ELSE '' END || CASE WHEN character_length(re.title) > 0 THEN ', ' || re.title ELSE '' END || CASE WHEN character_length(di.districts) > 0 THEN ', ' || di.districts ELSE '' END AS Город, ";

          orderCity = 'select_default, Город, ';
        }

        if(code.indexOf('1', 3) === 3){
          colStreet = 'st.street AS Улица, ';

          orderStreet = 'Улица, ';
        }

        if(code.indexOf('1', 4) === 4){
          colHouse = 'house AS Дом, ';

          orderHouse = 'Дом, ';
        }

        if(code.indexOf('1', 5) === 5){
          colLiter = 'liter AS Литер, ';
        }

        if(code.indexOf('1', 6) === 6){
          colStorey = 'storey AS "Этаж/Этажн", numstorey AS Этажность, ';
        }

        if(code.indexOf('1', 7) === 7){
          colProject = 'pr.title AS "Тип дома", ';
        }

        if(code.indexOf('1', 8) === 8){
          colPrice = 'price AS Цена, ';
        }

        if(code.indexOf('1', 9) === 9){
          colArea = 'area1 AS "Общ/Жил/Кух", area2, area3, ';
        }

        if(code.indexOf('1', 10) === 10){
          colToilet = 't.title AS Санузел, ';
        }

        if(code.indexOf('1', 11) === 11){
          colBalcony = 'balcony AS Балкон, ';
        }

        if(code.indexOf('1', 12) === 12){
          colOp = 'op AS Опека, ';
          //colOp = "CASE WHEN op = '1' THEN 'ДА' WHEN op = '0' THEN 'НЕТ' ELSE 'Нет данных' END AS Опека, ";
        }

        if(code.indexOf('1', 13) === 13){
          colNote = 'ap.note AS Примечание, ';
        }

        if(code.indexOf('1', 14) === 14){

          colAgent = "substring(ud.tel from 3 for 3) || ' ' || substring(ud.tel from 6 for 3) || '-' || substring(ud.tel from 9 for 2) || '-' || substring(ud.tel from 11 for 2) || ', ' || CASE WHEN character_length(n3.title) > 0 THEN n3.title ELSE 'Ин. агент' END || ', ' || ud.fio AS" + ' "Телефоны агенства, риэлтора", ';
        }

        if(code.indexOf('1', 15) === 15){
          colPhoto = '(SELECT DISTINCT node_id_photo FROM photo WHERE node_id_photo = n.id) AS ФотоКарта, ';
        }

        let col = colSection + colType + colCity + colStreet + colHouse + colLiter + colStorey + colProject + colPrice + colArea + colToilet + colBalcony + colOp + colNote + colAgent + colPhoto;

        let str = col.slice(0,-2);


        order = orderSection + orderCity + orderStreet + orderHouse;

        if(order.length > 0){
          order = " ORDER BY " + order;
          order = order.slice(0,-2);
        }

        pool.connect( function (err, client, done) {
          if (err) return fn(err);

          /*console.log('SELECT '+str+' FROM apartment ap LEFT JOIN node n ON(n.id = ap.node_id) LEFT JOIN node n1 ON(n1.id = ap.type) LEFT JOIN node n2 ON(n2.id = n.section) LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN toilet t ON(id_toilet = toilet) LEFT JOIN project pr ON(pr.id_project = ap.project) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) LEFT JOIN districts di ON(ci.districts_id = di.id_districts) LEFT JOIN users u ON(ap.agent = u.id_user) LEFT JOIN userdata ud ON(u.id_user = ud.user_id) LEFT JOIN node n3 ON(n3.id = ud.agency) WHERE ap.type '+type+' AND n.section '+sections+' AND ci.id_city = '+city+' AND ap.street = '+street+' AND ap.agent = '+agent+op+priceSQL+order);*/



          client.query('SELECT '+str+' FROM apartment ap LEFT JOIN node n ON(n.id = ap.node_id) LEFT JOIN node n1 ON(n1.id = ap.type) LEFT JOIN node n2 ON(n2.id = n.section) LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN toilet t ON(id_toilet = toilet) LEFT JOIN project pr ON(pr.id_project = ap.project) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) LEFT JOIN districts di ON(ci.districts_id = di.id_districts) LEFT JOIN users u ON(ap.agent = u.id_user) LEFT JOIN userdata ud ON(u.id_user = ud.user_id) LEFT JOIN node n3 ON(n3.id = ud.agency) WHERE ud.date_entry > ud.date_start AND ap.type '+type+' AND n.section '+sections+' AND ci.id_city = '+city+' AND ap.street = '+street+' AND ap.agent = '+agent+op+priceSQL+order, function (err, result) {
            done();
            if (err) {
              return fn(err, null)
            } else {
              return fn(null, result);
            }
          });
        });

      } else {
        return fn(null, null);
      }

    });
  });

};

Price.prototype.listLimit = function (fn) {

  let price = this;
  let email = price.email;
  let type = '';
  let sections = '';
  let city = '';
  let street = '';
  let agent = '';
  let op = '';
  let priceSQL = '';

  if(price.type){
    type = 'IN('+price.type+')';
  } else {
    type = 'IN(SELECT DISTINCT type FROM apartment)';
  }

  if(price.sections){
    sections = 'IN('+price.sections+')';
  } else {
    sections = "IN(SELECT DISTINCT section FROM node WHERE template = 'apartment' )";
  }

  if(price.city){
    city  = price.city;
  } else {
    city  = 'ANY(SELECT id_city FROM city)';
  }

  if(price.street){
    street  = price.street;
  } else {
    street  = 'ANY(SELECT id_street FROM street)';
  }

  if(price.agent){
    agent  = price.agent;
  } else {
    agent  = 'ANY(SELECT agent FROM apartment)';
  }

  if(price.op){

    if(price.op === '0'){
      op = ' AND ap.op = ' + price.op*1;
    }

    if(price.op === '1'){
      op = ' AND ap.op = ' + price.op*1;
    }

    if(price.op === 'null'){
      op = ' AND ap.op IS NULL';
    }

  } else {
    op  = '';
  }

  if(price.price){
    priceSQL = price.price;
  } else {
    priceSQL = ' AND price IN(SELECT price FROM apartment)';
  }

  let limit = price.limit;
  let offset = price.offset;


  pool.connect(function (err, client, done) {
    if (err) return fn(err);


    client.query('SELECT code_price FROM users, userdata WHERE id_user = user_id AND email = $1', [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        let code = result.rows[0].code_price;

        let colType = '';
        let colSection = '';
        let colCity = '';
        let colStreet = '';
        let colHouse = '';
        let colLiter = '';
        let colStorey = '';
        let colProject = '';
        let colPrice = '';
        let colArea = '';
        let colToilet = '';
        let colBalcony = '';
        let colOp = '';
        let colNote = '';
        let colAgent = '';
        let colPhoto = '';

        let order = '';
        let orderSection = '';
        let orderCity = '';
        let orderStreet = '';
        let orderHouse = '';


        if(code.indexOf('1', 0) === 0){
          colType = 'n1.title AS "Тип объяв.", ';
        }

        if(code.indexOf('1', 1) === 1){
          colSection = 'n2.title AS Категория, ';
          orderSection = 'n2.line DESC, ';
        }

        if(code.indexOf('1', 2) === 2){
          colCity = "CASE WHEN character_length(ci.title) > 0 THEN ci.title ELSE '' END || CASE WHEN character_length(re.title) > 0 THEN ', ' || re.title ELSE '' END || CASE WHEN character_length(di.districts) > 0 THEN ', ' || di.districts ELSE '' END AS Город, ";

          orderCity = 'select_default, Город, ';
        }

        if(code.indexOf('1', 3) === 3){
          colStreet = 'st.street AS Улица, ';

          orderStreet = 'Улица, ';
        }

        if(code.indexOf('1', 4) === 4){
          colHouse = 'house AS Дом, ';

          orderHouse = 'Дом, ';
        }

        if(code.indexOf('1', 5) === 5){
          colLiter = 'liter AS Литер, ';
        }

        if(code.indexOf('1', 6) === 6){
          colStorey = 'storey AS "Этаж", numstorey AS Этажность, ';
        }

        if(code.indexOf('1', 7) === 7){
          colProject = 'pr.title AS "Тип дома", ';
        }

        if(code.indexOf('1', 8) === 8){
          colPrice = 'price AS Цена, ';
        }

        if(code.indexOf('1', 9) === 9){
          colArea = 'area1 AS "Общ/Жил/Кух", area2, area3, ';
        }

        if(code.indexOf('1', 10) === 10){
          colToilet = 't.title AS Санузел, ';
        }

        if(code.indexOf('1', 11) === 11){
          colBalcony = 'balcony AS Балкон, ';
        }

        if(code.indexOf('1', 12) === 12){
          colOp = 'op AS Опека, ';
          //colOp = "CASE WHEN op = '1' THEN 'ДА' WHEN op = '0' THEN 'НЕТ' ELSE 'Нет данных' END AS Опека, ";
        }

        if(code.indexOf('1', 13) === 13){
          colNote = 'ap.note AS Примечание, ';
        }

        if(code.indexOf('1', 14) === 14){
          colAgent = "substring(ud.tel from 3 for 3) || ' ' || substring(ud.tel from 6 for 3) || '-' || substring(ud.tel from 9 for 2) || '-' || substring(ud.tel from 11 for 2) || ', ' || CASE WHEN character_length(n3.title) > 0 THEN n3.title ELSE 'Ин. агент' END || ', ' || ud.fio AS" + ' "Телефоны агенства, риэлтора", ';
        }

        if(code.indexOf('1', 15) === 15){
          colPhoto = '(SELECT DISTINCT node_id_photo FROM photo WHERE node_id_photo = n.id) AS ФотоКарта, ';
        }

        let col = colSection + colType + colCity + colStreet + colHouse + colLiter + colStorey + colProject + colPrice + colArea + colToilet + colBalcony + colOp + colNote + colAgent + colPhoto;

        let str = col.slice(0,-2);

        order = orderSection + orderCity + orderStreet + orderHouse;

        if(order.length > 0){
          order = " ORDER BY " + order;
          order = order.slice(0,-2);
        }

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('SELECT node_id, '+str+' FROM apartment ap LEFT JOIN node n ON(n.id = ap.node_id) LEFT JOIN node n1 ON(n1.id = ap.type) LEFT JOIN node n2 ON(n2.id = n.section) LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN toilet t ON(id_toilet = toilet) LEFT JOIN project pr ON(pr.id_project = ap.project) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) LEFT JOIN districts di ON(ci.districts_id = di.id_districts) LEFT JOIN users u ON(ap.agent = u.id_user) LEFT JOIN userdata ud ON(u.id_user = ud.user_id) LEFT JOIN node n3 ON(n3.id = ud.agency) WHERE ud.date_entry > ud.date_start AND ap.type '+type+' AND n.section '+sections+' AND ci.id_city = '+city+' AND ap.street = '+street+' AND ap.agent = '+agent+op+priceSQL+order+' LIMIT $1 OFFSET $2', [ limit, offset ], function (err, result) {
              done();
              if (err) {
                return fn(err, null)
              } else {
                return fn(null, result);
              }
            });
        });

      } else {
        return fn(null, null);
      }

    });

  });
};

Price.prototype.listExcel = function (fn) {

  let price = this;
  let email = price.email;
  let type = '';
  let sections = '';
  let city = '';
  let street = '';
  let agent = '';
  let op = '';
  let priceSQL = '';

  if(price.type){
    type = 'IN('+price.type+')';
  } else {
    type = 'IN(SELECT DISTINCT type FROM apartment)';
  }

  if(price.sections){
    sections = 'IN('+price.sections+')';
  } else {
    sections = "IN(SELECT DISTINCT section FROM node WHERE template = 'apartment' )";
  }

  if(price.city){
    city  = price.city;
  } else {
    city  = 'ANY(SELECT id_city FROM city)';
  }

  if(price.street){
    street  = price.street;
  } else {
    street  = 'ANY(SELECT id_street FROM street)';
  }

  if(price.agent){
    agent  = price.agent;
  } else {
    agent  = 'ANY(SELECT agent FROM apartment)';
  }

  if(price.op){

    if(price.op === '0'){
      op = ' AND ap.op = ' + price.op*1;
    }

    if(price.op === '1'){
      op = ' AND ap.op = ' + price.op*1;
    }

    if(price.op === 'null'){
      op = ' AND ap.op IS NULL';
    }

  } else {
    op  = '';
  }

  if(price.price){
    priceSQL = price.price;
  } else {
    priceSQL = ' AND price IN(SELECT price FROM apartment)';
  }


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT code_price FROM users, userdata WHERE id_user = user_id AND email = $1', [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        let code = result.rows[0].code_price;

        let colType = '';
        let colSection = '';
        let colCity = '';
        let colStreet = '';
        let colHouse = '';
        let colLiter = '';
        let colStorey = '';
        let colProject = '';
        let colPrice = '';
        let colArea = '';
        let colToilet = '';
        let colBalcony = '';
        let colOp = '';
        let colNote = '';
        let colAgent = '';
        let colPhoto = '';


        let order = '';
        let orderSection = '';
        let orderCity = '';
        let orderStreet = '';
        let orderHouse = '';


        if(code.indexOf('1', 0) === 0){
          colType = 'n1.title AS "Тип объяв.", ';
        }

        if(code.indexOf('1', 1) === 1){
          colSection = 'n2.title AS "Катег.", ';
          orderSection = 'n2.line DESC, ';
        }

        if(code.indexOf('1', 2) === 2){
          colCity = "CASE WHEN character_length(ci.title) > 0 THEN ci.title ELSE '' END || CASE WHEN character_length(re.title) > 0 THEN ', ' || re.title ELSE '' END || CASE WHEN character_length(di.districts) > 0 THEN ', ' || di.districts ELSE '' END AS Город, ";

          orderCity = 'select_default, Город, ';
        }

        if(code.indexOf('1', 3) === 3){
          colStreet = 'st.street AS Улица, ';

          orderStreet = 'Улица, ';
        }

        if(code.indexOf('1', 4) === 4){
          colHouse = 'house AS Дом, ';

          orderHouse = 'Дом, ';
        }

        if(code.indexOf('1', 5) === 5){
          colLiter = 'liter AS "Лит.", ';
        }

        if(code.indexOf('1', 6) === 6){
          colStorey = 'storey AS "Этаж", numstorey AS Этажность, ';
        }

        if(code.indexOf('1', 7) === 7){
          colProject = 'pr.title AS "пр-т", ';
        }

        if(code.indexOf('1', 8) === 8){
          colPrice = 'price AS Цена, ';
        }

        if(code.indexOf('1', 9) === 9){
          colArea = 'area1 AS "Площадь", area2, area3, ';
        }

        if(code.indexOf('1', 10) === 10){
          colToilet = 't.title AS "с/у", ';
        }

        if(code.indexOf('1', 11) === 11){
          colBalcony = 'balcony AS Бал, ';
        }

        if(code.indexOf('1', 12) === 12){
          colOp = 'op AS ОП, ';
          //colOp = "CASE WHEN op = '1' THEN 'ДА' WHEN op = '0' THEN 'НЕТ' ELSE 'Нет данных' END AS Опека, ";
        }

        if(code.indexOf('1', 13) === 13){
          colNote = 'ap.note AS Примечание, ';
        }

        if(code.indexOf('1', 14) === 14){
          colAgent = "substring(ud.tel from 3 for 3) || ' ' || substring(ud.tel from 6 for 3) || '-' || substring(ud.tel from 9 for 2) || '-' || substring(ud.tel from 11 for 2) || ', ' || CASE WHEN character_length(n3.title) > 0 THEN n3.title ELSE 'Ин. агент' END || ', ' || ud.fio AS" + ' "Телефоны агенства, риэлтора", ';
        }

        if(code.indexOf('1', 15) === 15){
          colPhoto = '(SELECT DISTINCT node_id_photo FROM photo WHERE node_id_photo = n.id) AS Фото, ';
        }

        let col = colSection + colType + colCity + colStreet + colHouse + colLiter + colStorey + colProject + colPrice + colArea + colToilet + colBalcony + colOp + colNote + colAgent + colPhoto;

        let str = col.slice(0,-2);


        order = orderSection + orderCity + orderStreet + orderHouse;

        if(order.length > 0){
          order = " ORDER BY " + order;
          order = order.slice(0,-2);
        }

        pool.connect( function (err, client, done) {
          if (err) return fn(err);

/*          console.log('SELECT n2.id AS id,'+str+' FROM apartment ap LEFT JOIN node n ON(n.id = ap.node_id) LEFT JOIN node n1 ON(n1.id = ap.type) LEFT JOIN node n2 ON(n2.id = n.section) LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN toilet t ON(id_toilet = toilet) LEFT JOIN project pr ON(pr.id_project = ap.project) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) LEFT JOIN districts di ON(ci.districts_id = di.id_districts) LEFT JOIN users u ON(ap.agent = u.id_user) LEFT JOIN userdata ud ON(u.id_user = ud.user_id) LEFT JOIN node n3 ON(n3.id = ud.agency) WHERE ap.type '+type+' AND n.section '+sections+' AND ci.id_city = '+city+' AND ap.street = '+street+' AND ap.agent = '+agent+op+priceSQL+order);*/

          client.query('SELECT n2.id AS id, '+str+' FROM apartment ap LEFT JOIN node n ON(n.id = ap.node_id) LEFT JOIN node n1 ON(n1.id = ap.type) LEFT JOIN node n2 ON(n2.id = n.section) LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN toilet t ON(id_toilet = toilet) LEFT JOIN project pr ON(pr.id_project = ap.project) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) LEFT JOIN districts di ON(ci.districts_id = di.id_districts) LEFT JOIN users u ON(ap.agent = u.id_user) LEFT JOIN userdata ud ON(u.id_user = ud.user_id) LEFT JOIN node n3 ON(n3.id = ud.agency) WHERE ud.date_entry > ud.date_start AND ap.type '+type+' AND n.section '+sections+' AND ci.id_city = '+city+' AND ap.street = '+street+' AND ap.agent = '+agent+op+priceSQL+order, function (err, result) {
            done();
            if (err) {
              return fn(err, null)
            } else {
              return fn(null, result);
            }
          });
        });

      } else {
        return fn(null, null);
      }

    });
  });

};

Price.getSectionType = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT title, id FROM node WHERE id = ANY(SELECT DISTINCT type FROM apartment) ORDER BY line DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.getSectionSorting = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id, title FROM node WHERE id = ANY(SELECT section FROM apartment LEFT JOIN node ON(id = node_id) GROUP BY section) ORDER BY line DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.getCitySorting = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title, id_city FROM city WHERE id_city = ANY(SELECT city_id FROM apartment c LEFT JOIN street s ON (c.street = s.id_street) GROUP BY city_id) ORDER BY select_default, title", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.getStreetSorting = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_street, street || ' | ' || title AS street FROM street LEFT JOIN city ON(city_id = id_city) WHERE id_street = ANY(SELECT st.id_street FROM apartment c LEFT JOIN street st ON (c.street = st.id_street) LEFT JOIN city ci ON (ci.id_city = st.city_id) GROUP BY st.id_street) ORDER BY select_default, street", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.getAgentSorting = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_user, fio || ' | ' || CASE WHEN agency > 0 THEN (SELECT title FROM node WHERE id = agency) WHEN agency IS NULL THEN 'Ин. риелтор' ELSE '' END AS fio FROM users LEFT JOIN userdata ON(id_user = user_id) WHERE id_user IN(SELECT DISTINCT agent FROM apartment) ORDER BY agency, fio", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.getOpSorting = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT op FROM apartment", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.getMinPrice = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT min(price) FROM node, apartment WHERE id = node_id AND price IS NOT NULL AND price > 0', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.getMaxPrice = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT max(price) FROM node, apartment WHERE id = node_id', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.updatePriceCode = function (code, email, fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_user FROM users WHERE email = $1', [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        let id_user = result.rows[0].id_user;

        pool.connect( function (err, client, done) {
          if (err) return fn(err);

          client.query('UPDATE userdata SET code_price = $1 WHERE user_id = $2', [code, id_user], function (err, result) {
            done();
            if (err) return fn(err, null);

            return fn(null, result);

          });
        });

      } else {
        return fn(null, null);
      }

    });

  });
};

Price.colPrice = function (email, fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT code_price FROM users, userdata WHERE id_user = user_id AND email = $1', [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.getSectionName = function (id, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT title FROM node WHERE id = $1', [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Price.editResults = function (result) {

  let a_1='';
  let a_2='';
  let a_3='';
  let a_4='';
  let a_5='';

  let max=80;

  for(let k = 0; k < result.rows.length; k++){

    if(result.rows[k]['Примечание'] && result.rows[k]['Примечание'].length > 80){
      result.rows[k]['Примечание'] = result.rows[k]['Примечание'].substring(0, max ) + '...';
    }


    if(result.rows[k]['Цена']){
      result.rows[k]['Цена'] = Price.splitMoney(result.rows[k]['Цена']);
      //result.rows[k]['Цена'] = result.rows[k]['Цена'];
    }

    if(result.rows[k]['Катег.']){
      if(result.rows[k]['Катег.'] === '1-комнатные') result.rows[k]['Катег.'] = '1-но';
      if(result.rows[k]['Катег.'] === '2-комнатные') result.rows[k]['Катег.'] = '2-x';
      if(result.rows[k]['Катег.'] === '3-комнатные') result.rows[k]['Катег.'] = '3-x';
      if(result.rows[k]['Катег.'] === '4-комнатные') result.rows[k]['Катег.'] = '4-x';
      if(result.rows[k]['Катег.'] === '5-комнат и более') result.rows[k]['Катег.'] = '5-6';
      if(result.rows[k]['Катег.'] === 'Изолированные малосемейки') result.rows[k]['Катег.'] = 'ИЗ-М';
    }

    if(result.rows[k]['пр-т']){
      if(result.rows[k]['пр-т'] === 'Панельный') result.rows[k]['пр-т'] = 'Пан.';
      if(result.rows[k]['пр-т'] === 'Блочный') result.rows[k]['пр-т'] = 'Бл.';
      if(result.rows[k]['пр-т'] === 'Кирпичный') result.rows[k]['пр-т'] = 'Кир.';
      if(result.rows[k]['пр-т'] === 'Деревянный') result.rows[k]['пр-т'] = 'Дер.';
      if(result.rows[k]['пр-т'] === 'Монолитный') result.rows[k]['пр-т'] = 'Мон.';
    }

    if(result.rows[k]['с/у']){
      if(result.rows[k]['с/у'] === 'Общий') result.rows[k]['с/у'] = 'Общ.';
      if(result.rows[k]['с/у'] === '1 санузел на 2х') result.rows[k]['с/у'] = '1X2x';
      if(result.rows[k]['с/у'] === '1 санузел на 3х') result.rows[k]['с/у'] = '1X3x';
      if(result.rows[k]['с/у'] === '1 санузел на 4х') result.rows[k]['с/у'] = '1X3x';
      if(result.rows[k]['с/у'] === 'Совмещенный') result.rows[k]['с/у'] = 'Сов.';
      if(result.rows[k]['с/у'] === 'Раздельный') result.rows[k]['с/у'] = 'Раз.';
      if(result.rows[k]['с/у'] === '2 санузла') result.rows[k]['с/у'] = '2с/у';
      if(result.rows[k]['с/у'] === '3 санузла') result.rows[k]['с/у'] = '3с/у';
    }


    if(result.rows[k]['Этаж'] > 0){
      a_4 = String(result.rows[k]['Этаж']);
    } else {
      a_4 = '-';
    }

    if(result.rows[k].Этажность > 0){
      a_5 = String(result.rows[k].Этажность);
    } else {
      a_5 = '-';
    }


    if(result.rows[k]['Площадь'] > 0){
      a_1 = String(result.rows[k]['Площадь']);
    } else {
      a_1 = '-';
    }

    if(result.rows[k].area2 > 0){
      a_2 = String(result.rows[k].area2);
    } else {
      a_2 = '-';
    }

    if(result.rows[k].area3 > 0){
      a_3 = String(result.rows[k].area3);
    } else {
      a_3 = '-';
    }

    for(let f = 0; f < result.fields.length; f++){

      if(result.fields[f].name === 'Этаж'){
        result.rows[k]['Этаж'] = a_4 + "/" + a_5;
      }

      if(result.fields[f].name === 'Площадь'){
        result.rows[k]['Площадь'] = a_1 + "/" + a_2 + "/" + a_3;
      }

      if(result.fields[f].name === 'Фото'){

        if (result.rows[k]['Фото'] > 0) {
          result.rows[k]['Фото'] = 'Да';
        } else {
          result.rows[k]['Фото'] = 'Нет';
        }
      }

    }


    if(result.rows[k].ОП === 0){
      result.rows[k].ОП = 'Нет';
    }

    if(result.rows[k].ОП === 1){
      result.rows[k].ОП = 'Да';
    }


    delete result.rows[k].Этажность;
    delete result.rows[k].area2;
    delete result.rows[k].area3;

    a_4='';
    a_5='';
    a_1='';
    a_2='';
    a_3='';
  } // end for(let k = 0; k < result.rows.length; k++)

  for(let f = 0; f < result.fields.length; f++){

    if(result.fields[f].name === 'Этажность'){
      result.fields.splice(f, 1);
    }

    if(result.fields[f].name === 'area2'){
      result.fields.splice(f, 1);
    }
    if(result.fields[f].name === 'area3'){
      result.fields.splice(f, 1);
    }
  }



  for(let r = 0; r < result.rows.length; r++){

    for(let key in result.rows[r]){

      if(key === 'Бал'){
        if(result.rows[r][key] === 0){
          result.rows[r][key]='Нет';
        }
        if(result.rows[r][key] === 1){
          result.rows[r][key]='Да';
        }
      }

      if(key === 'Цена' && result.rows[r][key] === 0){
        result.rows[r][key]='Договор.';
      }

    }
  }

  return result;
};

Price.splitMoney = function (money) {
  let arr = String(money).split("");
  let len = arr.length;

  let sum = '';

  if(len === 4){
    for(let i = 0; i< arr.length; i++){
      if(i === 1){
        sum += '.' + arr[i];
      } else {
        sum += arr[i];
      }
    }
  }
  if(len === 5){
    for(let i = 0; i< arr.length; i++){
      if(i === 2){
        sum += '.' + arr[i];
      } else {
        sum += arr[i];
      }
    }
  }
  if(len === 6){
    for(let i = 0; i< arr.length; i++){
      if(i === 3){
        sum += '.' + arr[i];
      } else {
        sum += arr[i];
      }
    }
  }
  if(len === 7){
    for(let i = 0; i< arr.length; i++){
      if(i === 1){
        sum += '.' + arr[i];
      } else if(i === 4){
        sum += '.' + arr[i];
      } else {
        sum += arr[i];
      }
    }
  }
  if(len === 8){
    for(let i = 0; i< arr.length; i++){
      if(i === 2){
        sum += '.' + arr[i];
      } else if(i === 5){
        sum += '.' + arr[i];
      } else {
        sum += arr[i];
      }
    }
  }

  return sum;
};

Price.unique = function(arr) {
  let result = [];

  nextInput:
    for (let i = 0; i < arr.length; i++) {
      let str = arr[i]; // для каждого элемента
      for (let j = 0; j < result.length; j++) { // ищем, был ли он уже?
        if (result[j] == str) continue nextInput; // если да, то следующий
      }
      result.push(str);
    }

  return result;
};


