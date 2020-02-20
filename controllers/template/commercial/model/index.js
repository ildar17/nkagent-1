let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let nav = require('../../../../lib/navigation');
let ms = require('../../../../lib/msDate');

module.exports = Commercial;

function Commercial(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}


Commercial.prototype.list = function (fn) {

  let commercial = this;
  let permission = commercial.permission;
  let id_agency = commercial.id_agency;
  let id_moderator_agency = commercial.id_moderator_agency;
  let id_city = commercial.id_city;
  let id_user = commercial.id_user;

  let inSection = commercial.inSection;
  if(!inSection) inSection = null;
  let querySection = commercial.querySection;
  if(inSection)inSection = inSection.slice(0, -2);
  inSection = 'IN(' + inSection + ')';
  if (querySection) {
    inSection = 'IN(' + querySection + ')';
  }

  let queryAgent = commercial.idAgent;
  let inAgent = commercial.inAgent;
  if(!inAgent)inAgent = null;
  if(inAgent)inAgent = inAgent.slice(0, -2);
  inAgent = 'IN(' + inAgent + ')';
  if (queryAgent) {
    inAgent = 'IN(' + queryAgent + ')';
  }

  let queryStreet = commercial.queryStreet;
  let inStreet = commercial.inStreet;
  if(!inStreet) inStreet = null;
  if(inStreet)inStreet = inStreet.slice(0, -2);
  inStreet = 'IN(' + inStreet + ')';
  if (queryStreet) {
    inStreet = 'IN(' + queryStreet + ')';
  }

  let price = '';
  if (commercial.price) {
    price = commercial.price;
  } else {
    price = ' AND price IN(SELECT price FROM commercial)';
  }


  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      /*      console.log(id_city, "SELECT section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM commercial c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet+price + " ORDER BY Улица, Цена");*/

      client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM commercial c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet+price + " ORDER BY Улица, Цена", [id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });
  }


  if (permission.indexOf('0', 4) === 4) {

    if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM commercial c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet+price + " ORDER BY Улица, Цена", [id_city], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM commercial c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent = $2 AND c.street " + inStreet+price + " ORDER BY Улица, Цена", [id_city, id_user], function (err, result) {
          done();

          if (err) return fn(err);

          fn(null, result);
        });
      });
    }

  }
};

Commercial.prototype.listLimit = function (fn) {

  let commercial = this;
  let permission = commercial.permission;
  let id_city = commercial.id_city;
  let id_agency = commercial.id_agency;
  let id_moderator_agency = commercial.id_moderator_agency;
  let limit = commercial.limit;
  let offset = commercial.offset;
  let id_user = commercial.id_user;

  let inSection = commercial.inSection;
  if(!inSection) inSection = null;
  let querySection = commercial.querySection;
  if(inSection)inSection = inSection.slice(0, -2);
  inSection = 'IN(' + inSection + ')';
  if (querySection) {
    inSection = 'IN(' + querySection + ')';
  }

  let queryAgent = commercial.idAgent;
  let inAgent = commercial.inAgent;
  if(!inAgent)inAgent = null;
  if(inAgent)inAgent = inAgent.slice(0, -2);
  inAgent = 'IN(' + inAgent + ')';
  if (queryAgent) {
    inAgent = 'IN(' + queryAgent + ')';
  }

  let queryStreet = commercial.queryStreet;
  let inStreet = commercial.inStreet;
  if(!inStreet) inStreet = null;
  if(inStreet)inStreet = inStreet.slice(0, -2);
  inStreet = 'IN(' + inStreet + ')';
  if (queryStreet) {
    inStreet = 'IN(' + queryStreet + ')';
  }

  let price = '';
  if (commercial.price) {
    price = commercial.price;
  } else {
    price = ' AND price IN(SELECT price FROM commercial)';
  }


  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM commercial c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet + price+" ORDER BY Улица, Цена LIMIT $2 OFFSET $3", [id_city, limit, offset], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  }

  if (permission.indexOf('0', 4) === 4) {

    if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM commercial c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet + price+" ORDER BY Улица, Цена LIMIT $2 OFFSET $3", [id_city, limit, offset], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {


      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM commercial c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent = $2 AND c.street " + inStreet + price+" ORDER BY Улица, Цена LIMIT $3 OFFSET $4", [id_city, id_user, limit, offset], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });
    }

  }
};

Commercial.setCity = function (id_city, email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE users SET default_city = $1 WHERE email = $2", [id_city, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Commercial.getIdPayAgent = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_role FROM role WHERE payment_price = 1", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Commercial.getIdNotPayAgent = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_role FROM role WHERE payment_price = 2", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Commercial.transferAgencyStaff = function (agency, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT user_id FROM userdata WHERE agency = $1", [agency], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Commercial.recordVisitTimeGroup = function (date, employees, fn) {

  co(function*() {

    let client;

    try {

      let id;

      for (let i = 0; i < employees.length; i++) {

        id = employees[i].user_id;

        client = yield pool.connect();

        yield client.query('UPDATE userdata SET date_entry = $1 WHERE user_id = $2', [date, id]);
        client.release();

      }
      return fn(null, 1);

    } catch (err) {
      return fn(err, null);
    }

  });

};

Commercial.recordVisitTimOneAgent = function (date, id_user, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE userdata SET date_entry = $1 WHERE user_id = $2", [date, id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Commercial.prototype.getIdNode = function (fn) {

  let commercial = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node, commercial WHERE id = node_id AND id = $1 AND template = $2', [commercial.id, commercial.template], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Commercial.getIdAgentCommercial = function (id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT agent FROM node, commercial WHERE id = node_id AND id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Commercial.getIdAgency = function (id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT agency FROM userdata WHERE user_id = $1", [id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Commercial.prototype.listEditDrop = function (fn) {
  let commercial = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node, commercial WHERE id = node_id AND id = $1', [commercial.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Commercial.setDistricts = function (id_districts, email, fn) {

  pool.connect(function (err, client, done) {

    if (err) return fn(err);

    client.query("UPDATE users SET default_districts = $1 WHERE email = $2", [id_districts, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Commercial.getDistrictsMain = function (region, permission, id_agency, id_moderator_agency, id_user, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1", [region], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 AND u.agency = $2", [region, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 AND ap.agent = $2", [region, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  }

};

Commercial.getDistricts = function (region, permission, id_agency, id_moderator_agency, id_user, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1", [region], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 AND u.agency = $2", [region, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 AND ap.agent = $2", [region, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  }
};

Commercial.getDistrictsLastMain = function (region, permission, id_agency, id_moderator_agency, id_user, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1", [region], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 AND u.agency = $2", [region, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 AND ap.agent = $2", [region, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });

    });

  }
};

Commercial.getDistrictsLast = function (region, permission, id_agency, id_moderator_agency, id_user, fn) {


  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1", [region], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 AND u.agency = $2", [region, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM commercial ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 AND ap.agent = $2", [region, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });
  }
};

Commercial.getIdLabel = function (id_permit, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT node_id AS id, (SELECT title FROM node WHERE id = node_id) FROM labelandtemplate, node WHERE id = node_id AND permit_id = $1 ORDER BY line DESC", [id_permit], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Commercial.oneCity = function (id_city, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM city WHERE id_city = $1", [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Commercial.getCityNoDistricts = function (permission, regionID, id_agency, id_moderator_agency, id_user, fn) {


  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND districts_id IS NULL AND region_id = $1 ORDER BY title", [regionID], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND districts_id IS NULL AND region_id = $1 AND u.agency = $2 ORDER BY c.title", [regionID, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND districts_id IS NULL AND region_id = $1 AND a.agent = $2 ORDER BY title", [regionID, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });
  }
};

Commercial.getMainCity = function(mainCity, permission, id_agency, id_moderator_agency, id_user, id_districts, fn){

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title = $1 AND districts_id = $2", [mainCity, id_districts], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if(permission.indexOf('0', 4) === 4){

    if (!id_agency) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title = $1 AND a.agent = $2 AND districts_id = $3", [mainCity, id_user, id_districts], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title = $1 AND u.agency = $2 AND districts_id = $3", [mainCity, id_agency, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });

      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title = $1 AND a.agent = $2 AND districts_id = $3", [mainCity, id_user, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }
    }
  }
};

Commercial.listFirstCity = function (mainCity, permission, id_agency, id_moderator_agency, id_user, id_districts, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title != $1 AND districts_id = $2 ORDER BY c.title", [mainCity, id_districts], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if(permission.indexOf('0', 4) === 4){

    if (!id_agency) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title != $1 AND a.agent = $2 AND districts_id = $3 ORDER BY c.title", [mainCity, id_user, id_districts], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

        pool.connect(function (err, client, done) {

          if (err) return fn(err);

          client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title != $1 AND u.agency = $2 AND districts_id = $3 ORDER BY c.title", [mainCity, id_agency, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });


      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title != $1 AND a.agent = $2 AND districts_id = $3 ORDER BY c.title", [mainCity, id_user, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }
    }
  }
};

Commercial.getCityNoDistrictsLast = function (permission, regionID, id_agency, id_moderator_agency, id_user, fn) {
  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL) AND id_city IS NOT NULL AND districts_id IS NULL AND region_id = $1 ORDER BY title", [regionID], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

    pool.connect(function (err, client, done) {

      if (err) return fn(err);

      client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM commercial a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) AND id_city IS NOT NULL AND u.agency = $1) AND districts_id IS NULL AND region_id = $2 ORDER BY select_default, title", [ id_agency, regionID ], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND a.agent = $1) AND id_city IS NOT NULL AND districts_id IS NULL AND region_id = $2 ORDER BY title", [id_user, regionID], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  }
};

Commercial.listLastCity = function (permission, id_agency, id_moderator_agency, id_user, id_districts, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL) AND districts_id = $1 ORDER BY select_default, title", [id_districts], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if(permission.indexOf('0', 4) === 4){

    if (!id_agency) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND a.agent = $1) AND districts_id = $2 ORDER BY select_default, title", [id_user, id_districts], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

        pool.connect(function (err, client, done) {

          if (err) return fn(err);

          client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM commercial a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) AND id_city IS NOT NULL AND u.agency = $1) AND districts_id = $2 ORDER BY select_default, title", [id_agency, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });


      } else {

        pool.connect(function (err, client, done) {

          if (err) return fn(err);

          client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM commercial a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND a.agent = $1) AND districts_id = $2 ORDER BY select_default, title", [id_user, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }
    }
  }
};

Commercial.getAgentAllSelect = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT user_id, (SELECT title FROM node WHERE id = agency), fio FROM users, userdata, role WHERE id_user = user_id AND role_id = id_role AND payment_price = 2 ORDER BY title, fio", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });

};

Commercial.getIdUser = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT fio, id_user, agency, moderator FROM users, userdata WHERE id_user = user_id AND email = $1", [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Commercial.getAgentSelect = function (id_agency, id_moderator_agency, id_user, fn) {

  if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT user_id, (SELECT title FROM node WHERE id = agency), fio FROM users, userdata WHERE id_user = user_id AND agency = $1", [id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT user_id, fio FROM userdata WHERE user_id = $1", [id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });
  }
};

Commercial.getAgentAllSorting = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT user_id, fio, (SELECT title FROM node WHERE id = agency) FROM userdata WHERE user_id = ANY( SELECT DISTINCT agent FROM node, commercial WHERE id = node_id AND street = ANY( SELECT id_street FROM street WHERE city_id = $1 )) ORDER BY title, fio", [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });

};

Commercial.getIdUser = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT fio, id_user, agency, moderator FROM users, userdata WHERE id_user = user_id AND email = $1", [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Commercial.getAgentSorting = function (id_agency, id_moderator_agency, id_user, id_city, fn) {

  if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT user_id, fio, (SELECT title FROM node WHERE id = agency) FROM userdata WHERE user_id = ANY( SELECT DISTINCT agent FROM node, commercial WHERE id = node_id AND street = ANY( SELECT id_street FROM street WHERE city_id = $1 AND agency = $2 )) ORDER BY title, fio", [id_city, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT user_id, fio FROM userdata WHERE user_id = $1", [id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });
  }
};

Commercial.prototype.selectSection = function (fn) {

  let commercial = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT section_id, (SELECT title FROM node WHERE id = section_id) as section FROM sectionandtemplate WHERE template_name = $1 ORDER BY section',
      [commercial.temp], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Commercial.getSectionSorting = function (permission, id_city, id_user, id_agency, id_moderator_agency, fn) {

  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id, title FROM node WHERE id = ANY(SELECT section FROM commercial c LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN node ON(c.node_id = id) WHERE s.city_id = $1 GROUP BY section) ORDER BY title", [id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if (permission.indexOf('0', 4) === 4) {

    if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, title FROM node WHERE id = ANY( SELECT section FROM commercial c LEFT JOIN userdata ON(c.agent = user_id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN node ON(c.node_id = id) WHERE s.city_id = $1 AND agency = $2 GROUP BY section ) ORDER BY title", [id_city, id_agency], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, title FROM node WHERE id = ANY(SELECT section FROM commercial c LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN node ON(c.node_id = id) WHERE s.city_id = $1 AND c.agent = $2 GROUP BY section) ORDER BY title", [id_city, id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });
    }
  }
};

Commercial.prototype.getStreet = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_street, districts, ci.title AS city, street FROM street s LEFT JOIN city ci ON (s.city_id = ci.id_city) LEFT JOIN districts d ON (ci.districts_id = d.id_districts) LEFT JOIN region r ON (ci.region_id = r.id_region) LEFT JOIN country c ON (r.country_id = c.id) WHERE id_city = $1 ORDER BY s.street', [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Commercial.getStreetSortingAll = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM street WHERE id_street = ANY(SELECT DISTINCT street FROM node, commercial WHERE id = node_id AND street = ANY(SELECT id_street FROM street WHERE city_id = $1)) ORDER BY street', [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Commercial.getStreetSortingUser = function (id_city, id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM street WHERE id_street = ANY(SELECT DISTINCT id_street FROM commercial a, street s, city WHERE a.street = s.id_street AND s.city_id = id_city AND agent = $1 AND id_city = $2 ) ORDER BY street", [id_user, id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

Commercial.getStreetSortingAgency = function (id_agency, id_moderator_agency, id_user, id_city, fn) {

  if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {


    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_street, street FROM street WHERE id_street = ANY(SELECT DISTINCT street FROM commercial WHERE agent = ANY(SELECT DISTINCT agent FROM commercial WHERE agent = ANY(SELECT user_id FROM users, userdata WHERE id_user = user_id AND agency = $1))) AND city_id = $2 ORDER BY street", [id_agency, id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_street, street FROM street WHERE id_street = ANY(SELECT DISTINCT street FROM commercial WHERE agent = ANY(SELECT DISTINCT agent FROM commercial WHERE agent = ANY(SELECT user_id FROM users, userdata WHERE id_user = user_id AND agency = $1 AND id_user = $3))) AND city_id = $2  ORDER BY street", [id_agency, id_city, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });
  }
};

Commercial.getMinPrice = function (permission, id_agency, id_moderator_agency, id_user, inAgent, fn) {

  if(inAgent)inAgent = inAgent.slice(0, -2);
  if(!inAgent)inAgent = null;
  inAgent = 'IN(' + inAgent + ')';


  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT min(price) FROM commercial LEFT JOIN userdata ON(agent = user_id)', function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });


  } else if (permission.indexOf('0', 4) === 4){


    if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){


      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('SELECT min(price) FROM commercial LEFT JOIN userdata ON(agent = user_id) AND agent ' + inAgent, function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('SELECT min(price) FROM commercial LEFT JOIN userdata ON(agent = user_id) AND agent = $1', [id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });
    }
  }
};

Commercial.getMaxPrice = function (permission, id_agency, id_moderator_agency, id_user, inAgent, fn) {

  if(inAgent)inAgent = inAgent.slice(0, -2);
  if(!inAgent)inAgent = null;
  inAgent = 'IN(' + inAgent + ')';


  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT max(price) FROM commercial LEFT JOIN userdata ON(agent = user_id)', function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });


  } else if (permission.indexOf('0', 4) === 4){


    if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){


      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('SELECT max(price) FROM commercial LEFT JOIN userdata ON(agent = user_id) AND agent ' + inAgent, function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('SELECT max(price) FROM commercial LEFT JOIN userdata ON(agent = user_id) AND agent = $1', [id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });
    }
  }
};


Commercial.tableListCommercial = function (permission, row, urlParsed, limit, linkLimit, urlPage, result, req) {

  let strPath = nav.linkQuery('edit', 'drop', 'party', req);
  let str = '';
  let idSection = '';
  let idPhoto = null;
  let btn = '';

  let active = '';

  if (urlParsed.query.edit) {
    active = urlParsed.query.edit;
  }

  if (urlParsed.query.drop) {
    active = urlParsed.query.drop;
  }

  if (result === '') {

    return str;

  } else {


    str += nav.navPageApartment(str, urlParsed, row.rowCount, limit, linkLimit, urlPage, 'page');

    str += '<div class="clearfix"></div>' + '\n';
    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-bordered table-hover table-condensed tables-top">' + '\n';

    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      if (result.fields[i].name === 'photo') {
        continue;
      }

      if (result.fields[i].name === 'section') {
        continue;
      }

      if (i === 0) {
        str += '';
      } else {
        str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';
      }
    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {

      let row = result.rows[j];

      let cols = '';

      if (result.rows[j]['Редактирование'] === active) {
        str += '\t' + '<tr bgcolor="#f0e68c">' + '\n';
      } else {
        str += '\t' + '<tr>' + '\n';
      }

      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        if (result.fields[i].name === 'photo') {
          idPhoto = row[cols];
          continue;
        }

        if (result.fields[i].name === 'section') {
          idSection = row[cols];
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

          if (urlParsed.query.section) {

            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/commercial?edit=' + rowCols + strPath + '"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>';
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/commercial?drop=' + rowCols + strPath + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto='+rowCols+'" role="button" class="btn '+btn+' btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/template/commercial?map='+rowCols+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';

          } else {

            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/commercial?section=' + idSection + '&edit=' + rowCols + '"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>';
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/commercial?section=' + idSection + '&drop=' + rowCols + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto='+rowCols+'" role="button" class="btn '+btn+' btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/template/commercial?map='+rowCols+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';
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

        } else if (result.fields[i].name === 'ДатаВнесения') {

          str += ms.msDateYear(row[cols]);

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

Commercial.getAddress = function (temp, id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT street FROM "+temp+" WHERE node_id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        let street = result.rows[0].street;

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT c.title, s.street, (SELECT districts FROM districts WHERE id_districts = c.districts_id) AS districts,  (SELECT title FROM region WHERE id_region = c.region_id) AS region FROM street s LEFT JOIN city c ON(s.city_id = c.id_city) WHERE s.id_street = $1", [street], function (err, result) {
            done();
            if (err) return fn(err, null);

            fn(null, result);

          });
        });

      } else {
        fn(null, null);
      }
    });
  });
};

Commercial.prototype.delete = function (fn) {

  let commercial = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM node WHERE id = $1',
      [commercial.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Commercial.listSaveEdit = function(id_city, section, permission, id_agency, id_moderator_agency, id_user, fn){

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, price FROM node LEFT JOIN commercial a ON(id = node_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 ORDER BY Улица, price", [section, id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });


  } else if(permission.indexOf('0', 4) === 4){


    if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, price  FROM node LEFT JOIN commercial a ON(id = node_id) LEFT JOIN userdata ON(a.agent = user_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 AND agency = $3 ORDER BY Улица, price", [section, id_city, id_agency], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, price  FROM node LEFT JOIN commercial a ON(id = node_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 AND a.agent = $3 ORDER BY Улица, price", [section, id_city, id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });
    }
  }

};

Commercial.prototype.save = function (fn) {
  let commercial = this;

  let title = commercial.title;
  let date_create = commercial.date_create;
  let author = commercial.author;
  let status = commercial.value.status * 1;
  let main = commercial.value.main * 1;
  let template = commercial.template;
  let section = commercial.value.section * 1;
  let type = commercial.value.type * 1;
  let agent = commercial.value.agent * 1;
  let price = commercial.value.price * 1;
  let area_house = commercial.value.area_house * 1;
  let street = commercial.value.street * 1;
  let note = commercial.value.note;


  if (!status || commercial.permission.indexOf('0', 4) === 4) {
    status = 0;
  }

  if (!main || commercial.permission.indexOf('0', 4) === 4) {
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

Commercial.prototype.edit = function (fn) {

  let commercial = this;


  let id = commercial.id;
  let title = commercial.title;
  let date_edit = commercial.date_edit;
  let author_edit = commercial.author;
  let status = commercial.value.status * 1;
  let main = commercial.value.main * 1;
  let section = commercial.value.section * 1;
  let type = commercial.value.type * 1;
  let agent = commercial.value.agent * 1;
  let price = commercial.value.price * 1;
  let area_house = commercial.value.area_house * 1;
  let street = commercial.value.street * 1;
  let note = commercial.value.note;

  if (!status || commercial.permission.indexOf('0', 4) === 4) {
    status = 0;
  }

  if (!main || commercial.permission.indexOf('0', 4) === 4) {
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

Commercial.getTitleSection = function (section, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM node WHERE id = $1", [section], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Commercial.getCountAllPhoto = function (id_node, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE node_id_photo = $1", [id_node], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Commercial.deleteAllPhoto = function (id_node, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE node_id_photo = $1", [id_node], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};