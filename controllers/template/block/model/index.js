let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let ms = require('../../../../lib/msDate');

module.exports = Block;

function Block(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}


Block.prototype.isset = function (fn) {

  let block = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node WHERE alias = $1',
      [block.alias], function (err, result) {
        done();
        if (err) return fn(err, null);


        if (result.rowCount === 1 && result.rows[0].id === block.id) {
          return fn(null, 1);
        } else if (result.rowCount === 1 && result.rows[0].id !== block.id) {
          return fn(null, 0);
        } else {
          return fn(null, 1);
        }
      });
  });

};

//Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

Block.prototype.save = function (fn) {

  let block = this;


  if (block.permission.indexOf('0', 0) === 0) {
    block.status = 0;
    block.main = 0;
  }

    co(function* () {

      let client = yield pool.connect();

      try {

        yield client.query('BEGIN');

        let result = yield client.query('INSERT INTO node (title, alias, date_create, author, status, main, template) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [block.title, block.alias, block.date_create, block.author, block.status, block.main, block.template]);


        let result1 = yield client.query('UPDATE node SET line = $1 WHERE id = $2', [result.rows[0].id, result.rows[0].id]);

        yield client.query('COMMIT');
        client.release();


        return fn(null, result1);

      } catch (e) {

        client.release(true);
        return fn(e, null);

      }
    });

};

Block.prototype.editEmail = function (fn) {

  let block = this;

  if (block.permission.indexOf('0', 0) === 0) {
    block.status = 0;
    block.main = 0;
  }

  block.line = block.id;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, template = $5, line = $6 WHERE id = $7 AND author = $8',
      [block.title, block.alias, block.date_create, block.author, block.template, block.line, block.id, block.author], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Block.prototype.editId = function (fn) {

  let block = this;

  if (block.permission.indexOf('0', 0) === 0) {
    block.status = 0;
    block.main = 0;
  }

  block.line = block.line * 1;

  if (!block.line) {
    block.line = null;
  }


  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, status = $5, main = $6, template = $7, line = $8 WHERE id = $9',
      [block.title, block.alias, block.date_create, block.author, block.status, block.main, block.template, block.line, block.id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Block.prototype.dropBlock = function (fn) {
  let block = this;


  co(function* () {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      yield client.query('DELETE FROM layerandblock WHERE block_id = $1', [block.id]);

      yield client.query('DELETE FROM blockandsection WHERE block_id = $1', [block.id]);

      let result = yield client.query('DELETE FROM node WHERE id = $1', [block.id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (e) {
      client.release(true);
      return fn(e, null);
    }
  })
};

Block.prototype.list = function (fn) {
  let block = this;

  if (block.permission.indexOf('0', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id as Редактирование, title as "Имя набора", alias as "Псевдоним набора", (SELECT title FROM node WHERE id = section_id) as "Раздел", id_blockandsection, date_create as "Дата создания", (select email from users where id_user = author_edit) as "Автор правки", date_edit as "Дата правки", status as "Статус", main as "Главная" FROM node LEFT OUTER JOIN blockandsection ON (id = block_id) WHERE template = $1 AND author = $2 ORDER BY date_create DESC',
        [block.template, block.id_user], function (err, result) {
          done();
          if (err) {
            return fn(err, null)
          } else {
            return fn(null, result);
          }
        });
    });

  }

  if (block.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id as Редактирование, title as "Имя набора", alias as "Псевдоним набора", ' +
        '(SELECT title FROM node WHERE id = section_id) as "Раздел", id_blockandsection, date_create as "Дата создания", date_edit as "Дата правки", ' +
        '(select email from users where id_user = author) as Автор, (select email from users where id_user = author_edit) as "Автор правки", status as "Статус", main as "Главная", line as "Приоритет"  FROM node ' +
        'LEFT OUTER JOIN blockandsection ON (id = block_id) WHERE template = $1 ORDER BY line DESC',
        [block.template], function (err, result) {
          done();
          if (err) {
            return fn(err, null)
          } else {
            return fn(null, result);
          }
        });
    });
  }
};

Block.prototype.getIdEmail = function (fn) {

  let block = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1 AND author = $2',
      [block.id, block.author], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Block.prototype.getId = function (fn) {

  let block = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1',
      [block.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Block.prototype.addBlockAndSection = function (fn) {

  let block = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO blockandsection ( block_id, section_id ) VALUES ($1, $2)',
      [block.block_id, block.section_id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Block.getBlockID = function (block_id, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node WHERE id = $1", [block_id], function (err, result) {
      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Block.getBlockIDAuthor = function (block_id, author, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT * FROM node WHERE id = $1 AND author = $2", [block_id, author], function (err, result) {
      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });

};

Block.getTableId = function (block_id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_blockandsection as Редактирование, title as "Название раздела", alias as "Псевдоним раздела", (select email from users where id_user = author) as "Автор", date_create as "Дата создания", (select email from users where id_user = author_edit) as "Автор правки", date_edit as "Дата правки", status as "Статус", main as "Главная" FROM node JOIN blockandsection ON(id = section_id) WHERE block_id = $1',
      [block_id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Block.getTableIdAuthor = function (block_id, author, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_blockandsection as Редактирование, title as "Название раздела", alias as "Псевдоним раздела", date_create as "Дата создания", (select email from users where id_user = author_edit) as "Автор правки", date_edit as "Дата правки", status as "Статус", main as "Главная" FROM node JOIN blockandsection ON(id = section_id) WHERE block_id = $1 AND author = $2',
      [block_id, author], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Block.blockAndSectionSelect = function (block_id, author, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    let section = 'section';

    client.query('SELECT id, title, alias, author FROM node WHERE template = $1 AND author = $2 EXCEPT SELECT id, title, alias, author FROM node RIGT JOIN blockandsection ON (id = section_id ) WHERE block_id = $3 AND author = $4', [section, author, block_id, author], function (err, result) {
      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Block.blockAndSectionSelectAll = function (block_id, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query("SELECT id, title, alias, author FROM node WHERE template = 'section' EXCEPT SELECT id, title, alias, author FROM node RIGT JOIN blockandsection ON (id = section_id ) WHERE block_id = $1", [block_id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Block.accessBlockandsectionID = function (id_blockandsection, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT (SELECT email FROM users WHERE id_user = author) AS email FROM node, blockandsection WHERE id = block_id AND id_blockandsection = $1', [id_blockandsection], function (err, result) {

      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Block.accessBlockID = function (id_block, fn) {
  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT (SELECT email FROM users WHERE id_user = author) AS email FROM node WHERE id = $1', [id_block], function (err, result) {

      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};


Block.prototype.deleteStrBlockandsection = function (fn) {
  let block = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('DELETE FROM blockandsection WHERE id_blockandsection = $1', [block.id], function (err, result) {
      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};


Block.getEmailAuthor = function (author, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT email FROM users WHERE id_user = $1', [author], function (err, result) {

      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Block.tableListBlock = function (result, permission) {

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

          str += '<span class="td240">';

          if (permission.indexOf('1', 2) === 2) {
            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/block?edit=' + row[cols] + '">править</a>';
          }

          if (permission.indexOf('1', 1) === 1) {
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/block?drop=' + row[cols] + '">удалить блок</a>';
          }

          if (permission.indexOf('1', 3) === 3) {
            str += '<a class="btn btn-success btn-xs btn-margins" role="button" href="/admin/template/block?createSections=' + row[cols] + '">добавить разделы в блок</a>';
          }
          str += '</span>';

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

        } else if (result.fields[i].name === 'id_blockandsection') {

          if (row[cols] == null) {
            str += row[cols] = '';
          } else {

            if (permission.indexOf('1', 1) === 1) {
              str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/block?dropStr=' + row[cols] + '">удалить строку</a>';
            }

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

        } else if (result.fields[i].name === 'Псевдоним набора') {

          str += '<strong>' + row[cols] + '</strong>';


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

Block.tableBlockAndSection = function (result, permission) {

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

          if (permission.indexOf('1', 1) === 1) {
            str += '&nbsp&nbsp&nbsp' + '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/block?dropStr=' + row[cols] + '">удалить</a>';
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
    return str;
  }
};