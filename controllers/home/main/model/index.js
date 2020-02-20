let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

module.exports = Main;

function Main(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Main.getPermit = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM permit ORDER BY priority DESC", function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });

  });
};

Main.getMainPage = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node, main WHERE id = node_id AND template = 'main'", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getSectionApartment = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT n.section, (SELECT title FROM node WHERE id = n.section) AS \"Комнаты, квартиры\", count(*) OVER (PARTITION BY n.section) AS \"Количество объектов\" FROM apartment a LEFT JOIN node n ON(n.id = a.node_id) ORDER by \"Комнаты, квартиры\"", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getOneCity = function (city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT c.title AS \"Город - поселение\", CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE 'Областной центр' END AS Район, (SELECT title FROM region WHERE id_region = c.region_id) AS Область, count(*) OVER (PARTITION BY c.title) AS \"Количество объектов\" FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN node n ON(a.node_id = n.id) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title = $1", [city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getAllCity = function (city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT c.title AS \"Город - поселение\", CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE 'Областной центр' END AS Район, (SELECT title FROM region WHERE id_region = c.region_id) AS Область, count(*) OVER (PARTITION BY c.title) AS \"Количество объектов\" FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN node n ON(a.node_id = n.id) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title != $1 ORDER BY c.title", [city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getSectionCottages = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT n.section, (SELECT title FROM node WHERE id = n.section) AS \"Комнаты, квартиры\", count(*) OVER (PARTITION BY n.section) AS \"Количество объектов\" FROM cottages a LEFT JOIN node n ON(n.id = a.node_id) ORDER by \"Комнаты, квартиры\"", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getOneCityCottages = function (city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT c.title AS \"Город - поселение\", CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE 'Областной центр' END AS Район, (SELECT title FROM region WHERE id_region = c.region_id) AS Область, count(*) OVER (PARTITION BY c.title) AS \"Количество объектов\" FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN node n ON(a.node_id = n.id) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title = $1", [city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getAllCityCottages = function (city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT c.title AS \"Город - поселение\", CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE 'Областной центр' END AS Район, (SELECT title FROM region WHERE id_region = c.region_id) AS Область, count(*) OVER (PARTITION BY c.title) AS \"Количество объектов\" FROM cottages a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN node n ON(a.node_id = n.id) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title != $1 ORDER BY c.title", [city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getSectionCommercial = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT n.section, (SELECT title FROM node WHERE id = n.section) AS \"Комнаты, квартиры\", count(*) OVER (PARTITION BY n.section) AS \"Количество объектов\" FROM commercial a LEFT JOIN node n ON(n.id = a.node_id) ORDER by \"Комнаты, квартиры\"", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getOneCityCommercial = function (city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT c.title AS \"Город - поселение\", CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE 'Областной центр' END AS Район, (SELECT title FROM region WHERE id_region = c.region_id) AS Область, count(*) OVER (PARTITION BY c.title) AS \"Количество объектов\" FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN node n ON(a.node_id = n.id) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title = $1", [city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getAllCityCommercial = function (city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT c.title AS \"Город - поселение\", CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE 'Областной центр' END AS Район, (SELECT title FROM region WHERE id_region = c.region_id) AS Область, count(*) OVER (PARTITION BY c.title) AS \"Количество объектов\" FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN node n ON(a.node_id = n.id) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title != $1 ORDER BY c.title", [city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });
};

Main.getAgency = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT fio AS ФИО, CASE WHEN agency IS NULL THEN 'Индивидуальный риелтор' ELSE (SELECT title FROM node WHERE id = agency) END AS" +
      " \"Агенства\", CASE WHEN moderator IS NULL THEN '' ELSE 'модератор' END AS \"Главный в агенстве\", tel, email from users, userdata where id_user = user_id ORDER BY Агенства, ФИО", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });

  });

};

Main.tableCity = function (one, all) {

  let str = '';

  if (one.rowCount === 0 || !one) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';

    for (let k = 0; k < one.fields.length; k++) {

      str += '\t\t' + '<th>' + one.fields[k].name + '</th>' + '\n';

    }

    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < one.rows.length; j++) {

      let row = one.rows[j];

      str += '\t' + '<tr>' + '\n';

      for (let i = 0; i < one.fields.length; i++) {

        let cols = one.fields[i].name;

        str += '\t\t' + '<td>';

        str += row[cols];

        str += '\t\t' + '</td>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';
    }

   // str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < all.rows.length; j++) {

      let row = all.rows[j];

      str += '\t' + '<tr>' + '\n';

      for (let i = 0; i < all.fields.length; i++) {

        let cols = all.fields[i].name;

        str += '\t\t' + '<td>';

        str += row[cols];

        str += '\t\t' + '</td>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';
    }


    str += '</table>' + '\n';
    str += '</div>' + '\n';

    return str;
  }

};

Main.tableSection = function (resultSection) {

  let str = '';

  if (resultSection.rowCount === 0 || !resultSection) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';

    for (let k = 0; k < resultSection.fields.length; k++) {

      if (resultSection.fields[k].name === 'section') {
        continue;
      }

      str += '\t\t' + '<th>' + resultSection.fields[k].name + '</th>' + '\n';

    }

    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < resultSection.rows.length; j++) {

      let row = resultSection.rows[j];


      str += '\t' + '<tr>' + '\n';

      for (let i = 0; i < resultSection.fields.length; i++) {

        if (resultSection.fields[i].name === 'section') {
          continue;
        }

        let cols = resultSection.fields[i].name;

        str += '\t\t' + '<td>';

        str += row[cols];

        str += '\t\t' + '</td>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';

    return str;
  }

};

Main.tableAgency = function (result) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';

    for (let k = 0; k < result.fields.length; k++) {

      str += '\t\t' + '<th>' + result.fields[k].name + '</th>' + '\n';

    }

    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {

      let row = result.rows[j];


      str += '\t' + '<tr>' + '\n';

      for (let i = 0; i < result.fields.length; i++) {

        let cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name === 'email') {

          str += row[cols]/*.substr(0, 4) + "..."*/;

        } else {
          str += row[cols];
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

