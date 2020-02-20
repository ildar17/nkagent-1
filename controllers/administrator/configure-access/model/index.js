let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = Configure_access;

function Configure_access(obj) {
	for (let key in obj) {
		this[key] = obj[key];
	}
}

Configure_access.prototype.getRole = function (fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT id_role as Администрирование, name_role as "Название роли", users as "Статус' +
			' роли" FROM role ORDER BY id_role', function (err, result) {
			done();
			if (err) return fn(err, null);

			fn(null, result);
		});

	});
};