//const db = require('../db');

let conf = require('../config');
const {Pool} = require('pg');
let dbConf = conf.get('db');
let pool = new Pool(dbConf);

class Permit{

  constructor(obj){
    for (let key in obj) {
      this[key] = obj[key];
    }
  }

  async getSection(){

    try {

      let result = await pool.query('SELECT * FROM permit WHERE url_temp = $1', [this.pathname]);

      let objPermit = {};

      if(result.rowCount > 0){

        this.id_permit = result.rows[0].id_permit;
        this.temp = result.rows[0].temp;
        objPermit.temp = result.rows[0].temp;
        objPermit.nameTemplate = result.rows[0].name;

      } else {
        objPermit.rowCount = result.rowCount;
      }

      return objPermit;

    } catch (err) {
      //console.log(1, err);
      throw err;
    }
  }

  async setTemp(){

    try {

      let arrUrl = this.pathname.split('/');
      let temp = arrUrl[arrUrl.length - 1];
      this.temp = temp;

      return await pool.query('INSERT INTO permit (temp, url_temp) VALUES ($1, $2)', [temp, this.pathname]);


    } catch (err){
      //console.log(2, err);
      throw err;
    }

  }

  async getDataUser(uid){

    try {

      return await pool.query('SELECT * FROM users, userdata WHERE id_user = user_id AND email = $1', [uid]);

    } catch (err){
      //console.log(3, err);
      throw err;
    }
  }

  async getAccessCode(user){

    try {

      let id_permit = null;
      let code = '00000';
      let id_role = null;
      let result_role;

      let result_permit = await pool.query('SELECT * FROM permit WHERE url_temp = $1', [this.pathname]);

      if(result_permit.rowCount > 0){
        id_permit = result_permit.rows[0].id_permit;
      }

      if(user.administrator === true){

        code = '11111';
        return Promise.resolve(code);

      } else if(user.users === 0){

        id_role = user.id_role;

      } else {

        result_role = await pool.query('SELECT * FROM role WHERE users = 1');

        if(result_role.rowCount > 0){
          id_role = result_role.rows[0].id_role;
        }
      }


      let result = await pool.query('SELECT * FROM access WHERE permit_id = $1 and role_id = $2', [id_permit, id_role]);

      if(result.rowCount > 0){
        code = result.rows[0].code;
      } else {
        code = '00000';
      }

      return code;

    } catch (err){
      //console.log(4, err);
      throw err;
    }
  }

  async form(){

    try {

      let result = await pool.query('SELECT * FROM permit WHERE temp = $1', [this.temp]);

      let str = '';

      if (result.rowCount > 0) {

        let browse = result.rows[0].browse;
        let make = result.rows[0].make;
        let updat = result.rows[0].update;
        let delet = result.rows[0].delete;
        let publication = result.rows[0].publication;

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (browse !== 0) str += ' checked ';
        str += 'name="' + this.temp + '[browse]" value="1"> Редактировать всех</p>' + '\n';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (make !== 0) str += ' checked ';
        str += 'name="' + this.temp + '[make]" value="10"> Сохранять, добавлять</p>' + '\n';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (updat !== 0) str += ' checked ';
        str += ' name="' + this.temp + '[update]" value="100"> Править, редактировать</p>' + '\n';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (delet !== 0) str += ' checked ';
        str += 'name="' + this.temp + '[delete]" value="1000"> Удалять</p>' + '\n';

        str += '\t\t\t' + '<p><input type="checkbox" ';
        if (publication !== 0) str += ' checked ';
        str += 'name="' + this.temp + '[publication]" value="10000"> Публиковать</p>' + '\n';
        str += '<span class="commentForm" > Внимание! после снятия галочек с пунктов, нужно перенастроить роли.</span>' + '\n';

        str += '\t\t\t' + '<p><input class="permit_btn" type="submit" name="' + this.temp + '[tune]" value="Настроить" /></p>' + '\n';

        return str;

      } else {
        return str;
      }

    } catch (err){
      //console.log(5, err);
      throw err;
    }
  }

  async codeAndForm(user){

    try {

      return Promise.all([this.getAccessCode(user), this.form()])

    } catch (err){
      return Promise.reject(err);
    }
  }

  async setPermit(objInput){

    try {

      if (objInput.browse === undefined) objInput.browse = 0;
      if (objInput.make === undefined) objInput.make = 0;
      if (objInput.update === undefined) objInput.update = 0;
      if (objInput.delete === undefined) objInput.delete = 0;
      if (objInput.publication === undefined) objInput.publication = 0;

      return await pool.query('UPDATE permit SET browse = $1,  make = $2, update = $3,  delete = $4, publication = $5 WHERE temp = $6', [objInput.browse, objInput.make, objInput.update, objInput.delete, objInput.publication, this.temp]);


    } catch (err){
      //console.log(6, err);
      throw err;

    }

  }
}

module.exports = Permit;