let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

module.exports = Apartment;

function Apartment(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Apartment.prototype.getIdNode = function (fn) {

  let apartment = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node, apartment WHERE id = node_id AND id = $1 AND template = $2', [apartment.id, apartment.template], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Apartment.getAllProject = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM project ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Apartment.getAllToilet = function (fn) {

  pool.connect(function (err, client, done) {

    if (err) return fn(err);

    client.query('SELECT * FROM toilet ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Apartment.prototype.listEditDrop = function (fn) {
  let apartment = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node, apartment WHERE id = node_id AND id = $1', [apartment.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Apartment.prototype.list = function (fn) {

  let apartment = this;

  let permission = apartment.permission;
  let id_agency = apartment.id_agency;
  let id_moderator_agency = apartment.id_moderator_agency;
  let id_city = apartment.id_city;
  let id_user = apartment.id_user;

  let inSection = apartment.inSection;
  if(!inSection) inSection = null;
  let querySection = apartment.querySection;
  if(inSection)inSection = inSection.slice(0, -2);
  inSection = 'IN(' + inSection + ')';
  if (querySection) {
    inSection = 'IN(' + querySection + ')';
  }

  let queryAgent = apartment.idAgent;
  let inAgent = apartment.inAgent;
  if(!inAgent)inAgent = null;
  if(inAgent)inAgent = inAgent.slice(0, -2);
  inAgent = 'IN(' + inAgent + ')';
  if (queryAgent) {
    inAgent = 'IN(' + queryAgent + ')';
  }

  let queryStreet = apartment.queryStreet;
  let inStreet = apartment.inStreet;
  if(!inStreet) inStreet = null;
  if(inStreet)inStreet = inStreet.slice(0, -2);
  inStreet = 'IN(' + inStreet + ')';
  if (queryStreet) {
    inStreet = 'IN(' + queryStreet + ')';
  }

  let price = '';
  if (apartment.price) {
    price = apartment.price;
  } else {
    price = ' AND price IN(SELECT price FROM apartment)';
  }


  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      /*      console.log(id_city, "SELECT section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM cottages c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet+price + " ORDER BY Улица, Цена");*/

      client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM apartment c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet+price + " ORDER BY Улица, Цена", [id_city], function (err, result) {
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

        client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM apartment c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet+price + " ORDER BY Улица, Цена", [id_city], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

/*      console.log("SELECT section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM apartment c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent = $2 AND c.street " + inStreet+price + " ORDER BY Улица, Цена");*/

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM apartment c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent = $2 AND c.street " + inStreet+price + " ORDER BY Улица, Цена", [id_city, id_user], function (err, result) {
          done();

          if (err) return fn(err);

          fn(null, result);
        });
      });
    }

  }
};

Apartment.prototype.listLimit = function (fn) {

  let apartment = this;

  let permission = apartment.permission;
  let id_city = apartment.id_city;
  let id_agency = apartment.id_agency;
  let id_moderator_agency = apartment.id_moderator_agency;
  let limit = apartment.limit;
  let offset = apartment.offset;
  let id_user = apartment.id_user;

  let inSection = apartment.inSection;
  if(!inSection) inSection = null;
  let querySection = apartment.querySection;
  if(inSection)inSection = inSection.slice(0, -2);
  inSection = 'IN(' + inSection + ')';
  if (querySection) {
    inSection = 'IN(' + querySection + ')';
  }

  let queryAgent = apartment.idAgent;
  let inAgent = apartment.inAgent;
  if(!inAgent)inAgent = null;
  if(inAgent)inAgent = inAgent.slice(0, -2);
  inAgent = 'IN(' + inAgent + ')';
  if (queryAgent) {
    inAgent = 'IN(' + queryAgent + ')';
  }

  let queryStreet = apartment.queryStreet;
  let inStreet = apartment.inStreet;
  if(!inStreet) inStreet = null;
  if(inStreet)inStreet = inStreet.slice(0, -2);
  inStreet = 'IN(' + inStreet + ')';
  if (queryStreet) {
    inStreet = 'IN(' + queryStreet + ')';
  }

  let price = '';
  if (apartment.price) {
    price = apartment.price;
  } else {
    price = ' AND price IN(SELECT price FROM apartment)';
  }


  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM apartment c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet + price+" ORDER BY Улица, Цена LIMIT $2 OFFSET $3", [id_city, limit, offset], function (err, result) {
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

        client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM apartment c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent " + inAgent + " AND c.street " + inStreet + price+" ORDER BY Улица, Цена LIMIT $2 OFFSET $3", [id_city, limit, offset], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {


      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, section, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, title AS Заголовок, (SELECT street || ' [' || title || ']' AS Улица FROM city, street WHERE id_city = city_id AND id_street = c.street) AS Улица, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS Владелец, date_create AS ДатаВнесения FROM apartment c LEFT JOIN node ON(node_id = id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN userdata ON(user_id = agent) WHERE s.city_id = $1 AND section " + inSection + " AND agent = $2 AND c.street " + inStreet + price+" ORDER BY Улица, Цена LIMIT $3 OFFSET $4", [id_city, id_user, limit, offset], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });
    }
  }
};

Apartment.getSectionStreet = function (inUsers, users, permission, fn) {

  let agent = null;

  if (users === null || permission.indexOf('1', 4) === 4) {
    agent = 'IN(SELECT id_user FROM users, userdata WHERE id_user = user_id AND agency IS NOT NULL)';
  } else {
    agent = inUsers;
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id, title FROM node WHERE id IN(SELECT DISTINCT section FROM node, apartment WHERE id=node_id AND agent ' + agent + ')', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.getMinPrice = function (permission, id_agency, id_moderator_agency, id_user, inAgent, fn) {

  if(inAgent)inAgent = inAgent.slice(0, -2);
  if(!inAgent)inAgent = null;
  inAgent = 'IN(' + inAgent + ')';


  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT min(price) FROM apartment LEFT JOIN userdata ON(agent = user_id)', function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });


  } else if (permission.indexOf('0', 4) === 4){


    if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){


      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('SELECT min(price) FROM apartment LEFT JOIN userdata ON(agent = user_id) AND agent ' + inAgent, function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('SELECT min(price) FROM apartment LEFT JOIN userdata ON(agent = user_id) AND agent = $1', [id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });
    }
  }
};

Apartment.getMaxPrice = function (permission, id_agency, id_moderator_agency, id_user, inAgent, fn) {

  if(inAgent)inAgent = inAgent.slice(0, -2);
  if(!inAgent)inAgent = null;
  inAgent = 'IN(' + inAgent + ')';


  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT max(price) FROM apartment LEFT JOIN userdata ON(agent = user_id)', function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });


  } else if (permission.indexOf('0', 4) === 4){


    if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){


      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('SELECT max(price) FROM apartment LEFT JOIN userdata ON(agent = user_id) AND agent ' + inAgent, function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('SELECT max(price) FROM apartment LEFT JOIN userdata ON(agent = user_id) AND agent = $1', [id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
      });
    }
  }
};

Apartment.prototype.save = function (fn) {
  let apartment = this;

  let title = apartment.title;
  let date_create = apartment.date_create;
  let author = apartment.author;
  let status = apartment.value.status * 1;
  let main = apartment.value.main * 1;
  let template = apartment.template;
  let section = apartment.value.section * 1;
  let type = apartment.value.type * 1;
  let agent = apartment.value.agent * 1;
  let street = apartment.value.street * 1;
  let house = apartment.value.house;
  let liter = apartment.value.liter;
  let storey = apartment.value.storey * 1;
  let numstorey = apartment.value.numstorey * 1;
  let price = apartment.value.price * 1;
  let area1 = apartment.value.area1 * 1;
  let area2 = apartment.value.area2 * 1;
  let area3 = apartment.value.area3 * 1;
  let op = apartment.value.op * 1;
  let project = apartment.value.project * 1;
  let toilet = apartment.value.toilet * 1;
  let balcony = apartment.value.balcony * 1;
  let note = apartment.value.note;


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

Apartment.prototype.edit = function (fn) {

  let apartment = this;

  let id = apartment.id;
  let title = apartment.title;
  let date_edit = apartment.date_edit;
  let author_edit = apartment.author_edit;
  let status = apartment.value.status * 1;
  let main = apartment.value.main * 1;
  let section = apartment.value.section * 1;
  let type = apartment.value.type * 1;
  let agent = apartment.value.agent * 1;
  let street = apartment.value.street * 1;
  let house = apartment.value.house;
  let liter = apartment.value.liter;
  let storey = apartment.value.storey * 1;
  let numstorey = apartment.value.numstorey * 1;
  let price = apartment.value.price * 1;
  let area1 = apartment.value.area1 * 1;
  let area2 = apartment.value.area2 * 1;
  let area3 = apartment.value.area3 * 1;
  let op = apartment.value.op * 1;
  let project = apartment.value.project * 1;
  let toilet = apartment.value.toilet * 1;
  let balcony = apartment.value.balcony * 1;
  let note = apartment.value.note;

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

Apartment.prototype.delete = function (fn) {

  let apartment = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM node WHERE id = $1',
      [apartment.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Apartment.prototype.selectSection = function (fn) {

  let apartment = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT section_id, (SELECT title FROM node WHERE id = section_id) as section FROM sectionandtemplate WHERE' +
      ' template_name = $1 ORDER BY section',
      [apartment.temp], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Apartment.getSectionSorting = function (permission, id_city, id_user, id_agency, id_moderator_agency, fn) {

  if (permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id, title FROM node WHERE id = ANY(SELECT section FROM apartment c LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN node ON(c.node_id = id) WHERE s.city_id = $1 GROUP BY section) ORDER BY title", [id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if (permission.indexOf('0', 4) === 4) {

    if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, title FROM node WHERE id = ANY( SELECT section FROM apartment c LEFT JOIN userdata ON(c.agent = user_id) LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN node ON(c.node_id = id) WHERE s.city_id = $1 AND agency = $2 GROUP BY section ) ORDER BY title", [id_city, id_agency], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, title FROM node WHERE id = ANY(SELECT section FROM apartment c LEFT JOIN street s ON(c.street = s.id_street) LEFT JOIN node ON(c.node_id = id) WHERE s.city_id = $1 AND c.agent = $2 GROUP BY section) ORDER BY title", [id_city, id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });
    }
  }
};

Apartment.prototype.getStreet = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_street, districts, ci.title AS city, street FROM street s LEFT JOIN city ci ON (s.city_id = ci.id_city) LEFT JOIN districts d ON (ci.districts_id = d.id_districts) LEFT JOIN region r ON (ci.region_id = r.id_region) LEFT JOIN country c ON (r.country_id = c.id) WHERE id_city = $1 ORDER BY s.street', [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.getStreetSortingAll = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM street WHERE id_street = ANY(SELECT DISTINCT street FROM node, apartment WHERE id = node_id AND street = ANY(SELECT id_street FROM street WHERE city_id = $1)) ORDER BY street', [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.getSortingStreet = function (inUsers, users, permission, fn) {

  let agent = null;

  if (users === null || permission.indexOf('1', 4) === 4) {
    agent = 'IN(SELECT id_user FROM users, userdata WHERE id_user = user_id AND agency IS NOT NULL)';
  } else {
    agent = inUsers;
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_street, street, ci.title as city_title FROM street LEFT JOIN city ci ON(ci.id_city = city_id) WHERE id_street IN(SELECT DISTINCT s.id_street FROM apartment a LEFT JOIN node n ON(a.node_id = n.id) LEFT JOIN street s ON(a.street = s.id_street) WHERE agent ' + agent + ') ORDER BY ci.title, street', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.getIdUser = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT fio, id_user, agency, moderator FROM users, userdata WHERE id_user = user_id AND email = $1", [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Apartment.getUserAgency = function (agency, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM users, userdata WHERE id_user = user_id AND agency = $1", [agency], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Apartment.getAgent = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM users, userdata WHERE id_user = user_id AND email = $1 AND agency IS NOT NULL", [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Apartment.getTitleSection = function (section, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM node WHERE id = $1", [section], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Apartment.getIdPayAgent = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_role FROM role WHERE payment_price = 1", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.getIdNotPayAgent = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_role FROM role WHERE payment_price = 2", function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.transferAgencyStaff = function (agency, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT user_id FROM userdata WHERE agency = $1", [agency], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.recordVisitTimeGroup = function (date, employees, fn) {

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

Apartment.getIdLabel = function (id_permit, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT node_id AS id, (SELECT title FROM node WHERE id = node_id) FROM labelandtemplate, node WHERE id = node_id AND permit_id = $1 ORDER BY line DESC", [id_permit], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Apartment.recordVisitTimOneAgent = function (date, id_user, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE userdata SET date_entry = $1 WHERE user_id = $2", [date, id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.getIdAgentApartment = function (id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT agent FROM node, apartment WHERE id = node_id AND id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.getIdAgency = function (id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT agency FROM userdata WHERE user_id = $1", [id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Apartment.getDistrictsMain = function (region, permission, id_agency, id_moderator_agency, id_user, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1", [region], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 AND u.agency = $2", [region, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 AND ap.agent = $2", [region, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  }

};

Apartment.getDistricts = function (region, permission, id_agency, id_moderator_agency, id_user, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1", [region], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 AND u.agency = $2", [region, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id), count(*) OVER (PARTITION BY ci.districts_id) AS sum FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 AND ap.agent = $2", [region, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  }
};

Apartment.getDistrictsLastMain = function (region, permission, id_agency, id_moderator_agency, id_user, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1", [region], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 AND u.agency = $2", [region, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title = $1 AND ap.agent = $2", [region, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });

    });

  }
};

Apartment.getDistrictsLast = function (region, permission, id_agency, id_moderator_agency, id_user, fn) {


  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1", [region], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else if(id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 AND u.agency = $2", [region, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM street st LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 EXCEPT SELECT DISTINCT ci.districts_id, re.title, (SELECT districts FROM districts WHERE id_districts = ci.districts_id) FROM apartment ap LEFT JOIN street st ON(ap.street = st.id_street) LEFT JOIN userdata u ON (ap.agent = u.user_id) LEFT JOIN city ci ON(st.city_id = ci.id_city) LEFT JOIN region re ON(ci.region_id = re.id_region) WHERE districts_id IS NOT NULL AND re.title != $1 AND ap.agent = $2", [region, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
    });
  }
};

Apartment.setDistricts = function (id_districts, email, fn) {

  pool.connect(function (err, client, done) {

    if (err) return fn(err);

    client.query("UPDATE users SET default_districts = $1 WHERE email = $2", [id_districts, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Apartment.oneCity = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM city WHERE id_city = $1", [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Apartment.getAllCity = function (fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_city, title, (SELECT title FROM region WHERE id_region = region_id) AS region FROM city ORDER BY title", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Apartment.setCity = function (id_city, email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE users SET default_city = $1 WHERE email = $2", [id_city, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Apartment.getAgentSelect = function (id_agency, id_moderator_agency, id_user, fn) {

  if (id_moderator_agency === id_agency) {

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

Apartment.getAgentAllSelect = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT user_id, (SELECT title FROM node WHERE id = agency), fio FROM users, userdata, role WHERE id_user = user_id AND role_id = id_role AND payment_price = 2 ORDER BY title, fio", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });

};

Apartment.getAgentAllSorting = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT user_id, fio, (SELECT title FROM node WHERE id = agency) FROM userdata WHERE user_id = ANY( SELECT DISTINCT agent FROM node, apartment WHERE id = node_id AND street = ANY( SELECT id_street FROM street WHERE city_id = $1 )) ORDER BY title, fio", [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });

};

Apartment.getAgentSorting = function (id_agency, id_moderator_agency, id_user, id_city, fn) {


  if (id_moderator_agency === id_agency) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT user_id, fio, (SELECT title FROM node WHERE id = agency) FROM userdata WHERE user_id = ANY( SELECT DISTINCT agent FROM node, apartment WHERE id = node_id AND street = ANY( SELECT id_street FROM street WHERE city_id = $1 AND agency = $2 )) ORDER BY title, fio", [id_city, id_agency], function (err, result) {
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

Apartment.getStreetSortingAgency = function (id_agency, id_moderator_agency, id_user, id_city, fn) {

  if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {


    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_street, street FROM street WHERE id_street = ANY(SELECT DISTINCT street FROM apartment WHERE agent = ANY(SELECT DISTINCT agent FROM apartment WHERE agent = ANY(SELECT user_id FROM users, userdata WHERE id_user = user_id AND agency = $1))) AND city_id = $2 ORDER BY street", [id_agency, id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_street, street FROM street WHERE id_street = ANY(SELECT DISTINCT street FROM apartment WHERE agent = ANY(SELECT DISTINCT agent FROM apartment WHERE agent = ANY(SELECT user_id FROM users, userdata WHERE id_user = user_id AND agency = $1 AND id_user = $3))) AND city_id = $2  ORDER BY street", [id_agency, id_city, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });
  }
};

Apartment.getStreetSortingUser = function (id_city, id_user, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM street WHERE id_street = ANY(SELECT DISTINCT id_street FROM apartment a, street s, city WHERE a.street = s.id_street AND s.city_id = id_city AND agent = $1 AND id_city = $2 ) ORDER BY street", [id_user, id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

Apartment.getCityNoDistricts = function (permission, regionID, id_agency, id_moderator_agency, id_user, fn) {


  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND districts_id IS NULL AND region_id = $1 ORDER BY title", [regionID], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND districts_id IS NULL AND region_id = $1 AND u.agency = $2 ORDER BY c.title", [regionID, id_agency], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND districts_id IS NULL AND region_id = $1 AND a.agent = $2 ORDER BY title", [regionID, id_user], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });
  }
};

Apartment.getMainCity = function(mainCity, permission, id_agency, id_moderator_agency, id_user, id_districts, fn){

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title = $1 AND districts_id = $2", [mainCity, id_districts], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if(permission.indexOf('0', 4) === 4){

    if (!id_agency) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title = $1 AND a.agent = $2 AND districts_id = $3", [mainCity, id_user, id_districts], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title = $1 AND u.agency = $2 AND districts_id = $3", [mainCity, id_agency, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });

      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title = $1 AND a.agent = $2 AND districts_id = $3", [mainCity, id_user, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }
    }
  }
};

Apartment.listFirstCity = function (mainCity, permission, id_agency, id_moderator_agency, id_user, id_districts, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title != $1 AND districts_id = $2 ORDER BY c.title", [mainCity, id_districts], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if(permission.indexOf('0', 4) === 4){

    if (!id_agency) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title != $1 AND a.agent = $2 AND districts_id = $3 ORDER BY c.title", [mainCity, id_user, id_districts], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

        pool.connect(function (err, client, done) {

          if (err) return fn(err);

          client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title != $1 AND u.agency = $2 AND districts_id = $3 ORDER BY c.title", [mainCity, id_agency, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });


      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT DISTINCT c.title, c.id_city, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND c.title != $1 AND a.agent = $2 AND districts_id = $3 ORDER BY c.title", [mainCity, id_user, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }
    }
  }
};

Apartment.getCityNoDistrictsLast = function (permission, regionID, id_agency, id_moderator_agency, id_user, fn) {
  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL) AND id_city IS NOT NULL AND districts_id IS NULL AND region_id = $1 ORDER BY title", [regionID], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

    pool.connect(function (err, client, done) {

      if (err) return fn(err);

      client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM apartment a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) AND id_city IS NOT NULL AND u.agency = $1) AND districts_id IS NULL AND region_id = $2 ORDER BY select_default, title", [ id_agency, regionID ], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND a.agent = $1) AND id_city IS NOT NULL AND districts_id IS NULL AND region_id = $2 ORDER BY title", [id_user, regionID], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  }
};

Apartment.listLastCity = function (permission, id_agency, id_moderator_agency, id_user, id_districts, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL) AND districts_id = $1 ORDER BY select_default, title", [id_districts], function (err, result) {
        done();

        if (err) return fn(err, null);

        fn(null, result);
      });
    });

  } else if(permission.indexOf('0', 4) === 4){

    if (!id_agency) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND a.agent = $1) AND districts_id = $2 ORDER BY select_default, title", [id_user, id_districts], function (err, result) {
          done();

          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

        pool.connect(function (err, client, done) {

          if (err) return fn(err);

          client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM apartment a LEFT JOIN userdata u ON (a.agent = u.user_id) LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) AND id_city IS NOT NULL AND u.agency = $1) AND districts_id = $2 ORDER BY select_default, title", [id_agency, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });


      } else {

        pool.connect(function (err, client, done) {

          if (err) return fn(err);

          client.query("SELECT id_city, title, CASE WHEN districts_id IS NOT NULL THEN (SELECT districts FROM districts WHERE id_districts = districts_id) ELSE '' END AS districts FROM city WHERE id_city = ANY(SELECT id_city FROM city EXCEPT SELECT DISTINCT c.id_city FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE id_city IS NOT NULL AND a.agent = $1) AND districts_id = $2 ORDER BY select_default, title", [id_user, id_districts], function (err, result) {
            done();

            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }
    }
  }
};

Apartment.listSaveEdit = function(id_city, section, permission, id_agency, id_moderator_agency, id_user, fn){

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, house, price FROM node LEFT JOIN apartment a ON(id = node_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 ORDER BY Улица, house, price", [section, id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });


  } else if(permission.indexOf('0', 4) === 4){

    if(!id_agency){

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, house, price  FROM node LEFT JOIN apartment a ON(id = node_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 AND a.agent = $3 ORDER BY Улица, house, price", [section, id_city, id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, house, price  FROM node LEFT JOIN apartment a ON(id = node_id) LEFT JOIN userdata ON(a.agent = user_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 AND agency = $3 ORDER BY Улица, house, price", [section, id_city, id_agency], function (err, result) {
            done();
            if (err) return fn(err, null);

            fn(null, result);
          });
        });

      } else {

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, house, price  FROM node LEFT JOIN apartment a ON(id = node_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 AND a.agent = $3 ORDER BY Улица, house, price", [section, id_city, id_user], function (err, result) {
            done();
            if (err) return fn(err, null);

            fn(null, result);
          });
        });
      }

    }
  }

};

Apartment.getCountAllPhoto = function (id_node, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE node_id_photo = $1", [id_node], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Apartment.deleteAllPhoto = function (id_node, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE node_id_photo = $1", [id_node], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

Apartment.getAddress = function (temp, id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT street, house, liter FROM "+temp+" WHERE node_id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        let street = result.rows[0].street;
        let house = result.rows[0].house;
        let liter = result.rows[0].liter;

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
};