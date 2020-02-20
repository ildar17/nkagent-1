let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let nav = require('../../../../lib/navigation');
let ms = require('../../../../lib/msDate');

module.exports = Complete;

function Complete(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Complete.setDistricts = function (id_districts, email, fn) {

  pool.connect(function (err, client, done) {

    if (err) return fn(err);

    client.query("UPDATE users SET default_districts = $1 WHERE email = $2", [id_districts, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Complete.setCity = function (id_city, email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE users SET default_city = $1 WHERE email = $2", [id_city, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Complete.getDistricts = function (fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_districts, districts, (SELECT title FROM region WHERE id_region = region_id) FROM districts ORDER BY districts", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Complete.oneCity = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM city WHERE id_city = $1", [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Complete.getCityNoDistricts = function (regionID, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_city, title FROM city WHERE districts_id IS NULL AND region_id = $1 ORDER BY title", [regionID], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });

};

Complete.getCity = function (districtsID, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_city, title, (SELECT districts FROM districts WHERE id_districts = districts_id ) AS districts FROM city WHERE districts_id = $1 ORDER BY title", [districtsID], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });

};

Complete.prototype.getStreet = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_street, districts, ci.title AS city, street FROM street s LEFT JOIN city ci ON (s.city_id = ci.id_city) LEFT JOIN districts d ON (ci.districts_id = d.id_districts) LEFT JOIN region r ON (ci.region_id = r.id_region) LEFT JOIN country c ON (r.country_id = c.id) WHERE id_city = $1 ORDER BY s.street', [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Complete.getAgents = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_user, email, fio, CASE WHEN agency IS NOT NULL THEN (SELECT title FROM node WHERE id = agency) WHEN agency IS NULL THEN 'Ин-риелтор' END AS title FROM users LEFT JOIN userdata ON(user_id = id_user) LEFT JOIN role ON (id_role = role_id) WHERE payment_price IN(1,2) ORDER BY title, fio", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Complete.getOneAgent = function (agent, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    let date_entry_moderator = Date.now();

    client.query("UPDATE userdata SET date_entry_moderator = $1 WHERE user_id = $2", [date_entry_moderator, agent], function (err, result) {
      done();
      if (err) return fn(err, null);

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id_user, fio, CASE WHEN agency IS NOT NULL THEN (SELECT title FROM node WHERE id = agency) WHEN agency IS NULL THEN 'Ин. риелтор' END AS title FROM users LEFT JOIN userdata ON(id_user = user_id) WHERE id_user = $1", [agent], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);

        });

      });

    });

  });

};

Complete.list = function (agent, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, date_create AS ДатаВнесения, date_edit AS ДатаПравки, (SELECT (SELECT title FROM city WHERE id_city = s.city_id) FROM street s WHERE s.id_street = c.street) AS Город, (SELECT s.street FROM street s WHERE s.id_street = c.street) AS Улица, house AS Дом, price AS Цена, note AS Примечание, main AS Главная, status AS Публик FROM complete c WHERE template IN('apartment','cottages','commercial') AND agent = $1 ORDER by template, section, title, Улица", [agent], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

Complete.deleteObject = function (id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM node WHERE id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });

};

Complete.getObject = function (id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT template FROM node WHERE id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      if (result.rowCount > 0) {

        let template = result.rows[0].template;

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT * FROM node, "+template+" WHERE id = node_id AND id = $1", [id], function (err, result) {
            done();
            if (err) return fn(err, null);

            if (result.rowCount > 0) {

              fn(null, result);

            } else {
              fn(null, null);
            }
          });
        });

      } else {
        fn(null, null);
      }
    });
  });
};

Complete.getIdLabel = function (id_permit, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT node_id AS id, (SELECT title FROM node WHERE id = node_id) FROM labelandtemplate, node WHERE id = node_id AND permit_id = $1 ORDER BY line DESC", [id_permit], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Complete.prototype.selectSection = function (fn) {

  let complete = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT section_id, (SELECT title FROM node WHERE id = section_id) as section FROM sectionandtemplate WHERE template_name = $1 ORDER BY section',
      [complete.temp], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Complete.getTitleSection = function (section, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM node WHERE id = $1", [section], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Complete.prototype.editApartment = function (fn) {

  let complete = this;

  let id = complete.id;
  let title = complete.title;
  let date_edit = complete.date_edit;
  let author_edit = complete.author_edit;
  let status = complete.value.status * 1;
  let main = complete.value.main * 1;
  let section = complete.value.section * 1;
  let type = complete.value.type * 1;
  let agent = complete.value.agent * 1;
  let street = complete.value.street * 1;
  let house = complete.value.house;
  let liter = complete.value.liter;
  let storey = complete.value.storey * 1;
  let numstorey = complete.value.numstorey * 1;
  let price = complete.value.price * 1;
  let area1 = complete.value.area1 * 1;
  let area2 = complete.value.area2 * 1;
  let area3 = complete.value.area3 * 1;
  let op = complete.value.op * 1;
  let project = complete.value.project * 1;
  let toilet = complete.value.toilet * 1;
  let balcony = complete.value.balcony * 1;
  let note = complete.value.note;

  if (!status) {
    status = 0;
  }

  if (!main) {
    main = 0;
  }

  if (liter === '') {
    liter = null;
  }

  if (area2 === 0) {
    area2 = null;
  }

  if (area3 === 0) {
    area3 = null;
  }

  if (project === 0) {
    project = null;
  }

  if (toilet === 0) {
    toilet = null;
  }

  if (balcony === '') {
    balcony = null;
  }

  if (note === '') {
    note = null;
  }

  co(function*() {
    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      yield client.query('UPDATE node SET title = $1, date_edit = $2, author_edit = $3, status = $4, main = $5, section = $6 WHERE id = $7', [title, date_edit, author_edit, status, main, section, id]);

      let result = yield client.query('UPDATE apartment SET type = $1, agent = $2, street = $3, house = $4, liter = $5, storey = $6, numstorey = $7, price = $8, area1 = $9, area2 = $10, area3 = $11, op = $12, project = $13, toilet = $14, balcony = $15, note = $16 WHERE node_id = $17', [type, agent, street, house, liter, storey, numstorey, price, area1, area2, area3, op, project, toilet, balcony, note, id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (e) {
      client.release(true);
      return fn(e, null);
    }

  })
};

Complete.prototype.editCottages = function (fn) {

  let complete = this;


  let id = complete.id;
  let title = complete.title;
  let date_edit = complete.date_edit;
  let author_edit = complete.author;
  let status = complete.value.status * 1;
  let main = complete.value.main * 1;
  let section = complete.value.section * 1;
  let type = complete.value.type * 1;
  let agent = complete.value.agent * 1;
  let storey = complete.value.storey * 1;
  let price = complete.value.price * 1;
  let area_house = complete.value.area_house * 1;
  let area_land = complete.value.area_land * 1;
  let material = complete.value.material * 1;
  let street = complete.value.street * 1;
  let note = complete.value.note;
  let categoryLand = complete.value.categoryLand * 1;
  let kdn = complete.value.kdn;

  if (!status || complete.permission.indexOf('0', 4) === 4) {
    status = 0;
  }

  if(area_house === 0){
    area_house = null;
  }

  if(area_land === 0){
    area_land = null;
  }

  if (!main || complete.permission.indexOf('0', 4) === 4) {
    main = 0;
  }

  if (street === 0) {
    street = null;
  }

  if (storey === 0) {
    storey = null;
  }

  if (area_house === 0) {
    area_house = null;
  }

  if( area_land === 0) {
    area_land = null;
  }

  if (material === 0) {
    material = null;
  }

  if (categoryLand === 0) {
    categoryLand  = null;
  }

  if(!kdn){
    kdn = null;
  }

  if (note === '') {
    note = null;
  }

  co(function*() {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      yield client.query('UPDATE node SET title = $1, date_edit = $2, author_edit = $3, status = $4, main = $5, section = $6 WHERE id = $7', [title, date_edit, author_edit, status, main, section, id]);

      let result = yield client.query('UPDATE cottages SET type = $1, agent = $2, street = $3, storey = $4, price = $5, area_house = $6, area_land = $7, material = $8, category_land = $9, kdn = $10, note = $11 WHERE node_id = $12', [type, agent, street, storey, price, area_house, area_land, material, categoryLand, kdn, note, id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (e) {
      client.release(true);
      return fn(e, null);
    }

  })
};

Complete.prototype.editCommercial = function (fn) {

  let complete = this;


  let id = complete.id;
  let title = complete.title;
  let date_edit = complete.date_edit;
  let author_edit = complete.author;
  let status = complete.value.status * 1;
  let main = complete.value.main * 1;
  let section = complete.value.section * 1;
  let type = complete.value.type * 1;
  let agent = complete.value.agent * 1;
  let price = complete.value.price * 1;
  let area_house = complete.value.area_house * 1;
  let street = complete.value.street * 1;
  let note = complete.value.note;

  if (!status || complete.permission.indexOf('0', 4) === 4) {
    status = 0;
  }

  if (!main || complete.permission.indexOf('0', 4) === 4) {
    main = 0;
  }

  if (street === 0) {
    street = null;
  }

  if (area_house === 0) {
    area_house = null;
  }

  if (note === '') {
    note = null;
  }

  co(function*() {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      yield client.query('UPDATE node SET title = $1, date_edit = $2, author_edit = $3, status = $4, main = $5, section = $6 WHERE id = $7', [title, date_edit, author_edit, status, main, section, id]);

      let result = yield client.query('UPDATE commercial SET type = $1, agent = $2, street = $3, price = $4, area_house = $5, note = $6 WHERE node_id = $7', [type, agent, street, price, area_house, note, id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (e) {
      client.release(true);
      return fn(e, null);
    }

  })
};

Complete.prototype.saveApartment = function (fn) {
  let complete = this;

  let title = complete.title;
  let date_create = complete.date_create;
  let author = complete.author;
  let status = complete.value.status * 1;
  let main = complete.value.main * 1;
  let template = complete.template;
  let section = complete.value.section * 1;
  let type = complete.value.type * 1;
  let agent = complete.value.agent * 1;
  let street = complete.value.street * 1;
  let house = complete.value.house;
  let liter = complete.value.liter;
  let storey = complete.value.storey * 1;
  let numstorey = complete.value.numstorey * 1;
  let price = complete.value.price * 1;
  let area1 = complete.value.area1 * 1;
  let area2 = complete.value.area2 * 1;
  let area3 = complete.value.area3 * 1;
  let op = complete.value.op * 1;
  let project = complete.value.project * 1;
  let toilet = complete.value.toilet * 1;
  let balcony = complete.value.balcony * 1;
  let note = complete.value.note;


  if (!status) {
    status = 0;
  }

  if (!main) {
    main = 0;
  }

  if (liter === '') {
    liter = null;
  }

  if (area2 === 0) {
    area2 = null;
  }

  if (area3 === 0) {
    area3 = null;
  }

  if (project === 0) {
    project = null;
  }

  if (toilet === 0) {
    toilet = null;
  }

  if (balcony === '') {
    balcony = null;
  }

  if (note === '') {
    note = null;
  }


  co(function*() {
    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('INSERT INTO node (title, date_create, author, status, main, template, section) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [title, date_create, author, status, main, template, section]);

      let id = result.rows[0].id;

      yield client.query('INSERT INTO apartment (type, agent, street, house, liter, storey, numstorey, price, area1, area2, area3, op, project, toilet, balcony, note, node_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)', [type, agent, street, house, liter, storey, numstorey, price, area1, area2, area3, op, project, toilet, balcony, note, id]);

      let result1 = yield client.query('UPDATE node SET alias = $1 WHERE id = $2', [id, id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result1, id);

    } catch (e) {

      client.release(true);
      return fn(e, null);
    }

  })
};

Complete.prototype.saveCottages = function (fn) {
  let complete = this;

  let title = complete.title;
  let date_create = complete.date_create;
  let author = complete.author;
  let status = complete.value.status * 1;
  let main = complete.value.main * 1;
  let template = complete.template;
  let section = complete.value.section * 1;
  let type = complete.value.type * 1;
  let agent = complete.value.agent * 1;
  let storey = complete.value.storey * 1;
  let price = complete.value.price * 1;
  let area_house = complete.value.area_house * 1;
  let area_land = complete.value.area_land * 1;
  let material = complete.value.material * 1;
  let street = complete.value.street * 1;
  let note = complete.value.note;
  let categoryLand = complete.value.categoryLand * 1;
  let kdn = complete.value.kdn;


  if (!status || complete.permission.indexOf('0', 4) === 4) {
    status = 0;
  }

  if (!main || complete.permission.indexOf('0', 4) === 4) {
    main = 0;
  }

  if (street === 0) {
    street = null;
  }

  if (storey === 0) {
    storey = null;
  }

  if (area_house === 0) {
    area_house = null;
  }

  if( area_land === 0) {
    area_land = null;
  }

  if (material === 0) {
    material = null;
  }

  if (categoryLand === 0) {
    categoryLand  = null;
  }

  if(!kdn){
    kdn = null;
  }

  if (note === '') {
    note = null;
  }

  /*  console.log('type', type, typeof type);
   console.log('title', title, typeof title);
   console.log('date_create', date_create, typeof date_create);
   console.log('author', author, typeof author);
   console.log('status', status, typeof status);
   console.log('main', main, typeof main);
   console.log('template', template, typeof template);
   console.log('section', section, typeof section);
   console.log('agent', agent, typeof agent);
   console.log('storey', storey, typeof storey);
   console.log('price', price, typeof price);
   console.log('area_house', area_house, typeof area_house);
   console.log('area_land', area_land, typeof area_land);
   console.log('material', material, typeof material);
   console.log('street', street, typeof street);
   console.log('note', note, typeof note);*/


  co(function*() {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('INSERT INTO node (title, date_create, author, status, main, template, section) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [title, date_create, author, status, main, template, section]);

      let id = result.rows[0].id;

      yield client.query('INSERT INTO cottages (agent, type, street, storey, price, area_house, area_land, material, category_land, kdn, note, node_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)', [agent, type, street, storey, price, area_house, area_land, material, categoryLand, kdn, note, id]);

      let result1 = yield client.query('UPDATE node SET alias = $1 WHERE id = $2', [id, id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result1, id);

    } catch (e) {

      client.release(true);
      return fn(e, null);
    }

  })
};

Complete.prototype.saveCommercial = function (fn) {
  let complete = this;

  let title = complete.title;
  let date_create = complete.date_create;
  let author = complete.author;
  let status = complete.value.status * 1;
  let main = complete.value.main * 1;
  let template = complete.template;
  let section = complete.value.section * 1;
  let type = complete.value.type * 1;
  let agent = complete.value.agent * 1;
  let price = complete.value.price * 1;
  let area_house = complete.value.area_house * 1;
  let street = complete.value.street * 1;
  let note = complete.value.note;


  if (!status || complete.permission.indexOf('0', 4) === 4) {
    status = 0;
  }

  if (!main || complete.permission.indexOf('0', 4) === 4) {
    main = 0;
  }

  if (street === 0) {
    street = null;
  }

  if (area_house === 0) {
    area_house = null;
  }

  if (note === '') {
    note = null;
  }

  /*  console.log('type', type, typeof type);
   console.log('title', title, typeof title);
   console.log('date_create', date_create, typeof date_create);
   console.log('author', author, typeof author);
   console.log('status', status, typeof status);
   console.log('main', main, typeof main);
   console.log('template', template, typeof template);
   console.log('section', section, typeof section);
   console.log('agent', agent, typeof agent);
   console.log('storey', storey, typeof storey);
   console.log('price', price, typeof price);
   console.log('area_house', area_house, typeof area_house);
   console.log('area_land', area_land, typeof area_land);
   console.log('material', material, typeof material);
   console.log('street', street, typeof street);
   console.log('note', note, typeof note);*/


  co(function*() {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('INSERT INTO node (title, date_create, author, status, main, template, section) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [title, date_create, author, status, main, template, section]);

      let id = result.rows[0].id;

      yield client.query('INSERT INTO commercial (agent, type, street, price, area_house, note, node_id) VALUES ($1, $2, $3, $4, $5, $6, $7)', [agent, type, street, price, area_house, note, id]);

      let result1 = yield client.query('UPDATE node SET alias = $1 WHERE id = $2', [id, id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result1, id);

    } catch (e) {

      client.release(true);
      return fn(e, null);
    }

  })
};

Complete.getTitleStreett = function (street, fn) {

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

Complete.getAllProject = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM project ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Complete.getAllToilet = function (fn) {

  pool.connect(function (err, client, done) {

    if (err) return fn(err);

    client.query('SELECT * FROM toilet ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Complete.getAllMaterial = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM material ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Complete.getAllCategoryLand= function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM category_land ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Complete.tableListComplete = function (agent, result) {

  let str = '';
  let max = 80;
  let idPhoto = null;
  let btn = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';

    for (let k = 0; k < result.fields.length; k++) {

      if (result.fields[k].name === 'photo') {
        continue;
      }

      str += '\t\t' + '<th>' + result.fields[k].name + '</th>' + '\n';

    }

    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {

      let row = result.rows[j];

      str += '\t' + '<tr>' + '\n';

      for (let i = 0; i < result.fields.length; i++) {

        let cols = result.fields[i].name;

        if (result.fields[i].name === 'photo') {
          idPhoto = row[cols];
          continue;
        }

        str += '\t\t' + '<td>';

        if (result.fields[i].name === 'Редактирование') {

          let rowCols = row[cols];

          if(idPhoto){
            btn = 'btn-success';
          } else {
            btn = 'btn-danger'
          }

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/complete?agent=' + agent + '&edit=' + rowCols + '"><span class="glyphicon' +
            ' glyphicon-pencil" aria-hidden="true"></span></a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/complete?agent=' + agent + '&drop=' + rowCols + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>';
          str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto='+rowCols+'" role="button" class="btn '+btn+' btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';


        } else if (result.fields[i].name === 'Примечание') {

          if (row[cols]) {
            if (row[cols].length > 80) {
              str += row[cols].substring(0, max) + '...';
            } else {
              str += row[cols];
            }
          }

        } else if (result.fields[i].name === 'ДатаВнесения') {

          if (row[cols]) {
            str += ms.msDateYear(row[cols]);
          } else {
            str += '<span class="noData">пусто</span>';
          }

        } else if (result.fields[i].name === 'ДатаПравки') {

          if (row[cols]) {
            str += ms.msDateYear(row[cols]);
          } else {
            str += '<span class="noData">пусто</span>';
          }

        } else if (result.fields[i].name === 'Главная' || result.fields[i].name === 'Публик') {

          if(row[cols] === 1){
            str += '<span class="yes">Да</span>';
          } else {
            str += '<span class="no">Нет</span>';
          }

        } else if (result.fields[i].name === 'Цена') {

          if (row[cols] === 0) {
            str += 'Договор.';
          } else {

            let arr = String(row[cols]).split("");
            let len = arr.length;

            let sum = '';

            if (len === 4) {
              for (let i = 0; i < arr.length; i++) {

                if (i === 1) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            if (len === 5) {
              for (let i = 0; i < arr.length; i++) {

                if (i === 2) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            if (len === 6) {
              for (let i = 0; i < arr.length; i++) {

                if (i === 3) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            if (len === 7) {
              for (let i = 0; i < arr.length; i++) {
                if (i === 1) {
                  sum += '.' + arr[i];
                } else if (i === 4) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            if (len === 8) {
              for (let i = 0; i < arr.length; i++) {
                if (i === 2) {
                  sum += '.' + arr[i];
                } else if (i === 5) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            str += sum;
          }

        } else {
          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '\t\t' + '</td>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';

    return str;
  }

};

Complete.getCountAllPhoto = function (id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE node_id_photo = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Complete.deleteAllPhoto = function (id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE node_id_photo = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};