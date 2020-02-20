let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

module.exports = Parser;

function Parser(obj) {
	for (var key in obj) {
		this[key] = obj[key];
	}
}

Parser.list = function (fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT id as "Редактирование", street as "Улица", house as "Дом", liter as "Лит", storey as' +
			' "Этаж", project as' +
			' "Пр-т", price as "Цена", area as "Площадь", toilet as "с/у", balcony as "Балкон", op as "ОП",' +
			' note as "Примечание", tel as "Тел. агенства, Риэлтора", section as "Раздел" FROM parser' +
			' ORDER BY id', function (err, result) {
				done();
				if (err) return fn(err, null);

        fn(null, result);

			});
	});
};

Parser.listLimit = function (limit, offset, fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id as "Редактирование", street as "Улица", house as "Дом", liter as "Лит", storey as' +
      ' "Этаж", project as' +
      ' "Пр-т", price as "Цена", area as "Площадь", toilet as "с/у", balcony as "Балкон", op as "ОП",' +
      ' note as "Примечание", tel as "Тел. агенства, Риэлтора", section as "Раздел" FROM parser' +
      ' ORDER BY id LIMIT $1 OFFSET $2', [limit, offset], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

Parser.prototype.getOneRecord = function (fn) {

	var parser = this;

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT * FROM parser WHERE id = $1', [parser.id], function (err, result) {
				done();
				if (err) return fn(err, null);

				if(result.rowCount > 0){
					fn(null, result.rows[0]);
				} else {
					fn(null, null);
				}
		});
	});
};

Parser.prototype.getUser = function (fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query("SELECT id_user, tel, fio AS fio1 FROM users, userdata WHERE id_user = user_id AND role_id IN(6, 5) ORDER by fio", function (err, result) {
			done();
			if (err) return fn(err, null);

				fn(null, result);


		});
	});
};

Parser.setCity = function (id_city, email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE users SET default_city = $1 WHERE email = $2", [id_city, email], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Parser.oneCity = function (id_city, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM city WHERE id_city = $1", [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Parser.getAllCity = function (fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_city, title, (SELECT title FROM region WHERE id_region = region_id) AS region FROM city ORDER BY title", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });

  });
};

Parser.getMainCity = function(mainCity, permission, id_agency, id_moderator_agency, id_user, fn){

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title = $1", [mainCity], function (err, result) {
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

Parser.listCity = function (mainCity, permission, id_agency, id_moderator_agency, id_user, fn) {

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT DISTINCT c.id_city, (SELECT title FROM city WHERE id_city = c.id_city), (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM city WHERE id_city = c.id_city ) AS region, count(*) OVER (PARTITION BY c.title) AS sum FROM apartment a LEFT JOIN street s ON (a.street = s.id_street) LEFT JOIN city c ON (s.city_id = c.id_city) WHERE c.title != $1 ORDER BY title", [mainCity], function (err, result) {
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

Parser.prototype.getStreet = function (id_city, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_street, districts, ci.title AS city, street FROM street s LEFT JOIN city ci ON (s.city_id = ci.id_city) LEFT JOIN districts d ON (ci.districts_id = d.id_districts) LEFT JOIN region r ON (ci.region_id = r.id_region) LEFT JOIN country c ON (r.country_id = c.id) WHERE id_city = $1 ORDER BY s.street', [id_city], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Parser.distStreet = function (fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT DISTINCT street FROM parser ORDER BY street', function (err, result) {
			done();
			if (err) return fn(err, null);

			fn(null, result);


		});
	});
};

Parser.earthStreet = function (fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT * FROM street ORDER BY street', function (err, result) {
			done();
			if (err) return fn(err, null);

			fn(null, result);


		});
	});
};

Parser.getAllToilet = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM toilet ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Parser.getAllProject = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM project ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Parser.selectSection = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT section_id, (SELECT title FROM node WHERE id = section_id) as section FROM sectionandtemplate WHERE template_name = 'apartment'", function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Parser.earthStreet1 = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_street, districts, ci.title AS sity, street FROM street s LEFT JOIN city ci ON (s.city_id = ci.id_city) LEFT JOIN districts d ON (ci.districts_id = d.id_districts) LEFT JOIN region r ON (ci.region_id = r.id_region) LEFT JOIN country c ON (r.country_id = c.id) ORDER BY ci.title, street', function (err, result) {
      done();
      if(err) return fn(err, null);
      return fn(null, result);
    });
  });

};

Parser.getSection = function (alias, fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE alias = $1', [ alias ], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Parser.getTitleSection = function (section, fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT title FROM node WHERE id = $1", [section], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Parser.prototype.save = function (fn) {
  let apartment = this;

  let id_parser = apartment.id_parser;


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
  let op = apartment.value.op;
  let project  = apartment.value.project * 1;
  let toilet  = apartment.value.toilet * 1;
  let balcony  = apartment.value.balcony;
  let note  = apartment.value.note;


  if(op === ''){
    op = null;
  }

  if(!status){
    status = 0;
  }

  if(!main){
    main = 0;
  }

  if(liter === ''){
    liter = null;
  }

  if(area2 === 0){
    area2 = null;
  }

  if(area3 === 0){
    area3 = null;
  }

  if(project === 0){
    project = null;
  }

  if(toilet === 0){
    toilet = null;
  }

  if(balcony  === ''){
    balcony = null;
  }

  if(note  === ''){
    note = null;
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
   console.log('house', typeof(house), house);
   console.log('liter', typeof(liter), liter);
   console.log('storey', typeof(storey), storey);
   console.log('numstorey', typeof(numstorey), numstorey);
   console.log('price', typeof(price), price);
   console.log('area1', typeof(area1), area1);
   console.log('area2', typeof(area2), area2);
   console.log('area3', typeof(area3), area3);
   console.log('op', typeof(op), op);
   console.log('project', typeof(project), project);
   console.log('toilet', typeof(toilet), toilet);
   console.log('balcony', typeof(balcony), balcony);
   console.log('note', typeof(note), note);*/



/*  co(function * () {
    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('INSERT INTO node (title, date_create, author, status, main, template, section) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [ title, date_create, author, status, main, template, section ]);

      let id = result.rows[0].id;

      let result1 = yield client.query('INSERT INTO apartment (type, agent, street, house, liter, storey, numstorey, price, area1, area2, area3, op, project, toilet, balcony, note, node_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)', [ type, agent, street, house, liter, storey, numstorey, price, area1, area2, area3, op, project, toilet, balcony, note, id ]);

      let result2 = yield client.query('UPDATE node SET alias = $1 WHERE id = $2', [ id, id ]);

      let result3 = yield client.query('DELETE FROM parser WHERE id = $1', [ id_parser ]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result3);

    } catch(e) {

      client.release(true);
      return fn(e, null);
    }

  })*/

  (async () => {

    const client = await pool.connect();

    try {

      await client.query('BEGIN');

      let result = await client.query('INSERT INTO node (title, date_create, author, status, main, template, section) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [ title, date_create, author, status, main, template, section ]);

      let id = result.rows[0].id;

      let result1 = await client.query('INSERT INTO apartment (type, agent, street, house, liter, storey, numstorey, price, area1, area2, area3, op, project, toilet, balcony, note, node_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)', [ type, agent, street, house, liter, storey, numstorey, price, area1, area2, area3, op, project, toilet, balcony, note, id ]);

      let result2 = await client.query('UPDATE node SET alias = $1 WHERE id = $2', [ id, id ]);

      let result3 = await client.query('DELETE FROM parser WHERE id = $1', [ id_parser ]);

      await client.query('COMMIT');
      client.release();

      return fn(null, result3);

    } catch (err) {
      await client.query('ROLLBACK');
      return fn(err, null);
    }
  })()
};

