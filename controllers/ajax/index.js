let Ajax = require('./model/index');
let url = require('url');
let fs = require('fs');
const sharp = require('sharp');


exports.list = function (req, res, next) {

  let urlParsed = url.parse(req.url, true);
  let idEdit = null;
  let resJSON = {};
  let photo = [];

  function Photo(obj) {
    for (let key in obj) {
      this[key] = obj[key];
    }
  }

  let idDrop = null;
  let dropEdit = null;

  if (urlParsed.query.tableFoto) {

    let tableFoto = urlParsed.query.tableFoto * 1;

    Ajax.getPhoto(tableFoto, function (err, result) {
      if (err) {
        res.set('Cache-Control', 'no-store, no-cache');
        res.send('500, Internal Server Error.');
      }

      if (result.rowCount > 0) {

        let str = '';

        str += '<div class="row">' + "\n";

        for (let i = 0; i < result.rows.length; i++) {

          str += "\t" + '<div class="col-xs-4 col-sm-2 col-md-2 col-lg-1">' + "\n";
          str += "\t\t" + '<a href="/images/' + result.rows[i].title_photo + '" class="thumbnail" data-fancybox data-toolbar="false" data-small-btn="true">' + "\n";
          str += "\t\t" + '<img src="/images/' + result.rows[i].title_photo + '">' + "\n";
          str += "\t\t" + '</a>' + "\n";
          str += "\t" + '</div>' + "\n";

        }

        str += '</div>' + "\n";

        res.set('Cache-Control', 'no-store, no-cache');
        res.send(str);

      } else {
        res.set('Cache-Control', 'no-store, no-cache');
        res.send('Красный цвет кнопки означает, что этому объекту фотографии не добавлены. Зелёный цвет кнопки означает, что у этого объекта есть фотографии для просмотра. 404, Not Found.');
      }

    });

  } else if (urlParsed.query.photoEditOnload) {

    idEdit = urlParsed.query.photoEditOnload * 1;

    Ajax.getPhoto(idEdit, function (err, result) {
      if (err) {

        photo.push({type: "error"});
        photo.push(new Photo({
          type: "alert-danger",
          intro: "Ошибка сервера!",
          message: "Не получен список изображений."
        }));
        resJSON = JSON.stringify(photo);
        res.set('Cache-Control', 'no-store, no-cache');
        res.send(resJSON);
      }

      if (result.rowCount > 0) {

        photo.push({type: "result"});
        for (let i = 0; i < result.rows.length; i++) {
          photo.push(new Photo({
            title: result.rows[i].title_photo,
            id_photo: result.rows[i].id_photo,
            path: result.rows[i].path_photo
          }));
        }

        resJSON = JSON.stringify(photo);

        res.set('Cache-Control', 'no-store, no-cache');
        res.send(resJSON);

      } else {
        photo.push({type: "resultNull"});

        resJSON = JSON.stringify(photo);

        res.set('Cache-Control', 'no-store, no-cache');
        res.send(resJSON);
      }

    });


  } else if (urlParsed.query.dropPhoto) {

    idDrop = urlParsed.query.dropPhoto * 1;
    dropEdit = urlParsed.query.dropEdit * 1;

    let path = '';
    let node_id = null;

    Ajax.getImg(idDrop, function (err, result) {
      if (err) {
        photo.push({type: "error"});
        photo.push(new Photo({
          type: "alert-danger",
          intro: "Ошибка сервера!",
          message: "Не получены данные по изображению."
        }));
        resJSON = JSON.stringify(photo);
        res.set('Cache-Control', 'no-store, no-cache');
        res.send(resJSON);
      }

      if (result.rowCount > 0) {

        path = result.rows[0].path_photo;
        node_id = result.rows[0].node_id_photo * 1;

        if (node_id === dropEdit) {

          fs.unlink(path, function (err) {
            if (err) {
              photo.push({type: "error"});
              photo.push(new Photo({
                type: "alert-danger",
                intro: "Ошибка сервера!",
                message: "Не очищен images."
              }));
              resJSON = JSON.stringify(photo);
              res.set('Cache-Control', 'no-store, no-cache');
              res.send(resJSON);
            }

            Ajax.dropImg(idDrop, function (err, result) {
              if (err) {
                photo.push({type: "error"});
                photo.push(new Photo({
                  type: "alert-danger",
                  intro: "Ошибка сервера!",
                  message: "Не удалились данные."
                }));
                resJSON = JSON.stringify(photo);
                res.set('Cache-Control', 'no-store, no-cache');
                res.send(resJSON);
              }

              if (result.rowCount > 0) {

                Ajax.getPhoto(node_id, function (err, result) {
                  if (err) {
                    photo.push({type: "error"});
                    photo.push(new Photo({
                      type: "alert-danger",
                      intro: "Ошибка сервера!",
                      message: "Нет данных по изображению."
                    }));
                    resJSON = JSON.stringify(photo);
                    res.set('Cache-Control', 'no-store, no-cache');
                    res.send(resJSON);
                  }

                  if (result.rowCount > 0) {

                    photo.push({type: "result"});
                    for (let i = 0; i < result.rows.length; i++) {
                      photo.push(new Photo({
                        title: result.rows[i].title_photo,
                        id_photo: result.rows[i].id_photo,
                        path: result.rows[i].path_photo
                      }));
                    }

                    resJSON = JSON.stringify(photo);

                    res.set('Cache-Control', 'no-store, no-cache');
                    res.send(resJSON);

                  } else {
                    photo.push({type: "resultNull"});

                    resJSON = JSON.stringify(photo);

                    res.set('Cache-Control', 'no-store, no-cache');
                    res.send(resJSON);
                  }

                });

              } else {
                photo.push({type: "error"});
                photo.push(new Photo({
                  type: "alert-danger",
                  intro: "Ошибка сервера!",
                  message: "Не удалились данные."
                }));
                resJSON = JSON.stringify(photo);
                res.set('Cache-Control', 'no-store, no-cache');
                res.send(resJSON);
              }

            });

          });

        } else {
          photo.push({type: "error"});
          photo.push(new Photo({
            type: "alert-danger",
            intro: "Ошибка проверки!",
            message: "Нет изображений в заданном объекте недвижимости."
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
        }

      } else {
        photo.push({type: "error"});
        photo.push(new Photo({
          type: "alert-danger",
          intro: "Ошибка сервера!",
          message: "Нет данных по изображению."
        }));
        resJSON = JSON.stringify(photo);
        res.set('Cache-Control', 'no-store, no-cache');
        res.send(resJSON);
      }

    });

  } else {

    photo.push({type: "error"});
    photo.push(new Photo({
      type: "alert-danger",
      intro: "Ошибка проверки!",
      message: "Адрес не соответствует."
    }));
    resJSON = JSON.stringify(photo);
    res.set('Cache-Control', 'no-store, no-cache');
    res.send(resJSON);
  }
};


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////


exports.submit = function (req, res, next) {

  let urlParsed = url.parse(req.url, true);
  let value = {};
  let mimetype = '';
  let path = '';
  let newPath = '';
  let date;
  let imgPath;
  let newPath1;
  let idEdit = null;
  let template = '';
  let agent = null;
  let title = '';
  let resJSON = {};
  let photo = [];

  function Photo(obj) {
    for (let key in obj) {
      this[key] = obj[key];
    }
  }

  function urlQuery() {

    if (urlParsed.query.photoEdit) {
      noend();
    } else {
      photo.push({type: "error"});
      photo.push(new Photo({
        type: "alert-danger",
        intro: "Ошибка проверки!",
        message: "Неверный запрос."
      }));
      resJSON = JSON.stringify(photo);
      res.set('Cache-Control', 'no-store, no-cache');
      res.send(resJSON);
    }
  }

  function validate() {

    value.img = req.file;
    //console.log(value.img);
    mimetype = value.img.mimetype;
    path = value.img.path;
    date = Date.now();

    if (mimetype === 'image/jpeg') {
      newPath = path + '.jpg';
      newPath1 = 'controllers/ajax/tmp/' + date + '.jpg';
      imgPath = 'public/images/' + date + '.jpg';
      title = date + '.jpg';
      noend();
    } else if (mimetype === 'image/png') {
      newPath = path + '.png';
      newPath1 = 'controllers/ajax/tmp/' + date + '.png';
      imgPath = 'public/images/' + date + '.png';
      title = date + '.png';
      noend();
    } else {
      fs.unlink(path, function (err) {
        if (err) {
          photo.push({type: "error"});
          photo.push(new Photo({
            type: "alert-danger",
            intro: "Ошибка сервера!",
            message: "Сообщите пожалуйста администратору."
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
        }

        photo.push({type: "error"});
        photo.push(new Photo({
          type: "alert-danger",
          intro: "Ошибка проверки!",
          message: "Разрешена загрузка файлов с расширением .jpg, .png ."
        }));
        resJSON = JSON.stringify(photo);
        res.set('Cache-Control', 'no-store, no-cache');
        res.send(resJSON);
      });
    }
  }

  function stat() {

    fs.stat(path, function (err, stat) {
      if (err) {
        // Файл не существует
        if ('ENOENT' === err.code) {
          photo.push({type: "error"});
          photo.push(new Photo({
            type: "alert-danger",
            intro: "Ошибка сервера!",
            message: "Файл не найден."
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
          // Некая другая ошибка
        } else {
          photo.push({type: "error"});
          photo.push(new Photo({
            type: "alert-danger",
            intro: "Ошибка сервера!",
            message: "Ошибка не определена."
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);
        }
      } else {
        noend();
      }
    });
  }

  function getIdEdit() {

    idEdit = urlParsed.query.photoEdit * 1;

    Ajax.getNode(idEdit, function (err, result) {
      if (err) {
        photo.push({type: "error"});
        photo.push(new Photo({
          type: "alert-danger",
          intro: "Ошибка сервера!",
          message: "В базе данных не найден объект недвижимости."
        }));
        resJSON = JSON.stringify(photo);
        res.set('Cache-Control', 'no-store, no-cache');
        res.send(resJSON);
      }

      if (result.rowCount > 0) {

        template = result.rows[0].template;

        Ajax.getNodeTemplate(idEdit, template, function (err, result) {
          if (err) {
            photo.push({type: "error"});
            photo.push(new Photo({
              type: "alert-danger",
              intro: "Ошибка сервера!",
              message: "Ошибка не определена."
            }));
            resJSON = JSON.stringify(photo);
            res.set('Cache-Control', 'no-store, no-cache');
            res.send(resJSON);
          }

          if (result.rowCount > 0) {

            agent = result.rows[0].agent;

            Ajax.getPhoto(idEdit, function (err, result) {
              if (err) {
                photo.push({type: "error"});
                photo.push(new Photo({
                  type: "alert-danger",
                  intro: "Ошибка сервера!",
                  message: "В базе данных не найдено изображение."
                }));
                resJSON = JSON.stringify(photo);
                res.set('Cache-Control', 'no-store, no-cache');
                res.send(resJSON);
              }

              if (result.rowCount >= 10) {

                fs.unlink(path, function (err) {
                  if (err) {
                    photo.push({type: "error"});
                    photo.push(new Photo({
                      type: "alert-danger",
                      intro: "Ошибка сервера!",
                      message: "Не очищен tmp."
                    }));
                    resJSON = JSON.stringify(photo);
                    res.set('Cache-Control', 'no-store, no-cache');
                    res.send(resJSON);
                  }
                  photo.push({type: "error"});
                  photo.push(new Photo({
                    type: "alert-danger",
                    intro: "Ошибка проверки!",
                    message: "Допускается загрузить на сервер не более десяти изображений на объект."
                  }));
                  resJSON = JSON.stringify(photo);
                  res.set('Cache-Control', 'no-store, no-cache');
                  res.send(resJSON);

                });
              } else {
                noend();
              }
            });

          } else {

            fs.unlink(path, function (err) {
              if (err) {
                photo.push({type: "error"});
                photo.push(new Photo({
                  type: "alert-danger",
                  intro: "Ошибка сервера!",
                  message: "Не очищен tmp."
                }));
                resJSON = JSON.stringify(photo);
                res.set('Cache-Control', 'no-store, no-cache');
                res.send(resJSON);
              }
              photo.push({type: "error"});
              photo.push(new Photo({
                type: "alert-danger",
                intro: "Ошибка сервера!",
                message: "Не найдена node объекта."
              }));
              resJSON = JSON.stringify(photo);
              res.set('Cache-Control', 'no-store, no-cache');
              res.send(resJSON);

            });

          }

        });

      } else {

        fs.unlink(path, function (err) {
          if (err) {
            photo.push({type: "error"});
            photo.push(new Photo({
              type: "alert-danger",
              intro: "Ошибка сервера!",
              message: "Не очищен tmp."
            }));
            resJSON = JSON.stringify(photo);
            res.set('Cache-Control', 'no-store, no-cache');
            res.send(resJSON);
          }
          photo.push({type: "error"});
          photo.push(new Photo({
            type: "alert-danger",
            intro: "Ошибка сервера!",
            message: "Не найдена node объекта."
          }));
          resJSON = JSON.stringify(photo);
          res.set('Cache-Control', 'no-store, no-cache');
          res.send(resJSON);

        });
      }
    });

  }

  function writeToImages() {

    fs.rename(path, newPath, function (err) {
      if (err) {
        photo.push({type: "error"});
        photo.push(new Photo({
          type: "alert-danger",
          intro: "Ошибка сервера!",
          message: "Не записан в tmp."
        }));
        resJSON = JSON.stringify(photo);
        res.set('Cache-Control', 'no-store, no-cache');
        res.send(resJSON);
      }

      sharp(newPath)
        .resize(700, undefined)
        .min()
        .toFile(newPath1, function (err) {
          if (err) {
            photo.push({type: "error"});
            photo.push(new Photo({
              type: "alert-danger",
              intro: "Ошибка сервера!",
              message: "Не форматируется изображение."
            }));
            resJSON = JSON.stringify(photo);
            res.set('Cache-Control', 'no-store, no-cache');
            res.send(resJSON);
          }

          fs.unlink(newPath, function (err) {
            if (err) {
              photo.push({type: "error"});
              photo.push(new Photo({
                type: "alert-danger",
                intro: "Ошибка сервера!",
                message: "Не очищен tmp."
              }));
              resJSON = JSON.stringify(photo);
              res.set('Cache-Control', 'no-store, no-cache');
              res.send(resJSON);
            }

            fs.rename(newPath1, imgPath, function (err) {
              if (err) {
                photo.push({type: "error"});
                photo.push(new Photo({
                  type: "alert-danger",
                  intro: "Ошибка сервера!",
                  message: "Не записан в images."
                }));
                resJSON = JSON.stringify(photo);
                res.set('Cache-Control', 'no-store, no-cache');
                res.send(resJSON);
              }

              Ajax.savePhoto(idEdit, template, agent, title, imgPath, function (err, result) {

                if (err) {
                  fs.unlink(imgPath, function (err) {
                    if (err) {
                      photo.push({type: "error"});
                      photo.push(new Photo({
                        type: "alert-danger",
                        intro: "Ошибка сервера!",
                        message: "Не очищен images."
                      }));
                      resJSON = JSON.stringify(photo);
                      res.set('Cache-Control', 'no-store, no-cache');
                      res.send(resJSON);
                    }
                    photo.push({type: "error"});
                    photo.push(new Photo({
                      type: "alert-danger",
                      intro: "Ошибка сервера!",
                      message: "Не записаны данные по изображению."
                    }));
                    resJSON = JSON.stringify(photo);
                    res.set('Cache-Control', 'no-store, no-cache');
                    res.send(resJSON);

                  });
                }

                if (result.rowCount > 0) {

                  Ajax.getPhoto(idEdit, function (err, result) {
                    if (err) {
                      photo.push({type: "error"});
                      photo.push(new Photo({
                        type: "alert-danger",
                        intro: "Ошибка сервера!",
                        message: "Не получен список изображений."
                      }));
                      resJSON = JSON.stringify(photo);
                      res.set('Cache-Control', 'no-store, no-cache');
                      res.send(resJSON);
                    }

                    if (result.rowCount > 0) {

                      photo.push({type: "result"});
                      for (let i = 0; i < result.rows.length; i++) {
                        photo.push(new Photo({
                          title: result.rows[i].title_photo,
                          id_photo: result.rows[i].id_photo,
                          path: result.rows[i].path_photo
                        }));
                      }

                      resJSON = JSON.stringify(photo);

                      res.set('Cache-Control', 'no-store, no-cache');
                      res.send(resJSON);

                    } else {
                      photo.push({type: "resultNull"});

                      resJSON = JSON.stringify(photo);

                      res.set('Cache-Control', 'no-store, no-cache');
                      res.send(resJSON);
                    }

                  });

                } else {

                  fs.unlink(imgPath, function (err) {
                    if (err) {
                      photo.push({type: "error"});
                      photo.push(new Photo({
                        type: "alert-danger",
                        intro: "Ошибка сервера!",
                        message: "Не очищен images."
                      }));
                      resJSON = JSON.stringify(photo);
                      res.set('Cache-Control', 'no-store, no-cache');
                      res.send(resJSON);
                    }
                    photo.push({type: "error"});
                    photo.push(new Photo({
                      type: "alert-danger",
                      intro: "Ошибка сервера!",
                      message: "Не записаны данные по изображению."
                    }));
                    resJSON = JSON.stringify(photo);
                    res.set('Cache-Control', 'no-store, no-cache');
                    res.send(resJSON);

                  });
                }

              });

            });

          });
        });
    });
  }


  let tasks = [urlQuery,validate, stat, getIdEdit, writeToImages];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};