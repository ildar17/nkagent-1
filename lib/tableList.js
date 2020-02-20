let ms = require('./msDate');
let nav = require('./navigation');
let conf = require('../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let co = require('co');

exports.tableListApartment = function (permission, row, urlParsed, limit, linkLimit, urlPage, result, req) {

  let strPath = nav.linkQuery('edit', 'drop', 'party', req);
  let str = '';
  let idSection = '';
  let idPhoto = null;
  let btn = '';

  let active = '';

  if (urlParsed.query.edit) {
    active = urlParsed.query.edit;
  }

  if (urlParsed.query.drop) {
    active = urlParsed.query.drop;
  }

  if (result === '') {

    return str;

  } else {


    str += nav.navPageApartment(str, urlParsed, row.rowCount, limit, linkLimit, urlPage, 'page');

    str += '<div class="clearfix"></div>' + '\n';
    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-bordered table-hover table-condensed tables-top">' + '\n';

    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      if (result.fields[i].name === 'photo') {
        continue;
      }

      if (result.fields[i].name === 'section') {
        continue;
      }

      if (i === 0) {
        str += '';
      } else {
        str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';
      }
    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {

      let row = result.rows[j];

      let cols = '';

      if (result.rows[j]['Редактирование'] === active ) {
        str += '\t' + '<tr bgcolor="#f0e68c">' + '\n';
      } else {
        str += '\t' + '<tr>' + '\n';
      }

      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        if (result.fields[i].name === 'photo') {
          idPhoto = row[cols];
          continue;
        }

        if (result.fields[i].name === 'section') {
          idSection = row[cols];
          continue;
        }

        str += '\t\t' + '<td>';

        if (result.fields[i].name === 'Редактирование') {

          let rowCols = row[cols];

          if(idPhoto){
            btn = 'btn-success';
          } else {
            btn = 'btn-danger'
          }

          if(urlParsed.query.section){

            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/apartment?edit=' + rowCols + strPath + '"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>';
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/apartment?drop=' + rowCols + strPath + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto='+rowCols+'" role="button" class="btn '+btn+' btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/template/apartment?map='+rowCols+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';

          } else {

            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/template/apartment?section='+idSection+'&edit=' + rowCols + '"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>';
            str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/template/apartment?section='+idSection+'&drop=' + rowCols + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto='+rowCols+'" role="button" class="btn '+btn+' btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/template/apartment?map='+rowCols+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';
          }

        } else if (result.fields[i].name === 'Сохранил') {
          if (row[cols] === conf.get('administrator')) {
            str += 'администратор';
          } else if (row[cols] == null) {
            str += '';
          } else {
            str += row[cols];
          }
        } else if (result.fields[i].name === 'Правил') {

          if (row[cols] === conf.get('administrator')) {
            str += 'администратор';
          } else if (row[cols] == null) {
            str += '';
          } else {
            str += row[cols];
          }

        } else if (result.fields[i].name === 'Цена') {

          if (row[cols] === 0) {
            str += 'Договор.';
          } else {

            let arr = String(row[cols]).split("");
            let len = arr.length;

            let sum = '';

            if (len === 4) {
              for (let i = 0; i < arr.length; i++) {

                if (i === 1) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            if (len === 5) {
              for (let i = 0; i < arr.length; i++) {

                if (i === 2) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            if (len === 6) {
              for (let i = 0; i < arr.length; i++) {

                if (i === 3) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            if (len === 7) {
              for (let i = 0; i < arr.length; i++) {
                if (i === 1) {
                  sum += '.' + arr[i];
                } else if (i === 4) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            if (len === 8) {
              for (let i = 0; i < arr.length; i++) {
                if (i === 2) {
                  sum += '.' + arr[i];
                } else if (i === 5) {
                  sum += '.' + arr[i];
                } else {
                  sum += arr[i];
                }
              }
            }

            str += sum;
          }

        } else if (result.fields[i].name === 'Опека') {

          if (row[cols] === 1) {
            str += 'Да';
          } else if (row[cols] === 0) {
            str += 'Нет';
          } else {
            str += '<span class="noData">пусто</span>';
          }

        } else if (result.fields[i].name === 'ДатаВнесения') {

          str += ms.msDateYear(row[cols]);

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }

      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }

};

exports.tableListPrice = function (permission, row, urlParsed, limit, linkLimit, urlPage, result) {

  let str = '';
  let max=80;

  if (result === '') {

    return str;

  } else {

    str += nav.navPageApartment(str, urlParsed, row.rowCount, limit, linkLimit, urlPage, 'page');

    str += '<div class="clearfix"></div>' + '\n';
    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';

    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      if(result.fields[i].name === 'node_id'){
        continue;
      }

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];


      let cols = '';

      str += '\t' + '<tr>' + '\n';

      let id;

      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        if(result.fields[i].name === 'node_id'){
          id = row[cols];
          continue;
        }


        str += '\t\t' + '<td>';

        if (result.fields[i].name === 'Опека') {

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

        } else if (result.fields[i].name === 'Балкон') {

            if (row[cols] === 1) {
              str += 'Да';
            } else if (row[cols] === 0) {
              str += 'Нет';
            } else {
              str += '<span class="noData">пусто</span>';
            }

        } else if (result.fields[i].name === 'ФотоКарта') {

          let btn = '';

          if (row[cols]) {
            btn = 'btn-success';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto='+row[cols]+'" role="button" class="btn '+btn+' btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/template/price?map='+id+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';
          } else {
            btn = 'btn-danger';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/ajax?tableFoto=0" role="button" class="btn '+btn+' btn-xs btn-margins"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span></a>';
            str += '<a data-fancybox data-type="ajax" data-src="/admin/template/price?map='+id+'" role="button" class="btn btn-success btn-xs btn-margins"><span class="glyphicon glyphicon-map-marker"  aria-hidden="true"></span></a>';
          }

        } else {
          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }
        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};


exports.tableParser = function (row, urlParsed, limit, linkLimit, urlPage, result, req) {

  let strPath = nav.linkQuery('edit', 'drop', 'party', req);

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    nav.navpage(str, urlParsed, row.rowCount, limit, linkLimit, urlPage, 'page', function (err, result) {
      str += result;
    });
    str += '<div class="clearfix"></div>' + '\n';
    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {


          str += '<strong>' + row[cols] + '.</strong>';
          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/parser?edit=' + row[cols] + strPath + '">править</a>'


        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListDistricts = function (result) {

  let str = '';

  if (result === '') {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/helper?editDistricts=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/helper?dropDistricts=' + row[cols] + '">удалить</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};


exports.tableListProject = function (result) {

  let str = '';

  if (result === '') {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/helper?editProject=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/helper?dropProject=' + row[cols] + '">удалить</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListToilet = function (result) {

  let str = '';

  if (result === '') {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/helper?editToilet=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/helper?dropToilet=' + row[cols] + '">удалить</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListMaterial = function (result) {

  let str = '';

  if (result === '') {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/helper?editMaterial=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/helper?dropMaterial=' + row[cols] + '">удалить</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableCategoryLand = function (result) {

  let str = '';

  if (result === '') {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/administrator/helper?editCategoryLand=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/administrator/helper?dropCategoryLand=' + row[cols] + '">удалить</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListEarthMap = function (result) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (row[cols]) {

          if (row[cols] == 0) {
            str += '<span class="noData">пусто</span>';
          } else {
            str += row[cols];
          }
        } else {
          str += '<span class="noData">пусто</span>';
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListEarthMap1 = function (result) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (row[cols]) {

          if (row[cols] == 0) {
            str += '<span class="noData">пусто</span>';
          } else {
            str += row[cols];
          }
        } else {
          str += '<span class="noData">пусто</span>';
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListMetro = function (result, country, region, metro) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&metro=' + metro + '&edit=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&metro=' + metro + '&drop=' + row[cols] + '">удалить</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};


exports.tableListDistrict = function (result, country, region, district) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&district=' + district + '&edit=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&district=' + district + '&drop=' + row[cols] + '">удалить</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListStreet = function (result, country, region, street) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&street=' + street + '&edit=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&street=' + street + '&drop=' + row[cols] + '">удалить</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListCountry = function (result) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?edit=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?drop=' + row[cols] + '">удалить</a>';
          str += '<a class="btn btn-success btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + row[cols] + '">добавить области</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListRegion = function (result, country) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&edit=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&drop=' + row[cols] + '">удалить</a>';
          str += '<a class="btn btn-success btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + row[cols] + '">добавить' +
            ' поселение</a>';

        } else {

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '<span class="noData">пусто</span>';
          }
        }

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListCity = function (result, country, region) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let cols = '';
      let listName = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'Редактирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&edit=' + row[cols] + '">править</a>';
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&drop=' + row[cols] + '">удалить</a>';
          str += '<a class="btn btn-success btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&metro=' + row[cols] + '">метро</a>';
          str += '<a class="btn btn-success btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&district=' + row[cols] + '">район</a>';
          str += '<a class="btn btn-success btn-xs btn-margins" role="button"' +
            '  href="/admin/administrator/earth?country=' + country + '&region=' + region + '&street=' + row[cols] + '">улица</a>';

        } else if (result.fields[i].name == 'Улицы') {

          if (row[cols] != 0) {

            if (row[cols] == 1) {
              listName = " строкa";
            } else if (row[cols] == 2 || row[cols] == 3 || row[cols] == 4) {
              listName = " строки";
            } else {
              listName = " строк";
            }

            str += row[cols] + listName;

          } else {
            str += '<span class="noData">пусто</span>';
          }

        } else if (result.fields[i].name == 'Метро') {

          if (row[cols] != 0) {

            if (row[cols] == 1) {
              listName = " строкa";
            } else if (row[cols] == 2 || row[cols] == 3 || row[cols] == 4) {
              listName = " строки";
            } else {
              listName = " строк";
            }

            str += row[cols] + listName;

          } else {
            str += '<span class="noData">пусто</span>';
          }

        } else if (result.fields[i].name == 'Районы') {

          if (row[cols] != 0) {

            if (row[cols] == 1) {
              listName = " строкa";
            } else if (row[cols] == 2 || row[cols] == 3 || row[cols] == 4) {
              listName = " строки";
            } else {
              listName = " строк";
            }

            str += row[cols] + listName;

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

        str += '</td>' + '\n'
      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};


exports.tableListParty = function (result, party) {
  let str = '';
  let id = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';

    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];

      let cols = '';

      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'id') {

          id = row[cols];

          str += row[cols]

        } else if (result.fields[i].name == 'Модератор') {

          if (row[cols] == null) {
            str += '<a class="btn btn-warning btn-xs" role="button"' +
              ' href="/admin/template/agency?party=' + party + '&user=' + id + '">рядовой сотрудник</a>' + '\n';
          } else {
            str += '<a class="btn btn-success btn-xs" role="button"' +
              ' href="/admin/template/agency?party=' + party + '&user=' + id + '">модератор агенства</a>' + '\n';
          }

        } else if (row[cols] == null) {

          str += '<span class="noData">нет данных</span>';

        } else {

          str += row[cols];
        }

        str += '</td>' + '\n'

      }

      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    return str;
  }
};

exports.tableListMenu = function (result, permission) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {


    str += '<table border="1">' + '\n';
    str += '\t' + '<tr>' + '\n';
    for (let i = 0; i < result.fields.length; i++) {

      str += '\t\t' + '<th>' + result.fields[i].name + '</th>' + '\n';

    }
    str += '\t' + '</tr>' + '\n';


    for (let j = 0; j < result.rows.length; j++) {
      let row = result.rows[j];
      let idSection = null;
      let blockName = null;


      str += '\t' + '<tr>' + '\n';
      for (let i = 0; i < result.fields.length; i++) {

        let cols = result.fields[i].name;

        str += '\t\t' + '<td>';

        if (result.fields[i].name == 'block_name') {

          blockName = row[cols];

          if (row[cols]) {
            str += row[cols];
          } else {
            str += '';
          }

        } else if (result.fields[i].name == 'id') {

          idSection = row[cols];

          str += row[cols];

        } else if (result.fields[i].name == 'Название раздела') {

          str += row[cols];

          if (!blockName) {
            if (permission.indexOf('1', 2) == 2) {
              str += '&nbsp&nbsp' + '<a class="edit" href="/admin/template/testMenu?putin=' + idSection + '">вложить</a>';
            }
          }

        } else if (result.fields[i].name == 'Главная') {

          if (row[cols] == 1) {
            str += 'главная';
          }

          if (row[cols] == 0) {
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

exports.tableTemplate = function (result) {
  let str = '';
  let nameTemp = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
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

        if (result.fields[i].name == 'Шаблоны') {
          nameTemp = row[cols];
        }

        if (result.fields[i].name == 'Принадлежность шаблона') {

          if (row[cols] == null || row[cols] == 0) {
            str += '<a class="btn btn-warning btn-xs" role="button" href="/admin/administrator/settings?name=' + nameTemp + '&sort=1">Системный шаблон</a>';
          }

          if (row[cols] == 1) {
            str += '<a class="btn btn-success btn-xs" role="button" href="/admin/administrator/settings?name=' + nameTemp + '&sort=0">Пользовательский' +
              ' шаблон</a>';
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

exports.tableListRole = function (result) {

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

        if (result.fields[i].name === 'Администрирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"  href="/admin/administrator/create-role?editRole=' + row[cols] + '">править</a>' +
            ' ' + '<a class="btn btn-danger btn-xs btn-margins" role="button" href="/admin/administrator/create-role?dropRole=' + row[cols] + '">удалить</a>';


        } else if (result.fields[i].name === 'Оплата прайса') {

          if (row[cols] === 1) {
            str += 'оплатил';

          }else if(row[cols] === 2){
            str += 'не оплатил';
          } else {
            str += '';
          }

        } else if (result.fields[i].name === 'Статус роли') {

          if (row[cols] === 1) {
            str += '<span class="yes">пользователь после регистрации</span>';
          } else {
            str += 'модератор';
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

exports.tableListRole1 = function (result) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
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

        if (result.fields[i].name == 'Администрирование') {


          str += '<a class="btn btn-primary btn-xs btn-margins" href="/admin/administrator/configure-access?tuneRole=' + row[cols] + '">настроить роль</a>';


        } else if (result.fields[i].name == 'Статус роли') {

          if (row[cols] == 1) {
            str += 'пользователи';
          } else {
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
    str += '</div>' + '\n';
    return str;
  }

};

exports.tableListRoleUrl = function (result, hostname) {

  let str = '';
  let id_permit = null;

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
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

        if (result.fields[i].name == 'Администр.') {

          id_permit = row[cols];
          str += '<a class="btn btn-danger btn-xs btn-margins" role="button" class="drop" href="/admin/administrator/section-name?dropRolePage=' + row[cols] + '">удалить</a>';

        } else if (result.fields[i].name == 'Просм.' || result.fields[i].name == 'Сохр.' || result.fields[i].name == 'Править' || result.fields[i].name == 'Уд.' || result.fields[i].name == 'Публ.') {

          if (row[cols] > 0) {
            str += '<span class="yes">да</span>';
          } else {
            str += '<span class="no">нет</span>';
          }

        } else if (result.fields[i].name == 'Название раздела') {
          if (row[cols] == null) {
            str += '<a class="btn btn-warning btn-xs btn-margins" role="button" href="/admin/administrator/section-name?addName=' + id_permit + '">присвоить имя</a>';
          }

          if (row[cols] != null) {
            str += '<a class="btn btn-primary btn-xs btn-margins" role="button" href="/admin/administrator/section-name?addName=' + id_permit + '">' + row[cols] + '</a>';
          }


        } else if (result.fields[i].name == 'Адрес страницы') {

          str += hostname + row[cols];

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

exports.tableTuneRole = function (result, id_role, hostname, fn) {

  let str = '';
  let id_permit = '';
  let che = [];

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    client.query('SELECT code, permit_id, role_id FROM access WHERE role_id = $1',
      [id_role], function (err, resultDB) {
        done();
        if (err) return fn(err, null);

        if (result.rows.length === 0) {

          return str;

        } else {

          str += '<div class="table-responsive">' + '\n';
          str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
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

              str += '\t\t' + '<td align="center">';

              if (result.fields[i].name === 'id') {

                str += row[cols];
                id_permit = row[cols];

              } else if (result.fields[i].name === 'Редактировать всех') {


                if (row[cols] > 0) {
                  str += '<input type="checkbox" ';

                  for (let k = 0; k < resultDB.rows.length; k++) {


                    if (resultDB.rows[k].permit_id === id_permit) {
                      let code = resultDB.rows[k].code;

                      if (code.indexOf('1', 4) === 4) {
                        str += 'checked';
                      }
                    }
                  }

                  str += ' name="administrator[' + id_permit + ']" value="' + row[cols] + '">';
                  che.push(id_permit);
                } else {
                  str += '';
                }

              } else if (result.fields[i].name === 'Сохранять добавлять') {

                if (row[cols] > 0) {
                  str += '<input type="checkbox" ';

                  for (let k = 0; k < resultDB.rows.length; k++) {


                    if (resultDB.rows[k].permit_id === id_permit) {
                      let code = resultDB.rows[k].code;

                      if (code.indexOf('1', 3) === 3) {
                        str += 'checked';
                      }
                    }
                  }

                  str += ' name="administrator[' + id_permit + ']" value="' + row[cols] + '">';
                  che.push(id_permit);
                } else {
                  str += '';
                }

              } else if (result.fields[i].name === 'Править редактировать') {

                if (row[cols] > 0) {
                  str += '<input type="checkbox" ';

                  for (let k = 0; k < resultDB.rows.length; k++) {


                    if (resultDB.rows[k].permit_id === id_permit) {
                      let code = resultDB.rows[k].code;

                      if (code.indexOf('1', 2) === 2) {
                        str += 'checked';
                      }
                    }
                  }

                  str += ' name="administrator[' + id_permit + ']" value="' + row[cols] + '">';
                  che.push(id_permit);
                } else {
                  str += '';
                }

              } else if (result.fields[i].name === 'Удалять') {

                if (row[cols] > 0) {
                  str += '<input type="checkbox" ';

                  for (let k = 0; k < resultDB.rows.length; k++) {


                    if (resultDB.rows[k].permit_id === id_permit) {
                      let code = resultDB.rows[k].code;

                      if (code.indexOf('1', 1) === 1) {
                        str += 'checked';
                      }
                    }
                  }

                  str += ' name="administrator[' + id_permit + ']" value="' + row[cols] + '">';
                  che.push(id_permit);
                } else {
                  str += '';
                }

              } else if (result.fields[i].name === 'Публиковать') {

                if (row[cols] > 0) {
                  str += '<input type="checkbox" ';

                  for (let k = 0; k < resultDB.rows.length; k++) {


                    if (resultDB.rows[k].permit_id === id_permit) {
                      let code = resultDB.rows[k].code;

                      if (code.indexOf('1', 0) === 0) {
                        str += 'checked';
                      }
                    }
                  }

                  str += ' name="administrator[' + id_permit + ']" value="' + row[cols] + '">';
                  che.push(id_permit);
                } else {
                  str += '';
                }

              } else if (result.fields[i].name === 'Адрес страницы') {

                str += hostname + row[cols];

              } else {

                str += row[cols];
              }

              str += '</td>' + '\n';

            }

            str += '\t' + '</tr>' + '\n';
          }

          str += '</table>' + '\n';
          str += '</div>' + '\n';
          str += '<input type="hidden" name="administrator[id_role]" value="' + id_role + '" />' + '\n';
          str += '<input type="hidden" name="administrator[check]" value="' + che + '" />';

          fn(null, str);
        }
      });
  });
};

exports.tableUsers = function (result, roleUsers) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
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

        if (result.fields[i].name == 'Администрирование') {

          str += '<a class="btn btn-primary btn-xs btn-margins" role="button"' +
            ' href="/admin/administrator/assign-role?assignRole=' + row[cols] + '">присвоить роль</a>';

        } else if (result.fields[i].name == 'Роль') {

          if (row[cols] == null && roleUsers.rowCount == 0) {

            str += '<span class="no">нет роли для пользователей</span>';

          } else if (row[cols] == null && roleUsers.rowCount == 1) {

            str += '<strong>' + roleUsers.rows[0].name_role + '</strong>';

          } else {

            str += '<strong>' + row[cols] + '</strong>';
          }

        } else if (result.fields[i].name == 'Дата регистрации') {

          str += ms.msDate(row[cols]);

        } else if (result.fields[i].name == "Ф.И.О") {

          if (row[cols] != null) {
            str += ms.clip(row[cols]);
          } else if (row[cols] == null) {
            str += 'нет данных';
          }

        } else if (row[cols] == null) {

          str += 'нет данных';

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

exports.tableOneUsers = function (result, allRoleModerator, oneRoleUsers) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    let id_user;
    let usersRoleId;

    str += '<div class="table-responsive">' + '\n';
    str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
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

        if (result.fields[i].name === 'Присвоить роль') {

          id_user = row[cols];

          str += '<select class="form-control select-xs" name="administrator[selectRole]">' + '\n';


          if (oneRoleUsers.rowCount === 1) {
            usersRoleId = oneRoleUsers.rows[0].id_role;
            str += '<option value="' + oneRoleUsers.rows[0].id_role + '">' + oneRoleUsers.rows[0].name_role + '</option>' + '\n';
          }

          for (let j = 0; j < allRoleModerator.rows.length; j++) {

            str += '<option ';


            if (result.rows[0]['Текущая роль'] === allRoleModerator.rows[j].name_role) str += 'selected';

            str += ' value="' + allRoleModerator.rows[j].id_role + '">' + allRoleModerator.rows[j].name_role + '</option>' + '\n';
          }

          str += '</select>' + '\n';

        } else if (result.fields[i].name === 'Текущая роль') {

          if (row[cols]) {

            str += row[cols];

          } else {

            if (oneRoleUsers.rowCount === 1) {
              str += oneRoleUsers.rows[0].name_role;
            } else {
              str += '<span class="no">нет роли для пользователей</span>';
            }
          }

        } else if (result.fields[i].name === 'Дата регистрации' || result.fields[i].name === 'date_hash_url') {

          str += ms.clip(ms.msDate(row[cols]));

        } else if (row[cols] == null) {

          str += 'нет данных';

        } else {

          str += row[cols];
        }

        str += '</td>' + '\n';

      }
      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    str += '<input type="hidden" name="administrator[id_user]" value="' + id_user + '">' + '\n';
    str += '<input type="hidden" name="administrator[usersRoleId]" value="' + usersRoleId + '">' + '\n';

    return str;
  }
};

exports.tableAccessUser = function (users, result, hostname) {


  let status = '';

  if (users === 1) status = 'Зарегистрированный пользователь';
  if (users === 0) status = 'Модератор сайта';
  if (users === null) status = '<h4 class="text-center">Администратор - все права.</h4>';

  let str = '';

  if (users === null) {

    str = status;

    return str;

  } else {

    if (result.rows.length === 0) {

      return str;

    } else {

      str += '<div class="table-responsive">' + '\n';
      str += '<table class="table table-striped table-bordered table-hover table-condensed tables-top">' + '\n';
      str += '\t' + '<tr>' + '\n';

      for (let k = 0; k < result.fields.length; k++) {

        str += '\t\t' + '<th>' + result.fields[k].name + '</th>' + '\n';

      }
      str += '\t' + '</tr>' + '\n';

      let count = null;
      let rowspan = result.rows.length;

      for (let j = 0; j < result.rows.length; j++) {

        count = j;

        let row = result.rows[j];

        str += '\t' + '<tr>' + '\n';

        for (let i = 0; i < result.fields.length; i++) {

          /*console.log('i: ' + i);
           console.log('count: ' + count);
           console.log('********************');*/

          let cols = result.fields[i].name;

          if (count === 0 && i === 0 || count === 0 && i === 1) {
            str += '\t\t' + '<td rowspan="' + rowspan + '">';
          } else if (i === 0 || i === 1) {
            str += '';
          } else {
            str += '\t\t' + '<td>';
          }

          if (result.fields[i].name === 'Статус') {

            if (row[cols] === 1) {

              if (count === 0 && i === 0) str += 'Зарегистрированный пользователь';
            }

            if (row[cols] === null) {

              if (count === 0 && i === 0) str += 'Модератор сайта';
            }

          } else if (result.fields[i].name === 'Роль') {

            if (count === 0 && i === 1) str += row[cols];

          } else if (result.fields[i].name === 'Путь к разделам') {

            str += hostname + row[cols];

          } else if (result.fields[i].name === 'Права доступа к разделам') {

            if (row[cols].indexOf('1', 4) === 4) str += 'Редактировать всех, ';
            if (row[cols].indexOf('1', 3) === 3) str += 'Сохранять, ';
            if (row[cols].indexOf('1', 2) === 2) str += 'Править, ';
            if (row[cols].indexOf('1', 1) === 1) str += 'Удалять, ';
            if (row[cols].indexOf('1', 0) === 0) str += 'Публиковать, ';

          } else {

            str += row[cols];

          }

          if (count === 0 && i === 0 || count === 0 && i === 1) {
            str += '\t\t' + '</td>' + '\n';
          } else if (i === 0 || i === 1) {
            str += '';
          } else {
            str += '\t\t' + '</td>' + '\n';
          }

        }
        str += '\t' + '</tr>' + '\n';
      }

      str += '</table>' + '\n';
      str += '</div>' + '\n';

      return str;
    }
  }
};

function tableSQLfunc(hidden, query, str, fn) {

  let strDelete = '';
  let strSelect = '';

  pool.connect(function (err, client, done) {
    if (err) return fn(err);

    if (hidden) {

      strDelete = "DELETE FROM sqltable WHERE query != ";

      if (typeof hidden === 'object') {

        for (let d = 0; d < hidden.length; d++) {

          if (d == 0) strDelete += "'" + hidden[d] + "'";

          if (d > 0) strDelete += " AND query != '" + hidden[d] + "'";

        }

      } else {
        strDelete = "DELETE FROM sqltable WHERE query != '" + hidden + "'";
      }

    } else {
      strDelete = "DELETE FROM sqltable";
    }

    client.query(strDelete, function (err, result) {
      done();
      if (err) return fn(err);

      pool.connect(function (err, client, done) {
        if (err) return fn(err);

        client.query('INSERT INTO sqltable (str, query) VALUES ($1, $2)',
          [str, query.replace(/['"]/g, "")], function (err, result) {
            done();
            if (err) return fn(err);

            if (hidden) {
              pool.connect(function (err, client, done) {
                if (err) return fn(err);

                if (hidden) {

                  strSelect = 'SELECT str FROM sqltable WHERE query = ';

                  if (typeof hidden === 'object') {

                    for (let s = 0; s < hidden.length; s++) {

                      if (s == 0) strSelect += "'" + hidden[s] + "'";

                      if (s > 0) strSelect += " OR query = '" + hidden[s] + "'";

                    }

                  } else {

                    strSelect += "'" + hidden + "'";
                  }

                  client.query(strSelect, function (err, result) {
                    done();
                    if (err) return fn(err);

                    for (let l = 0; l < result.rows.length; l++) {
                      str += result.rows[l].str;
                    }


                    return fn(null, str);

                  });
                }
              });

            } else {

              return fn(null, str);
            }
          });
      });
    });
  });
}

exports.tableSQL = function (title, hidden, horizontally, query, error, result, fn) {

  let str = '';

  if (horizontally == 1) {

    if (error) {

      str += '<h5 class="no">' + 'ERROR: ' + error + '</h5>' + '\n';
      str += '<h5>' + 'QUERY: ' + query + '</h5>' + '\n';

      tableSQLfunc(hidden, query, str, function (err, result) {

        return fn(null, result);

      });

    } else {

      if (result.rows.length == 0) {

        str += title;
        return fn(null, str);

      } else {


        str += title;
        str += '<input type="checkbox" value="' + query.replace(/['"]/g, "") + '" name="sql[hidden]"/>' + '\n';
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

            str += ms.clip300(row[cols]);

            str += '\t\t' + '</td>' + '\n';

          }

          str += '\t' + '</tr>' + '\n';
        }

        str += '</table>' + '\n';
        str += '</div>' + '\n';


        tableSQLfunc(hidden, query, str, function (err, result) {

          return fn(null, result);

        });

      }
    }
  }

  if (horizontally == 0) {

    if (error) {

      str += '<h3 class="no">' + 'ERROR: ' + error + '</h3>' + '\n';
      str += '<h3>' + 'QUERY: ' + query + '</h3>' + '\n';

      tableSQLfunc(hidden, query, str, function (err, result) {

        return fn(null, result);

      });

    } else {

      if (result.rows.length == 0) {

        str += title;
        return fn(null, str);

      } else {

        str += title;
        str += '<input type="checkbox" value="' + query.replace(/['"]/g, "") + '" name="sql[hidden]"/>' + '\n';

        let row = '';
        let cols = '';


        for (let j = 0; j < result.rows.length; j++) {

          str += '\t\t' + '<hr>' + '\n';

          row = result.rows[j];

          for (let i = 0; i < result.fields.length; i++) {

            cols = result.fields[i].name;

            str += '\t\t' + '<p class="sql-horiz"><label class="label sqll">' + cols + '</label>: ' + row[cols] + '</p>' + '\n';

          }
        }

      }

      tableSQLfunc(hidden, query, str, function (err, result) {

        return fn(null, result);

      });
    }
  }
};


exports.tableArchiveSQL = function (result) {

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

        if (result.fields[i].name == 'id_sql') {
          str += '<span class="td220">';

          str += '<a class="btn btn-danger btn-xs btn-margins" href="/admin/administrator/sql?dropQuery=' + row[cols] + '">удалить</a>'
            + '<a class="btn btn-success btn-xs btn-margins" href="/admin/administrator/sql?saveQuery=' + row[cols] + '">сохранить</a>'
            + '<a class="btn btn-primary btn-xs btn-margins" href="/admin/administrator/sql?viewsQuery=' + row[cols] + '">представление</a>';

          str += '</span>';
        } else if (result.fields[i].name == 'date') {

          str += ms.msDate(row[cols]);

        } else if (result.fields[i].name == 'error') {

          if (row[cols] == null) {
            str += '';
          } else {
            str += row[cols];
          }

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
};

exports.tableNotebookSQL = function (result) {


  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="wrapperNav">' + '\n';
    str += '</div>' + '\n';
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

        if (result.fields[i].name == 'id_sql') {
          str += '<span class="td225">';
          str += '<a class="btn btn-danger btn-xs btn-margins" href="/admin/administrator/sql?dropQuery=' + row[cols] + '">удалить</a>'
            + '<a class="btn btn-success btn-xs btn-margins" href="/admin/administrator/sql?editQuery=' + row[cols] + '">редактировать</a>'
            + '<a class="btn btn-primary btn-xs btn-margins" href="/admin/administrator/sql?viewsQuery=' + row[cols] + '">представление</a>';

          str += '<span>';

        } else if (result.fields[i].name == 'description' || result.fields[i].name == 'tags' || result.fields[i].name == 'priority') {

          if (row[cols] == null) {
            str += '';
          } else {
            str += row[cols];
          }

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
};

exports.tableEditQuery = function (result) {

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

        str += row[cols];

        str += '\t\t' + '</td>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';

    return str;
  }

};

exports.tableLesson = function (result) {

  let str = '';

  if (result.rowCount === 0 || !result) {

    return str;

  } else {

    str += '<div class="wrapperTable">' + '\n';
    str += '<div class="table">' + '\n';
    str += '<table border="1">' + '\n';
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

        str += row[cols];

        str += '\t\t' + '</td>' + '\n';

      }

      str += '\t' + '</tr>' + '\n';
    }

    str += '</table>' + '\n';
    str += '</div>' + '\n';
    str += '</div>' + '\n';

    return str;
  }

};