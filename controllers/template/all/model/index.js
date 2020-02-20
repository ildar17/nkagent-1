let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let nav = require('../../../../lib/navigation');
let ms = require('../../../../lib/msDate');

module.exports = All;

function All(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}


All.list = function (inAgent, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT (SELECT DISTINCT node_id_photo FROM photo WHERE id = node_id_photo) AS photo, id AS \"Редактирование-Карта\", (SELECT title FROM" +
      " node WHERE id = type) AS Тип, title AS Заголовок, date_create AS ДатаВнесения, date_edit AS ДатаПравки, (SELECT (SELECT title FROM city WHERE id_city = s.city_id) FROM street s WHERE s.id_street = c.street) AS Город, (SELECT s.street FROM street s WHERE s.id_street = c.street) AS Улица, house AS Дом, price AS Цена, note AS Примечание, (SELECT fio FROM userdata WHERE user_id = agent ) AS \"Ф.И.О.\"  FROM complete c WHERE template IN('apartment','cottages','commercial') AND agent "+inAgent+" ORDER by template, section, title, Улица", function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

All.getAgent = function (id_agency, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT DISTINCT user_id FROM userdata WHERE agency = $1",[id_agency], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

All.getObject = function (id, fn) {


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node WHERE id = $1",[id], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0){

        let temp = result.rows[0].template;

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT * FROM node LEFT JOIN "+temp+" ON(id = node_id) WHERE id = $1", [id], function (err, result) {
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

All.setCity = function (id_user, street, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT city_id, (SELECT districts_id FROM city WHERE id_city = city_id) FROM street WHERE id_street = $1", [street], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rowCount > 0) {

        let city_id = result.rows[0].city_id;
        let districts_id = result.rows[0].districts_id;


        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("UPDATE users SET default_districts = $1 WHERE id_user = $2", [districts_id, id_user], function (err, result) {
            done();
            if (err) return fn(err, null);


            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query("UPDATE users SET default_city = $1 WHERE id_user = $2", [city_id, id_user], function (err, result) {
                done();
                if (err) return fn(err, null);

                fn(null, result);
              });

            });


          });

        });


      } else {
        fn(null, null);
      }

    });

  });
};

All.listSaveEdit = function(template, id_city, section, permission, id_agency, id_moderator_agency, id_user, fn){

  if(permission.indexOf('1', 4) === 4){

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, price FROM node LEFT JOIN "+template+" a ON(id = node_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 ORDER BY Улица, price", [section, id_city], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
    });


  } else if(permission.indexOf('0', 4) === 4){


    if (id_agency === id_moderator_agency && id_agency!==0 && id_moderator_agency!==0) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, price  FROM node LEFT JOIN "+template+" a ON(id = node_id) LEFT JOIN userdata ON(a.agent = user_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 AND agency = $3 ORDER BY Улица, price", [section, id_city, id_agency], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });

    } else {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query("SELECT id, (SELECT street FROM street WHERE id_street = a.street) AS Улица, price  FROM node LEFT JOIN "+template+" a ON(id = node_id) LEFT JOIN street s ON(a.street = s.id_street) WHERE section = $1 AND s.city_id = $2 AND a.agent = $3 ORDER BY Улица, price", [section, id_city, id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          fn(null, result);
        });
      });
    }
  }
};

All.prototype.getIdNode = function (fn) {

  let all = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1', [all.id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);
    });
  });
};

All.getIdAgent = function (template, id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT agent FROM node, "+template+" WHERE id = node_id AND id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

All.deleteObject = function (id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM node WHERE id = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

All.getIdAgency = function (id_user, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT agency FROM userdata WHERE user_id = $1", [id_user], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

All.getCountAllPhoto = function (id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM photo WHERE node_id_photo = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

All.deleteAllPhoto = function (id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("DELETE FROM photo WHERE node_id_photo = $1", [id], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);

    });
  });
};

All.tableListComplete = function (agent, result) {

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

        if (result.fields[i].name === 'Редактирование-Карта') {

          let rowCols = row[cols];

          if(idPhoto){
            btn = 'btn-success';
          } else {
            btn = 'btn-danger'
          }

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/all?edit=' + rowCols + '"><span class="glyphicon' +
            ' glyphicon-pencil" aria-hidden="true"></span></a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/all?drop=' + rowCols + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>';

          str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto='+rowCols+'" role="button" class="btn '+btn+' btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';

          str += '<a data-fancybox data-type="ajax" data-src="/admin/template/all?map='+rowCols+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';


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

All.getAddress = function (id, fn) {

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
