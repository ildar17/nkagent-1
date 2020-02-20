let Collection = require('./model/index');
let Core = require('../../../lib/core');
let url = require('url');
let menu = require('../../../lib/menu');
let crypto = require('crypto');
let conf = require('../../../config');


exports.list = function (req, res, next) {

  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;

  if (urlParsed.query.pick) {//////////////////////////////////////////////////////////////////

    function initPick() {

      let permit = new Core({pathname: pathname});

      permit.getSection().then((permitObj) => {

        let node = {};
        let user = {};
        node.urlParsed = urlParsed;
        node.pathname = pathname;
        node.nameTemplate = permitObj.nameTemplate;
        node.temp = permitObj.temp;
        node.rowCount = permitObj.rowCount;
        user.uid = req.session.uid;

        if (!req.session.uid) {
          res.redirect(303, '/admin/login');
        } else {
          initialization(node, user);
        }

      }).catch(err => {
        if (err) return next(err);
      });

      function initialization(node, user) {

        if (node.rowCount === 0 && req.admin !== user.uid) {
          res.redirect(303, '/');
        } else if (node.rowCount === 0 && req.admin === user.uid) {
          permit.setTemp()
            .then(result => {

              if (result.rowCount > 0) {

                access(node, user);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: 'Не сохранилась запись в таблице permit.'
                };
                res.redirect(303, '/admin/template/admin');
              }
            })
            .catch(err => {
              if (err) return next(err);
            });

        } else {
          access(node, user);
        }

      }

      function access(node, user) {

        permit.getDataUser(user.uid)

          .then(result => {

            if (result.rowCount > 0) {

              user.administrator = true;
              user.id_user = Number(result.rows[0].id_user);
              user.id_agency = Number(result.rows[0].agency);
              user.id_moderator_agency = Number(result.rows[0].moderator);
              user.id_role = Number(result.rows[0].role_id);

              if (req.admin !== req.session.uid) {

                if (result.rows[0].role_id == null) {
                  user.administrator = false;
                  user.users = 1;
                } else {
                  user.administrator = false;
                  user.users = 0;
                }
              }

              permit.codeAndForm(user)
                .then(code => {

                  user.permission = code[0];
                  node.permitForm = code[1];
                  userMenu(node, user);
                })
                .catch(err => {
                  if (err) return next(err);
                });

            } else {
              res.redirect(303, '/admin/logout');
            }
          })
          .catch(err => {
            if (err) return next(err);
          });
      }

      function userMenu(node, user) {

        menu.adminMenu(user.permission, user.users, req.session.uid, node.urlParsed, function (err, result) {
          if (err) return next(err);
          node.sidebar = result;
          accessTemplate(node, user);
        });
      }

      function accessTemplate(node, user) {

        node.yesPage = true;

        if (user.permission === '00000') {

          res.locals.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: 'У Вас нет прав доступа к шаблону "collection".'
          };

          node.yesPage = false;

          res.render('template/collection/body',
            {
              layout: 'admin',
              sidebar: node.sidebar,
              yesPage: node.yesPage,
              administrator: node.administrator
            }
          );

        } else {
          noendPick(node, user);
        }
      }
    }

    function deleteCart(node, user) {

      if (node.urlParsed.query.deleteCart) {

        let collection = new Collection({node_id: node.urlParsed.query.deleteCart, collection_id: node.urlParsed.query.pick, user_id: user.id_user});

        collection.dropCart()
          .then(result => {
            if (result.rowCount) {
              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Объект удалён в коллекции.'
              };
              delete node.urlParsed.query.deleteCart;
              let i = 0;
              let str = '';
              for (let key in node.urlParsed.query) {
                i++;
                if (i === 1) {
                  str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                } else {
                  str += '&' + key + '=' + node.urlParsed.query[key];
                }
              }
              res.redirect(303, str);

            } else {

              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка сервера!',
                message: "Не удалось удалить объект в коллекции."
              };

              delete node.urlParsed.query.deleteCart;
              let i = 0;
              let str = '';
              for (let key in node.urlParsed.query) {
                i++;
                if (i === 1) {
                  str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                } else {
                  str += '&' + key + '=' + node.urlParsed.query[key];
                }
              }
              res.redirect(303, str);
            }
          })
          .catch(err => {
            return next(err);
          })

      } else {
        noendPick(node, user);
      }
    }

    function listBtn(node, user) {

      //console.log(1);

      if (node.urlParsed.query.type) node.pageType = Number(node.urlParsed.query.type);
      if (node.urlParsed.query.section1) node.pageSection = Number(node.urlParsed.query.section1);
      if (node.urlParsed.query.street) node.pageStreet = Number(node.urlParsed.query.street);
      if (node.urlParsed.query.min) node.pageMin = Number(node.urlParsed.query.min);
      if (node.urlParsed.query.max) node.pageMax = Number(node.urlParsed.query.max);
      if (node.urlParsed.query.sorting) node.sorting = Number(node.urlParsed.query.sorting);

      let collection = new Collection({id_collection: node.urlParsed.query.pick, user_id: user.id_user});
      collection.getOneCollection()
        .then(result => {

          if (result.rowCount > 0) {

            node.note_my = result.rows[0].note_my;
            node.note_client = result.rows[0].note_client;
            node.no_price = result.rows[0].no_price;
            node.no_agency = result.rows[0].no_agency;

            if (result.rows[0].temp) {
              node.tempBtn = result.rows[0].temp;
              node.tempSorting = result.rows[0].temp;
            } else {
              node.tempSorting = false;
              node.tempBtn = false;
            }

            if (result.rows[0].districts) {
              node.districtsBtn = result.rows[0].name_districts;
              node.districtsSorting = result.rows[0].districts;
            } else {
              node.districtsBtn = false;
              node.districtsSorting = false;
            }

            if (result.rows[0].city) {
              node.cityBtn = result.rows[0].name_city;
              node.citySorting = result.rows[0].city;
            } else {
              node.cityBtn = false;
              node.citySorting = false;
            }

            noendPick(node, user);

          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Не удалось получить данные."
            };

            res.redirect(303, node.pathname);
          }
        })
        .catch(err => {
          return next(err);
        });
    }

    function listCollection(node, user) {
      let collection = new Collection({pick: urlParsed.query.pick});
      collection.getCollection()
        .then(result => {
          if (result.rowCount > 0) {
            node.collection = [];
            for (let i = 0; i < result.rows.length; i++) {
              node.collection.push(result.rows[i].node_id);
            }
            noendPick(node, user);
          } else {
            noendPick(node, user);
          }
        })
        .catch(err => {
          return next(err);
        });
    }

    function addCart(node, user) {

      if (node.urlParsed.query.add) {

        if (node.collection) {

          if (node.collection.indexOf(node.urlParsed.query.add) < 0) {

            let collection = new Collection({collection_id: node.urlParsed.query.pick, cart: node.urlParsed.query.add, user_id: user.id_user});
            collection.setCart()
              .then(result => {
                if (result.rowCount) {
                  req.session.flash = {
                    type: 'success',
                    intro: 'Успех!',
                    message: 'Объект добавлен в коллекцию.'
                  };
                  delete node.urlParsed.query.add;
                  let i = 0;
                  let str = '';
                  for (let key in node.urlParsed.query) {
                    i++;
                    if (i === 1) {
                      str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                    } else {
                      str += '&' + key + '=' + node.urlParsed.query[key];
                    }
                  }
                  res.redirect(303, str);

                } else {

                  req.session.flash = {
                    type: 'danger',
                    intro: 'Ошибка сервера!',
                    message: "Не удалось добавить объект в коллекцию."
                  };

                  delete node.urlParsed.query.add;
                  let i = 0;
                  let str = '';
                  for (let key in node.urlParsed.query) {
                    i++;
                    if (i === 1) {
                      str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                    } else {
                      str += '&' + key + '=' + node.urlParsed.query[key];
                    }
                  }
                  res.redirect(303, str);
                }
              })
              .catch(err => {
                return next(err);
              })

          } else {
            req.session.flash = {
              type: 'warning',
              intro: 'Ошибка проверки!',
              message: "Объект уже существует в коллекции."
            };

            delete node.urlParsed.query.add;
            let i = 0;
            let str = '';
            for (let key in node.urlParsed.query) {
              i++;
              if (i === 1) {
                str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
              } else {
                str += '&' + key + '=' + node.urlParsed.query[key];
              }
            }

            res.redirect(303, str);
          }

        } else {

          let collection = new Collection({collection_id: node.urlParsed.query.pick, cart: node.urlParsed.query.add, user_id: user.id_user});
          collection.setCart()
            .then(result => {
              if (result.rowCount) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'Объект добавлен в коллекцию.'
                };
                delete node.urlParsed.query.add;
                let i = 0;
                let str = '';
                for (let key in node.urlParsed.query) {
                  i++;
                  if (i === 1) {
                    str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                  } else {
                    str += '&' + key + '=' + node.urlParsed.query[key];
                  }
                }
                res.redirect(303, str);

              } else {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка сервера!',
                  message: "Не удалось добавить объект в коллекцию."
                };

                delete node.urlParsed.query.add;
                let i = 0;
                let str = '';
                for (let key in node.urlParsed.query) {
                  i++;
                  if (i === 1) {
                    str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                  } else {
                    str += '&' + key + '=' + node.urlParsed.query[key];
                  }
                }
                res.redirect(303, str);
              }
            })
            .catch(err => {
              return next(err);
            })
        }

      } else {
        noendPick(node, user);
      }

    }

    function runCart(node, user) {

      if (node.urlParsed.query.run) {

        if (node.collection) {

          let idIn = '';

          for (let i = 0; i < node.collection.length; i++) {
            idIn += node.collection[i] + ','
          }

          idIn = idIn.slice(0, -1);
          let where = 'WHERE id IN(' + idIn + ')';

          let collection = new Collection({where: where});
          collection.getRun()
            .then(result => {
              if (result.rowCount > 0) {

                node.table = collection.getTableRun(result, node.urlParsed);
                noendPick(node, user);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка сервера!',
                  message: "Не удалось получить данные."
                };

                res.redirect(303, 'back');
              }
            })
            .catch(err => {
              return next(err);
            })

        } else {
          noendPick(node, user);
        }

      } else {
        noendPick(node, user);
      }

    }

    function editDivide(node, user) {

      //console.log(2);

      if (node.urlParsed.query.divide) {

        let collection = new Collection({
          temp: node.urlParsed.query.divide,
          id_collection: node.urlParsed.query.pick,
          user_id: user.id_user,
          districtsSorting: node.districtsSorting,
          citySorting: node.citySorting
        });

        collection.editTemp()
          .then(result => {
            if (result.rowCount > 0) {
              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Секция установлена.'
              };
              delete node.urlParsed.query.divide;
              let i = 0;
              let str = '';
              for (let key in node.urlParsed.query) {
                i++;
                if (i === 1) {
                  str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                } else {
                  str += '&' + key + '=' + node.urlParsed.query[key];
                }
              }
              res.redirect(303, str);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка сервера!',
                message: "Секция не установлена."
              };

              delete node.urlParsed.query.divide;
              let i = 0;
              let str = '';
              for (let key in node.urlParsed.query) {
                i++;
                if (i === 1) {
                  str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                } else {
                  str += '&' + key + '=' + node.urlParsed.query[key];
                }
              }
              res.redirect(303, str);
            }
          })
          .catch(err => {
            return next(err)
          });

      } else {
        noendPick(node, user);
      }
    }

    function editDistricts(node, user) {

      //console.log(3);

      if (node.urlParsed.query.editDistricts) {

        let collection = new Collection({
          districts_id: node.urlParsed.query.editDistricts,
          id_city: node.citySorting,
          id_collection: node.urlParsed.query.pick,
          user_id: user.id_user
        });

        collection.setDistricts()
          .then(result => {
            if (result.rowCount > 0) {
              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Район установлен.'
              };
              delete node.urlParsed.query.editDistricts;
              let i = 0;
              let str = '';
              for (let key in node.urlParsed.query) {
                i++;
                if (i === 1) {
                  str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                } else {
                  str += '&' + key + '=' + node.urlParsed.query[key];
                }
              }
              res.redirect(303, str);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка сервера!',
                message: "Район не установлен."
              };

              delete node.urlParsed.query.editDistricts;
              let i = 0;
              let str = '';
              for (let key in node.urlParsed.query) {
                i++;
                if (i === 1) {
                  str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                } else {
                  str += '&' + key + '=' + node.urlParsed.query[key];
                }
              }
              res.redirect(303, str);
            }
          })
          .catch(err => {
            return next(err)
          });

      } else {
        noendPick(node, user);
      }
    }

    function editCity(node, user) {

      //console.log(4);

      if (node.urlParsed.query.editCity) {

        let collection = new Collection({id_city: node.urlParsed.query.editCity, id_collection: node.urlParsed.query.pick, user_id: user.id_user});

        collection.setCity()
          .then(result => {
            if (result.rowCount > 0) {
              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Город установлен.'
              };
              delete node.urlParsed.query.editCity;
              let i = 0;
              let str = '';
              for (let key in node.urlParsed.query) {
                i++;
                if (i === 1) {
                  str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                } else {
                  str += '&' + key + '=' + node.urlParsed.query[key];
                }
              }
              res.redirect(303, str);
            } else {
              req.session.flash = {
                type: 'danger',
                intro: 'Ошибка сервера!',
                message: "Город не установлен."
              };

              delete node.urlParsed.query.editCity;
              let i = 0;
              let str = '';
              for (let key in node.urlParsed.query) {
                i++;
                if (i === 1) {
                  str += node.urlParsed.pathname + '?' + key + '=' + node.urlParsed.query[key];
                } else {
                  str += '&' + key + '=' + node.urlParsed.query[key];
                }
              }
              res.redirect(303, str);
            }
          })
          .catch(err => {
            return next(err)
          });

      } else {
        noendPick(node, user);
      }
    }

    function listDistricts(node, user) {

      //console.log(5);

      let collection = new Collection({tempSorting: node.tempSorting});
      collection.getDistricts()
        .then(result => {
          if (result.rowCount > 0) {

            node.districts = '';

            node.districts += '<ul class="listDistricts">\n';

            node.districts += '\t<li><a href="/admin/template/collection?pick=' + node.urlParsed.query.pick + '&editDistricts=null"><b>Все районы</b></a></li>\n';

            for (let i = 0; i < result.rows.length; i++) {
              node.districts += '\t<li><a href="/admin/template/collection?pick=' + node.urlParsed.query.pick + '&editDistricts=' + result.rows[i].id_districts + '">[' + result.rows[i].sum + ']<b>' + result.rows[i].districts + '</b>-' + result.rows[i].region + '</a></li>\n';
            }

            node.districts += '</ul>\n';

            noendPick(node, user);

          } else {

            node.districts += '\t<li>Нужно выбрать секцию.</li>\n';

            noendPick(node, user);
          }

        })
        .catch(err => {
          return next(err);
        });
    }

    function listCity(node, user) {

      //console.log(6);

      let collection = new Collection({tempSorting: node.tempSorting, districtsSorting: node.districtsSorting});
      collection.getCity()
        .then(result => {

          if (result.rowCount > 0) {

            node.city = '';

            node.city += '<ul class="listDistricts">\n';

            node.city += '\t<li><a href="/admin/template/collection?pick=' + node.urlParsed.query.pick + '&editCity=null"><b>Все города</b></a></li>\n';

            for (let i = 0; i < result.rows.length; i++) {
              node.city += '\t<li><a href="/admin/template/collection?pick=' + node.urlParsed.query.pick + '&editCity=' + result.rows[i].id_city + '">[' + result.rows[i].sum + ']<b>' + result.rows[i].city + '</b>' + '</a></li>\n';
            }

            node.city += '</ul>\n';

            noendPick(node, user);

          } else {

            node.city += '\t<li>Нужно выбрать район.</li>\n';

            noendPick(node, user);
          }

        })
        .catch(err => {
          return next(err);
        });
    }

    function sortingType(node, user) {

      let collection = new Collection({
        tempSorting: node.tempSorting,
        districtsSorting: node.districtsSorting,
        citySorting: node.citySorting,
        pageSection: node.pageSection,
        pageStreet: node.pageStreet,
        pageMin: node.pageMin,
        pageMax: node.pageMax
      });

      collection.getSortingType()
        .then(result => {
          if (result.rowCount > 0) {
            node.sortingType += '<option value="">-Тип объяв. не выбран-</option>' + '\n';

            node.sortingTypeAll = [];

            for (let i = 0; i < result.rows.length; i++) {

              node.sortingTypeAll.push(result.rows[i].id);

              if (node.pageType === Number(result.rows[i].id)) {
                node.sortingType += '<option selected value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
              } else {
                node.sortingType += '<option value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
              }
            }
            noendPick(node, user);
          } else {
            node.sortingType += '<option value="">-Тип объяв. не определён-</option>' + '\n';
            noendPick(node, user);
          }

        })
        .catch(err => {
          return next(err);
        });
    }

    function sortingSection(node, user) {

      let collection = new Collection({
        tempSorting: node.tempSorting,
        districtsSorting: node.districtsSorting,
        citySorting: node.citySorting,
        pageType: node.pageType,
        pageStreet: node.pageStreet,
        pageMin: node.pageMin,
        pageMax: node.pageMax
      });

      collection.getSortingSection()
        .then(result => {
          if (result.rowCount > 0) {
            node.sortingSection += '<option value="">-Раздел не выбран-</option>' + '\n';

            node.sortingSectionAll = [];

            for (let i = 0; i < result.rows.length; i++) {

              node.sortingSectionAll.push(result.rows[i].id);

              if (node.pageSection === Number(result.rows[i].id)) {
                node.sortingSection += '<option selected value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
              } else {
                node.sortingSection += '<option value="' + result.rows[i].id + '">' + result.rows[i].title + '</option>' + '\n';
              }

            }
            noendPick(node, user);
          } else {
            node.sortingSection += '<option value="">-Раздел не определён-</option>' + '\n';
            noendPick(node, user);
          }

        })
        .catch(err => {
          return next(err);
        });
    }

    function sortingStreet(node, user) {

      let collection = new Collection({
        tempSorting: node.tempSorting,
        districtsSorting: node.districtsSorting,
        citySorting: node.citySorting,
        pageType: node.pageType,
        pageSection: node.pageSection,
        pageMin: node.pageMin,
        pageMax: node.pageMax
      });

      collection.getSortingStreet()
        .then(result => {
          if (result.rowCount > 0) {

            node.sortingStreet += '<option value="">-Улица не выбрана-</option>' + '\n';

            node.sortingStreetAll = [];

            for (let i = 0; i < result.rows.length; i++) {

              node.sortingStreetAll.push(result.rows[i].id_street);

              if (node.pageStreet === Number(result.rows[i].id_street)) {
                node.sortingStreet += '<option selected  value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
              } else {
                node.sortingStreet += '<option value="' + result.rows[i].id_street + '">' + result.rows[i].street + '</option>' + '\n';
              }

            }
            noendPick(node, user);
          } else {
            node.sortingStreet += '<option value="">-Улица не определена-</option>' + '\n';
            noendPick(node, user);
          }

        })
        .catch(err => {
          return next(err);
        });
    }

    function sortingPrice(node, user) {

      let collection = new Collection({
        tempSorting: node.tempSorting,
        districtsSorting: node.districtsSorting,
        citySorting: node.citySorting,
        pageType: node.pageType,
        pageSection: node.pageSection,
        pageStreet: node.pageStreet
      });

      collection.getSortingPrice()
        .then(result => {
          if (result.rowCount > 0) {
            node.sortingMinPrice = result.rows[0].min;
            node.sortingMaxPrice = result.rows[0].max;
            noendPick(node, user);
          } else {
            noendPick(node, user);
          }
        })
        .catch(err => {
          return next(err);
        });
    }

    function listTablePick(node, user) {

      if (node.sorting === 1 && node.sortingTypeAll) {

        let collection = new Collection({
          tempSorting: node.tempSorting,
          districtsSorting: node.districtsSorting,
          citySorting: node.citySorting,
          pageType: node.pageType,
          sortingTypeAll: node.sortingTypeAll,
          pageSection: node.pageSection,
          sortingSectionAll: node.sortingSectionAll,
          pageStreet: node.pageStreet,
          sortingStreetAll: node.sortingStreetAll,
          pageMin: node.pageMin,
          pageMax: node.pageMax
        });

        collection.list()
          .then(result => {

            if (result.rowCount > 0) {

              if (node.sorting === 1) {

                node.table = collection.getTable(result, node.collection, node.urlParsed);
                noendPick(node, user);

              } else {
                node.table = '';
                noendPick(node, user);
              }
            } else {
              noendPick(node, user);
            }

          })
          .catch(err => {
            return next(err);
          });
      } else {
        noendPick(node, user);
      }
    }

    function listRenderPick(node, user) {

      //console.log(7);
      //console.log(node);

      let titlePage = node.nameTemplate;
      let btn = '';

      btn += '\t' + '<div class="modal fade section-modal-sm" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">' + '\n';
      btn += '\t\t' + '<div class="modal-dialog modal-sm">' + '\n';
      btn += '\t\t\t' + '<div style="padding: 25px; text-decoration: underline" class="modal-content">' + '\n';
      btn += '\t\t\t\t' + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' + '\n';
      btn += '\t\t\t\t' + '<h5><a href="/admin/template/collection?pick=' + node.urlParsed.query.pick + '&divide=apartment"><b>Комнаты, квартиры</b></a></h5>' + '\n';
      btn += '\t\t\t\t' + '<h5><a href="/admin/template/collection?pick=' + node.urlParsed.query.pick + '&divide=cottages"><b>Дома, коттеджи, дачи, участки</b></a></h5>' + '\n';
      btn += '\t\t\t\t' + '<h5><a href="/admin/template/collection?pick=' + node.urlParsed.query.pick + '&divide=commercial"><b>Коммерческая недвижимость</b></a></h5>' + '\n';
      btn += '\t\t\t' + '</div>' + '\n';
      btn += '\t\t' + '</div>' + '\n';
      btn += '\t' + '</div>' + '\n';

      if (node.tempBtn) {
        if (node.tempBtn === 'apartment') node.tempBtn = 'Комнаты Квартиры';
        if (node.tempBtn === 'cottages') node.tempBtn = 'Дома Дачи Земля';
        if (node.tempBtn === 'commercial') node.tempBtn = 'Комер. недвиж.';
        btn += '<a class="btn btn-primary selectCity" data-toggle="modal" data-target=".section-modal-sm">' + node.tempBtn + '</a>';
      } else {
        btn += '<a class="btn btn-default selectCity" data-toggle="modal" data-target=".section-modal-sm">Секция не выбрана</a>';
      }

      if (node.districtsBtn) {
        btn += '<a class="btn btn-primary selectCity" data-toggle="modal" data-target=".districts-modal">' + node.districtsBtn + '</a>';
      } else {
        btn += '<a class="btn btn-default selectCity" data-toggle="modal" data-target=".districts-modal">Район не выбран</a>';
      }

      if (node.cityBtn) {
        btn += '<a class="btn btn-primary selectCity" data-toggle="modal" data-target=".city-modal">' + node.cityBtn + '</a>';
      } else {
        btn += '<a class="btn btn-default selectCity" data-toggle="modal" data-target=".city-modal">Город не выбран</a>';
      }

      let count = 0;
      if (node.collection) {
        count = node.collection.length;
      }

      let textNoPrice = 'Показывать цену';
      if (node.no_price) {
        textNoPrice = 'Не показывать цену';
      }

      let textNoAgency = 'Показывать продавца';
      if (node.no_agency) {
        textNoAgency = 'Не показывать продавца';
      }


      res.render('template/collection/pick/body', {

        layout: 'admin',
        urlPage: req.url,
        titleHead: node.nameTemplate,
        title: titlePage,
        btn: btn,
        permission: user.permission,
        sidebar: node.sidebar,
        template: node.temp,
        administrator: user.administrator,
        yesPage: node.yesPage,
        districts: node.districts,
        city: node.city,
        pick: urlParsed.query.pick,
        sortingType: node.sortingType,
        sortingSection: node.sortingSection,
        sortingStreet: node.sortingStreet,
        sortingMinPrice: node.sortingMinPrice,
        sortingMaxPrice: node.sortingMaxPrice,
        back: node.pathname + '?pick=' + urlParsed.query.pick,
        minPrice: node.pageMin,
        maxPrice: node.pageMax,
        table: node.table,
        count: count,
        note_my: node.note_my,
        note_client: node.note_client,
        textNoPrice: textNoPrice,
        textNoAgency: textNoAgency

      });
    }

    let tasks = [initPick, deleteCart, listBtn, listCollection, addCart, runCart, editDivide, editDistricts, editCity, listDistricts, listCity, sortingType, sortingSection, sortingStreet, sortingPrice, listTablePick, listRenderPick];

    function noendPick(node, user) {
      let currentTask = tasks.shift();
      if (currentTask) currentTask(node, user);
    }

    noendPick();

  } else { /////////////////////////////////////////////////////////////////////////////////

    function init() {

      let permit = new Core({pathname: pathname});

      permit.getSection().then((permitObj) => {

        let node = {};
        let user = {};
        node.urlParsed = urlParsed;
        node.pathname = pathname;
        node.nameTemplate = permitObj.nameTemplate;
        node.temp = permitObj.temp;
        node.rowCount = permitObj.rowCount;
        user.uid = req.session.uid;

        if (!req.session.uid) {
          res.redirect(303, '/admin/login');
        } else {
          initialization(node, user);
        }

      }).catch(err => {
        if (err) return next(err);
      });

      function initialization(node, user) {

        if (node.rowCount === 0 && req.admin !== user.uid) {
          res.redirect(303, '/');
        } else if (node.rowCount === 0 && req.admin === user.uid) {
          permit.setTemp()
            .then(result => {

              if (result.rowCount > 0) {

                access(node, user);

              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка записи!',
                  message: 'Не сохранилась запись в таблице permit.'
                };
                res.redirect(303, '/admin/template/admin');
              }
            })
            .catch(err => {
              if (err) return next(err);
            });

        } else {
          access(node, user);
        }

      }

      function access(node, user) {

        permit.getDataUser(user.uid)

          .then(result => {

            if (result.rowCount > 0) {

              user.administrator = true;
              user.id_user = Number(result.rows[0].id_user);
              user.id_agency = Number(result.rows[0].agency);
              user.id_moderator_agency = Number(result.rows[0].moderator);
              user.id_role = Number(result.rows[0].role_id);

              if (req.admin !== req.session.uid) {

                if (result.rows[0].role_id == null) {
                  user.administrator = false;
                  user.users = 1;
                } else {
                  user.administrator = false;
                  user.users = 0;
                }
              }

              permit.codeAndForm(user)
                .then(code => {

                  user.permission = code[0];
                  node.permitForm = code[1];
                  userMenu(node, user);
                })
                .catch(err => {
                  if (err) return next(err);
                });

            } else {
              res.redirect(303, '/admin/logout');
            }
          })
          .catch(err => {
            if (err) return next(err);
          });
      }

      function userMenu(node, user) {

        menu.adminMenu(user.permission, user.users, req.session.uid, node.urlParsed, function (err, result) {
          if (err) return next(err);
          node.sidebar = result;
          accessTemplate(node, user);
        });
      }

      function accessTemplate(node, user) {

        node.yesPage = true;

        if (user.permission === '00000') {

          res.locals.flash = {
            type: 'danger',
            intro: 'Ошибка доступа!',
            message: 'У Вас нет прав доступа к шаблону "collection".'
          };

          node.yesPage = false;

          res.render('template/collection/body',
            {
              layout: 'admin',
              sidebar: node.sidebar,
              yesPage: node.yesPage,
              administrator: node.administrator
            }
          );

        } else {
          noend(node, user);
        }
      }
    }

    function listCreate(node, user) {
      let action = {};
      action.create = true;
      action.edit = false;
      action.drop = false;

      noend(node, user, action);
    }

    function listEdit(node, user, action) {

      if (node.urlParsed.query.edit) {
        action.create = false;
        action.edit = true;
        action.drop = false;
        node.formValue = '';

        let collection = new Collection({id_collection: node.urlParsed.query.edit, user_id: user.id_user});
        collection.getOneCollection()
          .then(result => {
            if (result.rowCount > 0) {
              node.formValue = result.rows[0];
              noend(node, user, action);
            } else {
              noend(node, user, action);
            }
          })
          .catch(err => {
            return next(err);
          });
      } else {
        noend(node, user, action);
      }
    }

    function listDrop(node, user, action) {

      if (node.urlParsed.query.drop) {
        action.create = false;
        action.edit = false;
        action.drop = true;
        node.formValue = '';

        let collection = new Collection({id_collection: node.urlParsed.query.drop, user_id: user.id_user});
        collection.getOneCollection()
          .then(result => {
            if (result.rowCount > 0) {
              node.formValue = result.rows[0];
              noend(node, user, action);
            } else {
              noend(node, user, action);
            }
          })
          .catch(err => {
            return next(err);
          });
      } else {
        noend(node, user, action);
      }
    }

    function listTable(node, user, action) {

      node.resultList = '';

      let collection = new Collection({id_user: user.id_user});

      collection.getTableCollection()
        .then(result => {
          node.resultList = result;
          noend(node, user, action)
        })
        .catch(err => {
          return next(err);
        });

    }

    function listRender(node, user, action) {

      res.render('template/collection/body', {
        layout: 'admin',
        urlPage: req.url,
        titleHead: node.nameTemplate,
        title: node.nameTemplate,
        formValue: node.formValue,
        permit: node.permitForm,
        action: action,
        permission: user.permission,
        sidebar: node.sidebar,
        table: node.resultList,
        template: node.temp,
        administrator: user.administrator,
        yesPage: node.yesPage,
        back: node.pathname
      });
    }

    let tasks = [init, listCreate, listEdit, listDrop, listTable, listRender];

    function noend(node, user, action) {
      let currentTask = tasks.shift();
      if (currentTask) currentTask(node, user, action);
    }

    noend();
  }/////////////////////////////////////////////////////////////////////////////////

};

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

exports.submit = function (req, res, next) {

  let urlParsed = url.parse(req.url, true);
  let pathname = urlParsed.pathname;

  function init() {

    let permit = new Core({pathname: pathname});

    permit.getSection().then((permitObj) => {

      if (!req.session.uid) {
        res.redirect(303, '/admin/login');
      } else {
        let user = {};
        let node = {};
        user.uid = req.session.uid;
        node.temp = permitObj.temp;
        node.nameTemplate = permitObj.nameTemplate;
        node.urlParsed = urlParsed;
        node.pathname = pathname;
        node.value = req.body[node.temp];

        access(node, user);
      }

    }).catch(err => {
      if (err) return next(err);
    });

    function access(node, user) {

      permit.getDataUser(user.uid)

        .then(result => {

          if (result.rowCount > 0) {

            user.administrator = true;
            user.id_user = Number(result.rows[0].id_user);
            user.id_agency = Number(result.rows[0].agency);
            user.id_moderator_agency = Number(result.rows[0].moderator);
            user.id_role = Number(result.rows[0].role_id);

            if (req.admin !== req.session.uid) {

              if (result.rows[0].role_id == null) {
                user.administrator = false;
                user.users = 1;
              } else {
                user.administrator = false;
                user.users = 0;
              }
            }

            permit.codeAndForm(user)
              .then(code => {
                user.permission = code[0];
                node.permitForm = code[1];

                initialization(node, user);
              })
              .catch(err => {
                if (err) return next(err);
              });

          } else {
            res.redirect(303, '/admin/logout');
          }
        })
        .catch(err => {
          if (err) return next(err);
        });
    }

    function initialization(node, user) {

      if (req.body.collection.tune) {

        permit.setPermit(req.body.collection)
          .then(result => {
            if (result.rowCount > 0) {
              req.session.flash = {
                type: 'success',
                intro: 'Успех!',
                message: 'Права доступа адреса изменены.'
              };
              res.redirect(303, node.pathname);
            } else {
              res.locals.flash = {
                type: 'danger',
                intro: 'Ошибка записи!',
                message: 'Права доступа адреса не изменены.'
              };
              res.redirect(303, node.pathname);
            }
          })
          .catch(err => {
            if (err) return next(err);
          })

      } else {
        userMenu(node, user);
      }
    }

    function userMenu(node, user) {

      menu.adminMenu(user.permission, user.users, req.session.uid, node.urlParsed, function (err, result) {
        if (err) return next(err);
        node.sidebar = result;
        accessTemplate(node, user);
      });
    }

    function accessTemplate(node, user) {

      node.yesPage = true;

      if (user.permission === '00000') {

        res.locals.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: 'У Вас нет прав доступа к шаблону "collection".'
        };

        node.yesPage = false;

        res.render('template/collection/body',
          {
            layout: 'admin',
            sidebar: node.sidebar,
            yesPage: node.yesPage,
            administrator: node.administrator
          }
        );

      } else {
        noend(node, user);
      }
    }

  }// END INIT END INIT END INIT END INIT

  function submitAccess(node, user) {

    if (node.value.create) {

      if (user.permission.indexOf('1', 3) === 3) {

        noend(node, user);

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на создание подборки недвижимости."
        };
        res.redirect(303, node.pathname);
      }

    } else if (node.value.edit) {

      if (user.permission.indexOf('1', 2) === 2) {

        noend(node, user);

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на правку объекта недвижимости."
        };
        res.redirect(303, node.pathname);
      }

    } else if (node.value.drop) {

      if (user.permission.indexOf('1', 1) === 1) {

        noend(node, user);

      } else {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка доступа!',
          message: "У Вас нет прав на удаление объекта недвижимости."
        };
        res.redirect(303, node.pathname);
      }

    } else {
      noend(node, user);
    }

  }

  function validate(node, user) {

    if (node.value.note_my.length > 1000) {

      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более 1000 символов."
      };

      req.session.repeatData = {
        errNote_my: true, note_my: node.value.note_my, note_client: node.value.note_client
      };

      res.redirect('back');

    } else if (node.value.note_client.length > 1000) {
      req.session.flash = {
        type: 'danger', intro: 'Ошибка проверки!', message: "Нужно указать не более 1000 символов."
      };

      req.session.repeatData = {
        errNote_client: true, note_my: node.value.note_my, note_client: node.value.note_client
      };

      res.redirect('back');

    } else {
      noend(node, user);
    }
  }

  function submitCreate(node, user) {

    if (node.value.create) {

      let date = Date.now();
      let dataString = String(date);

      let url = crypto.createHmac('sha1', conf.get('salt')).update(dataString).digest('hex');

      if (!node.value.no_price) {
        node.value.no_price = null;
      }

      if (!node.value.no_agency) {
        node.value.no_agency = null;
      }

      let collection = new Collection({
        user_id: user.id_user,
        note_my: node.value.note_my,
        note_client: node.value.note_client,
        date_collection: date,
        no_price: node.value.no_price,
        no_agency: node.value.no_agency,
        url_collection: url
      });

      collection.save()
        .then(result => {
          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись сохранена.'
            };
            res.redirect('back');
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Запись не сохранена."
            };
            res.redirect('back');
          }
        })
        .catch(err => {
          return next(err);
        })

    } else {
      noend(node, user);
    }
  }

  function submitEdit(node, user) {

    if (node.value.edit) {

      if (!node.value.no_price) {
        node.value.no_price = null;
      }

      if (!node.value.no_agency) {
        node.value.no_agency = null;
      }

      let collection = new Collection({
        id_collection: node.urlParsed.query.edit,
        user_id: user.id_user,
        note_my: node.value.note_my,
        note_client: node.value.note_client,
        no_price: node.value.no_price,
        no_agency: node.value.no_agency,

      });
      collection.edit()
        .then(result => {
          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись изменена.'
            };
            res.redirect(node.pathname);
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Запись не изменена."
            };
            res.redirect(node.pathname);
          }
        })
        .catch(err => {
          return next(err);
        });
    } else {
      noend(node, user);
    }
  }

  function submitDrop(node, user) {

    if (node.value.drop) {

      let collection = new Collection({
        id_collection: node.urlParsed.query.drop,
        user_id: user.id_user
      });
      collection.drop()
        .then(result => {
          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: 'Запись удалена.'
            };
            res.redirect(node.pathname);
          } else {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "Запись не удалена."
            };
            res.redirect(node.pathname);
          }
        })
        .catch(err => {
          return next(err);
        });
    } else {
      next();
    }
  }

  let tasks = [init, submitAccess, validate, submitCreate, submitEdit, submitDrop];

  function noend(node, user) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(node, user);
  }

  noend();

};

