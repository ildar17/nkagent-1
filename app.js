let express = require('express');
let conf = require('./config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
//let https = require('https');
let http = require('http');
let fs = require('fs');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let pgSession = require('connect-pg-simple')(session);
let path = require('path');
let multer = require('multer');
let logger= require('morgan');
let app = express();

/////////////////////////////
//app.set('env', 'production');
/////////////////////////////

app.use(require('helmet')());
/*const options = {
	key: fs.readFileSync(__dirname + '/ssl/nodesite.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/nodesite.crt')
};*/

http.createServer(app).listen(8080);
//https.createServer(options, app).listen(8443);

let handlebars = require('express-handlebars').create(
  {
    defaultLayout: 'main',
    extname: 'hbs',
    helpers: {
      section: function (name, options) {
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      },
      log: function (name) {
        console.log(name);
        return null;
      },
      deleteFlash: function (name) {
        name.removeMessages();
      },

      if_eq: function (a, b, options) {
        if (a == b) {
          if (!this._selected) this._selected = {};
          this._selected = options.fn(this);
        } else {
          this._selected = false;
        }
        return null;
      }
    }
  }
);
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser('optional secret string 17'));

app.use(express.static(__dirname + '/public'));

app.use(session({
  store: new pgSession({
    pool: pool,
  }),
  secret: 'keyboard cat 17',
  resave: false,
  saveUninitialized: true,
  cookie: conf.get("maxAge")
}));

let user = require('./middleware/user');
app.use(user);

let messagesAuth = require('./middleware/messages');
app.use(messagesAuth);

app.use(multer({dest: 'controllers/ajax/tmp/'}).single('file'));

app.use(require('csurf')());
app.use(function (req, res, next) {
  res.locals._csrfToken = req.csrfToken();
  next();
});

app.use(function (req, res, next) {
  res.locals.flash = req.session.flash;
  res.locals._viewsQuery = req.session._viewsQuery;
  res.locals.repeatData = req.session.repeatData;

  delete req.session._viewsQuery;
  delete req.session.repeatData;
  delete req.session.flash;

  next();
});

app.use(logger('dev'));
require('./routes.js')(app);


app.use(function (req, res, next) {
  res.status(404);
  res.render('404');
});

if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('500', {
      message: err.message,
      error: err
    });
  });
}

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('500', {
    message: err.message,
    error: {}
  });
});

