let conf = require('../../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);

module.exports = SQL;

function SQL(obj) {
   for (let key in obj) {
      this[key] = obj[key];
   }
}


SQL.resultQuery = function (query, fn) {
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query(query, function (err, result) {
         done();

         if (err) return fn(err, null);

         return fn(null, result);
      });

   });
};

SQL.prototype.saveArchive = function (fn) {
   
   let sql = this;
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);

      client.query('SELECT query FROM sql WHERE query_lower = $1',
         [ sql.query.toLowerCase() ], function (err, result) {
            done();
            if (err) return fn(err, null);

            if(result.rowCount != 1){
   
               pool.connect( function (err, client, done) {
                  if (err) return fn(err, null);

                  client.query('INSERT INTO sql (command, error, query, query_lower, date) VALUES ($1, $2, $3, $4, $5)',
                     [ sql.command, sql.error, sql.query, sql.query.toLowerCase(), sql.date ], function (err, result) {
                        done();
                        if (err) return fn(err, null);

                        fn(null, result);
                     });
               });

            } else {

               fn(null, result);
            }
         });
   });
};

SQL.getQuery = function (id_sql, fn) {
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query('SELECT query FROM sql WHERE id_sql = $1',
         [ id_sql ], function (err, result) {
            done();
            if (err) return fn(err, null);
            
            fn(null, result);
         });
   });
};

SQL.getArchive = function (fn) {
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query('SELECT id_sql, command, error, query, date FROM sql WHERE notebook is null ORDER BY date DESC',
         function (err, result) {
         done();
         if (err) return fn(err, null);
         
         fn(null, result);
      });
   });
};

SQL.getNotebook = function (fn) {
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query('SELECT id_sql, query, tags, description, priority FROM sql WHERE notebook = 1 ORDER BY priority DESC',
         function (err, result) {
            done();
            if (err) return fn(err, null);
            
            fn(null, result);
         });
   });
};

SQL.getNotebookLimit = function (limit, offset, fn) {
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query('SELECT id_sql, query, tags, description, priority FROM sql WHERE notebook = 1 ORDER BY priority DESC LIMIT $1 OFFSET $2',
         [ limit, offset ], function (err, result) {
            done();
            if (err) return fn(err, null);
            
            fn(null, result);
         });
   });
};

SQL.getOneNotebook = function (id_sql, fn) {
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query('SELECT id_sql, query, tags, description, priority FROM sql WHERE notebook = 1 AND id_sql = $1',
         [ id_sql ], function (err, result) {
            done();
            if (err) return fn(err, null);
            
            fn(null, result);
         });
   });
};

SQL.saveQueryNotebook  = function (id_sql, fn) {
   
   let notebook = 1;
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query('UPDATE sql SET  notebook = $1 WHERE id_sql = $2',
         [ notebook, id_sql ], function (err, result) {
            done();
            if (err) return fn(err, null);
            
            fn(null, result);
         });
   });
};

SQL.prototype.editSQL = function (fn) {
   
   let sql = this;
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query('UPDATE sql SET  tags = $1, description = $2, priority = $3 WHERE id_sql = $4',
         [ sql.tags, sql.description, sql.priority, sql.id_sql ], function (err, result) {
            done();
            if (err) return fn(err, null);
            
            fn(null, result);
         });
   });
};

SQL.deleteQueryArchive = function (id_sql, fn) {
   
   pool.connect( function (err, client, done) {
      if (err) return fn(err, null);
      
      client.query('DELETE FROM sql WHERE id_sql = $1',
         [ id_sql ], function (err, result) {
            done();
            if (err) return fn(err, null);
            
            fn(null, result);
         });
   });
};