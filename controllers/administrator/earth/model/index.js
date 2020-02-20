let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let fs = require('fs');

module.exports = Earth;

function Earth(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Earth.getEarthMap = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT c.title AS "Страна", (SELECT title FROM city WHERE id_city = c.metropolis) AS "Столица", c.alias AS "Псевдоним страны", r.title AS "Область", (SELECT title FROM city WHERE id_city = r.regional_city) AS "Административный центр", r.alias AS "Псевдоним области", (SELECT districts FROM districts WHERE id_districts =' +
      ' ci.districts_id) AS "Район, Округ", ci.title AS "Город", (SELECT count(metro) FROM metro WHERE city_id = ci.id_city) AS "Метро", (SELECT count(district) FROM district WHERE city_id = ci.id_city) AS "Район", (SELECT count(street) FROM street WHERE city_id = ci.id_city) AS "Улица", ci.alias AS "Псевдоним города" FROM country c LEFT JOIN region r ON(c.id = r.country_id) LEFT JOIN city ci ON(r.id_region = ci.region_id) ORDER BY c.title, r.title, ci.title', function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });

};

Earth.getEarthMap1 = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT c.title AS Страна, r.title AS Область, districts AS РайонОкруг, ci.title AS Город, street AS Улица, id_city FROM street s LEFT JOIN city ci ON (s.city_id = ci.id_city) LEFT JOIN districts d ON (ci.districts_id = d.id_districts) LEFT JOIN region r ON (ci.region_id = r.id_region) LEFT JOIN country c ON (r.country_id = c.id) ORDER BY Страна, Область, Город, Улица', function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });

};


Earth.prototype.getOneCountry = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM country WHERE id = $1', [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });

};

Earth.prototype.getOneRegion = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM region WHERE id_region = $1', [earth.id_region], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.getOneCity = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM city WHERE id_city = $1', [earth.id_city], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.getOneMetro = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM metro WHERE id_metro = $1', [earth.id_metro], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.getOneDistrict = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM district WHERE id_district = $1', [earth.id_district], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.getOneStreet = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM street WHERE id_street = $1', [earth.id_street], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.getAllCountry = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id AS "Редактирование", title AS "Страна", (SELECT title FROM city WHERE' +
      ' id_city = metropolis) AS "Столица",' +
      ' alias AS' +
      ' "Псевдоним"' +
      ' FROM country ORDER BY title', function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.getAllRegion = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_region AS "Редактирование", title AS "Область", ' +
      '(SELECT title FROM city WHERE id_city = regional_city) AS "Административный' +
      ' центр", alias AS "Псевдоним", (SELECT title FROM country WHERE id = country_id) ' +
      'AS "Страна" FROM region WHERE country_id = $1 ORDER BY title', [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Earth.prototype.getAllCity = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_city AS "Редактирование", (SELECT title FROM region WHERE id_region = region_id) AS "Область", (SELECT districts FROM districts WHERE id_districts = districts_id) AS "РайонОкруг", title AS "Поселение", alias AS "Псевдоним", (SELECT count(metro) FROM metro WHERE city_id = id_city) AS "Метро",' +
      ' (SELECT' +
      ' count(district) FROM district WHERE city_id = id_city) AS "Районы",  (SELECT count(street) FROM street WHERE city_id = id_city) AS "Улицы" FROM city WHERE region_id = $1 ORDER BY title', [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });

};

Earth.getDistricts = function (region, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM districts WHERE region_id = $1', [region], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Earth.prototype.isset = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node WHERE alias = $1',
      [earth.alias], function (err, result) {
        done();
        if (err) return fn(err, null);

        if (result.rowCount > 0) {
          return fn(null, 0);
        } else {
          return fn(null, 1);
        }
      });
  });
};

Earth.prototype.saveCountry = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO country ( title, alias ) VALUES ( $1, $2 )',
      [earth.title, earth.alias], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.saveRegion = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO region ( title, alias, country_id ) VALUES ( $1, $2, $3 )',
      [earth.title, earth.alias, earth.id_country], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.saveCity = function (fn) {

  let earth = this;
  let districts = earth.id_districts;
  if (!districts) {
    districts = null;
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO city ( title, alias, region_id, districts_id ) VALUES ( $1, $2, $3, $4 )',
      [earth.title, earth.alias, earth.id_region, districts], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.saveMetro = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO metro ( metro, city_id ) VALUES ( $1, $2 )',
      [earth.title, earth.city_id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.saveDistrict = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO district ( district, city_id ) VALUES ( $1, $2 )',
      [earth.title, earth.city_id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.saveStreet = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO street ( street, city_id ) VALUES ( $1, $2 )',
      [earth.title, earth.city_id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.editCountry = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE country SET title = $1, alias = $2, metropolis = $3 WHERE id = $4",
      [earth.title, earth.alias, earth.metropolis, earth.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.editRegion = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE region SET title = $1, alias = $2, regional_city = $3 WHERE id_region = $4",
      [earth.title, earth.alias, earth.regional_city, earth.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.editCity = function (fn) {

  let earth = this;

  let districts = earth.districts_id;
  if (!districts) {
    districts = null;
  }


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE city SET title = $1, alias = $2, districts_id = $3 WHERE id_city = $4",
      [earth.title, earth.alias, districts, earth.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.editMetro = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE metro SET metro = $1 WHERE id_metro = $2",
      [earth.title, earth.id_metro], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.editDistrict = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE district SET district = $1 WHERE id_district = $2",
      [earth.title, earth.id_district], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.editStreet = function (fn) {

  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("UPDATE street SET street = $1 WHERE id_street = $2",
      [earth.title, earth.id_street], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Earth.prototype.dropCountry = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_region FROM region WHERE country_id = $1", [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      let inId = '';

      for (let i = 0; i < result.rows.length; i++) {
        inId += result.rows[i].id_region + ', '
      }

      inId = inId.slice(0, -2);

      if (inId) {
        inId = 'IN(' + inId + ')';
      } else {
        inId = 'IN(0)';
      }

      let inIdRegion = inId;

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id_city FROM city WHERE region_id " + inId, function (err, result) {
          done();
          if (err) return fn(err, null);

          let inId = '';

          for (let i = 0; i < result.rows.length; i++) {

            inId += result.rows[i].id_city + ', '
          }

          inId = inId.slice(0, -2);

          if (inId) {
            inId = 'IN(' + inId + ')';
          } else {
            inId = 'IN(0)';
          }

          let inIdCity = inId;

          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query("SELECT id_street FROM street WHERE city_id " + inId, function (err, result) {
              done();
              if (err) return fn(err, null);

              let inId = '';

              for (let i = 0; i < result.rows.length; i++) {

                inId += result.rows[i].id_street + ', '
              }

              inId = inId.slice(0, -2);

              if (inId) {
                inId = 'IN(' + inId + ')';
              } else {
                inId = 'IN(0)';
              }

              pool.connect(function (err, client, done) {
                if (err) return fn(err);

                client.query("SELECT id FROM complete WHERE street " + inId, function (err, result) {
                  done();
                  if (err) return fn(err, null);

                  let inId = '';

                  for (let i = 0; i < result.rows.length; i++) {

                    inId += result.rows[i].id + ', '
                  }

                  inId = inId.slice(0, -2);

                  if (inId) {
                    inId = 'IN(' + inId + ')';
                  } else {
                    inId = 'IN(0)';
                  }

                  Earth.dropPhoto(inId, function (err, result1, result) {
                    if (err) return fn(err, null);

                    if(result1){
                      if(result1.rowCount > 0){

                        for(let i = 0; i < result.rows.length; i++){
                          fs.unlinkSync(result.rows[i].path_photo);
                        }
                      }
                    }

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query("DELETE FROM node WHERE id " + inId, function (err, result) {
                        done();
                        if (err) return fn(err, null);

                        pool.connect(function (err, client, done) {
                          if (err) return fn(err);

                          client.query("DELETE FROM district WHERE city_id " + inIdCity, function (err, result) {
                            done();
                            if (err) return fn(err, null);
                            pool.connect(function (err, client, done) {
                              if (err) return fn(err);

                              client.query("DELETE FROM metro WHERE city_id  " + inIdCity, function (err, result) {
                                done();
                                if (err) return fn(err, null);

                                pool.connect(function (err, client, done) {
                                  if (err) return fn(err);

                                  client.query("DELETE FROM street WHERE city_id  " + inIdCity, function (err, result) {
                                    done();
                                    if (err) return fn(err, null);

                                    pool.connect(function (err, client, done) {
                                      if (err) return fn(err);

                                      client.query("DELETE FROM city WHERE id_city " + inIdCity, function (err, result) {
                                        done();
                                        if (err) return fn(err, null);

                                        pool.connect(function (err, client, done) {
                                          if (err) return fn(err);

                                          client.query("DELETE FROM region WHERE id_region " + inIdRegion, function (err, result) {
                                            done();
                                            if (err) return fn(err, null);

                                            pool.connect(function (err, client, done) {
                                              if (err) return fn(err);

                                              client.query("DELETE FROM country WHERE id = $1", [earth.id], function (err, result) {
                                                done();
                                                if (err) return fn(err, null);
                                                return fn(null, result);
                                              });
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

Earth.prototype.dropRegion = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_city FROM city WHERE region_id = $1", [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      let inId = '';

      for (let i = 0; i < result.rows.length; i++) {

        inId += result.rows[i].id_city + ', '
      }

      inId = inId.slice(0, -2);

      if (inId) {
        inId = 'IN(' + inId + ')';
      } else {
        inId = 'IN(0)';
      }

      let inIdCity = inId;

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id_street FROM street WHERE city_id " + inId, function (err, result) {
          done();
          if (err) return fn(err, null);

          let inId = '';

          for (let i = 0; i < result.rows.length; i++) {

            inId += result.rows[i].id_street + ', '
          }

          inId = inId.slice(0, -2);

          if (inId) {
            inId = 'IN(' + inId + ')';
          } else {
            inId = 'IN(0)';
          }

          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query("SELECT id FROM complete WHERE street " + inId, function (err, result) {
              done();
              if (err) return fn(err, null);

              let inId = '';

              for (let i = 0; i < result.rows.length; i++) {

                inId += result.rows[i].id + ', '
              }

              inId = inId.slice(0, -2);

              if (inId) {
                inId = 'IN(' + inId + ')';
              } else {
                inId = 'IN(0)';
              }

              Earth.dropPhoto(inId, function (err, result1, result) {
                if (err) return fn(err, null);

                if(result1){
                  if(result1.rowCount > 0){

                    for(let i = 0; i < result.rows.length; i++){
                      fs.unlinkSync(result.rows[i].path_photo);
                    }
                  }
                }

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query("DELETE FROM node WHERE id " + inId, function (err, result) {
                    done();
                    if (err) return fn(err, null);

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query("DELETE FROM district WHERE city_id " + inIdCity, function (err, result) {
                        done();
                        if (err) return fn(err, null);
                        pool.connect(function (err, client, done) {
                          if (err) return fn(err);

                          client.query("DELETE FROM metro WHERE city_id  " + inIdCity, function (err, result) {
                            done();
                            if (err) return fn(err, null);

                            pool.connect(function (err, client, done) {
                              if (err) return fn(err);

                              client.query("DELETE FROM street WHERE city_id  " + inIdCity, function (err, result) {
                                done();
                                if (err) return fn(err, null);

                                pool.connect(function (err, client, done) {
                                  if (err) return fn(err);

                                  client.query("DELETE FROM city WHERE id_city " + inIdCity, function (err, result) {
                                    done();
                                    if (err) return fn(err, null);

                                    pool.connect(function (err, client, done) {
                                      if (err) return fn(err);

                                      client.query("DELETE FROM region WHERE id_region = $1", [earth.id], function (err, result) {
                                        done();
                                        if (err) return fn(err, null);

                                        return fn(null, result);

                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

Earth.prototype.dropCity = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id_street FROM street WHERE city_id = $1", [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      let inId = '';

      for (let i = 0; i < result.rows.length; i++) {

        inId += result.rows[i].id_street + ', '
      }

      inId = inId.slice(0, -2);

      if (inId) {
        inId = 'IN(' + inId + ')';
      } else {
        inId = 'IN(0)';
      }

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id FROM complete WHERE street " + inId, function (err, result) {
          done();
          if (err) return fn(err, null);

          let inId = '';

          for (let i = 0; i < result.rows.length; i++) {

            inId += result.rows[i].id + ', '
          }

          inId = inId.slice(0, -2);

          if (inId) {
            inId = 'IN(' + inId + ')';
          } else {
            inId = 'IN(0)';
          }

          Earth.dropPhoto(inId, function (err, result1, result) {
            if (err) return fn(err, null);

            if(result1){
              if(result1.rowCount > 0){

                for(let i = 0; i < result.rows.length; i++){
                  fs.unlinkSync(result.rows[i].path_photo);
                }
              }
            }

            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query("DELETE FROM node WHERE id " + inId, function (err, result) {
                done();
                if (err) return fn(err, null);

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query("DELETE FROM district WHERE city_id = $1", [earth.id], function (err, result) {
                    done();
                    if (err) return fn(err, null);
                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query("DELETE FROM metro WHERE city_id = $1", [earth.id], function (err, result) {
                        done();
                        if (err) return fn(err, null);

                        pool.connect(function (err, client, done) {
                          if (err) return fn(err);

                          client.query("DELETE FROM street WHERE city_id = $1", [earth.id], function (err, result) {
                            done();
                            if (err) return fn(err, null);

                            pool.connect(function (err, client, done) {
                              if (err) return fn(err);

                              client.query("UPDATE region SET regional_city = null WHERE regional_city = $1", [earth.id], function (err, result) {
                                done();
                                if (err) return fn(err, null);

                                pool.connect(function (err, client, done) {
                                  if (err) return fn(err);

                                  client.query("UPDATE country SET metropolis = null WHERE metropolis = $1", [earth.id], function (err, result) {
                                    done();
                                    if (err) return fn(err, null);

                                    pool.connect(function (err, client, done) {
                                      if (err) return fn(err);

                                      client.query("DELETE FROM city WHERE id_city = $1", [earth.id], function (err, result) {
                                        done();
                                        if (err) return fn(err, null);
                                        return fn(null, result);

                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

Earth.prototype.dropStreet = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id FROM complete WHERE street = $1 ", [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      let inId = '';

      for (let i = 0; i < result.rows.length; i++) {

        inId += result.rows[i].id + ', '
      }

      inId = inId.slice(0, -2);

      inId = 'IN(' + inId + ')';

      Earth.dropPhoto(inId, function (err, result1, result) {
        if (err) return fn(err, null);

        if(result1){
          if(result1.rowCount > 0){

            for(let i = 0; i < result.rows.length; i++){
              fs.unlinkSync(result.rows[i].path_photo);
            }
          }
        }

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("DELETE FROM node WHERE id " + inId, function (err, result) {
            done();
            if (err) return fn(err, null);

            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query("DELETE FROM street WHERE id_street = $1", [earth.id], function (err, result) {
                done();
                if (err) return fn(err, null);

                return fn(null, result);

              });
            });
          });
        });
      });
    });
  });
};

Earth.dropPhoto = function (inId, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE node_id_photo " + inId, function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("DELETE FROM photo WHERE node_id_photo " + inId, function (err, result1) {
            done();
            if (err) return fn(err, null);

            return fn(err, result1, result);

          });
        });

      } else {
        return fn(null, null);
      }
    });
  });
};

Earth.prototype.dropMetro = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM metro WHERE id_metro = $1", [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Earth.prototype.dropDistrict = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM district WHERE id_district = $1", [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};


Earth.prototype.selectRegionNull = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT count(ci.title) FROM country c LEFT JOIN region r ON(c.id = r.country_id) LEFT JOIN city ci ON(r.id_region = ci.region_id) WHERE r.id_region = $1', [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.selectCountryNull = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT count(ci.title) FROM country c LEFT JOIN region r ON(c.id = r.country_id) LEFT JOIN city ci ON(r.id_region = ci.region_id) WHERE c.id = $1', [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.selectCityForCountry = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT c.id, c.metropolis, id_city, ci.title FROM country c LEFT JOIN region r ON(c.id = r.country_id) LEFT JOIN city ci ON(r.id_region = ci.region_id) WHERE c.id = $1 ORDER BY c.title, ci.title', [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.selectCityForRegion = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT c.id, c.title, c.metropolis, c.alias, r.id_region, r.title, r.regional_city, r.alias, ci.id_city, ci.title, ci.alias FROM country c LEFT JOIN region r ON(c.id = r.country_id) LEFT JOIN city ci ON(r.id_region = ci.region_id) WHERE r.id_region = $1 ORDER BY c.title, ci.title', [earth.id], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.getAllMetro = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_metro AS "Редактирование", metro AS "Метро" FROM metro WHERE city_id = $1 ORDER BY metro', [earth.city_id], function (err, result) {
      done();
      if (err) return fn(err, null);
      return fn(null, result);
    });
  });
};

Earth.prototype.getAllDistrict = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_district AS "Редактирование", district AS "Район" FROM district WHERE city_id = $1 ORDER BY district', [earth.city_id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Earth.prototype.getAllStreet = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_street AS "Редактирование", street AS "Улица" FROM street WHERE city_id = $1 ORDER BY street', [earth.city_id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Earth.prototype.getMetroMetro = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM metro WHERE metro = $1 AND city_id = $2', [earth.title, earth.city_id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Earth.prototype.getDistrictDistrict = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM district WHERE district = $1 AND city_id = $2', [earth.title, earth.city_id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

Earth.prototype.getStreetStreet = function (fn) {
  let earth = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM street WHERE street = $1 AND city_id = $2', [earth.title, earth.city_id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

