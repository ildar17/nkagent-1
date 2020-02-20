let conf = require('../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);


module.exports = Permit;

function Permit(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Permit.prototype.init = function (fn) {

  let init = this;
  let arrUrl = init.url.split('/');
  let temp = arrUrl[arrUrl.length - 1];
  let submit = {};

  function action1() {
    for (let key in init.submit) {
      submit = init.submit[key];
    }
    noend();
  }

  function action2() {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT temp FROM permit WHERE temp = $1', [temp], function (err, result) {
        done();
        if (err) return fn(err, null);

        if (result.rowCount === 1) {

          if (submit.tune) {

            if (submit.browse === undefined) submit.browse = 0;
            if (submit.make === undefined) submit.make = 0;
            if (submit.update === undefined) submit.update = 0;
            if (submit.delete === undefined) submit.delete = 0;
            if (submit.publication === undefined) submit.publication = 0;

            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query('UPDATE permit SET browse = $1,  make = $2, update = $3,  delete = $4, publication = $5 WHERE temp = $6',
                [submit.browse, submit.make, submit.update, submit.delete, submit.publication, temp], function (err, resultUPDATE) {
                  done();
                  if (err) return fn(err, null);
                  fn(null, resultUPDATE);
                });
            });

          } else {
            fn(null, result);
          }
        }

        if (result.rowCount === 0) {

          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query('INSERT INTO permit (temp, url_temp) VALUES ($1, $2)', [temp, init.url], function (err, resultINSERT) {
              done();
              if (err) return fn(err, null);

              fn(null, resultINSERT);

            });
          });
        }
      });
    });
  }


  let tasks = [action1, action2];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

Permit.prototype.form = function (fn) {

  let form = this;
  let arrUrl = form.url.split('/');
  let temp = arrUrl[arrUrl.length - 1];

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM permit WHERE temp = $1', [temp], function (err, result) {
      done();
      if (err) return fn(err, null);

      if (result.rowCount === 1) {

        let browse = result.rows[0].browse;
        let make = result.rows[0].make;
        let updat = result.rows[0].update;
        let delet = result.rows[0].delete;
        let publication = result.rows[0].publication;


        let str = '';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (browse !== 0) str += ' checked ';
        str += 'name="' + temp + '[browse]" value="1"> Редактировать всех</p>' + '\n';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (make !== 0) str += ' checked ';
        str += 'name="' + temp + '[make]" value="10"> Сохранять, добавлять</p>' + '\n';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (updat !== 0) str += ' checked ';
        str += ' name="' + temp + '[update]" value="100"> Править, редактировать</p>' + '\n';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (delet !== 0) str += ' checked ';
        str += 'name="' + temp + '[delete]" value="1000"> Удалять</p>' + '\n';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (publication !== 0) str += ' checked ';
        str += 'name="' + temp + '[publication]" value="10000"> Публиковать</p>' + '\n';
        str += '<span class="commentForm" > Внимание! после снятия галочек с пунктов, нужно перенастроить роли.</span>' + '\n';

        str += '\t\t\t' + '<p><input class="permit_btn" type="submit" name="' + temp + '[tune]" value="Настроить" /></p>' + '\n';


        fn(null, str);

      } else {
        fn(null, result);
      }

    });
  });
};

Permit.getPermit = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_permit as id, name as "Название раздела", temp as "Псевдоним шаблона", ' +
      'url_temp as "Адрес страницы", browse as "Редактировать всех", ' +
      'make as "Сохранять добавлять", update as "Править редактировать", delete as Удалять, ' +
      'publication as Публиковать FROM permit ORDER BY priority DESC', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

Permit.getOneRole = function (id_role, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM role WHERE id_role = $1', [id_role], function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });
  });
};

Permit.setAccess = function (id_role, id_permit, code, fn) {

  function action1() {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT * FROM access WHERE permit_id = $1 and role_id = $2',
        [id_permit, id_role], function (err, result) {
          done();
          if (err) return fn(err, null);
          noend(result);
        });
    });
  }


  function action2(result) {

    if (result.rowCount > 0) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('UPDATE access SET code = $1 WHERE permit_id = $2 and role_id = $3',
          [code, id_permit, id_role], function (err, result1) {
            done();
            if (err) return fn(err, null);

            fn(null, result1);
          });
      });

    } else if (result.rowCount === 0) {

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('INSERT INTO  access (code, permit_id, role_id) VALUES ($1, $2, $3)',
          [code, id_permit, id_role], function (err, result2) {
            done();
            if (err) return fn(err, null);

            fn(null, result2);
          });
      });
    }
  }

  let tasks = [action1, action2];

  function noend(result) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(result);
  }

  noend();
};

Permit.prototype.access = function (fn) {

  let access = this;

  let idUser = null;
  let dateNow = null;
  let date_payment_price = null;
  let id_role = null;

  if (access.email === conf.get('administrator')) {

    return fn(null, '11111');

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id_role FROM role WHERE users = 1', function (err, result) {
        done();
        if (err) return fn(err, null);

        if (result.rowCount > 0) {

          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query('SELECT id_user, email, code, url_temp, name_role, payment_price, date_payment_price FROM users u, userdata ud, role r, access a, permit p WHERE u.id_user = ud.user_id AND u.role_id = a.role_id AND p.id_permit = a.permit_id AND r.id_role = a.role_id AND u.email = $1 AND p.url_temp = $2', [access.email, access.url], function (err, result) {
              done();
              if (err) return fn(err);

              if (result.rowCount > 0) {

                dateNow = Date.now();
                date_payment_price = Number(result.rows[0].date_payment_price);


                if (date_payment_price > dateNow && result.rows[0].payment_price === 2) {

                  idUser = Number(result.rows[0].id_user);

                  pool.connect(function (err, client, done) {
                    if (err) return fn(err);

                    client.query("SELECT id_role FROM role WHERE payment_price = 1", function (err, result) {
                      done();
                      if (err) return fn(err);

                      id_role = Number(result.rows[0].id_role);

                      pool.connect(function (err, client, done) {
                        if (err) return fn(err);

                        client.query("UPDATE users SET role_id = $1 WHERE id_user = $2", [id_role, idUser], function (err, result) {
                          done();
                          if (err) return fn(err);

                          pool.connect(function (err, client, done) {
                            if (err) return fn(err);

                            client.query("SELECT id_user, email, code, url_temp, name_role, payment_price, date_payment_price FROM users u, userdata ud, role r, access a, permit p WHERE u.id_user = ud.user_id AND u.role_id = a.role_id AND p.id_permit = a.permit_id AND r.id_role = a.role_id AND u.email = $1 AND p.url_temp = $2", [access.email, access.url], function (err, result) {
                              done();
                              if (err) return fn(err);

                              return fn(null, result.rows[0].code);

                            });
                          });
                        });
                      });
                    });
                  });

                } else if (date_payment_price < dateNow && result.rows[0].payment_price === 1) {

                  idUser = Number(result.rows[0].id_user);

                  pool.connect(function (err, client, done) {
                    if (err) return fn(err);

                    client.query("SELECT id_role FROM role WHERE payment_price = 2", function (err, result) {
                      done();
                      if (err) return fn(err);

                      id_role = Number(result.rows[0].id_role);

                      pool.connect(function (err, client, done) {
                        if (err) return fn(err);

                        client.query("UPDATE users SET role_id = $1 WHERE id_user = $2", [id_role, idUser], function (err, result) {
                          done();
                          if (err) return fn(err);

                          pool.connect(function (err, client, done) {
                            if (err) return fn(err);

                            client.query("SELECT id_user, email, code, url_temp, name_role, payment_price, date_payment_price FROM users u, userdata ud, role r, access a, permit p WHERE u.id_user = ud.user_id AND u.role_id = a.role_id AND p.id_permit = a.permit_id AND r.id_role = a.role_id AND u.email = $1 AND p.url_temp = $2", [access.email, access.url], function (err, result) {
                              done();
                              if (err) return fn(err);

                              return fn(null, result.rows[0].code);

                            });
                          });
                        });
                      });
                    });
                  });

                } else {

                  return fn(null, result.rows[0].code);
                }

              } else {

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query("SELECT a.code, p.url_temp, users FROM role r, access a, permit p WHERE p.id_permit = a.permit_id AND r.id_role = a.role_id AND r.users = 1 AND p.url_temp = $1",
                    [access.url], function (err, result) {
                      done();
                      if (err) return fn(err);

                      if (result.rowCount > 0) {

                        return fn(null, result.rows[0].code);

                      } else {

                        return fn(null, '00000');
                      }
                    });
                });
              }
            });
          });

        } else {
          return fn('Ошибка! Нужно создать общую роль для всех пользователей.', null);
        }
      });
    });
  }
};

Permit.prototype.accessNew = function (fn) {
  let access = this;

  if (access.email === conf.get('administrator')) {

    fn(null, '11111');

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT role_id FROM users WHERE email = $1', [access.email], function (err, result) {
        done();
        if (err) return fn(err, null);

        let role_id = result.rows[0].role_id;

        if (result.rows[0].role_id === null) {

          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query('SELECT id_role FROM role WHERE users = 1', function (err, result) {
              done();
              if (err) return fn(err, null);

              if (result.rowCount > 0) {

                let id_role = result.rows[0].id_role;

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query('SELECT id_permit FROM permit WHERE url_temp = $1', [access.url], function (err, result) {
                    done();
                    if (err) return fn(err, null);
                    let id_permit = result.rows[0].id_permit;

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query('SELECT code FROM access WHERE permit_id = $1 AND role_id = $2', [id_permit, id_role], function (err, result) {
                        done();
                        if (err) return fn(err, null);
                        fn(null, result.rows[0].code);

                      })
                    })

                  })
                })

              } else {
                fn('Ошибка! Нужно создать общую роль для всех пользователей.', null);
              }

            })

          })

        } else {

          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query('SELECT id_permit FROM permit WHERE url_temp = $1', [access.url], function (err, result) {
              done();
              if (err) return fn(err, null);

              let id_permit = result.rows[0].id_permit;

              pool.connect(function (err, client, done) {
                if (err) return fn(err);

                client.query('SELECT code FROM access WHERE permit_id = $1 AND role_id = $2', [id_permit, role_id], function (err, result) {
                  done();
                  if (err) return fn(err, null);
                  fn(null, result.rows[0].code);

                })
              })

            });
          });

        }
      });

    });

  }
};

Permit.prototype.accessModerator = function (fn) {
  let access = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM users, userdata WHERE id_user = user_id AND email = $1',
      [access.email], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
  });
};

Permit.getSection = function (pathname, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM permit WHERE url_temp = $1',
      [pathname], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });
  });

};

Permit.templateAndSection = function (templateName, idSection, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT template_name, section_id FROM permit LEFT JOIN sectionandtemplate ON(template_name = temp ) WHERE temp = $1 AND section_id = $2', [templateName, idSection], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Permit.sectionAndPage = function (id, templateName, idSection, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1 AND template = $2 AND section = $3', [id, templateName, idSection], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Permit.getDistricts = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT (SELECT region_id FROM districts WHERE id_districts = default_districts ), default_districts, default_districts AS districts_id, (SELECT (SELECT title FROM region WHERE id_region = region_id) FROM districts WHERE id_districts = default_districts ) || ' ' || (SELECT districts FROM districts WHERE id_districts = default_districts ) AS districts FROM users WHERE email = $1", [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rows[0].default_districts === null){

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query("SELECT (SELECT region_id FROM districts WHERE id_districts = districts_id ), districts_id, ((SELECT (SELECT title FROM region WHERE id_region = region_id) FROM districts WHERE id_districts = districts_id) || ' ' || (SELECT districts FROM districts WHERE id_districts = districts_id)) AS districts FROM city WHERE select_default = 1", function (err, result) {
            done();
            if (err) return fn(err, null);

            return fn(null, result.rows[0].districts, result.rows[0].districts_id, result.rows[0].region_id);

          });
        });

      } else {
        return fn(null, result.rows[0].districts, result.rows[0].districts_id, result.rows[0].region_id);
      }
    });
  });
};

Permit.getCity = function (email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT default_city FROM users WHERE email = $1', [email], function (err, result) {
      done();
      if (err) return fn(err, null);

      if(result.rows[0].default_city === null){

        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('SELECT id_city FROM city WHERE select_default = 1', function (err, result) {
            done();
            if (err) return fn(err, null);

            if(result.rowCount > 0){
              return fn(null, result.rows[0].id_city);
            } else {
              return fn(null, 0);
            }
          });
        });

      } else {
        return fn(null, result.rows[0].default_city);
      }

    });
  });
};