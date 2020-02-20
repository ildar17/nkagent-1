let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = Helper;

function Helper(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Helper.prototype.saveDistricts = function (fn) {

  let helper = this;
  let districts = helper.title;
  let region = helper.region;


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO districts(districts, region_id)VALUES($1, $2)', [ districts, region ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.saveProject = function (fn) {

  let helper = this;
  let title = helper.title;
  let priority = null;
  if(helper.priority){
    priority = helper.priority * 1;
  }


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO project(title, priority)VALUES($1, $2)', [ title, priority ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.getRegion = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM region ORDER BY title', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.getAllDistricts = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_districts AS "Редактирование", districts AS "Название", (SELECT title FROM region WHERE id_region = region_id) AS' +
      ' "Область" FROM districts ORDER BY districts', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.getAllProject = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_project AS "Редактирование", title AS "Тип дома", priority AS "Приоритет" FROM project ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.getAllMaterial = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_material AS "Редактирование", title AS "Название", priority AS "Приоритет" FROM material ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.getAllCategoryLand = function (fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_category_land AS "Редактирование", title AS "Название", priority AS "Приоритет" FROM category_land ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.getAllToilet = function (fn) {

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_toilet AS "Редактирование", title AS "Название", priority AS "Приоритет" FROM toilet ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.getOneDistricts = function (fn) {

  let helper = this;


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM districts WHERE id_districts = $1', [ helper.id_districts ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.getOneProject = function (fn) {

  let helper = this;


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM project WHERE id_project = $1', [ helper.id_project ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.editProject = function (fn) {

  let helper = this;

  let priority = null;
  if(helper.priority){
    priority = helper.priority * 1;
  }

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE project SET title = $1, priority = $2 WHERE id_project = $3',
      [ helper.title, priority, helper.id_project ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.editDistricts = function (fn) {

  let helper = this;

  let id_districts = helper.id_districts;
  let districts = helper.districts;
  let region_id = helper.region_id ;

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE districts SET districts = $1, region_id = $2 WHERE id_districts = $3', [ districts, region_id, id_districts ], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });

  });
};


Helper.prototype.saveToilet = function (fn) {

  let toilet = this;
  let title = toilet.title;
  let priority = null;
  if(toilet.priority){
    priority = toilet.priority * 1;
  }


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO toilet(title, priority)VALUES($1, $2)', [ title, priority ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.saveMaterial = function (fn) {

  let material = this;
  let title = material.title;
  let priority = null;
  if(material.priority){
    priority = material.priority * 1;
  }


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO material(title, priority)VALUES($1, $2)', [ title, priority ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};


Helper.prototype.saveCategoryLand = function (fn) {

  let categoryLand = this;
  let title = categoryLand.title;
  let priority = null;
  if(categoryLand.priority){
    priority = categoryLand.priority * 1;
  }


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO category_land(title, priority)VALUES($1, $2)', [ title, priority ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};


Helper.prototype.getOneToilet = function (fn) {

  let toilet = this;


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM toilet WHERE id_toilet = $1', [ toilet.id_toilet ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.getOneMaterial = function (fn) {

  let material = this;


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM material WHERE id_material = $1', [ material.id_material ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.getOneCategoryLand = function (fn) {
  let category_land = this;


  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM category_land WHERE id_category_land = $1', [ category_land.id_category_land ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.editToilet = function (fn) {

  let helper = this;

  let priority = null;
  if(helper.priority){
    priority = helper.priority * 1;
  }

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE toilet SET title = $1, priority = $2 WHERE id_toilet = $3',
      [ helper.title, priority, helper.id_toilet ], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });

  });
};

Helper.prototype.editMaterial = function (fn) {

  let helper = this;

  let priority = null;
  if(helper.priority){
    priority = helper.priority * 1;
  }

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE material SET title = $1, priority = $2 WHERE id_material = $3',
      [ helper.title, priority, helper.id_material ], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });

  });
};

Helper.prototype.editCategoryLand = function (fn) {

  let helper = this;

  let priority = null;
  if(helper.priority){
    priority = helper.priority * 1;
  }

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE category_land SET title = $1, priority = $2 WHERE id_category_land = $3',
      [ helper.title, priority, helper.id_category_land ], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });

  });
};

Helper.prototype.getProjectApartment = function (fn) {

  let helper = this;

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node, apartment WHERE id = node_id AND project = $1', [ helper.id_project ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};


Helper.prototype.dropProject = function (fn) {

  let helper = this;

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM project WHERE id_project = $1', [ helper.id_project ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.getToiletApartment = function (fn) {

  let helper = this;

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node, apartment WHERE id = node_id AND toilet = $1', [ helper.id_toilet ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.getMaterialCottages = function (fn) {

  let helper = this;

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node, cottages WHERE id = node_id AND material = $1', [ helper.id_material ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};


Helper.prototype.dropToilet = function (fn) {

  let helper = this;

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM toilet WHERE id_toilet = $1', [ helper.id_toilet ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.prototype.dropMaterial = function (fn) {

  let helper = this;

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM material WHERE id_material = $1', [ helper.id_material ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.dropCategoryLand = function (id_category_land, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM category_land WHERE id_category_land = $1', [ id_category_land ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};


Helper.connectedCity = function (districts_id, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE city SET districts_id = null WHERE districts_id = $1', [ districts_id ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Helper.deleteDistricts = function (districts_id, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM districts WHERE id_districts = $1', [ districts_id ], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

