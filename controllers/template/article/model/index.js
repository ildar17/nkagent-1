let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require("co");

module.exports = Article;

function Article(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

//Просматривать(0) | Удалять(1) | Править, редактировать(2) | Сохранять, добавлять(3) | Редактировать всех(4)


Article.prototype.list = function (fn) {

  let article = this;


  if (article.permission.indexOf('0', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id as Редактировать, date_create as "Дата создания", status as Статус, main as Главная, title as Заголовок, description as Описание,content as Контент, alias as Псевдоним FROM node, article WHERE id = node_id AND section = $1 AND template = $2 AND author = $3 ORDER BY date_create DESC', [article.section, article.template, article.author], function (err, result) {
        done();
        if (err) return fn(err, null);
        return fn(null, result);

      });

    });

  } else if (article.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      if (article.section === null) {

        client.query('SELECT id as Редактировать, date_create as "Дата создания", date_edit as "Дата правки", (SELECT email FROM users WHERE id_user = author) as Автор, (SELECT email FROM users WHERE id_user = author_edit) as "Автор правки", status as Статус, main as Главная, title as Заголовок, description as Описание, content as Контент, alias as Псевдоним, priority as Приоритет FROM node, article WHERE id = node_id  AND section IS NULL AND template = $1 ORDER BY priority DESC', [article.template], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);
        });

      } else {

        client.query('SELECT id as Редактировать, date_create as "Дата создания", date_edit as "Дата правки", (SELECT email FROM users WHERE id_user = author) as Автор, (SELECT email FROM users WHERE id_user = author_edit) as "Автор правки", status as Статус, main as Главная, title as Заголовок, description as Описание, content as Контент, alias as Псевдоним, priority as Приоритет FROM node, article WHERE id = node_id  AND section = $1 AND template = $2 ORDER BY priority DESC', [article.section, article.template], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);
        });
      }
    });
  }
};

Article.prototype.listLimit = function (limit, offset, fn) {
  let article = this;

  if (article.permission.indexOf('0', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id as Редактировать, date_create as "Дата создания", status as Статус, main as Главная, title as Заголовок, description as Описание,content as Контент, alias as Псевдоним FROM node, article WHERE id = node_id AND section = $1 AND template = $2 AND author = $3 ORDER BY date_create DESC' +
        ' LIMIT $4 OFFSET $5',
        [article.section, article.template, article.author, limit, offset], function (err, result) {
          done();
          if (err) return fn(err, null);

          return fn(null, result);
        });
    });

  } else if (article.permission.indexOf('1', 4) === 4) {

    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      if (article.section === null) {

        client.query('SELECT id as Редактировать, date_create as "Дата создания", date_edit as "Дата правки", (SELECT email FROM users WHERE id_user = author) as Автор, (SELECT email FROM users WHERE id_user = author_edit) as "Автор правки", status as Статус, main as Главная, title as Заголовок, description as Описание, content as Контент, alias as Псевдоним, priority as Приоритет FROM node, article WHERE id = node_id  AND section IS NULL AND template = $1 ORDER BY priority' +
          ' DESC LIMIT $2 OFFSET $3',
          [article.template, limit, offset], function (err, result) {
            done();


            if (err) return fn(err, null);

            return fn(null, result);

          });

      } else {

        client.query('SELECT id as Редактировать, date_create as "Дата создания", date_edit as "Дата правки", (SELECT email FROM users WHERE id_user = author) as Автор, (SELECT email FROM users WHERE id_user = author_edit) as "Автор правки", status as Статус, main as Главная, title as Заголовок, description as Описание, content as Контент, alias as Псевдоним, priority as Приоритет FROM node, article WHERE id = node_id  AND section = $1 AND template = $2 ORDER BY priority' +
          ' DESC LIMIT $3 OFFSET $4',
          [article.section, article.template, limit, offset], function (err, result) {
            done();

            if (err) return fn(err, null);

            return fn(null, result);
          });
      }
    });
  }
};

Article.prototype.getPage = function (fn) {
  let article = this;

  pool.connect(function (err, client, done) {

    client.query('SELECT * FROM node, article WHERE id = node_id AND id = $1',
      [article.id], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);
      });
  });
};

Article.prototype.isset = function (fn) {

  let article = this;

  if (article.latin === '2') {
    return fn(null, 1);
  } else {
    pool.connect(function (err, client, done) {
      if (err) return fn(err);

      client.query('SELECT id FROM node WHERE alias = $1',
        [article.alias], function (err, result) {
          done();
          if (err) return fn(err, null);


          if (result.rowCount === 1 && result.rows[0].id === article.id) {
            return fn(null, 1);
          } else if (result.rowCount === 1 && result.rows[0].id !== article.id) {
            return fn(null, 0);
          } else {
            return fn(null, 1);
          }
        });
    });
  }
};

Article.prototype.save = function (fn) {
  let article = this;

/*  co(function* () {

    let client = yield pool.connect();

    try {

      for (let key in article) {
        if (article[key] === '') {
          article[key] = null;
        }
      }

      if (article.permission.indexOf('0', 4) === 4) {
        article.priority = 0;
        article.status = 0;
        article.main = 0;
      }

      if (article.section === 'null') {
        article.section = null;
      }

      if (article.latin === '2') {
        article.alias = null;
      }

      yield client.query('BEGIN');

      let result = yield client.query('INSERT INTO node (title, alias, date_create, author, status, main, template, section) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)' + 'RETURNING id', [article.title, article.alias, article.date_create, article.author, article.status, article.main, article.template, article.section]);


      if (article.priority === 0 || article.priority === null) {
        article.priority = result.rows[0].id;
      }

      if (article.alias === null) {
        yield client.query('UPDATE node SET alias = $1 WHERE id = $2', [result.rows[0].id, result.rows[0].id]);

        let alias = yield client.query('SELECT alias, id FROM node WHERE alias = $1', [result.rows[0].id]);

        if (alias.rows[0].alias === result.rows[0].id) {
          yield client.query('UPDATE node SET alias = $1 WHERE id = $2', [alias.rows[0].id, alias.rows[0].id]);
        }
      }

      let result1 = yield client.query('INSERT INTO article (description, content, priority, node_id) VALUES ($1, $2, $3, $4)', [article.description, article.content, article.priority, result.rows[0].id]);


      yield client.query('COMMIT');
      client.release();

      return fn(null, result1);

    } catch (err) {

      client.release(true);
      return fn(err, null);

    }

  });*/

  (async () => {

    const client = await pool.connect();

    try {
      for (let key in article) {
        if (article[key] === '') {
          article[key] = null;
        }
      }

      if (article.permission.indexOf('0', 4) === 4) {
        article.priority = 0;
        article.status = 0;
        article.main = 0;
      }

      if (article.section === 'null') {
        article.section = null;
      }

      if (article.latin === '2') {
        article.alias = null;
      }
      await client.query('BEGIN');

      let result = await client.query('INSERT INTO node (title, alias, date_create, author, status, main, template, section) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)' + 'RETURNING id', [article.title, article.alias, article.date_create, article.author, article.status, article.main, article.template, article.section]);

      if (article.priority === 0 || article.priority === null) {
        article.priority = result.rows[0].id;
      }

      if (article.alias === null) {
        await client.query('UPDATE node SET alias = $1 WHERE id = $2', [result.rows[0].id, result.rows[0].id]);

        let alias = await client.query('SELECT alias, id FROM node WHERE alias = $1', [result.rows[0].id]);

        if (alias.rows[0].alias === result.rows[0].id) {
          await client.query('UPDATE node SET alias = $1 WHERE id = $2', [alias.rows[0].id, alias.rows[0].id]);
        }
      }

      let result1 = await client.query('INSERT INTO article (description, content, priority, node_id) VALUES ($1, $2, $3, $4)', [article.description, article.content, article.priority, result.rows[0].id]);

      await client.query('COMMIT');
      client.release();

      return fn(null, result1);

    } catch (err) {
      await client.query('ROLLBACK');
      return fn(err, null);
    }
  })()

};

Article.prototype.editPage = function (fn) {
  let article = this;

  co(function * () {

    let client = yield pool.connect();

    try {


      if (article.permission.indexOf('0', 4) === 4) {
        article.priority = 0;
        article.status = 0;
        article.main = 0;
      }

      if (article.latin === '2') {
        article.alias = null;
      }

      yield client.query('BEGIN');


      yield client.query('DELETE FROM article_reject WHERE node_id = $1', [article.id]);


      yield client.query('UPDATE node SET title = $1, alias = $2, date_edit = $3, author_edit = $4, status = $5, main = $6, template = $7,  section = $8 WHERE id = $9', [article.title, article.alias, article.date_edit, article.author_edit, article.status, article.main, article.template, article.section, article.id]);

      if (article.priority === null || article.priority === 0) {
        article.priority = article.id;
      }

      if (article.alias === null) {
        yield client.query('UPDATE node SET alias = $1 WHERE id = $2', [article.id, article.id]);

        let alias = yield client.query('SELECT alias, id FROM node WHERE alias = $1', [article.id]);

        if (alias.rows[0].alias === article.id) {
          yield client.query('UPDATE node SET alias = $1 WHERE id = $2', [alias.rows[0].id, alias.rows[0].id]);
        }
      }

      let result = yield client.query('UPDATE article SET description = $1, content = $2, priority = $3, node_id = $4 WHERE node_id = $5', [article.description, article.content, article.priority, article.id, article.id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (err) {

      client.release(true);
      return fn(err, null);

    }

  });
};

Article.prototype.drop = function (fn) {

  let article = this;

  co(function * () {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      yield client.query('DELETE FROM article_reject WHERE node_id = $1', [article.id]);

      yield client.query('DELETE FROM article WHERE node_id = $1', [article.id]);

      let result = yield client.query('DELETE FROM node WHERE id = $1', [article.id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result);

    } catch (err) {

      client.release(true);
      return fn(err, null);

    }
  });
};

Article.getSectionTemp = function (idSection, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node, sectionandtemplate WHERE section = section_id AND section = $1', [idSection], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};


Article.getSectionPage = function (idSection, fn) {

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node LEFT JOIN sectionandtemplate ON(id = section_id) WHERE id = $1', [idSection], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};


Article.prototype.getPageUser = function (fn) {
  let article = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT * FROM node, article WHERE id = node_id AND id = $1 AND author = $2', [article.id, article.author_edit], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Article.prototype.selectSection = function (fn) {

  let article = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT section_id, (SELECT title FROM node WHERE id = section_id) as section FROM sectionandtemplate WHERE template_name = $1' +
      ' AND one_page IS NULL ORDER BY section',
      [article.temp], function (err, result) {
        done();
        if (err) return fn(err, null);

        return fn(null, result);

      });
  });

};

Article.prototype.expectIdArticle = function (fn) {
  let article = this;

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT id, section FROM node WHERE template = $1 AND author = $2 AND status = 0', [article.template, article.author], function (err, result) {
      done();
      if (err) return fn(err, null);

      return fn(null, result);

    });
  });
};

Article.prototype.createRejectArticle = function (fn) {

  let article = this;

  co(function * () {

    let client = yield pool.connect();

    try {

      yield client.query('BEGIN');

      let result = yield client.query('SELECT * FROM article_reject WHERE node_id = $1', [article.id]);

      if (result.rowCount > 0) {

        yield client.query('UPDATE article_reject SET message = $1, date_message = $2 WHERE node_id = $3', [article.message, article.date_message, article.id]);

      } else {

        yield client.query('INSERT INTO article_reject(node_id, message, date_message) VALUES ($1, $2, $3)', [article.id, article.message, article.date_message]);

      }

      let result1 = yield client.query('UPDATE node SET status = 0 WHERE id = $1', [article.id]);

      yield client.query('COMMIT');
      client.release();

      return fn(null, result1);

    } catch (err) {

      client.release(true);
      return fn(err, null)

    }
  });
};