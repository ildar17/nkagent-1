var conf = require('../config');
var pg = require('pg');
var dbConf = conf.get('db');
var pool = new pg.Pool(dbConf);


exports.getCreateAliasEarth = function (alias, fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT c.title AS "Страна", c.alias AS "Псевдоним страны", r.title AS "Область", r.alias AS "Псевдоним области", ci.title AS "Город", ci.alias AS "Псевдоним города" FROM country c LEFT JOIN region r ON(c.id = r.country_id) LEFT JOIN city ci ON(r.id_region = ci.region_id) WHERE c.alias = $1 OR r.alias = $1 OR ci.alias = $1 ORDER BY c.title, ci.title', [alias], function (err, result) {
			done();
			if(err) return fn(err, null);

			if(result.rowCount > 0){
				return fn(null, 0);
			} else {
				return fn(null, 1);
			}
		});
	});
};

exports.getEditAliasCountryEarth = function (alias, id, fn) {
	var alias_country = null;

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT * FROM country WHERE id = $1', [id], function (err, result) {
			done();
			if (err) return fn(err);

			if(result.rowCount > 0){
				alias_country = result.rows[0].alias;
			}

			if(alias_country == alias){
				return fn(null, 1);
			} else {

				client.query('SELECT * FROM country WHERE alias = $1', [alias], function (err, result) {
					done();
					if (err) return fn(err);

					if(result.rowCount > 0){
						return fn(null, 0);
					} else {

						client.query('SELECT * FROM region WHERE alias = $1', [alias], function (err, result) {
							done();
							if (err) return fn(err);
							if (result.rowCount > 0) {
								return fn(null, 0);
							} else {
								client.query('SELECT * FROM city WHERE alias = $1', [alias], function (err, result) {
									done();
									if (err) return fn(err);
									if (result.rowCount > 0) {
										return fn(null, 0);
									} else {
										return fn(null, 1);
									}
								});
							}
						});
					}
				});
			}
		});
	});
};

exports.getEditAliasRegionEarth = function (alias, id_region, fn) {

	var alias_region = null;

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT * FROM region WHERE id_region = $1', [id_region], function (err, result) {
			done();
			if (err) return fn(err);

			if(result.rowCount > 0){
				alias_region = result.rows[0].alias;
			}

			if(alias_region == alias){
				return fn(null, 1);

			} else {

				client.query('SELECT * FROM region WHERE alias = $1', [alias], function (err, result) {
					done();
					if (err) return fn(err);
					if (result.rowCount > 0) {
						return fn(null, 0);
					} else {
						client.query('SELECT * FROM country WHERE alias = $1', [alias], function (err, result) {
							done();
							if (err) return fn(err);
							if (result.rowCount > 0) {
								return fn(null, 0);
							} else {
								client.query('SELECT * FROM city WHERE alias = $1', [alias], function (err, result) {
									done();
									if (err) return fn(err);
									if (result.rowCount > 0) {
										return fn(null, 0);
									} else {
										return fn(null, 1);
									}
								});
							}
						});
					}
				});
			}
		});
	});
};

exports.getEditAliasCityEarth = function (alias, id_city, fn) {

	var alias_city = null;

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT * FROM city WHERE id_city = $1', [id_city], function (err, result) {
			done();
			if (err) return fn(err);

			if(result.rowCount > 0){
				alias_city  = result.rows[0].alias;
			}

			if(alias_city == alias){
				return fn(null, 1);

			} else {

				client.query('SELECT * FROM city WHERE alias = $1', [alias], function (err, result) {
					done();
					if (err) return fn(err);

					if (result.rowCount > 0) {
						return fn(null, 0);
					} else {

						client.query('SELECT * FROM country WHERE alias = $1', [alias], function (err, result) {
							done();
							if (err) return fn(err);
							if (result.rowCount > 0) {
								return fn(null, 0);
							} else {
								client.query('SELECT * FROM region WHERE alias = $1', [alias], function (err, result) {
									done();
									if (err) return fn(err);
									if (result.rowCount > 0) {
										return fn(null, 0);
									} else {
										return fn(null, 1);
									}
								});
							}
						});
					}
				});
			}
		});
	});
};