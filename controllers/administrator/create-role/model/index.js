let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = Create_role;

function Create_role(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Create_role.prototype.saveRole = function (fn) {
  let administrator = this;

  let id_role = null;

  if (administrator.users === '') {
    administrator.users = null;
  }

  if(administrator.paymentPrice === 'null'){
    administrator.paymentPrice = null;
  } else {
    administrator.paymentPrice = Number(administrator.paymentPrice);
  }

  if (administrator.users === 1) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('UPDATE role SET users = NULL WHERE users = 1', function (err, result) {
        done();
        if (err) return fn(err, null);
        
        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('INSERT INTO role ( name_role, users ) VALUES ( $1, $2 ) RETURNING id_role',
            [administrator.nameRole, administrator.users], function (err, result) {
              done();
              if (err) return fn(err, null);

              id_role = result.rows[0].id_role;

              if (administrator.paymentPrice === 1 || administrator.paymentPrice === 2) {

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query('UPDATE role SET payment_price = NULL WHERE payment_price = $1',[administrator.paymentPrice], function (err, result) {
                    done();
                    if (err) return fn(err, null);

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query('UPDATE role SET payment_price = $1 WHERE id_role = $2', [administrator.paymentPrice, id_role], function (err, result) {
                        done();
                        if (err) return fn(err, null);

                        fn(null, result);
                      });
                    });

                  });
                });

              } else {

                fn(null, result);

              }
            });
        });
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('INSERT INTO role ( name_role, users ) VALUES ( $1, $2) RETURNING id_role',
        [administrator.nameRole, administrator.users], function (err, result) {
          done();
          if (err) return fn(err, null);

          id_role = result.rows[0].id_role;

          if (administrator.paymentPrice === 1 || administrator.paymentPrice === 2) {

            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query('UPDATE role SET payment_price = NULL WHERE payment_price = $1',[administrator.paymentPrice], function (err, result) {
                done();
                if (err) return fn(err, null);

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query('UPDATE role SET payment_price = $1 WHERE id_role = $2', [administrator.paymentPrice, id_role], function (err, result) {
                    done();
                    if (err) return fn(err, null);

                    fn(null, result);
                  });
                });

              });
            });

          } else {

            fn(null, result);

          }

      });
    });
  }

};





Create_role.prototype.editRole = function (fn) {
  let administrator = this;

  if (administrator.users === '') {
    administrator.users = null;
  }

  let id_role = administrator.id_role * 1;

  if(administrator.paymentPrice === 'null'){
    administrator.paymentPrice = null;
  } else {
    administrator.paymentPrice = Number(administrator.paymentPrice);
  }



  if (administrator.users === 1) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('UPDATE role SET users = NULL WHERE users = 1', function (err, result) {
        done();
        if (err) return fn(err, null);


        pool.connect(function (err, client, done) {
          if (err) return fn(err);

          client.query('UPDATE role SET name_role = $1, users = $2 WHERE id_role = $3',
            [administrator.nameRole, administrator.users, id_role], function (err, result) {
              done();
              if (err) return fn(err, null);

              if (administrator.paymentPrice === 1 || administrator.paymentPrice === 2) {

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query('UPDATE role SET payment_price = NULL WHERE payment_price = $1',[administrator.paymentPrice], function (err, result) {
                    done();
                    if (err) return fn(err, null);

                    pool.connect(function (err, client, done) {
                      if (err) return fn(err);

                      client.query('UPDATE role SET payment_price = $1 WHERE id_role = $2', [administrator.paymentPrice, id_role], function (err, result) {
                        done();
                        if (err) return fn(err, null);

                        fn(null, result);
                      });
                    });

                  });
                });

              } else {

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query('UPDATE role SET payment_price = $1 WHERE id_role = $2', [administrator.paymentPrice, id_role], function (err, result) {
                    done();
                    if (err) return fn(err, null);

                    fn(null, result);
                  });
                });

              }
            });
        });
      });
    });

  } else {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('UPDATE role SET name_role = $1, users = $2 WHERE id_role = $3',
        [administrator.nameRole, administrator.users, id_role], function (err, result) {
          done();
          if (err) return fn(err, null);

          if (administrator.paymentPrice === 1) {

            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query('UPDATE role SET payment_price = NULL WHERE payment_price = 1', function (err, result) {
                done();
                if (err) return fn(err, null);

                pool.connect(function (err, client, done) {
                  if (err) return fn(err);

                  client.query('UPDATE role SET payment_price = 1 WHERE id_role = $1', [id_role], function (err, result) {
                    done();
                    if (err) return fn(err, null);

                    fn(null, result);
                  });
                });

              });
            });

          } else {

            pool.connect(function (err, client, done) {
              if (err) return fn(err);

              client.query('UPDATE role SET payment_price = $1 WHERE id_role = $2', [administrator.paymentPrice, id_role], function (err, result) {
                done();
                if (err) return fn(err, null);

                fn(null, result);
              });
            });

          }
        });
    });
  }
};

Create_role.prototype.getRole = function (fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_role as Администрирование, name_role as "Название роли", users as "Статус роли", payment_price as "Оплата прайса" FROM' +
      ' role ORDER BY id_role', function (err, result) {
      done();
      if (err) return fn(err, null);

      fn(null, result);
    });

  });
};

Create_role.prototype.getOneRole = function (fn) {
  let administrator = this;
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM role WHERE id_role = $1',
      [administrator.editRole], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });

  });
};

Create_role.prototype.deleteRole = function (fn) {
  let administrator = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM access WHERE role_id = $1',
      [administrator.dropRole], function (err, result) {
        done();
        if (err) return fn(err, null);
      });

  });

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE users SET role_id = null WHERE role_id = $1',
      [administrator.dropRole], function (err, result) {
        done();
        if (err) return fn(err, null);
      });

  });

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM role WHERE id_role = $1',
      [administrator.dropRole], function (err, result) {
        done();
        if (err) return fn(err, null);

        fn(null, result);
      });

  });
};
