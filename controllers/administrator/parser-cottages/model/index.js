let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let nav = require('../../../../lib/navigation');

module.exports = ParserCottage;

function ParserCottage(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

ParserCottage.list = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id as "Редактирование", note AS "Дома и коттеджи", price AS цена, tel AS "телефоны риэлтора", section' +
      ' AS "раздел" FROM parser_cottages ORDER BY id', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

ParserCottage.listLimit = function (limit, offset, fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id as "Редактирование", note AS "Дома и коттеджи", price AS цена, tel AS "телефоны риэлтора", section' +
      ' AS "раздел" FROM parser_cottages ORDER BY id LIMIT $1 OFFSET $2', [limit, offset], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

ParserCottage.tableParser = function (row, urlParsed, limit, linkLimit, urlPage, result, req) {

  let strPath = nav.linkQuery('edit', 'drop', 'party', req);

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    nav.navpage(str, urlParsed, row.rowCount, limit, linkLimit, urlPage, 'page', function (err, result) {
      str += result;
    });
    str += '<div class="clearfix"></div>' + '\n';
    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {


          str += '<strong>' + row[cols] + '.</strong>';
          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/parser-cottages?edit=' + row[cols] + strPath + '">править</a>'


        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

ParserCottage.getOneRecord = function (id, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM parser_cottages WHERE id = $1', [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

ParserCottage.getSection = function (alias, fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE alias = $1', [ alias ], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

ParserCottage.selectSection = function (temp, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT (SELECT title FROM node WHERE id = section_id) AS section, (SELECT id FROM node WHERE id = section_id) AS section_id FROM sectionandtemplate WHERE template_name = $1', [ temp ], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

ParserCottage.prototype.getUser = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_user, tel, fio AS fio1 FROM users, userdata WHERE id_user = user_id AND role_id IN(6, 5) ORDER by fio", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);


    });
  });
};

ParserCottage.getMaterial = function (fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM material ORDER BY priority DESC", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);


    });
  });
};

ParserCottage.setCity = function (id_city, email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE users SET default_city = $1 WHERE email = $2", [id_city, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

ParserCottage.oneCity = function (id_city, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM city WHERE id_city = $1", [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

ParserCottage.getAllCity = function (fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_city, title, (SELECT title FROM region WHERE id_region = region_id) AS region FROM city ORDER BY title", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

ParserCottage.prototype.getStreet = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_street, districts, ci.title AS city, street FROM street s LEFT JOIN city ci ON (s.city_id = ci.id_city) LEFT JOIN districts d ON (ci.districts_id = d.id_districts) LEFT JOIN region r ON (ci.region_id = r.id_region) LEFT JOIN country c ON (r.country_id = c.id) WHERE id_city = $1 ORDER BY s.street', [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

ParserCottage.getMainCity = function(mainCity, permission, id_agency, id_moderator_agency, id_user, fn){

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title = $1", [mainCity], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if(permission.indexOf('0', 4) === 4){

    if (!id_agency) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title = $1 AND a.agent = $2", [mainCity, id_user], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency) {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) LEFT JOIN userdata u ON (a.agent = u.user_id) WHERE c.title = $1 AND u.agency = $2", [mainCity, id_agency], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });

      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title = $1 AND a.agent = $2", [mainCity, id_user], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }
    }
  }
};

ParserCottage.listCity = function (mainCity, permission, id_agency, id_moderator_agency, id_user, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title != $1 ORDER BY title", [mainCity], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if(permission.indexOf('0', 4) === 4){

    if (!id_agency) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title != $1 AND a.agent = $2", [mainCity, id_user], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency) {

        pool.connect(function (err, client, done) {

          if (err) return fn(err);

          client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region,  count(*) OVER (PARTITION BY c.title) AS sum FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) LEFT JOIN userdata u ON (a.agent = u.user_id) WHERE c.title != $1 AND u.agency = $2 ORDER BY title", [mainCity, id_agency], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });


      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title != $1 AND a.agent = $2", [mainCity, id_user], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }
    }
  }
};

ParserCottage.getTitleSection = function (section, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM node WHERE id = $1", [section], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

ParserCottage.getTitleStreett = function (street, fn) {

  if(street === ''){
    street = null;
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT street FROM street WHERE id_street = $1", [street], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

ParserCottage.prototype.save = function (fn) {
  let apartment = this;

  let id_parser = apartment.id_parser;


  let title = apartment.title;
  let date_create = apartment.date_create;
  let author = apartment.author;
  let template = apartment.template;
  let section = apartment.value.section * 1;
  let type = apartment.value.type * 1;
  let agent = apartment.value.agent * 1;
  let street = apartment.value.street * 1;
  let storey = apartment.value.storey * 1;
  let area_house = apartment.value.area_house * 1;
  let area_land = apartment.value.area_land * 1;
  let material  = apartment.value.material * 1;
  let price = apartment.value.price*1;
  let note  = apartment.value.note;
  let status = apartment.value.status * 1;
  let main = apartment.value.main * 1;


  if(!status){
    status = 0;
  }

  if(!main){
    main = 0;
  }

  if(note  === ''){
    note = null;
  }

  if(material  === ''){
    material = null;
  }

  if(area_land  === 0){
    area_land = null;
  }

  if(area_house  === 0){
    area_house = null;
  }

  if(storey  === 0){
    storey = null;
  }

  if(street  === ''){
    street = null;
  }

  if(price  === ''){
    price = null;
  }

/*  console.log('title', typeof(title), title);
  console.log('date_create', typeof(date_create), date_create);
  console.log('author', typeof(author), author);
  console.log('status', typeof(status), status);
  console.log('main', typeof(main), main);
  console.log('template', typeof(template), template);
  console.log('section', typeof(section), section);
  console.log('type', typeof(type), type);
  console.log('agent', typeof(agent), agent);
  console.log('street', typeof(street), street);
  console.log('storey', typeof(storey), storey);
  console.log('price', typeof(price), price);
  console.log('area_house', typeof(area_house), area_house);
  console.log('area_land', typeof(area_land), area_land);
  console.log('material', typeof(material), material);
  console.log('note', typeof(note), note);*/


  (async () => {

    const client = await pool.connect();

    try {

      await client.query('BEGIN');

      let result = await client.query('INSERT INTO node (title, date_create, author, status, main, template, section) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [ title, date_create, author, status, main, template, section ]);

      let id = result.rows[0].id;

      let result1 = await client.query('INSERT INTO cottages (type, agent, street, storey, price, area_house, area_land, material, note, node_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [ type, agent, street, storey, price, area_house, area_land, material, note, id ]);

      let result2 = await client.query('UPDATE node SET alias = $1 WHERE id = $2', [ id, id ]);

      let result3 = await client.query('DELETE FROM parser_cottages WHERE id = $1', [ id_parser ]);

      await client.query('COMMIT');
      client.release();

      return fn(null, result3);

    } catch (err) {
      await client.query('ROLLBACK');
      return fn(err, null);
    }
  })()
};