let url = require('url');
let co = require("co");
let XLS = require('xlsjs');
let conf = require('../../../config');
let pg = require('pg');
let dbConf = conf.get('db');
let pool = new pg.Pool(dbConf);
let Parser = require('./model/index');
let menu = require('../../../lib/menu');
let table = require('../../../lib/tableList');
let Permit = require('../../../lib/permit');




exports.list = function (req, res, next) {
	res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let administrator = true;
  let pathname = urlParsed.pathname;
  let formValue = null;
  let selectAgents = '<option value="">Нет агентов</option>';
  let selectEndStreet = '';
  let selectProject = '';
  let selectSection = '';
  let area1 = '';
  let area2 = '';
  let area3 = '';
  let selectToilet = '';
  let selectOp = '';
  let selectBalcony = '';
  let endstorey = '';
  let endnumstorey = '';
  let priceOld = '';
  let selectType = '';
  let resultList = '';
  let sidebar = null;
  let id_user = null;
  let users = null;
  let permission = '';
  let Permit = require('../../../lib/permit');
  let back = '';
  if(urlParsed.query.page){
    back = '?page=' + urlParsed.query.page;
  }
  let nameCity = '';
  let cityList = '';
  let id_agency = null;
  let id_moderator_agency = null;
  let id_city = null;


	function accessAdministrator() {

		if (conf.get('administrator') !== req.session.uid) {
			req.session.flash = {
				type: 'danger',
				intro: 'Ошибка доступа!',
				message: 'Вы не администратор сайта.'
			};

			res.redirect(303, '/admin/template/admin');
		} else {
			noend();
		}
	}

  function accessValue() {

    let permit = new Permit({
      url: urlParsed.pathname,
      email: req.session.uid
    });

    permit.accessModerator(function (err, result) {
      if (err) return next(err);

      id_user = result.rows[0].id_user;

      if (req.admin !== req.session.uid) {

        if (result.rows[0].role_id == null) {
          administrator = false;
          users = 1;
        } else {
          administrator = false;
          users = 0;
        }
      }

      permit.access(function (err, result) {
        if (err) return next(err);

        permission = result;

        Permit.getCity(req.session.uid, function (err, result) {
          if (err) return next(err);

          if (result === 0) {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка администрирования!',
              message: 'В разделе "Настройки сайта" нужно установить город по умолчанию.'
            };
            res.redirect(303, '/admin/template/admin');

          } else {

            id_city = result;
            noend();
          }
        });
      });
    });
  }

	function userMenu() {

		menu.adminMenu(permission, null, req.session.uid, urlParsed, function (err, result) {
			if (err) return next(err);

			sidebar = result;

			noend();
		});
	}

  function editCity() {

    if (urlParsed.query.editCity) {

      Parser.setCity(urlParsed.query.editCity, req.session.uid, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Город установлен.'
          };
          res.redirect(303, pathname);

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: "В ближайшее время ошибка будет устранена."
          };
          res.redirect(303, pathname);
        }
      })

    } else {
      noend();
    }
  }

	function listParser() {

		let workbook = XLS.readFile(__dirname + '/1.xls');

		function to_json(workbook) {

			pool.connect( function(err, client, done) {

				workbook.SheetNames.forEach(function(sheetName) {
				let roa = XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);

					for(let i=0; i < roa.length; i++ ){

						if(sheetName === 'Иногородние'){

							roa[i]['раздел'] = sheetName;

							client.query('INSERT INTO parser (street, house, liter, storey, project, price, area, toilet,' +
								' balcony, op, note, tel, section) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,' +
								' $13)',
/*								[roa[i]["улица"], roa[i]["дом "], roa[i]["лит."], roa[i]["этаж"], roa[i]["пр-т"], roa[i]["цена"], roa[i]["площадь"], roa[i]["с/у"], roa[i]["балкон"], roa[i]["ОП"], roa[i]["примечание"], roa[i]["телефоны агенства, риэлтора"], roa[i]["раздел"]], function (err, result) {
									done();

								});*/
                [roa[i]["Город -улица"], roa[i]["дом "], roa[i]["лит."], roa[i]["этаж"], roa[i]["пр-т"], roa[i]["цена"], roa[i]["площадь"], roa[i]["с/у"], roa[i]["балкон"], roa[i]["ОП"], roa[i]["примечание"], roa[i]["телефоны агенства, риэлтора"], roa[i]["раздел"]], function (err, result) {
                  done();

                });
						}
					}
				});
			});
		}

		//to_json(workbook);

		noend();
	}

	function listEdit() {

		if ( urlParsed.query.edit ) {

			let getEdit = new Parser({id:urlParsed.query.edit});

			getEdit.getOneRecord(function (err, result) {
				if (err) return next(err);

				if(result === null){
					req.session.flash = {
						type: 'warning',
						intro: 'Предупреждение базы данных!',
						message: "Таблица \"parser\" пустая."
					};
					res.redirect(303, 'back');
				} else {
					formValue = result;
					noend();
				}
			})

		} else {
			noend();
		}

	}

  function type() {

    if ( urlParsed.query.edit ) {

      co(function*() {

        let arrAlias = ['prodam', 'sdam', 'kuplyu', 'snimu'];

        for (let i = 0; i < arrAlias.length; i++) {

          let type = yield new Promise(function (resolve, reject) {

            Parser.getSection(arrAlias[i], function (err, result) {
              if (err) return next(err);
              resolve(result.rows[0]);
            });
          });

          selectType += '<option value="' + type.id + '">' + type.title + '</option>' + '\n';
        }
        noend();
      });
    } else {
      noend();
    }
  }

  function streetSelect() {

    if(urlParsed.query.edit){
      let street = new Parser({});

      street.getStreet(id_city, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          selectEndStreet += '<option value="">-Улица не выбрана-</option>' + '\n';

          let str = formValue.street.toLowerCase();

          for (let i = 0; i < result.rows.length; i++) {

            let strSelect = result.rows[i].street.toLowerCase();

            if(str.indexOf(strSelect) < 0){
              selectEndStreet += '<option value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
            } else {
              selectEndStreet += '<option value="' + result.rows[i].id_street + '" selected>' + result.rows[i].street + '</option>' + '\n';
            }

          }
          noend();

        } else {
          noend();
        }
      });
    } else {
      noend();
    }
  }

	function storey() {

		if ( urlParsed.query.edit ) {


		  if(formValue.storey){
        let arrStorey = formValue.storey.split('\\');

        if(arrStorey.length === 2){
          endstorey = arrStorey[0];
          endnumstorey = arrStorey[1];
        } else {
          arrStorey = formValue.storey.split('/');
          endstorey = arrStorey[0];
          endnumstorey = arrStorey[1];
        }
      }

      noend();

		} else {
			noend();
		}
	}

  function project() {

    if ( urlParsed.query.edit ) {

      co(function*() {

        let project = formValue.project;

        if(project){
          if(project.indexOf('.', project.length - 1)) {
            project = project.slice(0, -1);
          }
        }


        let index = null;

        let resultProject = yield new Promise(function (resolve, reject) {

          Parser.getAllProject(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultProject.rowCount > 0){

          selectProject += '<option value="">-не определено-</option>' + '\n';

          for (let i = 0; i < resultProject.rows.length; i++) {

            if(project){
              index = resultProject.rows[i].title.toLowerCase().indexOf(project);

              if(formValue.project.toLowerCase() == 'бнч' && resultProject.rows[i].title == 'Панельный'){
                index = 0;
              }

            }

            if(index === 0){
              selectProject += '<option value="' + resultProject.rows[i].id_project + '" selected>' + resultProject.rows[i].title + '</option>' + '\n';
            } else {
              selectProject += '<option value="' + resultProject.rows[i].id_project + '">' + resultProject.rows[i].title + '</option>' + '\n';
            }
          }

          noend();

        } else {
          noend();
        }

      });

    } else {
      noend();
    }
  }

  function price() {

	  if ( urlParsed.query.edit ) {

      priceOld = formValue.price;

      formValue.price = priceOld + '000';

      noend();

    } else {
	    noend();
    }
  }

	function area() {

		let arrArea = [];

		if ( urlParsed.query.edit ) {

			if(formValue.area){
        if(formValue.area.indexOf('/') < 0){
          if(formValue.area.indexOf('\\') < 0){
            area1 = formValue.area;
          } else {
            arrArea = formValue.area.split('\\');
            area1 = arrArea[0];
            area2 = arrArea[1];
            area3 = arrArea[2];
          }
        } else {
          arrArea = formValue.area.split('/');
          area1 = arrArea[0];
          area2 = arrArea[1];
          area3 = arrArea[2];
        }
      }

      noend();
		} else {
			noend();
		}
	}

  function toilet() {

    if ( urlParsed.query.edit ) {

      co(function*() {

        let toilet = formValue.toilet;

        if(toilet){
          if(toilet.indexOf('.', toilet.length - 1)) {
            toilet = toilet.slice(0, -1);
          }
        }


        let index = null;

        let resultToilet = yield new Promise(function (resolve, reject) {

          Parser.getAllToilet(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultToilet.rowCount > 0){

          selectToilet += '<option value="">-не определено-</option>' + '\n';

          for (let i = 0; i < resultToilet.rows.length; i++) {

            if(toilet){
              index = resultToilet.rows[i].title.toLowerCase().indexOf(toilet);
            }

            if(index === 0){
              selectToilet += '<option value="' + resultToilet.rows[i].id_toilet + '" selected>' + resultToilet.rows[i].title + '</option>' + '\n';
            } else {
              selectToilet += '<option value="' + resultToilet.rows[i].id_toilet + '">' + resultToilet.rows[i].title + '</option>' + '\n';
            }
          }

          noend();

        } else {
          noend();
        }

      });

    } else {
      noend();
    }
  }

  function op() {
    if ( urlParsed.query.edit ) {

      let arrOp = [];
      let op = formValue.op;
      let index = null;

      arrOp[0] = 'нет';
      arrOp[1] = 'да';

      selectOp += '<option value="">-не определено-</option>'+'\n';

      for(let i=0; i < arrOp.length; i++){

        index =  arrOp[i].indexOf(op);

        if(index < 0){

          if(op == '-' && i==0){
            selectOp += '<option value="0" selected>нет</option>'+'\n';
            continue;
          }

          if(op == 'нет' && i==0){
            selectOp += '<option value="0" selected>нет</option>'+'\n';
            continue;
          }

          if(op == 'Нет' && i==0){
            selectOp += '<option value="0" selected>нет</option>'+'\n';
            continue;
          }

          if(op == '+' && i==1){
            selectOp += '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          if(op == 'ОП' && i==1){
            selectOp += '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          if(op == 'Есть' && i==1){
            selectOp += '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          if(op == 'есть' && i==1){
            selectOp += '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          selectOp += '<option value="'+i+'">'+arrOp[i]+'</option>'+'\n';

        } else {
          selectOp += '<option value="'+i+'" selected>'+arrOp[i]+'</option>'+'\n';
        }
      }

      noend();
    } else {
      noend();
    }
  }

  function Balcony() {
    if ( urlParsed.query.edit ) {

      let arrBalcony = [];
      let balcony = formValue.balcony;
      let index = null;

      arrBalcony[0] = 'нет';
      arrBalcony[1] = 'да';

      selectBalcony += '<option value="">-не определено-</option>'+'\n';

      for(let i=0; i < arrBalcony.length; i++){

        index =  arrBalcony[i].indexOf(Balcony);

        if(index < 0){

          if(balcony == '-' && i==0){
            selectBalcony+= '<option value="0" selected>нет</option>'+'\n';
            continue;
          }

          if(balcony==="б/б" && i==0){
            selectBalcony += '<option value="0" selected>нет</option>'+'\n';
            continue;
          }


          if(balcony == 'б\\б' && i==0){
            selectBalcony+= '<option value="0" selected>нет</option>'+'\n';
            continue;
          }

          if(balcony == 'б\\з' && i==1){
            selectBalcony+= '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          if(balcony == 'б/з' && i==1){
            selectBalcony+= '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          if(balcony == 'нет' && i==0){
            selectBalcony += '<option value="0" selected>нет</option>'+'\n';
            continue;
          }

          if(balcony == 'Нет' && i==0){
            selectBalcony += '<option value="0" selected>нет</option>'+'\n';
            continue;
          }

          if(balcony == '+' && i==1){
            selectBalcony += '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          if(balcony == 'да' && i==1){
            selectBalcony += '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          if(balcony == 'Да' && i==1){
            selectBalcony += '<option value="1" selected>да</option>'+'\n';
            continue;
          }

          selectBalcony += '<option value="'+i+'">'+arrBalcony[i]+'</option>'+'\n';

        } else {
          selectBalcony += '<option value="'+i+'" selected>'+arrBalcony[i]+'</option>'+'\n';
        }
      }

      noend();
    } else {
      noend();
    }
  }

	function section() {
    if ( urlParsed.query.edit ) {

      let formValueSection = '';

      if(formValue.section == 1)formValueSection = '1-комнатные';
      if(formValue.section == 2)formValueSection = '2-комнатные';
      if(formValue.section == 3)formValueSection = '3-комнатные';
      if(formValue.section == 4)formValueSection = '4-комнатные';
      if(formValue.section == '5-6')formValueSection = '5-комнат и более';
      if(formValue.section == 'КОМНАТЫ')formValueSection = 'Комнаты';
      if(formValue.section == 'ИЗОЛИРОВАННЫЕ МАЛОСЕМЕЙКИ ')formValueSection = 'Изолированные малосемейки';

      Parser.selectSection(function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {

          for (let i = 0; i < result.rows.length; i++) {

            if (result.rows[i].section === formValueSection) {
              selectSection += '<option value="' + result.rows[i].section_id + '" selected>' + result.rows[i].section + '</option>' + '\n';
            } else {
              selectSection += '<option value="' + result.rows[i].section_id + '">' + result.rows[i].section + '</option>' + '\n';
            }
          }
          noend();
        } else {
          noend();
        }
      });

    } else {
      noend();
    }
  }

	function listSelectAgents() {

	  if ( urlParsed.query.edit ) {
			let getUser = new Parser({});

			getUser.getUser(function (err, result) {
        if (err) return next(err);
				if(result.rowCount > 0){

					selectAgents = '';
					let str = '';
					let tel = '';

          let arrTel = formValue.tel.split('');
          for(let i=0; i < arrTel.length; i++){

            arrTel[i] = arrTel[i] * 1;

            if(arrTel[i] === 0 || arrTel[i] === 1 || arrTel[i] === 2 || arrTel[i] === 3 || arrTel[i] === 4 || arrTel[i] === 5 || arrTel[i] === 6 || arrTel[i] === 7 || arrTel[i] === 8 || arrTel[i] === 9){
              str += arrTel[i];
            }
          }

          selectAgents += '<option value="">-не определено-</option>' + '\n';

					for(let i=0; i < result.rows.length; i++){

            tel = result.rows[i].tel.replace(/^(\+7)/,'');

            if(str.indexOf(tel) > 0){
              selectAgents += '<option selected value="' +result.rows[i].id_user + '">' + result.rows[i].tel + ' | ' + result.rows[i].fio1 + '</option>' + '\n';
            } else {
              selectAgents += '<option value="' +result.rows[i].id_user + '">' + result.rows[i].tel + ' | ' + result.rows[i].fio1 + '</option>' + '\n';
            }
          }
					noend();

				} else {
					noend();
				}
			})

		} else {
			noend();
		}
	}

  function listCity() {

    let city = '';

    Parser.oneCity(id_city, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {
        nameCity = result.rows[0].title;

        let objCity = {};
        let objRegion = {};

        Parser.getAllCity(function (err, result) {
          if (err) return next(err);

          for(let i = 0; i < result.rows.length; i++){
            objCity[result.rows[i].id_city] = result.rows[i].title;
          }

          for(let i = 0; i < result.rows.length; i++){
            objRegion[result.rows[i].id_city] = result.rows[i].region;
          }

          Parser.getMainCity('Нижнекамск', permission, id_agency, id_moderator_agency, id_user, function (err, result) {
            if (err) return next(err);

            if(result.rowCount > 0){

              delete objCity[result.rows[0].id_city];
              delete objRegion[result.rows[0].id_city];

              city += '<ul class="listCity">\n';

              if(result.rowCount > 0){
                city += '\t<li><a href="/admin/administrator/parser?editCity=' + result.rows[0].id_city + '">[' + result.rows[0].sum + '] '+'<b>' + result.rows[0].title + '</b> - ' + result.rows[0].region + '</a></li>\n';
              }

              Parser.listCity('Нижнекамск', permission, id_agency, id_moderator_agency, id_user, function (err, result) {
                if (err) return next(err);

                if(result.rowCount > 0){
                  cityList = result.rows;

                  for (let i = 0; i < cityList.length; i++) {

                    delete objCity[cityList[i].id_city];
                    delete objRegion[cityList[i].id_city];

                    city += '\t<li><a href="/admin/administrator/parser?editCity=' + cityList[i].id_city + '">[' + result.rows[i].sum  + '] '+'<b>' + cityList[i].title + '</b> - ' + cityList[i].region + '</a></li>\n';
                  }

                  for(let key in objCity){
                    city += '\t<li><a href="/admin/administrator/parser?editCity=' + key + '"><b>' + objCity[key] + '</b> - ' + objRegion[key] + '</a></li>\n';
                  }

                  city += '</ul>\n';
                  cityList = city;

                  noend();

                } else {

                  for(let key in objCity){
                    city += '\t<li><a href="/admin/administrator/parser?editCity=' + key + '"><b>' + objCity[key] + '</b> - ' + objRegion[key] + '</a></li>\n';
                  }

                  city += '</ul>\n';
                  cityList = city;

                  noend();
                }

              });

            } else {

              city += '<ul class="listCity">\n';

              for(let key in objCity){
                city += '\t<li><a href="/admin/administrator/parser?editCity=' + key + '"><b>' + objCity[key] + '</b> - ' + objRegion[key] + '</a></li>\n';
              }

              city += '</ul>\n';
              cityList = city;

              noend();
            }

          });

        });

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка администрирования!',
          message: "Не определяется город."
        };
        res.redirect(303, '/admin/template/admin');
      }
    })
  }

	function listTable(){

		Parser.list(function (err, result) {
			if (err) return next(err);

			if(result.rowCount < 1){
				req.session.flash = {
					type: 'warning',
					intro: 'Предупреждение базы данных!',
					message: "Таблица \"parser\" пустая."
				};
				res.redirect(303, 'back');

			} else {

        resultList = result;

        let urlPage = urlParsed.query.page;
        let limit = 30;
        let linkLimit = 20;
        let offset = urlPage * limit - limit;

        if (offset < 0 || !offset) offset = 0;


        Parser.listLimit(limit, offset, function (err, result) {

          if (err) return next(err);

          resultList = table.tableParser(resultList, urlParsed, limit, linkLimit, urlPage, result, req);

          noend();

        });
			}
		});
	}

	function listRender() {

    let nameTemplate = 'Комнаты, квартиры. Парсер XLS. ';

    let titlePage = nameTemplate + '<span class = "city">' + nameCity + '</span>';
    titlePage += '<span class="btn btn-primary selectCity" data-toggle="modal" data-target=".bs-example-modal-lg">Выбрать город</span>';


		res.render('administrator/parser/body', {
			layout: 'administrator',
      title: titlePage,
      sidebar: sidebar,
			priceTab : resultList,
			administrator: administrator,
			formValue: formValue,
			selectAgents: selectAgents,
			selectEndStreet: selectEndStreet,
			selectProject: selectProject,
			endstorey: endstorey,
			endnumstorey: endnumstorey,
			area1: area1,
			area2: area2,
			area3: area3,
			selectToilet: selectToilet,
			selectOp: selectOp,
      selectBalcony: selectBalcony,
      selectSection: selectSection,
      priceOld: priceOld,
      selectType: selectType,
      cityList: cityList,
      back: back

		});

	}

  let tasks = [ accessAdministrator, accessValue, userMenu, editCity, listParser, listEdit, type, streetSelect, storey, project, price, area, toilet, op, Balcony, section, listSelectAgents, listCity, listTable, listRender ];

	function noend() {
		let currentTask = tasks.shift();
		if (currentTask) currentTask();
	}

	noend();

};

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

exports.submit = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let value = req.body.administrator;
  let pathname = urlParsed.pathname;
  let title = '';
  let pathnameSave = '';
  let id_user = null;

  function accessAdministrator() {
    if (conf.get('administrator') !== req.session.uid) {
      res.redirect('/');
    } else {
      noend();
    }
  }

  function accessValue() {

    let permit = new Permit({
      url: urlParsed.pathname,
      email: req.session.uid
    });

    permit.accessModerator(function (err, result) {
      if (err) return next(err);

      id_user = result.rows[0].id_user;
      noend();
    });
  }

  function validate() {

    if(value.create){

      for(let key in value) {
        value[key] = value[key].trim();
      }

      for(let key in value) {
        if (value[key] === ' ') {
          value[key] = '';
        }
      }

      if(value.type === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errType: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.type.length > 19){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более девятнадцати символов."
        };
        req.session.repeatData = {
          errType: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.section === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errSection: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.section.length > 19){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более девятнадцати символов."
        };
        req.session.repeatData = {
          errSection: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.agent === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errAgent: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.agent.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errAgent: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.street === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errStreet: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.street.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errStreet: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.house.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errHouse: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.storey === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errStorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.storey.length > 2){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более двух символов."
        };
        req.session.repeatData = {
          errStorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(!(/^[0-9]*$/.test(value.storey))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать число."
        };
        req.session.repeatData = {
          errStorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.numstorey === ''){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Поля отмеченные звёздочкой, обязательны для заполнения."
        };
        req.session.repeatData = {
          errNumstorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(!(/^[0-9]*$/.test(value.numstorey))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать целое число."
        };
        req.session.repeatData = {
          errNumstorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.numstorey.length > 2){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более двух символов."
        };
        req.session.repeatData = {
          errNumstorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.storey*1 > value.numstorey*1){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Этажность дома должна быть ровна этажам, либо больше этажей."
        };
        req.session.repeatData = {
          errNumstorey: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(!(/^[0-9]*$/.test(value.price))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать целое число."
        };
        req.session.repeatData = {
          errPrice: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.price.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errPrice: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.area1.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errArea1: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(!(/^[0-9]*\.*\d{0,1}$/.test(value.area1))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать целое число, либо десятичное."
        };
        req.session.repeatData = {
          errArea1: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.area2.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errArea2: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if( value.area2.length > 0 && !(/^[0-9]*\.*\d{0,1}$/.test(value.area2))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать целое число, либо десятичное."
        };
        req.session.repeatData = {
          errArea2: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.area3.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errArea3: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.area3.length > 0 && !(/^[0-9]*\.*\d{0,1}$/.test(value.area3))){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать целое число, либо десятичное."
        };
        req.session.repeatData = {
          errArea3: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.op.length > 1){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более одного символа."
        };
        req.session.repeatData = {
          errOp: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.project.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errProject: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.toilet.length > 10){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более десяти символов."
        };
        req.session.repeatData = {
          errToilet: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.balcony.length > 1){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более одного символа."
        };
        req.session.repeatData = {
          errBalcony: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else if(value.note.length > 1000){
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Нужно указать не более одной тысячи символов."
        };
        req.session.repeatData = {
          errNote: true,
          type: value.type, section: value.section, agent: value.agent, street: value.street, house: value.house, liter: value.liter, storey: value.storey, numstorey: value.numstorey, price: value.price, area1: value.area1, area2: value.area2, area3: value.area3, op: value.op, project: value.project, toilet: value.toilet, balcony: value.balcony, note: value.note, status: value.status, main: value.main
        };
        res.redirect(303, 'back');

      } else {
        noend();
      }

    } else {
      noend();
    }
  }

  function joinTitle() {

    if (value.create) {

      for (let key in value) {
        value[key] = value[key].trim();
      }

      Parser.getTitleSection(value.section, function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          title = result.rows[0].title + ", " + value.area1 + " м<sup><small>2</small></sup>, " + value.storey + "/" + value.numstorey + " - " +
            "этаж/этажей";

          noend();

        } else {
          title = value.area1 + " м<sup><small>2</small></sup>, " + value.storey + "/" + value.numstorey + " - этаж/этажей";
          noend();
        }

      });

    } else {
      noend();
    }
  }

  function create() {

    if (value.create && urlParsed.query.edit) {

      if(urlParsed.query.page){
        pathnameSave = pathname + '?' + 'page=' + urlParsed.query.page
      } else {
        pathnameSave = pathname;
      }


      let create = new Parser({
        id_parser: urlParsed.query.edit,
        value: value,
        date_create: Date.now(),
        author: id_user,
        template: 'apartment',
        title: title
      });

      create.save(function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0) {

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Объект недвижимости перезаписан.'
          };

          res.redirect(303, pathnameSave);


        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка записи!',
            message: "Объект недвижимости не перезаписан"
          };
          res.redirect(303,'back');
        }

      });

    } else {
      return next();
    }
  }

  let tasks = [ accessAdministrator, accessValue, validate, joinTitle, create ];
  function noend(result) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(result);
  }
  noend();

};