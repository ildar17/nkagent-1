let pg = require('pg');
let conf = require('../config/index');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = function (req, res, next) {

  let uid = null;

	if (!res.locals.partials) res.locals.partials = {};

	if (req.signedCookies.user) {
    uid = req.signedCookies.user;
    req.session.uid = uid;

	} else {
		uid = req.session.uid;
	}

	if (!uid) return next();

	pool.connect(function (err, client, done) {

		if (err) return next(err);
		client.query('SELECT id_user, date_registration, email, pass FROM users WHERE email=$1',
			[uid], function (err, result) {
				done();

				if (err) return next(err);

				if (result.rowCount === 1) {

					req.user = res.locals.user = result.rows[0].email;

					if (uid === conf.get('administrator')) req.admin = res.locals.admin = conf.get('administrator');

				}

				next();
			});
	});
};