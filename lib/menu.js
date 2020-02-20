let conf = require('../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

exports.adminMenu = function (permission, users, email, urlParsed, fn) {

	let pathname = urlParsed.pathname;
  let section = urlParsed.query.section;

  let str = '';
  let str1 = '';
  let first = '';
  let activeLink = '';
  let code = '';
  let agent = false;

	if (users == null) {

	  let tempLink = null;

		pool.connect(function (err, client, done) {
			if (err) return fn(err);

			client.query('SELECT name, temp, url_temp, temp FROM permit ORDER BY priority DESC', function (err, result) {
				done();
				if (err) return fn(err, null);

				if (result.rowCount > 0) {

					co(function*() {

						str += '<ul>' + '\n';

						for (let i = 0; i < result.rows.length; i++) {

							if (i === 0) {
								first = ' divFirst';
							} else {
								first = ''
							}
							if (result.rows[i].url_temp === pathname) {
								activeLink = ' active';
                tempLink = result.rows[i].temp;
              } else {
								activeLink = '';
							}

              code = yield new Promise(function (resolve, reject) {

                getCodeUser(result.rows[i].id_permit, email, function (err, result) {
                  if (err) return reject(err);
                  resolve(result);
                });

              }).catch(function (err) {
                return fn(err, '');
              });


							str += '\t\t' + '<li><a class="' + activeLink + '" href="' + result.rows[i].url_temp + '"><div class="' + first + activeLink + '">' + result.rows[i].name + '</div></a>';

							str1 += yield new Promise(function (resolve, reject) {

								getSection(result.rows[i].temp, result.rows[i].url_temp, section, code, email, tempLink, function (err, result) {
									if (err) reject(err);
									resolve(result);
								});

							}).catch(function (err) {
                return fn(err, '');
              });

							if (str1) {
								str += str1 + '\n';
								str += '\t\t' + '</li>' + '\n';
							} else {
								str += '</li>' + '\n';
							}

							str1 = '';

						}

						str += '\t' + '</ul>' + '\n';

						return fn(null, str);
					})

				} else {
					return fn(null, str);
				}
			});
		});
	}

/////////////////////////////

  //Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)



	if (users === 0 || users === 1) {

    let tempLink = null;

	  pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT name, temp, url_temp, id_permit FROM permit ORDER BY priority DESC', function (err, result) {
        done();
        if (err) return fn(err, null);

        if (result.rowCount > 0) {

          co(function*() {

            str += '<ul>' + '\n';

            for (let i = 0; i < result.rows.length; i++) {

              if (i === 0) {
                first = ' divFirst';
                tempLink = result.rows[i].temp;
              } else {
                first = ''
              }

              if (result.rows[i].url_temp === pathname) {
                activeLink = ' active';
              } else {
                activeLink = '';
              }


              code = yield new Promise(function (resolve, reject) {

                getCodeUser(result.rows[i].id_permit, email, function (err, result) {
                  if (err) return reject(err);
                  resolve(result);
                });

              }).catch(function (err) {
                return fn(err, '');
              });


              if (code !== '00000') {

                str += '\t\t' + '<li><a class="' + activeLink + '" href="' + result.rows[i].url_temp + '"><div class="' + first + activeLink + '">' + result.rows[i].name + '</div></a>';

                str1 += yield new Promise(function (resolve, reject) {

                  getSection1(permission, result.rows[i].temp, result.rows[i].url_temp, section, code, email, tempLink, function (err, result) {
                    if (err) reject(err);
                    resolve(result);
                  });

                }).catch(function (err) {
                  return fn(err, '');
                });

                if (str1) {
                  str += str1 + '\n';
                  str += '\t\t' + '</li>' + '\n';
                } else {
                  str += '</li>' + '\n';
                }

              }//if (code !== '00000') {

              str1 = '';
              code = '';

            }

            str += '\t' + '</ul>' + '\n';

            return fn(null, str);
          });

        } else {
          return fn(null, str);
        }

      });

    });
  }
};

function getCodeUser(permit_id, email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err, null);

    client.query('SELECT CASE WHEN role_id is null THEN (SELECT id_role FROM role WHERE users = 1) ELSE role_id END AS roleid FROM users WHERE email = $1', [email], function (err, result) {
      if (err) return fn(err, null);
      done();

      if (result.rowCount > 0) {
        let id_role = result.rows[0].roleid;

        pool.connect(function (err, client, done) {
          if (err) return fn(err, null);

          client.query('SELECT code FROM access WHERE permit_id = $1 AND role_id = $2', [permit_id, id_role], function (err, result) {
            if (err)return fn(err, null);
            done();

            if (result.rowCount > 0) {
              return fn(null, result.rows[0].code);
            } else {
              return fn(null, '00000');
            }

          });
        });

      } else {
        return fn(null, '00000')
      }
    });

  });
}

function getSection(temp, url, section, code, email, tempLink, fn) {

  co(function*() {
    let str = '';

    let res = yield new Promise(function (resolve, reject) {

      pool.connect(function (err, client, done) {
        if (err) reject(err);

        client.query('SELECT template_name, section_id, title, (select email from users where id_user = author) AS email, author, one_page, id_one_page, line FROM node LEFT JOIN sectionandtemplate ON(section_id = id) WHERE template_name = $1 AND status = 1 ORDER BY title', [temp], function (err, result) {
          if (err) return reject(err);
          done();
          resolve(result);

        });

      });

    }).catch(function (err) {
      return fn(err, '');
    });


    if (res.rows.length > 0) {

      str += '\n\t\t\t' + '<ul>' + '\n';

      let activeLink = '';

      let temp = undefined;


      for (let i = 0; i < res.rows.length; i++) {

        temp = res.rows[i].template_name;

        if (section === res.rows[i].section_id) {

          activeLink = ' activeLevel2';

        } else {
          activeLink = '';
        }


        str += '\t\t\t\t' + '<li><a class="' + activeLink + '" href = "' + url + '?section=' + res.rows[i].section_id + '"><div class="' + activeLink + '">' + res.rows[i].title + '</div></a></li>' + '\n';

      }

      activeLink = '';

      if(section === 'null' && tempLink === temp){
        activeLink = ' activeLevel2';
      }

      if(temp === 'article'){
        str += '\t\t\t\t' + '<li><a class="' + activeLink + '" href = "' + url + '?section=null"><div class="' + activeLink + '">Раздел не' +
          ' присвоен</div></a></li>' + '\n';
      }

      temp = undefined;

      str += '\t\t\t' + '</ul>';

      return fn(null, str);
    } else {
      return fn(null, str);
    }

  })

}

function getSection1(permission, temp, url, section, code, email, tempLink, fn) {

  co(function*() {

    let str = '';

    let activeLink = '';

    let res = yield new Promise(function (resolve, reject) {

      pool.connect(function (err, client, done) {
        if (err) reject(err);

        client.query('SELECT section_id, title, (select email from users where id_user = author) AS email, author, one_page, id_one_page, line FROM node LEFT JOIN sectionandtemplate ON(section_id = id) WHERE template_name = $1 AND status = 1 ORDER BY title', [temp], function (err, result) {
          if (err) return reject(err);
          done();
          resolve(result);

        });

      });

    }).catch(function (err) {
      return fn(err, '');
    });

    if (res.rows.length > 0) {

      str += '\n\t\t\t' + '<ul>' + '\n';

      for (let i = 0; i < res.rows.length; i++) {


        if (section === res.rows[i].section_id) {
          activeLink = ' activeLevel2';
        } else {
          activeLink = '';
        }

        if(code.indexOf('0', 4) === 4 && res.rows[i].one_page === 1 && email !==  res.rows[i].email){
          str += '';
        } else {
          str += '\t\t\t\t' + '<li><a class="' + activeLink + '" href = "' + url + '?section=' + res.rows[i].section_id + '"><div class="' + activeLink + '">' + res.rows[i].title + '</div></a></li>' + '\n';
        }

      }

      activeLink = '';

      if(permission.indexOf('1', 4) === 4){

        if(section === 'null' && tempLink === temp){
          activeLink = ' activeLevel2';
        }

        str += '\t\t\t\t' + '<li><a class="' + activeLink + '" href = "' + url + '?section=null"><div class="' + activeLink + '">Раздел' +
          ' не присвоен</div></a></li>' + '\n';
      }

      str += '\t\t\t' + '</ul>';

      return fn(null, str);
    } else {
      return fn(null, str);
    }

  })

}

exports.getCode = function (permit_id, email, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err, null);

    client.query('SELECT CASE WHEN role_id is null THEN (SELECT id_role FROM role WHERE users = 1) ELSE role_id END AS roleid FROM users WHERE email = $1', [email], function (err, result) {
      if (err) return fn(err, null);
      done();

      if (result.rowCount > 0) {
        let id_role = result.rows[0].roleid;

        pool.connect(function (err, client, done) {
          if (err) return fn(err, null);

          client.query('SELECT code FROM access WHERE permit_id = $1 AND role_id = $2', [permit_id, id_role], function (err, result) {
            if (err)return fn(err, null);
            done();

            if (result.rowCount > 0) {
              return fn(null, result.rows[0].code);
            } else {
              return fn(null, '00000');
            }

          });
        });

      } else {
        return fn(null, '00000')
      }
    });

  });
};

