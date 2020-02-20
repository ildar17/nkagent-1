let conf = require('../../../../config');
const {Pool} = require('pg');
let dbConf = conf.get('db');
let pool = new Pool(dbConf);

class Collection {

  constructor(obj) {
    for (let key in obj) {
      this[key] = obj[key];
    }
  }








}

module.exports = Collection;