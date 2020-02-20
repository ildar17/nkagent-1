let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");
let ms = require('../../../../lib/msDate');

module.exports = Section;

function Section(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}


Section.prototype.isset = function (fn) {

  let section = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id FROM node WHERE alias = $1',
      [section.alias], function (err, result) {
        done();
        if (err) return fn(err, null);


        if (result.rowCount === 1 && result.rows[0].id === section.id) {
          return fn(null, 1);
        } else if (result.rowCount === 1 && result.rows[0].id !== section.id) {
          return fn(null, 0);
        } else {
          return fn(null, 1);
        }
      });
  });

};

//Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)

Section.prototype.save = function (fn) {

  let section = this;

  if (section.permission.indexOf('0', 0) === 0) {
    section.status = 0;
    section.main = 0;
  }


  co(function* () {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('INSERT INTO node (title, alias, date_create, author, status, main, template) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [section.title, section.alias, section.date_create, section.author, section.status, section.main, section.template]);


      let result1 = yield client.query('UPDATE node SET line = $1 WHERE id = $2', [result.rows[0].id, result.rows[0].id]);

      yield client.query('COMMIT');
      client.release();


      return fn(null, result1);

    } catch (e) {

      client.release(true);
      return fn(e, null);

    }
  })

};

Section.prototype.editEmail = function (fn) {

  let section = this;

  if (section.permission.indexOf('0', 0) === 0) {
    section.status = 0;
    section.main = 0;
  }

  section.line = section.id;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, template = $5, line = $6 WHERE id = $7 AND author = $8',
      [section.title, section.alias, section.date_create, section.author, section.template,  section.line, section.id, section.author], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Section.prototype.editId = function (fn) {

  let section = this;

  if (section.permission.indexOf('0', 0) === 0) {
    section.status = 0;
    section.main = 0;
  }

  section.line = section.line * 1;

  if (!section.line) {
    section.line = null;
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, ' +
      'status = $5, main = $6, template = $7, line = $8 WHERE id = $9',
      [section.title, section.alias, section.date_create, section.author, section.status, section.main, section.template, section.line, section.id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Section.prototype.dropSection = function (fn) {

  let section = this;

  co(function* () {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      yield client.query('DELETE FROM blockandsection WHERE section_id = $1', [section.id]);

      yield client.query('UPDATE node SET section = null WHERE section = $1', [section.id]);

      yield client.query('DELETE FROM sectionandtemplate WHERE section_id = $1', [section.id]);

      let result = yield client.query('DELETE FROM node WHERE id = $1', [section.id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (e) {
      client.release(true);
      return fn(e, null);
    }
  })


};

Section.prototype.list = function (fn) {
  let section = this;

  if (section.permission.indexOf('0', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id_sectionandtemplate as "ID", id as Редактирование, (SELECT title FROM node WHERE id = block_id) as "Блок", title as "Название раздела", alias as "Псевдоним раздела", template_name as "Шаблон", one_page as Запись, date_create as "Дата создания", date_edit as "Дата правки", (select email from users where id_user = author) as Автор, (select email from users where id_user = author_edit) as "Автор правки", status as Статус, main as Главная, line as Приоритет FROM node LEFT JOIN blockandsection ON (node.id = blockandsection.section_id) LEFT JOIN sectionandtemplate ON (node.id = sectionandtemplate.section_id) WHERE template = $1 AND author = $2 ORDER BY Блок, Автор, Приоритет DESC', [section.template, section.id_user], function (err, result) {
          done();

          if (err) return fn(err, null);

          return fn(null, result);

        });
    });
  }

  if (section.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id_sectionandtemplate as "ID", id as Редактирование, (SELECT title FROM node WHERE id = block_id) as "Блок", ' +
        'title as "Название раздела", alias as "Псевдоним раздела", template_name as "Шаблон", one_page as Запись, ' +
        'date_create as "Дата создания", date_edit as "Дата правки", ' +
        '(select email from users where id_user = author) as Автор, (select email from users where id_user = author_edit) as "Автор правки", status as Статус, main as Главная, line as Приоритет ' +
        'FROM node LEFT OUTER JOIN blockandsection ON (node.id = blockandsection.section_id) ' +
        'LEFT OUTER JOIN sectionandtemplate ON (node.id = sectionandtemplate.section_id) WHERE template = $1 ORDER BY Блок, Автор, Приоритет DESC',
        [section.template], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);

        });
    });
  }
};

Section.prototype.getId = function (fn) {

  let section = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1',
      [section.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Section.prototype.getIdEmail = function (fn) {

  let section = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node WHERE id = $1 AND author = $2',
      [section.id, section.author], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Section.prototype.getTemplateId = function (fn) {

  let section = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_permit, temp FROM permit WHERE temp_sort = 1 except SELECT (SELECT id_permit FROM permit WHERE temp = template_name)' +
      ' AS id, template_name FROM sectionandtemplate WHERE section_id = $1',
      [section.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });

  });
};

Section.prototype.getTableId = function (fn) {

  let block = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id_sectionandtemplate, title as "Название раздела", alias as "Псевдоним раздела", template_name as "Шаблоны раздела", (SELECT email FROM users WHERE id_user = author_edit) as "Автор правки", date_edit as "Дата правки", status as "Статус", main as "Главная" FROM node JOIN sectionandtemplate ON(section_id = id) WHERE section_id = $1',
      [block.id], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Section.prototype.addSectionAndTemplate = function (fn) {

  let section = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('INSERT INTO sectionandtemplate ( section_id, template_name ) VALUES ($1, $2)',
      [section.section_id, section.template], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Section.accessSectionID = function (id_section, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT (SELECT email FROM users WHERE id_user = author) AS email FROM node WHERE id = $1', [id_section], function (err, result) {

      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Section.accessSectionandtemplateID = function (id_sectionandtemplate, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT (SELECT email FROM users WHERE id_user = author) AS email FROM sectionandtemplate, node WHERE id = section_id AND id_sectionandtemplate = $1', [id_sectionandtemplate], function (err, result) {

      done();

      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Section.deleteTemplate = function (id_sectionandtemplate, fn) {
  pool.connect(function (err, client, done) {

    if (err) return fn(err);

    client.query('DELETE FROM sectionandtemplate WHERE id_sectionandtemplate = $1',
      [id_sectionandtemplate], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Section.prototype.createOnePage = function (fn) {

  let section = this;

  if (section.one_page === '0') {
    section.one_page = null
  }

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('UPDATE sectionandtemplate SET one_page = $1 WHERE id_sectionandtemplate = $2',
      [section.one_page, section.id_sectionandtemplate], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });
};

Section.getEmailAuthor = function (author, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT email FROM users WHERE id_user = $1',
      [author], function (err, result) {
        done();

        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Section.tableListSection = function (result, permission) {

  let str = '';
  let id = 0;

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed">' + '\n';
    str += '\t' + '<tr>' + '\n';

    for (let i = 0; i < result.fields.length; i++) {

      if (result.fields[i].name === 'ID') {
        continue;
      }

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }

    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {

      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        if (result.fields[i].name === 'ID') {
          id = row[cols];
          continue;
        }


        str += '\t\t' + '<td>';


        if (result.fields[i].name === 'Редактирование') {

          str += '<span class="td220">';

          if (permission.indexOf('1', 2) === 2) {
            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/section?edit=' + row[cols] + '">править</a>';
          }

          if (permission.indexOf('1', 1) === 1) {
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/section?drop=' + row[cols] + '">удалить</a>';
          }

          if (permission.indexOf('1', 3) === 3) {
            str += '<a class="btn btn-success btn-xs btn-margins" role="button" href="/admin/template/section?createTemplate=' + row[cols] + '">шаблон к разделу</a>';
          }

          str += '</span>';
        } else if (result.fields[i].name === 'Блок') {

          if (row[cols] == null) {
            str += row[cols] = '';
          } else {
            str += row[cols];
          }

        } else if (result.fields[i].name === 'Название раздела') {

          str += row[cols];


        } else if (result.fields[i].name === 'Шаблон') {

          if (permission.indexOf('1', 1) === 1 && id !== null) {
            str += row[cols]+" ";
            str += '<a href="/admin/template/section?deleteTemplate=' + id + '">открепить</a>';
          }


        } else if (result.fields[i].name === 'Дата создания' || result.fields[i].name === 'Дата правки') {
          str += ms.clip(ms.msDate(row[cols]));
        } else if (result.fields[i].name === 'Запись') {

          if (permission.indexOf('1', 2) === 2 || permission.indexOf('1', 3) === 3) {
            if (row[cols] == null && id != null) {
              str += '<a href="/admin/template/section?idSectionandtemplate=' + id + '&onePage=1">много</a>';
            } else if (row[cols] == null && id == null) {
              str += row[cols] = '';
            } else {
              str += '<a href="/admin/template/section?idSectionandtemplate=' + id + '&onePage=0">одна</a>';
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
          str += '<b>' + row[cols] + '</b>';
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

Section.tableSectionAndTemplate = function (result, permission, createTemplate) {

  let str = '';

  let id;

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed">' + '\n';
    str += '\t' + '<tr>' + '\n';

    for (let i = 0; i < result.fields.length; i++) {

      if (result.fields[i].name === 'id_sectionandtemplate') {
        continue;
      }

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';


    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];

      str += '\t' + '<tr>' + '\n';

      for (let i = 0; i < result.fields.length; i++) {

        let cols = result.fields[i].name;

        if (result.fields[i].name === 'id_sectionandtemplate') {
          id = row[cols];
          continue;
        }

        str += '\t\t' + '<td>';

        if (result.fields[i].name === 'Шаблоны раздела') {

          str += row[cols];

          if (permission.indexOf('1', 2) === 2) {
            str += '&nbsp&nbsp&nbsp' + '<a class="drop" href="/admin/template/section?createTemplate='
              + createTemplate + '&deleteTemplate=' + id + '">открепить</a>';
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
