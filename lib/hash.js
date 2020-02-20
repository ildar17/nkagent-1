let crypto = require('crypto');
let conf = require('../config');


exports.get = function (){

  let date = Date.now();
  date = String(date);

  return crypto.createHmac('sha1', conf.get('salt')).update(date).digest('hex');

};