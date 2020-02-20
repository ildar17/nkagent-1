let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let ms = require('../../../../lib/msDate');

module.exports = Layer;

function Layer(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}


Layer.prototype.isset = function (fn) {

  let layer = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node WHERE alias = $1',
      [layer.alias], function (err, result) {
        done();
        if (err) return fn(err, null);


        if (result.rowCount === 1 && result.rows[0].id === layer.id) {
          return fn(null, 1);
        } else if (result.rowCount === 1 && result.rows[0].id !== layer.id) {
          return fn(null, 0);
        } else {
          return fn(null, 1);
        }
      });
  });

};

//Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

Layer.prototype.save = function (fn) {

  let layer = this;

  if(layer.permission.indexOf('0', 4) === 4){

    layer.status = 0;
    layer.main = 0;

    co(function* () {

      let client = yield pool.connect();

      try {

        yield client.query('BEGIN');

        let result = yield client.query('INSERT INTO node (title, alias, date_create, status, main, author, template) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [layer.title, layer.alias, layer.date_create, layer.status, layer.main, layer.author, layer.template]);


        let result1 = yield client.query('UPDATE node SET line = $1 WHERE id = $2', [result.rows[0].id, result.rows[0].id]);

        yield client.query('COMMIT');
        client.release();


        return fn(null, result1);

      } catch (e) {

        client.release(true);
        return fn(e, null);

      }
    })
  }


  if( layer.permission.indexOf('1', 4) === 4){

    co(function* () {

      let client = yield pool.connect();

      try {

        yield client.query('BEGIN');

        let result = yield client.query('INSERT INTO node (title, alias, date_create, author, status, main, template) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [layer.title, layer.alias, layer.date_create, layer.author, layer.status, layer.main, layer.template]);

        if(layer.line === 0 || layer.line === null){
          layer.line = result.rows[0].id;
        }

        let result1 = yield client.query('UPDATE node SET line = $1 WHERE id = $2', [layer.line, result.rows[0].id]);

        yield client.query('COMMIT');
        client.release();


        return fn(null, result1);

      } catch (e) {

        client.release(true);
        return fn(e, null);

      }
    })
  }
};

Layer.prototype.editEmail = function (fn) {

  let layer = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, template = $5 WHERE id = $6 AND author = $7',
      [layer.title, layer.alias, layer.date_create, layer.author, layer.template, layer.id, layer.author], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Layer.prototype.editId = function (fn) {

  let layer = this;

  layer.line = layer.line * 1;

  if (!layer.line) {
    layer.line = null;
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, ' +
      'status = $5, main = $6, template = $7, line = $8  WHERE id = $9',
      [layer.title, layer.alias, layer.date_create, layer.author, layer.status, layer.main, layer.template, layer.line, layer.id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Layer.prototype.dropLayer = function (fn) {
  let layer = this;

  co(function* () {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      yield client.query('DELETE FROM layerandblock WHERE layer_id = $1', [layer.id]);

      let result = yield client.query('DELETE FROM node WHERE id = $1', [layer.id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (e) {
      client.release(true);
      return fn(e, null);
    }
  })
};

Layer.prototype.list = function (fn) {
  let layer = this;

  if (layer.permission.indexOf('0', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id as Редактирование, title as "Название слоя", alias as "Псевдоним слоя", (SELECT title FROM node WHERE id = block_id) as "Блок", id_layerandblock, date_create as "Дата создания", (select email from users where id_user = author_edit) as "Автор правки", date_edit as "Дата правки", status as Статус, main as Главная FROM node LEFT OUTER JOIN layerandblock block ON (id = layer_id) WHERE template = $1 AND author = $2 ORDER BY date_create DESC',
        [layer.template, layer.id_user], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
    });
  }

  if (layer.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id as Редактирование, title as "Название слоя", alias as "Псевдоним слоя", ' +
        '(SELECT title FROM node WHERE id = block_id) as "Блок", id_layerandblock, ' +
        'date_create as "Дата создания",  date_edit as "Дата правки", (select email from users where id_user = author) as Автор, (select email from users where id_user = author_edit) as' +
        ' "Автор правки", status as Статус, main as Главная, line as Приоритет FROM node LEFT OUTER JOIN layerandblock block ON (id = layer_id) WHERE template = $1 ORDER BY author, line DESC',
        [layer.template], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
    });
  }
};

Layer.prototype.getIdEmail = function (fn) {

  let layer = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1 AND author = $2',
      [layer.id, layer.author], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Layer.prototype.getId = function (fn) {

  let layer = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1',
      [layer.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Layer.prototype.addLayerAndBlock = function (fn) {

  let layer = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO layerandblock ( layer_id, block_id ) VALUES ($1, $2)',
      [layer.layer_id, layer.block_id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Layer.prototype.getTableId = function (fn) {

  let layer = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_layerandblock as Редактирование, title as "Название блока", alias as "Псевдоним блока", (select email from users where id_user = author) as "Автор", date_create as "Дата создания", (select email from users where id_user = author_edit) as "Автор правки", date_edit as "Дата правки", status as "Статус", main as "Главная" FROM node JOIN layerandblock ON(id = block_id) WHERE layer_id = $1',
      [layer.id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};


Layer.prototype.deleteStrLayerandblock = function (fn) {
  let layer = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM layerandblock WHERE id_layerandblock = $1', [layer.id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Layer.getEmailAuthor = function (author, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT email FROM users WHERE id_user = $1', [author], function (err, result) {

        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Layer.accessLayerandblockID = function (id_layerandblock, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT (SELECT email FROM users WHERE id_user = author) AS email FROM node, layerandblock WHERE id = layer_id AND id_layerandblock = $1', [id_layerandblock], function (err, result) {

      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Layer.accessLayerID = function (id_layer, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT (SELECT email FROM users WHERE id_user = author) AS email FROM node WHERE id = $1', [id_layer], function (err, result) {

      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Layer.getLayerIDAuthor = function (layer_id, author, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node WHERE id = $1 AND author = $2", [layer_id, author], function (err, result) {
      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Layer.layerAndBlockSelect = function (layer_id, author, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    let block = 'block';

    client.query('SELECT id, title, alias, author FROM node WHERE template = $1 AND author = $2 EXCEPT SELECT id, title, alias, author FROM node RIGT JOIN layerandblock ON (id = block_id ) WHERE layer_id = $3 AND author = $4', [block, author, layer_id, author], function (err, result) {
      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Layer.getTableIdAuthor = function (layer_id, author, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_layerandblock as Редактирование, title as "Название блока", alias as "Псевдоним блока", date_create as "Дата создания", (select email from users where id_user = author_edit) as "Автор правки", date_edit as "Дата правки", status as "Статус", main as "Главная" FROM node JOIN layerandblock ON(id = block_id) WHERE layer_id = $1 AND author = $2',
      [layer_id, author], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Layer.getLayerID = function (layer_id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node WHERE id = $1", [layer_id], function (err, result) {
      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Layer.layerAndBlockSelectAll = function (layer_id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    let block = 'block';

    client.query("SELECT id, title, alias, author FROM node WHERE template = $1 EXCEPT SELECT id, title, alias, author FROM node RIGT JOIN layerandblock ON (id = block_id ) WHERE layer_id = $2", [block, layer_id], function (err, result) {
      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Layer.getTableId = function (layer_id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_layerandblock as Редактирование, title as "Название блока", alias as "Псевдоним блока", (select email from users where id_user = author) as "Автор", date_create as "Дата создания", (select email from users where id_user = author_edit) as "Автор правки", date_edit as "Дата правки", status as "Статус", main as "Главная" FROM node JOIN layerandblock ON(id = block_id) WHERE layer_id = $1',
      [layer_id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Layer.tableListLayer = function (result, permission) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';


    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        let cols = result.fields[i].name;


        str += '\t\t' + '<td>';

        if (result.fields[i].name === 'Редактирование') {

          str += '<span class="td230">';

          if (permission.indexOf('1', 2) === 2) {
            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/layer?edit=' + row[cols] + '">править</a>';
          }

          if (permission.indexOf('1', 1) === 1) {
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/layer?drop=' + row[cols] + '">удалить слой</a>';
          }

          if (permission.indexOf('1', 3) === 3) {
            str += '<a class="btn btn-success btn-xs btn-margins" role="button" href="/admin/template/layer?createBlocks=' + row[cols] + '">добавить блоки к слою</a>';
          }

          str += '</span>';

        } else if (result.fields[i].name === 'id_layerandblock') {

          if (row[cols] == null) {
            str += row[cols] = '';
          } else {

            if (permission.indexOf('1', 1) === 1) {
              str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/layer?dropStr=' + row[cols] + '">удалить строку</a>';
            }

          }

        } else if (result.fields[i].name === 'Автор') {

          if (row[cols] === conf.get('administrator')) {
            str += 'администратор';
          } else if (row[cols] == null) {
            str += '<span class="noData">удалён</span>';
          } else {
            str += row[cols];
          }

        } else if (result.fields[i].name === 'Автор правки') {

          if (row[cols] === conf.get('administrator')) {
            str += 'администратор';
          } else if (row[cols] == null) {
            str += '';
          } else {
            str += row[cols];
          }

        } else if (result.fields[i].name === 'Дата создания' || result.fields[i].name === 'Дата правки') {
          str += ms.clip(ms.msDate(row[cols]));
        } else if (row[cols] == null) {
          str += row[cols] = '';
        } else if (result.fields[i].name === 'Статус') {

          if (row[cols] === 1) {
            str += '<span class="yes">public</span>';
          }

          if (row[cols] === 0) {
            str += '<span class="no">expect</span>';
          }

        } else if (result.fields[i].name === 'Главная') {

          if (row[cols] === 1) {
            str += '<span class="yes">да</span>';
          }

          if (row[cols] === 0) {
            str += '<span class="no">нет</span>';
          }

        } else {

          str += row[cols];
        }


        str += '</td>' + '\n';

      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

Layer.tableLayerAndBlock = function (result, permission) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';


    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        let cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name === 'Редактирование') {
          str += '<strong>' + row[cols] + '.</strong>';

          if (permission.indexOf('1', 1) === 1) {
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button"  href="/admin/template/layer?dropStr=' + row[cols] + '">удалить</a>';
          }

        } else if (result.fields[i].name === 'Автор') {

          if (row[cols] !== null && conf.get('administrator') !== row[cols]) {
            str += row[cols];
          } else if (conf.get('administrator') === row[cols]) {
            str += 'администратор';
          } else {
            str += '';
          }

        } else if (result.fields[i].name === 'Автор правки') {

          if (row[cols] !== null && conf.get('administrator') !== row[cols]) {
            str += row[cols];
          } else if (conf.get('administrator') === row[cols]) {
            str += 'администратор';
          } else {
            str += '';
          }

        } else if (result.fields[i].name === 'Дата создания' || result.fields[i].name === 'Дата правки') {
          str += ms.clip(ms.msDate(row[cols]));
        } else if (row[cols] == null) {
          str += row[cols] = '';
        } else if (result.fields[i].name === 'Статус') {

          if (row[cols] === 1) {
            str += '<span class="yes">public</span>';
          }

          if (row[cols] === 0) {
            str += '<span class="no">expect</span>';
          }

        } else if (result.fields[i].name === 'Главная') {
          if (row[cols] === 1) {
            str += 'главная';
          }

          if (row[cols] === 0) {
            str += '';
          }
        } else {
          str += row[cols];
        }


        str += '</td>' + '\n';

      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};