let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = Assign_role;

function Assign_role(obj) {
	for (let key in obj) {
		this[key] = obj[key];
	}
}


Assign_role.getUsers = function (fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT id_user as Администрирование, name_role as Роль, fio as "Ф.И.О", agency as "Агенство", ' +
			'tel as "Телефон", email,  date_registration as "Дата регистрации" ' +
			'FROM users join userdata on(id_user = user_id ) left outer join role on(role_id = id_role) ' +
			'WHERE email != $1 ORDER BY fio',
			[conf.get('administrator')], function (err, result) {
				done();
				if (err) {
					return fn(err, null)
				} else {
					return fn(null, result);
				}
			});
	});
};

Assign_role.getRoleUsers = function (fn) {
	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT * FROM role WHERE users is not null', function (err, result) {
			done();
			if (err) return fn(err, null);

			fn(null, result);
		});

	});
};

Assign_role.getOneUser = function (id_user, fn) {

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT id_user as "Присвоить роль", name_role as "Текущая роль",  ' +
			'fio as "Имя", agency as "Агенство", tel as "Телефон", date_registration as "Дата регистрации", email FROM users join userdata' +
			' on(id_user = user_id) left outer join role on(role_id = id_role) WHERE id_user = $1',
			[id_user], function (err, result) {
				done();
				if (err) {
					return fn(err, null)
				} else {
					return fn(null, result);
				}
			});
	});
};

Assign_role.getAllRoleModerator = function (fn) {
	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('SELECT * FROM role WHERE users is null ORDER BY name_role', function (err, result) {
			done();
			if (err) return fn(err, null);

			fn(null, result);
		});

	});
};

Assign_role.prototype.assignRole = function (fn) {

	let administrator = this;

	if(administrator.usersRoleId === administrator.role_id){
		administrator.role_id = null;
	}

	pool.connect( function (err, client, done) {
		if (err) return fn(err);

		client.query('UPDATE users SET role_id = $1 WHERE id_user = $2',
			[administrator.role_id, administrator.id_user], function (err, result) {
				done();
				if (err) {
					return fn(err, null)
				} else {
					return fn(null, result);
				}
			});
	});

};