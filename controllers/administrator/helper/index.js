let url = require('url');
let conf = require('../../../config');
let Helper = require('./model/index');
let table = require('../../../lib/tableList');
let menu = require('../../../lib/menu');
let co = require("co");

exports.list = function (req, res, next) {

  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let administrator = true;
  let pathname = urlParsed.pathname;
  let sidebar = null;
  let resultDistricts = '';
  let formValueDistricts = '';
  let selectRegion = '';
  let resultProject = '';
  let formValueProject = '';
  let resultToilet = '';
  let formValueToilet = '';
  let resultMaterial = '';
  let formValueMaterial = '';
  let action = {};
  let id_user = null;
  let users = null;
  let permission = '';
  let resultCategoryLand = '';
  let formValueCategoryLand = '';
  let Permit = require('../../../lib/permit');

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

        noend();
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
  
  function tableDistricts() {

    Helper.getRegion(function (err, result) {
      if (err) return next(err);


      if(result.rowCount > 0){

        selectRegion += '<option value="">-не выбрано-</option>' + '\n';

        for (let i = 0; i < result.rows.length; i++) {

          selectRegion += '<option value="' + result.rows[i].id_region + '">' + result.rows[i].title + '</option>' + '\n';

        }
      }

      Helper.getAllDistricts(function (err, result) {
        if (err) return next(err);

        if(result.rowCount > 0){
          resultDistricts = result;
          noend();
        } else {
          noend();
        }
      })

    })
  }

  function tableProject() {

    Helper.getAllProject(function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){
        resultProject = result;
        noend();
      } else {
        noend();
      }
    })
  }

  function tableToilet() {

    Helper.getAllToilet(function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){
        resultToilet= result;
        noend();
      } else {
        noend();
      }
    })
  }

  function tableMaterial() {

    Helper.getAllMaterial(function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){
        resultMaterial= result;
        noend();
      } else {
        noend();
      }
    })
  }

  function tableCategoryLand() {

    Helper.getAllCategoryLand(function (err, result) {
      if (err) return next(err);

      if(result.rowCount > 0){
        resultCategoryLand = result;
        noend();
      } else {
        noend();
      }
    })
  }

  function edit() {

    co(function*() {

      if(urlParsed.query.editDistricts){

        let objDistricts = new Helper({ id_districts: urlParsed.query.editDistricts });

        let resultDistricts = yield new Promise(function (resolve, reject) {

          objDistricts.getOneDistricts(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultDistricts.rowCount > 0){
          formValueDistricts = resultDistricts.rows[0];
        }


        let result = yield new Promise(function (resolve, reject) {

          Helper.getRegion(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(result.rowCount > 0){

          selectRegion = '';

          selectRegion += '<option value="">-не выбрано-</option>' + '\n';

          for (let i = 0; i < result.rows.length; i++) {

            if(formValueDistricts.region_id == result.rows[i].id_region){
              selectRegion += '<option selected value="' + result.rows[i].id_region + '">' + result.rows[i].title + '</option>' + '\n';
            } else {
              selectRegion += '<option value="' + result.rows[i].id_region + '">' + result.rows[i].title + '</option>' + '\n';
            }
          }
        }


        action.editDistricts = true;
        action.dropDistricts = false;
        action.createDistricts = false;

      }

      if(urlParsed.query.editProject){

        let objProject = new Helper({ id_project: urlParsed.query.editProject });

        let resultProject = yield new Promise(function (resolve, reject) {

          objProject.getOneProject(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultProject.rowCount > 0){
          formValueProject = resultProject.rows[0];
        }

        action.editProject = true;
        action.dropProject = false;
        action.createProject = false;

      }

      if(urlParsed.query.editToilet){

        let objToilet = new Helper({ id_toilet: urlParsed.query.editToilet});

        let resultToilet = yield new Promise(function (resolve, reject) {

          objToilet.getOneToilet(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultToilet.rowCount > 0){
          formValueToilet = resultToilet.rows[0];
        }

        action.editToilet = true;
        action.dropToilet = false;
        action.createToilet = false;

      }

      if(urlParsed.query.editMaterial){

        let objMaterial = new Helper({ id_material: urlParsed.query.editMaterial});

        let resultMaterial = yield new Promise(function (resolve, reject) {

          objMaterial.getOneMaterial(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultMaterial.rowCount > 0){
          formValueMaterial = resultMaterial.rows[0];
        }

        action.editMaterial = true;
        action.dropMaterial = false;
        action.createMaterial = false;

      }

      if(urlParsed.query.editCategoryLand){

        let objCategoryLand = new Helper({ id_category_land: urlParsed.query.editCategoryLand});

        let resultCategoryLand = yield new Promise(function (resolve, reject) {

          objCategoryLand.getOneCategoryLand(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultCategoryLand.rowCount > 0){
          formValueCategoryLand = resultCategoryLand.rows[0];
        }

        action.editCategoryLand = true;
        action.dropCategoryLand = false;
        action.createCategoryLand = false;

      }

      noend();
    })
  }

  function drop() {

    co(function*() {

      if(urlParsed.query.dropDistricts){

        let objDistricts = new Helper({ id_districts: urlParsed.query.dropDistricts });

        let resultDistricts = yield new Promise(function (resolve, reject) {

          objDistricts.getOneDistricts(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultDistricts.rowCount > 0){
          formValueDistricts = resultDistricts.rows[0];
        }


        let result = yield new Promise(function (resolve, reject) {

          Helper.getRegion(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(result.rowCount > 0){

          selectRegion = '';

          selectRegion += '<option value="">-не выбрано-</option>' + '\n';

          for (let i = 0; i < result.rows.length; i++) {

            if(formValueDistricts.region_id == result.rows[i].id_region){
              selectRegion += '<option selected value="' + result.rows[i].id_region + '">' + result.rows[i].title + '</option>' + '\n';
            } else {
              selectRegion += '<option value="' + result.rows[i].id_region + '">' + result.rows[i].title + '</option>' + '\n';
            }
          }
        }


        action.dropDistricts = true;
        action.createDistricts = false;
        action.editDistricts = false;

      }

      if(urlParsed.query.dropProject){

        let objProject = new Helper({ id_project: urlParsed.query.dropProject });

        let resultProject = yield new Promise(function (resolve, reject) {

          objProject.getOneProject(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultProject.rowCount > 0){
          formValueProject = resultProject.rows[0];
        }

        action.dropProject = true;
        action.createProject = false;
        action.editProject = false;

      }

      if(urlParsed.query.dropToilet){

        let objToilet = new Helper({ id_toilet: urlParsed.query.dropToilet});

        let resultToilet = yield new Promise(function (resolve, reject) {

          objToilet.getOneToilet(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultToilet.rowCount > 0){
          formValueToilet = resultToilet.rows[0];
        }

        action.dropToilet = true;
        action.createToilet = false;
        action.editToilet = false;

      }

      if(urlParsed.query.dropMaterial){

        let objMaterial = new Helper({ id_material: urlParsed.query.dropMaterial});

        let resultMaterial = yield new Promise(function (resolve, reject) {

          objMaterial.getOneMaterial(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultMaterial.rowCount > 0){
          formValueMaterial = resultMaterial.rows[0];
        }

        action.dropMaterial = true;
        action.createMaterial = false;
        action.editMaterial = false;

      }

      if(urlParsed.query.dropCategoryLand){

        let objCategoryLand = new Helper({ id_category_land: urlParsed.query.dropCategoryLand});

        let resultCategoryLand = yield new Promise(function (resolve, reject) {

          objCategoryLand.getOneCategoryLand(function (err, result) {
            if (err) return next(err);

            resolve(result);

          });
        });

        if(resultCategoryLand.rowCount > 0){
          formValueCategoryLand = resultCategoryLand.rows[0];
        }

        action.dropCategoryLand = true;
        action.createCategoryLand = false;
        action.editCategoryLand = false;

      }

      noend();

    })
  }

  function listRender() {

    if (action.editDistricts|| action.dropDistricts) {
      action.createDistricts= false;
    } else {
      action.createDistricts = true;
    }

    if (action.editProject || action.dropProject) {
      action.createProject = false;
    } else {
      action.createProject = true;
    }

    if (action.editToilet || action.dropToilet) {
      action.createToilet = false;
    } else {
      action.createToilet = true;
    }

    if (action.editMaterial || action.dropMaterial) {
      action.createMaterial = false;
    } else {
      action.createMaterial = true;
    }

    if (action.editCategoryLand || action.dropCategoryLand) {
      action.createCategoryLand = false;
    } else {
      action.createCategoryLand = true;
    }


    res.render('administrator/helper/body', {
      layout: 'administrator',
      title: "Администратор. Создание выпадающих списков: Муниципальные районы. Тип дома. Санузел.",
      sidebar: sidebar,
      tabDistricts: table.tableListDistricts(resultDistricts),
      formValueDistricts: formValueDistricts,
      selectRegion: selectRegion,
      tabProject: table.tableListProject(resultProject),
      formValueProject: formValueProject,
      tabToilet: table.tableListToilet(resultToilet),
      formValueToilet: formValueToilet,
      tabMaterial: table.tableListMaterial(resultMaterial),
      formValueMaterial: formValueMaterial,
      tabCategoryLand: table.tableCategoryLand(resultCategoryLand),
      formValueCategoryLand: formValueCategoryLand,
      administrator: administrator,
      action: action
    });
  }


  let tasks = [ accessAdministrator, accessValue, userMenu, tableDistricts, tableProject, tableToilet, tableMaterial, tableCategoryLand, edit, drop, listRender ];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }
  noend();

};

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

exports.submit = function (req, res, next) {
  res.locals.urlPage = req.url;
  let urlParsed = url.parse(req.url, true);
  let value = req.body.administrator;
  let pathname = urlParsed.pathname;

  function accessAdministrator() {
    if (conf.get('administrator') !== req.session.uid) {
      res.redirect('/');
    } else {
      noend();
    }
  }

  function validate() {

    for(let key in value) {
      if (value[key] === ' ') {
        value[key] = '';
      }
    }
    noend();
  }

  function create() {

    co(function*() {

      if(value.createProject) {

        if(value.projectTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errProjectTitle: true,
            projectTitle: value.projectTitle,
            projectPriority: value.projectPriority
          };
          res.redirect(303, 'back');

        } else if(value.projectTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов"
          };
          req.session.repeatData = {
            errProjectTitle: true,
            projectTitle: value.projectTitle,
            projectPriority: value.projectPriority
          };
          res.redirect(303, 'back');

        } else if(value.projectPriority.length > 10) {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errProjectPriority: true,
            projectTitle: value.projectTitle,
            projectPriority: value.projectPriority
          };
          res.redirect(303, 'back');

        } else {

          let objProject = new Helper({title: value.projectTitle, priority: value.projectPriority});

          let resultProject = yield new Promise(function (resolve, reject) {

            objProject.saveProject(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultProject.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название сохранён.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не сохранён."
            };
            res.redirect(303, 'back');
          }
        }

      } else if(value.createToilet){

        if(value.toiletTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errToiletTitle: true,
            toiletTitle: value.toiletTitle,
            toiletPriority: value.toiletPriority
          };
          res.redirect(303, 'back');

        } else if(value.toiletTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов."
          };
          req.session.repeatData = {
            errToiletTitle: true,
            toiletTitle: value.toiletTitle,
            toiletPriority: value.toiletPriority
          };
          res.redirect(303, 'back');

        } else if(value.toiletPriority.length > 10){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errToiletPriority: true,
            toiletTitle: value.toiletTitle,
            toiletPriority: value.toiletPriority
          };
          res.redirect(303, 'back');

        } else {

          let objToilet = new Helper({title: value.toiletTitle, priority: value.toiletPriority});

          let resultToilet = yield new Promise(function (resolve, reject) {

            objToilet.saveToilet(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultToilet.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название сохранено.'
            };
            res.redirect(303, pathname);

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не сохранено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if(value.createDistricts){

        if(value.districtsTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errDistrictsTitle: true,
            districtsTitle: value.districtsTitle,
            districtsRegion: value.districtsRegion
          };
          res.redirect(303, 'back');

        } else if(value.districtsTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов"
          };
          req.session.repeatData = {
            errDistrictsTitle: true,
            districtsTitle: value.districtsTitle,
            districtsRegion: value.districtsRegion
          };
          res.redirect(303, 'back');

        } else if(value.districtsRegion=== ''){
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Поля отмеченные звёздочкой, обязательны для заполнения."
            };
            req.session.repeatData = {
              errDistrictsRegion: true,
              districtsTitle: value.districtsTitle,
              districtsRegion: value.districtsRegion
            };
            res.redirect(303, 'back');

        } else if(value.districtsRegion.length > 10) {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errDistrictsRegion: true,
            districtsTitle: value.districtsTitle,
            districtsRegion: value.districtsRegion
          };
          res.redirect(303, 'back');

        } else {

          let objDistricts = new Helper({title: value.districtsTitle, region: value.districtsRegion});

          let resultDistricts = yield new Promise(function (resolve, reject) {

            objDistricts.saveDistricts(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultDistricts.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название сохранён.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не сохранён."
            };
            res.redirect(303, 'back');
          }
        }

      } else if(value.createMaterial){

        if(value.materialTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errMaterialTitle: true,
            materialTitle: value.materialTitle,
            materialPriority: value.materialPriority
          };
          res.redirect(303, 'back');

        } else if(value.materialTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов."
          };
          req.session.repeatData = {
            errMaterialTitle: true,
            materialTitle: value.materialTitle,
            materialPriority: value.materialPriority
          };
          res.redirect(303, 'back');

        } else if(value.materialPriority.length > 10){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errMaterialPriority: true,
            materialTitle: value.materialTitle,
            materialPriority: value.materialPriority
          };
          res.redirect(303, 'back');

        } else {

          let objMaterial = new Helper({title: value.materialTitle, priority: value.materialPriority});

          let resultMaterial = yield new Promise(function (resolve, reject) {

            objMaterial.saveMaterial(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultMaterial.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название сохранено.'
            };
            res.redirect(303, pathname);

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не сохранено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if(value.createCategoryLand){

        if(value.categoryLandTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errCategoryLandTitle: true,
            categoryLandTitle: value.categoryLandTitle,
            categoryLandPriority: value.categoryLandPriority
          };
          res.redirect(303, 'back');

        } else if(value.categoryLandTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов."
          };
          req.session.repeatData = {
            errCategoryLandTitle: true,
            categoryLandTitle: value.categoryLandTitle,
            categoryLandPriority: value.categoryLandPriority
          };
          res.redirect(303, 'back');

        } else if(value.categoryLandPriority.length > 10){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errCategoryLandPriority: true,
            categoryLandTitle: value.categoryLandTitle,
            categoryLandPriority: value.categoryLandPriority
          };
          res.redirect(303, 'back');

        } else {

          let objCategoryLand = new Helper({title: value.categoryLandTitle, priority: value.categoryLandPriority});

          let resultCategoryLand = yield new Promise(function (resolve, reject) {

            objCategoryLand.saveCategoryLand(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultCategoryLand.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название сохранено.'
            };
            res.redirect(303, pathname);

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не сохранено."
            };
            res.redirect(303, 'back');
          }
        }
      } else {
        noend();
      }

    });
  }

  function edit() {

    co(function*() {

      if(value.editProject) {

        if(value.projectTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errProjectTitle: true,
            projectTitle: value.projectTitle,
            projectPriority: value.projectPriority
          };
          res.redirect(303, 'back');

        } else if(value.projectTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов"
          };
          req.session.repeatData = {
            errProjectTitle: true,
            projectTitle: value.projectTitle,
            projectPriority: value.projectPriority
          };
          res.redirect(303, 'back');

        } else if(value.projectPriority.length > 10) {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errProjectPriority: true,
            projectTitle: value.projectTitle,
            projectPriority: value.projectPriority
          };
          res.redirect(303, 'back');

        } else {

          let objProject = new Helper({id_project: urlParsed.query.editProject, title: value.projectTitle, priority: value.projectPriority});

          let resultProject = yield new Promise(function (resolve, reject) {

            objProject.editProject(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultProject.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название исправлено.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не исправлено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if(value.editToilet) {

        if(value.toiletTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errToiletTitle: true,
            toiletTitle: value.toiletTitle,
            toiletPriority: value.toiletPriority
          };
          res.redirect(303, 'back');

        } else if(value.toiletTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов."
          };
          req.session.repeatData = {
            errToiletTitle: true,
            toiletTitle: value.toiletTitle,
            toiletPriority: value.toiletPriority
          };
          res.redirect(303, 'back');

        } else if(value.toiletPriority.length > 10){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errToiletPriority: true,
            toiletTitle: value.toiletTitle,
            toiletPriority: value.toiletPriority
          };
          res.redirect(303, 'back');

        } else {

          let objToilet = new Helper({ id_toilet: urlParsed.query.editToilet, title: value.toiletTitle, priority: value.toiletPriority });

          let resultToilet = yield new Promise(function (resolve, reject) {

            objToilet.editToilet(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultToilet.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название исправлено.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не исправлено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if(value.editMaterial) {

        if(value.materialTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errMaterialTitle: true,
            materialTitle: value.materialTitle,
            materialPriority: value.materialPriority
          };
          res.redirect(303, 'back');

        } else if(value.materialTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов."
          };
          req.session.repeatData = {
            errMaterialTitle: true,
            materialTitle: value.materialTitle,
            materialPriority: value.materialPriority
          };
          res.redirect(303, 'back');

        } else if(value.materialPriority.length > 10){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errMaterialPriority: true,
            materialTitle: value.materialTitle,
            materialPriority: value.materialPriority
          };
          res.redirect(303, 'back');

        } else {

          let objMaterial = new Helper({ id_material: urlParsed.query.editMaterial, title: value.materialTitle, priority: value.materialPriority });

          let resultMaterial = yield new Promise(function (resolve, reject) {

            objMaterial.editMaterial(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultMaterial.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название исправлено.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не исправлено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if(value.editCategoryLand) {

        if(value.categoryLandTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errCategoryLandTitle: true,
            categoryLandTitle: value.categoryLandTitle,
            categoryLandPriority: value.categoryLandPriority
          };
          res.redirect(303, 'back');

        } else if(value.categoryLandTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов."
          };
          req.session.repeatData = {
            errCategoryLandTitle: true,
            categoryLandTitle: value.categoryLandTitle,
            categoryLandPriority: value.categoryLandPriority
          };
          res.redirect(303, 'back');

        } else if(value.categoryLandPriority.length > 10){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errCategoryLandPriority: true,
            categoryLandTitle: value.categoryLandTitle,
            categoryLandPriority: value.categoryLandPriority
          };
          res.redirect(303, 'back');

        } else {

          let objCategoryLand = new Helper({ id_category_land: urlParsed.query.editCategoryLand, title: value.categoryLandTitle, priority: value.categoryLandPriority });

          let resultCategoryLand = yield new Promise(function (resolve, reject) {

            objCategoryLand.editCategoryLand(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultCategoryLand.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название исправлено.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не исправлено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if(value.editDistricts) {

        if(value.districtsTitle === ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errDistrictsTitle: true,
            districtsTitle: value.districtsTitle,
            districtsRegion: value.districtsRegion
          };
          res.redirect(303, 'back');

        } else if(value.districtsTitle.length > 60){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 60 символов"
          };
          req.session.repeatData = {
            errDistrictsTitle: true,
            districtsTitle: value.districtsTitle,
            districtsRegion: value.districtsRegion
          };
          res.redirect(303, 'back');

        } else if(value.districtsRegion=== ''){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Поля отмеченные звёздочкой, обязательны для заполнения."
          };
          req.session.repeatData = {
            errDistrictsRegion: true,
            districtsTitle: value.districtsTitle,
            districtsRegion: value.districtsRegion
          };
          res.redirect(303, 'back');

        } else if(value.districtsRegion.length > 10) {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Нужно указать не более 10 символов."
          };
          req.session.repeatData = {
            errDistrictsRegion: true,
            districtsTitle: value.districtsTitle,
            districtsRegion: value.districtsRegion
          };
          res.redirect(303, 'back');

        } else {

          let objDistricts = new Helper({ id_districts: urlParsed.query.editDistricts, districts: value.districtsTitle, region_id: value.districtsRegion });

          let resultDistricts = yield new Promise(function (resolve, reject) {

            objDistricts.editDistricts(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });
          });

          if(resultDistricts.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название исправлено.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка записи!',
              message: "Название не исправлено."
            };
            res.redirect(303, 'back');
          }
        }

      } else {
        noend();
      }
    })
  }

  function drop() {
    
    co(function*() {

      if(value.dropDistricts) {

        yield new Promise(function (resolve, reject) {

          Helper.connectedCity(urlParsed.query.dropDistricts, function (err, result) {
            if (err) return next(err);
            resolve(result);

          });
        });

        let result = yield new Promise(function (resolve, reject) {

          Helper.deleteDistricts(urlParsed.query.dropDistricts, function (err, result) {
            if (err) return next(err);
            resolve(result);

          });
        });

        if(result.rowCount > 0){

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Название удалено.'
          };
          res.redirect(303, pathname);

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка удаления!',
            message: "Название не удалено."
          };
          res.redirect(303, 'back');
        }

      } else if(value.dropProject) {

        let objProject = new Helper({ id_project: urlParsed.query.dropProject });

        let presenceProject = yield new Promise(function (resolve, reject) {

          objProject.getProjectApartment(function (err, result) {
            if (err) return next(err);

            resolve(result);
          })
        });
        
        if(presenceProject.rowCount > 0){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка удаления!',
            message: "В таблице apartment нужно удалить связанные поля project."
          };
          res.redirect(303, 'back');

        } else {

          let resultProject = yield new Promise(function (resolve, reject) {

            objProject.dropProject(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });

          });

          if(resultProject.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название удалено.'
            };
            res.redirect(303, pathname);

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка удаления!',
              message: "Название не удалено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if (value.dropToilet) {

        let objToilet = new Helper({ id_toilet: urlParsed.query.dropToilet});

        let presenceToilet = yield new Promise(function (resolve, reject) {

          objToilet.getToiletApartment(function (err, result) {
            if (err) return next(err);

            resolve(result);
          })
        });

        if(presenceToilet.rowCount > 0){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка удаления!',
            message: "В таблице apartment нужно удалить связанные поля toilet."
          };
          res.redirect(303, 'back');

        } else {

          let resultToilet = yield new Promise(function (resolve, reject) {

            objToilet.dropToilet(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });

          });

          if(resultToilet.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название удалено.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка удаления!',
              message: "Название не удалено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if (value.dropMaterial) {

        let objMaterial = new Helper({ id_material: urlParsed.query.dropMaterial});

        let presenceMaterial = yield new Promise(function (resolve, reject) {

          objMaterial.getMaterialCottages(function (err, result) {
            if (err) return next(err);

            resolve(result);
          })
        });

        if(presenceMaterial.rowCount > 0){
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка удаления!',
            message: "В таблице apartment нужно удалить связанные поля material."
          };
          res.redirect(303, 'back');

        } else {

          let resultMaterial = yield new Promise(function (resolve, reject) {

            objMaterial.dropMaterial(function (err, result) {
              if (err) return next(err);

              resolve(result);

            });

          });

          if(resultMaterial.rowCount > 0){

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Название удалено.'
            };
            res.redirect(303, 'back');

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка удаления!',
              message: "Название не удалено."
            };
            res.redirect(303, 'back');
          }
        }

      } else if (value.dropCategoryLand) {

        let resultCategoryLand = yield new Promise(function (resolve, reject) {

          Helper.dropCategoryLand(urlParsed.query.dropCategoryLand, function (err, result) {
            if (err) return next(err);

            resolve(result);

          });

        });

        if(resultCategoryLand.rowCount > 0){

          req.session.flash = {
            type: 'success',
            intro: 'Успех!',
            message: 'Название удалено.'
          };
          res.redirect(303, pathname);

        } else {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка удаления!',
            message: "Название не удалено."
          };
          res.redirect(303, 'back');
        }


      } else {
        next();
      }

    })
  }


  let tasks = [ accessAdministrator, validate, create, edit, drop ];

  function noend(result) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(result);
  }
  noend();
};
