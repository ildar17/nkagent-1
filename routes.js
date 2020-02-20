let conf = require('./config/index');
let auth = require('./controllers/auth/index');
let admin = require('./controllers/template/admin');
let create_role = require('./controllers/administrator/create-role');
let section_name = require('./controllers/administrator/section-name');
let configure_access = require('./controllers/administrator/configure-access');
let users = require('./controllers/template/users');
let assign_role = require('./controllers/administrator/assign-role');
let sql = require('./controllers/administrator/sql/index');
let layer = require('./controllers/template/layer');
let block = require('./controllers/template/block');
let section = require('./controllers/template/section');
let settings = require('./controllers/administrator/settings');
let article = require('./controllers/template/article');
let apartment = require('./controllers/template/apartment');
let collection = require('./controllers/template/collection');
let cottages = require('./controllers/template/cottages');
let commercial = require('./controllers/template/commercial');
let complete = require('./controllers/template/complete');
let parser = require('./controllers/administrator/parser');
let parserCottages = require('./controllers/administrator/parser-cottages');
let parserCommercial = require('./controllers/administrator/parser-commercial');
let agency = require('./controllers/template/agency');
let earth = require('./controllers/administrator/earth');
let helper = require('./controllers/administrator/helper');
let price = require('./controllers/template/price');
let priceCottages = require('./controllers/template/price-cottages');
let priceCommercial = require('./controllers/template/price-commercial');
let settingsTemplate = require('./controllers/template/settings');
let label = require('./controllers/template/label');
let home_main = require('./controllers/home/main');
let collection_main = require('./controllers/home/collection');
let main = require('./controllers/template/main');
let all = require('./controllers/template/all');
let ajax = require('./controllers/ajax');

module.exports = function (app) {

/*  app.get(/.*!/, function(req, res) {
    res.status(503).send('<h1>Технические работы на сервере.</h1>');
  });*/

  app.get('/', home_main.list);
  app.get('/agency', home_main.list);
  app.get('/apartment', home_main.list);
  app.get('/cottages', home_main.list);
  app.get('/cottages', home_main.list);
  app.get('/commercial', home_main.list);
  app.get('/article', home_main.list);

  app.get('/admin/register', auth.registerForm);
  app.post('/admin/register', auth.registerSubmit);

  app.get('/admin/login', auth.loginForm);
  app.post('/admin/login', auth.loginSubmit);

  app.get('/admin/recovery', auth.recoveryForm);
  app.post('/admin/recovery', auth.recoverySubmit);

  app.get(conf.get('pathRecovery') + '/:hashEmail', auth.rebuildForm);
  app.post(conf.get('pathRecovery') + '/:hashEmail', auth.rebuildSubmit);

  app.get(conf.get('pathRegistration') + '/:hashEmail', auth.registrationForm);

  app.get(conf.get('pathRegistrationAdmin')+'/:hashEmail', auth.registerAdminForm);

  app.get('/collection/:hashCollection', collection_main.list);


  app.get('/admin/logout', function (req, res, next) {
    req.session.destroy(function (err) {
      if (err) next(err);
      res.clearCookie('user');
      res.redirect('/');
    })
  });

  app.get('/admin/template/admin', admin.list);
  app.post('/admin/template/admin', admin.submit);

  app.get('/admin/administrator/create-role', create_role.list);
  app.post('/admin/administrator/create-role', create_role.submit);

  app.get('/admin/administrator/section-name', section_name.list);
  app.post('/admin/administrator/section-name', section_name.submit);

  app.get('/admin/administrator/configure-access', configure_access.list);
  app.post('/admin/administrator/configure-access', configure_access.submit);

  app.get('/admin/template/users', users.list);
  app.post('/admin/template/users', users.submit);

  app.get('/admin/administrator/assign-role', assign_role.list);
  app.post('/admin/administrator/assign-role', assign_role.submit);

  app.get('/admin/administrator/sql', sql.list);
  app.post('/admin/administrator/sql', sql.submit);

  app.get('/admin/template/layer', layer.list);
  app.post('/admin/template/layer', layer.submit);

  app.get('/admin/template/block', block.list);
  app.post('/admin/template/block', block.submit);

  app.get('/admin/template/section', section.list);
  app.post('/admin/template/section', section.submit);

  app.get('/admin/administrator/settings', settings.list);

  app.get('/admin/template/article', article.list);
  app.post('/admin/template/article', article.submit);

  app.get('/admin/template/article-admin', article.list);
  app.post('/admin/template/article-admin', article.submit);

  app.get('/admin/administrator/parser', parser.list);
  app.post('/admin/administrator/parser', parser.submit);

  app.get('/admin/administrator/parser-cottages', parserCottages.list);
  app.post('/admin/administrator/parser-cottages', parserCottages.submit);

  app.get('/admin/administrator/parser-commercial', parserCommercial.list);
  app.post('/admin/administrator/parser-commercial', parserCommercial.submit);

  app.get('/admin/template/agency', agency.list);
  app.post('/admin/template/agency', agency.submit);

  app.get('/admin/administrator/earth', earth.list);
  app.post('/admin/administrator/earth', earth.submit);

  app.get('/admin/administrator/helper', helper.list);
  app.post('/admin/administrator/helper', helper.submit);

  app.get('/admin/template/price', price.list);
  app.post('/admin/template/price', price.submit);

  app.get('/admin/template/price-cottages', priceCottages.list);
  app.post('/admin/template/price-cottages', priceCottages.submit);

  app.get('/admin/template/price-commercial', priceCommercial.list);
  app.post('/admin/template/price-commercial', priceCommercial.submit);

  app.get('/admin/template/settings', settingsTemplate.list);
  app.post('/admin/template/settings', settingsTemplate.submit);

  app.get('/admin/template/label', label.list);
  app.post('/admin/template/label', label.submit);

  app.get('/admin/template/apartment', apartment.list);
  app.post('/admin/template/apartment', apartment.submit);

  app.get('/admin/template/cottages', cottages.list);
  app.post('/admin/template/cottages', cottages.submit);

  app.get('/admin/template/commercial', commercial.list);
  app.post('/admin/template/commercial', commercial.submit);

  app.get('/admin/template/complete', complete.list);
  app.post('/admin/template/complete', complete.submit);

  app.get('/admin/template/main', main.list);
  app.post('/admin/template/main', main.submit);

  app.get('/admin/ajax', ajax.list);
  app.post('/admin/ajax', ajax.submit);

  app.get('/admin/template/all', all.list);
  app.post('/admin/template/all', all.submit);

  app.get('/admin/template/collection', collection.list);
  app.post('/admin/template/collection', collection.submit);



};