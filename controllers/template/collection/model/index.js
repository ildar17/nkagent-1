let conf = require('../../../../config');
const {Pool} = require('pg');
let dbConf = conf.get('db');
let pool = new Pool(dbConf);
let ms = require('../../../../lib/msDate');

class Collection {

  constructor(obj) {
    for (let key in obj) {
      this[key] = obj[key];
    }
  }

  async list() {

    try {

      //console.log(this);

      let result = {};
      let where = ' WHERE';
      let tempSorting = this.tempSorting;
      let districtsSorting = this.districtsSorting;
      let citySorting = this.citySorting;

      ////////////////////////////////////////////////////////
      let type = '';
      let pageType = this.pageType;
      let sortingTypeAll = this.sortingTypeAll;
      if (pageType) {
        type = 'type IN(' + pageType + ')';
      } else {
        for (let i = 0; i < sortingTypeAll.length; i++) {
          type += sortingTypeAll[i] + ",";
        }
        type = type.slice(0, -1);
        type = 'type IN(' + type + ')';
      }
      where += ' ' + type;
//////////////////////////////////////////////////////////
      if (this.sortingSectionAll) {

        let section = '';
        let pageSection = this.pageSection;
        let sortingSectionAll = this.sortingSectionAll;

        if (pageSection) {
          section = 'AND section_v IN(' + pageSection + ')';
        } else {
          for (let i = 0; i < sortingSectionAll.length; i++) {
            section += sortingSectionAll[i] + ",";
          }
          section = section.slice(0, -1);
          section = 'AND section_v IN(' + section + ')';
        }
        where += ' ' + section;
      }
//////////////////////////////////////////////////////////
      if (this.sortingStreetAll) {
        let street = '';
        let pageStreet = this.pageStreet;
        let sortingStreetAll = this.sortingStreetAll;

        if (pageStreet) {
          street = 'AND id_street IN(' + pageStreet + ')';
        } else {
          for (let i = 0; i < sortingStreetAll.length; i++) {
            street += sortingStreetAll[i] + ",";
          }
          street = street.slice(0, -1);
          street = 'AND id_street IN(' + street + ')';
        }
        where += ' ' + street;
      }
/////////////////////////////////////////////////////////
      if (districtsSorting) {
        where += ' AND districts_id = ' + districtsSorting;
      }
/////////////////////////////////////////////////////////
      if (citySorting) {
        where += ' AND id_city = ' + citySorting;
      }
//////////////////////////////////////////////////////////
      if (this.pageMin && this.pageMax) {
        where += ' AND price >= ' + this.pageMin + ' AND price <= ' + this.pageMax;
      }

      if (this.pageMin && !this.pageMax) {
        where += ' AND price >= ' + this.pageMin;
      }

      if (!this.pageMin && this.pageMax) {
        where += ' AND price <= ' + this.pageMax;
      }
/////////////////////////////////////////////////////////

      if (tempSorting) {

        if (tempSorting === 'apartment') {


  result = await pool.query("SELECT photo, id AS НаборКоллекция, (SELECT title FROM node WHERE id = type) AS \"Тип объяв.\", (SELECT title FROM node WHERE" +
    " id = section_v) AS \"Категория\", city AS Город, street AS Улица, house AS Дом, liter AS Лит, storey || '/' || numstorey AS \"Эт/Этажн\", area2," +
    " area3, area1 AS \"Общ/Жил/Кух\", price AS Цена, fio AS \"Ф.И.О\", tel AS Телефон, (SELECT title FROM agency, node WHERE id = node_id AND node_id = agency) AS Агенство, note AS Примечание, op AS ОП, toilet AS Санузел, project AS \"Тип дома\" FROM v_apartment" + where + " ORDER BY type, section_v, districts_id, city, street");
        }

        if (tempSorting === 'cottages') {
          result = await pool.query("SELECT photo, id AS НаборКоллекция, (SELECT title FROM node WHERE id = type) AS \"Тип объяв.\", (SELECT title FROM node WHERE id = section_v) AS \"Категория\", city AS Город, street AS Улица, area_house AS \"м<sup><small>2</small></sup>\", area_land AS Соток, storey AS Этажей, price AS Цена , fio AS \"Ф.И.О\", tel AS Телефон, (SELECT title FROM agency, node WHERE id = node_id AND node_id = agency) AS Агенство, note AS Примечание, category_land AS \"Катег. земель\", kdn AS \"Кад. номер\", material AS Материал FROM v_cottages" + where + " ORDER BY type, section_v, districts_id, city, street");
        }

        if (tempSorting === 'commercial') {
          result = await pool.query("SELECT photo, id AS НаборКоллекция,(SELECT title FROM node WHERE id = type) AS \"Тип объяв.\", (SELECT title FROM node WHERE id = section_v) AS \"Категория\", city AS Город, street AS Улица, area_house AS \"м<sup><small>2</small></sup>\", price AS Цена, fio AS \"Ф.И.О\", tel AS Телефон, (SELECT title FROM agency, node WHERE id = node_id AND node_id = agency) AS Агенство, note AS Примечание FROM v_commercial" + where + " ORDER BY type, section_v," +
            " districts_id, city, street");
        }


      } else {
        result.rowCount = 0;
      }

      return result;

    } catch (err) {
      console.log(0, err);
      throw err;
    }
  }

  getTable(result, collection, url) {

    let str = '';
    let area2;
    let area3;
    let max = 80;
    let photo;
    let arrCollection;

    if(collection){
      arrCollection = collection;
    }

    if (result.rowCount === 0 || !result) {

      return str;

    } else {

      str += '<h5>Найдено: <b>'+result.rowCount+'</b> объекта недвижимости</h5>';
      str += '<div id="sample2" class="table-responsive">' + '\n';
      str += '<table class="table table-bordered table-hover table-condensed tables-top">' + '\n';
      str += '\t' + '<tr>' + '\n';

      for (let k = 0; k < result.fields.length; k++) {

        if(result.fields[k].name === 'area2'){
          continue;
        }

        if(result.fields[k].name === 'area3'){
          continue;
        }

        if(result.fields[k].name === 'photo'){
          continue;
        }

        str += '\t\t' + '<th>' + result.fields[k].name + '</th>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';

      for (let j = 0; j < result.rows.length; j++) {

        let row = result.rows[j];

        if(arrCollection){
          if( arrCollection.indexOf(row['НаборКоллекция']) !== -1 ){
            str += '\t' + '<tr bgcolor="#c2eeb5">' + '\n';
          } else {
            str += '\t' + '<tr>' + '\n';
          }
        } else {
          str += '\t' + '<tr>' + '\n';
        }

        for (let i = 0; i < result.fields.length; i++) {

          let cols = result.fields[i].name;

          if (result.fields[i].name === 'area2') {
            area2 = row[cols];
            continue;
          }

          if (result.fields[i].name === 'area3') {
            area3 = row[cols];
            continue;
          }

          if (result.fields[i].name === 'photo') {
            photo = row[cols];
            continue;
          }

          str += '\t\t' + '<td>';

          if (result.fields[i].name === 'НаборКоллекция') {

            str += '<a class="btn btn-primary btn-xs btn-margins" title="Добавить в коллекцию" role="button" href="' + url.path + '&add=' + row[cols] + '"><span class="glyphicon glyphicon-shopping-cart"  aria-hidden="true"></span></a>';

            str += '<a data-fancybox data-type="ajax" data-src="/admin/template/price?map='+row[cols]+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';

            if(photo){
              str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto=' + row[cols] + '" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            } else {
              str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto=' + row[cols] + '" role="button" class="btn btn-danger btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            }


          } else if (result.fields[i].name === 'ОП') {
            if (row[cols] === 1) {
              str += 'Да';
            } else if (row[cols] === 0) {
              str += 'Нет';
            } else {
              str += '<span class="noData">пусто</span>';
            }

          } else if (result.fields[i].name === 'Примечание') {
            if(row[cols]){
              if(row[cols].length > 80){
                str += row[cols].substring(0, max ) + '...';
              } else {
                str += row[cols];
              }
            }
          } else if(result.fields[i].name === 'Общ/Жил/Кух'){

            if(area2 === null) area2 = "-";
            if(area3 === null) area3 = "-";

            str += row[cols] + '/' + area2 + '/' + area3;


          } else if (result.fields[i].name === 'Цена') {

            if (row[cols] === 0) {
              str += 'Договор.';
            } else {

              let arr = String(row[cols]).split("");
              let len = arr.length;

              let sum = '';

              if(len === 4){
                for(let i = 0; i< arr.length; i++){

                  if(i === 1){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              if(len === 5){
                for(let i = 0; i< arr.length; i++){

                  if(i === 2){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              if(len === 6){
                for(let i = 0; i< arr.length; i++){

                  if(i === 3){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              if(len === 7){
                for(let i = 0; i< arr.length; i++){
                  if(i === 1){
                    sum += '.' + arr[i];
                  } else if(i === 4){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              if(len === 8){
                for(let i = 0; i< arr.length; i++){
                  if(i === 2){
                    sum += '.' + arr[i];
                  } else if(i === 5){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              str += sum;
            }

          } else {
            if (row[cols]) {
              str += row[cols];
            } else {
              str += '<span class="noData">пусто</span>';
            }
          }

          str += '\t\t' + '</td>' + '\n';

        }

        str += '\t' + '</tr>' + '\n';
      }

      str += '</table>' + '\n';
      str += '</div>' + '\n';

      return str;
    }
  }

  async getCollection(){
    try{
      return await pool.query("SELECT * FROM collection_node WHERE collection_id = $1", [this.pick] )
    }catch (err){
      console.log(16, err);
      throw err;
    }
  }

  async getRun(){
    try{
      return await pool.query("SELECT photo, id AS Редактирование, (SELECT title FROM node WHERE id = type) AS Тип, (SELECT title FROM node n WHERE n.id =" +
        " co.section) AS Раздел, title AS Описание, city AS Город, title_street AS Улица, house AS Дом, liter AS Литер, price AS Цена, (SELECT title FROM node WHERE id = agency) AS Агенство, fio AS \"Ф.И.О.\", tel AS Телефон, note AS Примечание, date_create AS ДатаСозд, date_edit AS ДатаПравки, date_entry AS Активность FROM complete co " + this.where + " ORDER BY template");
    }catch (err){
      console.log(17, err);
      throw err;
    }
  }

  getTableRun (result, url) {

    let str = '';
    let photo;

    if (result.rowCount === 0 || !result) {

      return str;

    } else {

      str += '<h3 class="text-center"><b>Коллекция</b></h3>' + '\n';
      str += '<div id="sample2" class="table-responsive">' + '\n';
      str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
      str += '\t' + '<tr>' + '\n';

      for (let k = 0; k < result.fields.length; k++) {

        if(result.fields[k].name === 'photo'){
          continue;
        }

        str += '\t\t' + '<th>' + result.fields[k].name + '</th>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';

      for (let j = 0; j < result.rows.length; j++) {

        let row = result.rows[j];

        str += '\t' + '<tr>' + '\n';

        for (let i = 0; i < result.fields.length; i++) {

          let cols = result.fields[i].name;

          if (result.fields[i].name === 'photo') {
            photo = row[cols];
            continue;
          }

          str += '\t\t' + '<td>';

          if (result.fields[i].name === 'Редактирование') {

            str += '<a class="btn btn-danger btn-xs btn-margins" title="Добавить в коллекцию" role="button" href="' + url.path + '&deleteCart=' + row[cols] + '"><span class="glyphicon glyphicon-remove"  aria-hidden="true"></span></a>';

            str += '<a data-fancybox data-type="ajax" data-src="/admin/template/price?map='+row[cols]+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';

            if(photo){
              str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto=' + row[cols] + '" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            } else {
              str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto=' + row[cols] + '" role="button" class="btn btn-danger btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            }


          } else if (result.fields[i].name === 'Цена') {

            if (row[cols] === 0) {
              str += 'Договор.';
            } else {

              let arr = String(row[cols]).split("");
              let len = arr.length;

              let sum = '';

              if(len === 4){
                for(let i = 0; i< arr.length; i++){

                  if(i === 1){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              if(len === 5){
                for(let i = 0; i< arr.length; i++){

                  if(i === 2){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              if(len === 6){
                for(let i = 0; i< arr.length; i++){

                  if(i === 3){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              if(len === 7){
                for(let i = 0; i< arr.length; i++){
                  if(i === 1){
                    sum += '.' + arr[i];
                  } else if(i === 4){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              if(len === 8){
                for(let i = 0; i< arr.length; i++){
                  if(i === 2){
                    sum += '.' + arr[i];
                  } else if(i === 5){
                    sum += '.' + arr[i];
                  } else {
                    sum += arr[i];
                  }
                }
              }

              str += sum;
            }

          } else if (result.fields[i].name === 'ДатаСозд') {

            if(row[cols]){
              str += ms.msDateYear(row[cols]);
            } else {
              str += '<span class="noData">пусто</span>';
            }

          } else if (result.fields[i].name === 'ДатаПравки') {

            if(row[cols]){
              str += ms.msDateYear(row[cols]);
            } else {
              str += '<span class="noData">пусто</span>';
            }

          } else if (result.fields[i].name === 'Активность') {

            if(row[cols]){
              str += ms.msDateYear(row[cols]);
            } else {
              str += '<span class="noData">пусто</span>';
            }


          } else {
            if (row[cols]) {
              str += row[cols];
            } else {
              str += '<span class="noData">пусто</span>';
            }
          }

          str += '\t\t' + '</td>' + '\n';

        }

        str += '\t' + '</tr>' + '\n';
      }

      str += '</table>' + '\n';
      str += '</div>' + '\n';

      return str;
    }

  };

  async setCart(){
    try {

      return await pool.query("INSERT INTO collection_node (node_id, collection_id, user_id) VALUES ($1, $2, $3)", [this.cart, this.collection_id, this.user_id] )

    } catch (err){
      console.log(15, err);
      throw err;
    }
  }

  async dropCart(){
    try {

      return await pool.query("DELETE FROM collection_node WHERE node_id = $1 AND collection_id = $2 AND user_id = $3", [this.node_id, this.collection_id, this.user_id] )

    } catch (err){
      console.log(17, err);
      throw err;
    }
  }

  async save() {

    try {

      return await pool.query('INSERT INTO collection (user_id, note_my, note_client, date_collection, url_collection, no_price, no_agency) VALUES ($1, $2, $3, $4, $5, $6, $7)', [this.user_id, this.note_my, this.note_client, this.date_collection, this.url_collection, this.no_price, this.no_agency]);

    } catch (err) {
      console.log(1, err);
      throw err;
    }
  }

  async edit() {

    try {

      return await pool.query('UPDATE collection SET note_my = $1, note_client = $2, no_price = $3, no_agency = $4 WHERE id_collection = $5 AND user_id = $6', [this.note_my, this.note_client, this.no_price, this.no_agency, this.id_collection, this.user_id]);

    } catch (err) {
      console.log(2, err);
      throw err;
    }
  }

  async drop() {
    try {

      await pool.query('DELETE FROM collection_node WHERE collection_id = $1', [this.id_collection]);

      return await pool.query('DELETE FROM collection WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);

    } catch (err) {
      console.log(3, err);
      throw err;
    }
  }

  async getOneCollection() {

    try {

      return await pool.query('SELECT id_collection, user_id, collection, note_my, note_client, no_price, no_agency, date_collection, temp, districts, city, (SELECT districts FROM districts WHERE id_districts = c.districts) AS name_districts, (SELECT title FROM city WHERE id_city = c.city) AS name_city FROM collection c WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);


    } catch (err) {
      console.log(4, err);
      throw err;
    }
  }

  async editTemp() {

    try {

      if (this.districtsSorting) {

        if (this.temp === 'apartment') {


          let result = await pool.query('SELECT * FROM view_apartment_street WHERE id_districts = $1', [this.districtsSorting]);

          if (result.rowCount === 0) {

            await pool.query('UPDATE collection SET districts = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);

          }

        }

        if (this.temp === 'cottages') {


          let result = await pool.query('SELECT * FROM view_cottages_street WHERE id_districts = $1', [this.districtsSorting]);

          if (result.rowCount === 0) {

            await pool.query('UPDATE collection SET districts = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);

          }
        }

        if (this.temp === 'commercial') {


          let result = await pool.query('SELECT * FROM view_commercial_street WHERE id_districts = $1', [this.districtsSorting]);


          if (result.rowCount === 0) {

            await pool.query('UPDATE collection SET districts = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);

          }
        }
      }

      if (this.citySorting) {

        if (this.temp === 'apartment') {

          let result = await pool.query('SELECT * FROM view_apartment_street WHERE id_city = $1', [this.citySorting]);


          if (result.rowCount === 0) {

            await pool.query('UPDATE collection SET city = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);

          }
        }

        if (this.temp === 'cottages') {


          let result = await pool.query('SELECT * FROM view_cottages_street WHERE id_city = $1', [this.citySorting]);


          if (result.rowCount === 0) {

            await pool.query('UPDATE collection SET city = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);

          }

        }

        if (this.temp === 'commercial') {

          let result = await pool.query('SELECT * FROM view_commercial_street WHERE id_city = $1', [this.citySorting]);

          if (result.rowCount === 0) {
            await pool.query('UPDATE collection SET city = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);
          }
        }
      }

      return await pool.query('UPDATE collection SET temp = $1 WHERE id_collection = $2 AND user_id = $3', [this.temp, this.id_collection, this.user_id]);

    } catch (err) {
      console.log(5, err);
      throw err;
    }
  }

  async setDistricts() {

    const client = await pool.connect();

    try {

      let result = {};

      await client.query('BEGIN');

      if (this.id_city) {

        let res = {};

        if (this.districts_id === 'null') {

          res = await client.query('SELECT * FROM city WHERE id_city = $1 AND districts_id = null', [this.id_city]);

        } else {
          res = await client.query('SELECT * FROM city WHERE id_city = $1 AND districts_id = $2', [this.id_city, this.districts_id]);
        }


        if (res.rowCount < 1) {
          await client.query('UPDATE collection SET city = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);
        }
      }

      if (this.districts_id === 'null') {
        result = await client.query('UPDATE collection SET districts = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);
      } else {
        result = await client.query('UPDATE collection SET districts = $1 WHERE id_collection = $2 AND user_id = $3', [this.districts_id, this.id_collection, this.user_id]);
      }

      await client.query('COMMIT');

      client.release();

      return result;

    } catch (err) {

      await client.query('ROLLBACK');

      client.release();
      console.log(6, err);
      throw err;
    }
  }

  async setCity() {

    try {

      let result = {};

      if(this.id_city === 'null'){
        result =  await pool.query('UPDATE collection SET city = null WHERE id_collection = $1 AND user_id = $2', [this.id_collection, this.user_id]);
      } else {
        result =  await pool.query('UPDATE collection SET city = $1 WHERE id_collection = $2 AND user_id = $3', [this.id_city, this.id_collection, this.user_id]);
      }

      return result;

    } catch (err) {
      console.log(7, err);
      throw err;
    }
  }

  async getSortingType() {

    try {

      let str = '';
      let result = {};

      let where = '';
      let w = 0;


      if (this.districtsSorting) {
        w++;
        where += ' districts_id = ' + this.districtsSorting;
      }

      if (this.citySorting) {
        if (w > 0) {
          w++;
          where += ' AND id_city = ' + this.citySorting;
        } else {
          w++;
          where += ' id_city = ' + this.citySorting;
        }
      }

      if (this.pageSection) {
        if (w > 0) {
          w++;
          where += ' AND section_v = ' + this.pageSection;
        } else {
          w++;
          where += ' section_v = ' + this.pageSection;
        }
      }

      if (this.pageStreet) {

        if (w > 0) {
          w++;
          where += ' AND id_street = ' + this.pageStreet;
        } else {
          w++;
          where += ' id_street = ' + this.pageStreet;
        }
      }

      if (this.pageMin && this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price >= ' + this.pageMin + ' AND price <= ' + this.pageMax;

        } else {
          w++;
          where += ' price >= ' + this.pageMin + ' AND price<= ' + this.pageMax;
        }
      }

      if (this.pageMin && !this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price >= ' + this.pageMin;
        } else {
          w++;
          where += ' price >= ' + this.pageMin;
        }
      }

      if (!this.pageMin && this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price <= ' + this.pageMax;
        } else {
          w++;
          where += ' price <= ' + this.pageMax;
        }
      }

      if (where) {
        where = " WHERE" + where;
      }

      if (this.tempSorting) {

        if (this.tempSorting === 'apartment') str = 'SELECT * FROM node WHERE id IN(SELECT DISTINCT type FROM v_apartment' + where + ')';
        if (this.tempSorting === 'cottages') str = 'SELECT * FROM node WHERE id IN(SELECT DISTINCT type FROM v_cottages' + where + ')';
        if (this.tempSorting === 'commercial') str = 'SELECT * FROM node WHERE id IN(SELECT DISTINCT type FROM v_commercial' + where + ')';

        result = await pool.query(str);

      } else {
        result.rowCount = 0;
      }

      return result;

    } catch (err) {
      console.log(11, err);
      throw err;
    }
  }

  async getSortingSection() {

    try {

      let str = '';

      let result = {};

      let where = '';
      let w = 0;

      if (this.districtsSorting) {
        w++;
        where += ' districts_id = ' + this.districtsSorting;
      }

      if (this.citySorting) {
        if (w > 0) {
          w++;
          where += ' AND id_city = ' + this.citySorting;
        } else {
          w++;
          where += ' id_city = ' + this.citySorting;
        }
      }

      if (this.pageType) {

        if (w > 0) {
          w++;
          where += ' AND type = ' + this.pageType;
        } else {
          w++;
          where += ' type = ' + this.pageType;
        }

      }

      if (this.pageStreet) {

        if (w > 0) {
          w++;
          where += ' AND id_street = ' + this.pageStreet;
        } else {
          w++;
          where += ' id_street = ' + this.pageStreet;
        }

      }

      if (this.pageMin && this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price >= ' + this.pageMin + ' AND price <= ' + this.pageMax;

        } else {
          w++;
          where += ' price >= ' + this.pageMin + ' AND price<= ' + this.pageMax;
        }
      }

      if (this.pageMin && !this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price >= ' + this.pageMin;
        } else {
          w++;
          where += ' price >= ' + this.pageMin;
        }
      }

      if (!this.pageMin && this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price <= ' + this.pageMax;
        } else {
          w++;
          where += ' price <= ' + this.pageMax;
        }
      }

      if (where) {
        where = " WHERE" + where;
      }


      if (this.tempSorting) {

        if (this.tempSorting === 'apartment') str = 'SELECT * FROM node WHERE id IN(SELECT DISTINCT section_v FROM v_apartment' + where + ') ORDER BY title';
        if (this.tempSorting === 'cottages') str = 'SELECT * FROM node WHERE id IN(SELECT DISTINCT section_v FROM v_cottages' + where + ') ORDER BY title';
        if (this.tempSorting === 'commercial') str = 'SELECT * FROM node WHERE id IN(SELECT DISTINCT section_v FROM v_commercial' + where + ') ORDER BY title';

        result = await pool.query(str);

      } else {
        result.rowCount = 0;
      }

      return result;

    } catch (err) {
      console.log(12, err);
      throw err;
    }
  }

  async getSortingStreet() {

    try {

      let str = '';

      let result = {};

      let where = '';
      let w = 0;

      if (this.districtsSorting) {
        w++;
        where += ' districts_id = ' + this.districtsSorting;
      }

      if (this.citySorting) {
        if (w > 0) {
          w++;
          where += ' AND id_city = ' + this.citySorting;
        } else {
          w++;
          where += ' id_city = ' + this.citySorting;
        }
      }

      if (this.pageType) {

        if (w > 0) {
          w++;
          where += ' AND type = ' + this.pageType;
        } else {
          w++;
          where += ' type = ' + this.pageType;
        }
      }

      if (this.pageSection) {
        if (w > 0) {
          w++;
          where += ' AND section_v = ' + this.pageSection;
        } else {
          w++;
          where += ' section_v = ' + this.pageSection;
        }
      }

      if (this.pageMin && this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price >= ' + this.pageMin + ' AND price <= ' + this.pageMax;

        } else {
          w++;
          where += ' price >= ' + this.pageMin + ' AND price<= ' + this.pageMax;
        }
      }

      if (this.pageMin && !this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price >= ' + this.pageMin;
        } else {
          w++;
          where += ' price >= ' + this.pageMin;
        }
      }

      if (!this.pageMin && this.pageMax) {
        if (w > 0) {
          w++;
          where += ' AND price <= ' + this.pageMax;
        } else {
          w++;
          where += ' price <= ' + this.pageMax;
        }
      }

      if (where) {
        where = " WHERE" + where;
      }

      if (this.tempSorting && this.citySorting) {

        if (this.tempSorting === 'apartment') str = 'SELECT * FROM street WHERE id_street IN(SELECT DISTINCT id_street FROM v_apartment' + where + ') AND city_id = $1' +
          ' ORDER BY street';
        if (this.tempSorting === 'cottages') str = 'SELECT * FROM street WHERE id_street IN(SELECT DISTINCT id_street FROM v_cottages' + where + ') AND city_id = $1' +
          ' ORDER BY street';
        if (this.tempSorting === 'commercial') str = 'SELECT * FROM street WHERE id_street IN(SELECT DISTINCT id_street FROM v_commercial' + where + ') AND city_id = $1' +
          ' ORDER BY street';

        result = await pool.query(str, [this.citySorting]);

      } else {
        result.rowCount = 0;
      }

      return result;

    } catch (err) {
      console.log(13, err);
      throw err;
    }
  }

  async getSortingPrice() {
    try {

      let str = '';

      let result = {};

      let where = '';

      if (this.districtsSorting) {
        where += ' AND districts_id = ' + this.districtsSorting;
      }

      if (this.citySorting) {
        where += ' AND id_city = ' + this.citySorting;
      }

      if (this.pageType) {
        where += ' AND type = ' + this.pageType;
      }

      if (this.pageSection) {
        where += ' AND section_v = ' + this.pageSection;
      }

      if (this.pageStreet) {
        where += ' AND id_street = ' + this.pageStreet;
      }

      if (this.tempSorting) {

        if (this.tempSorting === 'apartment') str = 'SELECT min(price), max(price) FROM v_apartment WHERE price <> 0' + where;
        if (this.tempSorting === 'cottages') str = 'SELECT min(price), max(price) FROM v_cottages WHERE price <> 0' + where;
        if (this.tempSorting === 'commercial') str = 'SELECT min(price), max(price) FROM v_commercial WHERE price <> 0' + where;

        result = await pool.query(str);

      } else {
        result.rowCount = 0;
      }

      return result;

    }

    catch (err) {
      console.log(14, err);
      throw err;
    }
  }

  async getDistricts() {

    try {

      let result = {};

      if (this.tempSorting) {

        if (this.tempSorting === 'apartment') {
          result = await pool.query('SELECT DISTINCT id_districts, count(*) OVER (PARTITION BY id_districts) AS sum, districts, region, select_default FROM view_apartment_street ORDER BY select_default, districts');

        } else if (this.tempSorting === 'cottages') {
          result = await pool.query('SELECT DISTINCT id_districts, count(*) OVER (PARTITION BY id_districts) AS sum, districts, region, select_default FROM view_cottages_street ORDER BY select_default, districts');

        } else if (this.tempSorting === 'commercial') {
          result = await pool.query('SELECT DISTINCT id_districts, count(*) OVER (PARTITION BY id_districts) AS sum, districts, region, select_default FROM view_commercial_street ORDER BY select_default, districts');


        } else {
          result.rowCount = 0;
        }

      } else {
        result.rowCount = 0;
      }

      return result;
    } catch (err) {
      console.log(8, err);
      throw err;
    }
  }

  async getCity() {


    try {

      let result = {};

      if (this.tempSorting === 'apartment' && this.tempSorting && this.districtsSorting) {

        result = await pool.query('SELECT DISTINCT id_city, count(*) OVER (PARTITION BY id_city) AS sum, city, select_default FROM view_apartment_street WHERE id_districts = $1 ORDER BY select_default, city', [this.districtsSorting]);

        return result;

      }

      if (this.tempSorting === 'cottages' && this.tempSorting && this.districtsSorting) {

        result = await pool.query('SELECT DISTINCT id_city, count(*) OVER (PARTITION BY id_city) AS sum, city, select_default FROM view_cottages_street WHERE id_districts = $1 ORDER BY select_default, city', [this.districtsSorting]);

        return result;

      }

      if (this.tempSorting === 'commercial' && this.tempSorting && this.districtsSorting) {

        result = await pool.query('SELECT DISTINCT id_city, count(*) OVER (PARTITION BY id_city) AS sum, city, select_default FROM view_commercial_street WHERE id_districts = $1 ORDER BY select_default, city', [this.districtsSorting]);

        return result;

      }

      return result.rowCount = 0;


    } catch (err) {
      console.log(9, err);
      throw err;
    }
  }

  async getTableCollection() {

    try {

      let result = await pool.query('SELECT id_collection AS Редактирование, note_my AS "Примечание для себя", note_client AS "Примечание для клиента", url_collection AS "Ссылка для клиента", no_price AS Цену, no_agency AS Продовца, date_collection AS "ДатаСоздания" FROM collection WHERE user_id = $1 ORDER BY date_collection DESC', [this.id_user]);

      let str = '';

      if (result.rowCount === 0 || !result) {

        return str;

      } else {

        str += '<div class="table-responsive">' + '\n';
        str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
        str += '\t' + '<tr>' + '\n';

        for (let k = 0; k < result.fields.length; k++) {

          str += '\t\t' + '<th>' + result.fields[k].name + '</th>' + '\n';

        }

        str += '\t' + '</tr>' + '\n';

        for (let j = 0; j < result.rows.length; j++) {

          let row = result.rows[j];

          str += '\t' + '<tr>' + '\n';

          for (let i = 0; i < result.fields.length; i++) {

            let cols = result.fields[i].name;

            str += '\t\t' + '<td>';

            if (result.fields[i].name === 'Редактирование') {

              let rowCols = row[cols];

              str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/collection?edit=' + rowCols + '"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>';
              str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/collection?drop=' + rowCols + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>';

              str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/collection?pick=' + row[cols] + '">Подобрать объекты</a>';

            } else if (result.fields[i].name === 'Ссылка для клиента') {

              str += '<b>' + conf.get('siteName') + '/collection/' + row[cols] + '</b>';

            } else if (result.fields[i].name === 'Цену') {
              if (row[cols] === 1) {
                str += 'не показывать';
              } else {
                str += 'показывать';
              }

            } else if (result.fields[i].name === 'Продовца') {
              if (row[cols] === 1) {
                str += 'не показывать';
              } else {
                str += 'показывать';
              }

            } else if (result.fields[i].name === 'ДатаСоздания') {

              str += ms.msDateYear(row[cols]);

            } else {
              str += row[cols];
            }

            str += '\t\t' + '</td>' + '\n';

          }

          str += '\t' + '</tr>' + '\n';
        }

        str += '</table>' + '\n';
        str += '</div>' + '\n';

        return str;
      }

    } catch (err) {
      console.log(10, err);
      throw err;
    }
  }
}

module.exports = Collection;