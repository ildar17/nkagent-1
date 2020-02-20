let crypto = require('crypto');
let conf = require('../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = Auth;

function Auth(obj) {
  //console.log(obj);
  for (let key in obj) {
      this[key] = obj[key];
   }
}

Auth.prototype.temporarilySave = function (fn) {
  let auth = this;

  auth.hashPassword(function (err) {
    if (err) return fn(err);

    pool.connect( function(err, client, done) {
      if (err) return fn(err);

      client.query('DELETE FROM temporarily_users WHERE email = $1', [auth.email], function (err, result) {
          done();
          if (err) return fn(err, null);


          pool.connect( function(err, client, done) {
            if (err) return fn(err);

            client.query('INSERT INTO temporarily_users (email, passw, now_date, url_hash) VALUES ($1, $2, $3, $4)',
              [auth.email, auth.pass, auth.date_registration, auth.url_hash], function (err, result) {
                done();
                if (err) return fn(err, null);

                return fn(null, result);

              });
          });
        });
    });
  });
};

Auth.prototype.getTemporarily = function (fn) {

  let auth = this;
  let dateEmail = conf.get('dateEmail');
  let nowdate = this.dateNow;
  nowdate = nowdate - dateEmail;

  pool.connect( function(err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM temporarily_users WHERE now_date < ($1)',
      [nowdate], function (err, result) {
      done();
      if (err) return fn(err, null);

        pool.connect( function(err, client, done) {
          if (err) return fn(err);

          client.query('SELECT * FROM temporarily_users WHERE url_hash = ($1)',
            [auth.hash_url], function (err, result) {
              done();
                if (err) return fn(err, null);

                return fn(null, result);

            });
        });
    });
  });
};

Auth.prototype.save = function (fn) {

  let auth = this;

	for ( let key in auth ) {
		if ( !auth[key] ) {
			auth[key] = null;
		}
	}

	if(!auth.sumMs){
    auth.sumMs = null;
  }

	if(auth.id_user){

	  auth.id_user = String(auth.id_user);

	  auth.pass = crypto.createHmac('sha1', conf.get('salt')).update(auth.id_user).digest('hex');

    pool.connect( function(err, client, done) {
      if (err) return fn(err);

      client.query('INSERT INTO users (id_user, date_registration, email, pass) VALUES ($1, $2, $3, $4)' + 'RETURNING id_user',
        [ auth.id_user, auth.date_registration, auth.email, auth.pass ], function (err, result) {
          done();
          if (err) {

            return fn(err, null);

          } else {

            pool.connect( function(err, client, done) {
              if (err) return fn(err);

              client.query('INSERT INTO userdata (user_id, fio, tel, agency, note, date_payment_price) VALUES ($1, $2, $3, $4, $5, $6)',
                [result.rows[0].id_user, auth.fio, auth.tel, auth.agency, auth.note, auth.sumMs], function (err, result) {
                  done();
                  if (err) {
                    return fn(err, null);
                  } else {
                    return fn(null, result.rowCount);
                  }
                });

            });
          }
        });

    });

  } else {

	  auth.hashPassword(function (err) {
      if (err) return fn(err);

      pool.connect( function(err, client, done) {
        if (err) return fn(err);

        client.query('INSERT INTO users (date_registration, email, pass) VALUES ($1, $2, $3)' + 'RETURNING id_user',
          [ auth.date_registration, auth.email, auth.pass ], function (err, result) {
            done();
            if (err) return fn(err, null);

            pool.connect( function(err, client, done) {
              if (err) return fn(err);

              client.query('INSERT INTO userdata (user_id, fio, tel, agency, note, date_payment_price) VALUES ($1, $2, $3, $4, $5, $6)',
                [result.rows[0].id_user, auth.fio, auth.tel, auth.agency, auth.note, auth.sumMs], function (err, result) {
                  done();
                  if (err) {
                    return fn(err, null);
                  } else {
                    return fn(null, result.rowCount);
                  }
                });

            });

          });

      });
    });
  }
};

Auth.prototype.saveAuth = function (fn) {

  let auth = this;

  let set_val = null;

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('select max(id_user) from users', function (err, result) {
        done();
        if (err) return fn(err);

        if(result.rows[0].max){
          set_val = result.rows[0].max;
        }

        if(set_val){

          pool.connect( function(err, client, done) {
            if (err) return fn(err);

            client.query("select pg_catalog.setval('users_id_user_seq', $1, true)", [set_val], function (err, result) {
                done();
                if (err) return fn(err);


              pool.connect( function(err, client, done) {
                if (err) return fn(err);

                client.query('INSERT INTO users (date_registration, email, pass) VALUES ($1, $2, $3)' + 'RETURNING id_user',
                  [ auth.date_registration, auth.email, auth.pass ], function (err, result) {
                    done();
                    if (err) return fn(err, null);

                    pool.connect( function(err, client, done) {
                      if (err) return fn(err);

                      client.query('INSERT INTO userdata (user_id, fio, tel, agency, note) VALUES ($1, $2, $3, $4, $5)',
                        [result.rows[0].id_user, auth.fio, auth.tel, auth.agency, auth.note], function (err, result) {
                          done();
                          if (err) return fn(err);

                          return fn(null, result);

                        });

                    });
                  });
              });
            });
          });

        } else {

          pool.connect( function(err, client, done) {
            if (err) return fn(err);

            client.query('INSERT INTO users (date_registration, email, pass) VALUES ($1, $2, $3)' + 'RETURNING id_user',
              [ auth.date_registration, auth.email, auth.pass ], function (err, result) {
                done();
                if (err) return fn(err, null);

                pool.connect( function(err, client, done) {
                  if (err) return fn(err);

                  client.query('INSERT INTO userdata (user_id, fio, tel, agency, note) VALUES ($1, $2, $3, $4, $5)',
                    [result.rows[0].id_user, auth.fio, auth.tel, auth.agency, auth.note], function (err, result) {
                      done();
                      if (err) return fn(err);

                      return fn(null, result);

                    });

                });
              });
          });
        }
    });
  });
};

Auth.prototype.hashPassword = function (fn) {
   let auth = this;
   auth.pass = crypto.createHmac('sha1', conf.get('salt')).update(auth.pass).digest('hex');
   fn();
};

Auth.getByName = function (email, fn) {

   pool.connect( function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id_user, date_registration , email, pass FROM users WHERE email=$1', 
         [email], function (err, result) {
         done();
         if (err) return fn(err);

         fn(null, new Auth(result.rows[0]));
      });

   });
};

Auth.prototype.getRole = function (fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT id_role FROM role', function (err, result) {
				done();
				if (err) return fn(err);

				fn(null, result);
			});

	});
};

Auth.authenticate = function (email, pass, fn) {
   
   Auth.getByName(email, function (err, user) {

      if (err) return fn(err);

      if (!user.email) return fn();

      let hash = crypto.createHmac('sha1', conf.get('salt')).update(pass).digest('hex');

      if (hash === user.pass){

         return fn(null, user);

      } else {

         return fn(null, null);
      }

   });
};

Auth.getByNameRebuild = function (email, fn) {

   pool.connect( function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id_user, date_registration , email, pass, hash_url, date_hash_url FROM users WHERE email=$1', [email], function (err, result) {
         done();
         if (err){
            return fn(err);
         } else {
            fn(null, result.rows[0]);
         }
      });

   });
};

Auth.recordHashUrl = function (email, fn) {

   let int = parseInt(Math.random() * 10);
   let str = email + int;
   let hashUrl = crypto.createHmac('sha1', conf.get('salt')).update(str).digest('hex');
   let dateHashUrl = Date.now() + conf.get('dateEmail');

   pool.connect( function (err, client, done) {
      if (err) return fn(err);
      client.query('UPDATE users SET hash_url = $1, date_hash_url = $2 WHERE email = $3 RETURNING hash_url',
         [hashUrl, dateHashUrl, email], function (err, result) {
            done();
            if(err) {
               return fn(err, null);
            } else {
               return fn(null, result);
            }
         });

   });
};

Auth.getHashUrl = function (url, fn) {

   pool.connect( function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id_user, date_registration , email, pass, hash_url, date_hash_url FROM users WHERE hash_url=$1',
         [url], function (err, result) {
            done();
            if (err){
               return fn(err, null);
            } else {
               fn(null, result.rows[0]);
            }
         });

   });
};

Auth.saveNewPass = function (pass, hash_url, fn) {

   let hashPass = crypto.createHmac('sha1', conf.get('salt')).update(pass).digest('hex');

   pool.connect( function (err, client, done) {
      if (err) return fn(err);

      client.query('UPDATE users SET pass = $1, hash_url = null, date_hash_url = null WHERE hash_url = $2',
         [hashPass, hash_url], function (err, result) {
            done();
            if (err) {
               return fn(err, null);
            } else {
               return fn(null, result);
            }
         });
   });
};

Auth.getMailUsers = function (email, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT email FROM users WHERE email = $1',
      [email], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};


Auth.getMailLogin = function (email, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT email, init_date, num_input FROM login WHERE email = $1',
      [email], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Auth.setMailLogin = function (email, dateNow, numInput, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO login (email, init_date, num_input) VALUES ($1, $2, $3)',
      [email, dateNow, numInput], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};


Auth.deleteLogin = function (email, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM login WHERE email = $1',
      [email], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Auth.updateLoginCount = function (email, numInput, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE login SET num_input = $1 WHERE email = $2',
      [numInput, email], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Auth.updateLoginDateCount = function (email, initDate, numInput, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE login SET init_date = $1, num_input = $2 WHERE email = $3',
      [initDate, numInput, email], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Auth.cleanLogin = function (fn) {

  let dateNow = Date.now();

  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM login WHERE init_date < ' + dateNow, function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Auth.getTemp = function (urlHash, fn) {
  pool.connect( function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM temporarily_users_userdata WHERE url_hash = $1',
      [urlHash], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Auth.updateUsersUserdata = function (id_user, obj, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE users SET email = $1 WHERE id_user = $2', [obj.email, id_user], function (err, result) {
        done();

        if (err) return fn(err, null);

        if(result.rowCount > 0){
          pool.connect(function (err, client, done) {
            if (err) return fn(err);

            client.query("UPDATE userdata SET fio = $1, tel = $2, note = $3 WHERE user_id = $4",
              [obj.fio, obj.tel, obj.note, id_user], function (err, result) {
                done();
                if (err) return fn(err, null);

                fn(null, result);

              });
          });
        }
      });
  });

};