let conf= require('../../config');
let loginFormat = require('../../lib/dataFormat');
let hash = require('../../lib/hash');
let Auth = require('./model/index');
let svgCaptcha = require('svg-captcha');
let Mailer = require('../../lib/mailer');
const callsites = require('callsites');
let valid = require('../../lib/validPass');
let msDate = require('../../lib/msDate');
let main_menu = require("../../lib/mainMenu");

exports.registerAdminForm = function (req, res, next) {


  let hash_url = req.params.hashEmail.trim();

  Auth.getTemp(hash_url, function (err, result) {
    if (err) return next(err);

    if (result.rowCount > 0) {

      let obj = {};

      result = result.rows[0];
      let email = result.email;
      let now_date = result.now_date;
      let id_user = result.id_user;
      let fio = result.fio;
      let tel = result.tel;
      let agency = result.agency;
      let note = result.note;
      obj.email = email;
      obj.fio = fio;
      obj.tel = tel;
      obj.agency = agency;
      obj.note = note;

      now_date = Number(now_date);

      if (now_date > Date.now()) {

        Auth.updateUsersUserdata(id_user, obj, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.uid = obj.email;
            res.cookie('user', obj.email, {maxAge: conf.get("maxAge"), signed: true, httpOnly: true});

            res.redirect('/admin/template/admin');

          } else {

            let mailer = new Mailer({
              from: conf.get('mailerFrom'), // адрес отправителя
              to: conf.get('mailWebMaster'), // список получателей
              subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
              html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
            });

            mailer.mail(function (err, info, nodemailer) {
            });

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: "В ближайшее время ошибка будет устранена."
            };
            res.redirect('/admin/login');
          }
        })

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Истекло время активности ссылки на замену регистрационных данных."
        };

        res.redirect('/admin/login');

      }

    } else {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: "Ссылка на обновление регистрационных данных неверная."
      };

      res.redirect('/admin/login');

    }
  })
};

exports.registrationForm = function (req, res, next) {


  if (req.session.uid) {

    res.redirect('/admin/template/admin');

  } else {

    let hashUrl = req.params.hashEmail.trim();
    let dateNew = Date.now();
    let self;

    function temporarily() {

      let user = new Auth({hash_url: hashUrl, dateNow: Date.now()});

      user.getTemporarily(function (err, result) {
        if (err) return next(err);
        self = result;

        if (result.rowCount > 0) {

          noend();

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Истекло время активности ссылки на регистрацию данных."
          };

          res.redirect('/admin/register');
        }
      });
    }

    function getName() {

      let dateOld = self.rows[0].now_date;
      dateOld = Number(dateOld);
      dateOld = dateOld + conf.get('dateEmail');

      if (dateOld > dateNew) {

        Auth.getByName(self.rows[0].email, function (err, user) {
          if (err) return next(err);

          let userEmail = self.rows[0].email;

          let date = user.date_registration;

          if (user.email) {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: 'Почтовый ящик ' + userEmail + ' <b>был зарегистрирован ' + msDate.msDateYear(date) + '</b>. Введите учётные данные в' +
              ' поля формы.'
            };

            req.session.repeatData = {
              errPass: true, email: userEmail
            };

            res.redirect('/admin/login');

          } else {

            let user = new Auth({
              date_registration: dateNew,
              email: userEmail,
              pass: String(self.rows[0].passw)
            });

            user.saveAuth(function (err, result) {

              if (err) return next(err);

              if (result.rowCount > 0) {
                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: "Регистрация прошла успешно! Введите в поле формы пароль. Если Вы забыли пароль" +
                  " пройдите по ссылке \"Забыли пароль?\""
                };

                req.session.repeatData = {
                  email: userEmail
                };

                res.redirect('/admin/login');

              } else {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка сервера!',
                  message: "В ближайшее время ошибка будет устранена."
                };

                let mailer = new Mailer({
                  from: conf.get('mailerFrom'), // адрес отправителя
                  to: conf.get('mailWebMaster'), // список получателей
                  subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
                  html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
                });

                mailer.mail(function (err, info, nodemailer) {
                });

                res.redirect('/admin/login');
              }

            });
          }

        });

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Истекло время активности ссылки. Пройдите регистрацию ещё раз."
        };

        res.redirect('/admin/register');
      }
    }

  }

  let tasks = [temporarily, getName];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();
};

exports.rebuildForm = function (req, res, next) {

  let list_menu = '';

  if (req.session.uid) {

    res.redirect('/admin/template/admin');

  } else {


    Auth.getHashUrl(req.params.hashEmail.trim(), function (err, hashUrl) {
      if (err) return next(err);

      if (!hashUrl) {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Истекло время активности ссылки на восстановления пароля. Пройдите процесс восстановление пароля повтороно."
        };

        res.redirect('/admin/recovery');

      } else {

        main_menu.menu(pathname = 'нет', function (err, result) {
          if (err) return next(err);
          list_menu = result;

          if (hashUrl.date_hash_url > Date.now()) {

            res.render('auth/rebuild',
            {
              title: 'Новый пароль',
              listMenu: list_menu,
              email: hashUrl.email
            });

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: "Время для восстановления пароля истекло, отправьте новую заявку для восстановления пароля."
            };

            res.redirect('/admin/recovery');
          }

        });
      }
    });
  }
};

exports.rebuildSubmit = function (req, res, next) {

  if (req.session.uid) {

    res.redirect('/admin/template/admin');

  } else {

    let submitEmail = req.body.user.email.trim();
    let submitPass = req.body.user.pass.trim();
    let hash_url = req.params.hashEmail.trim();
    let realEmail = '';

    function getEmail() {

      Auth.getHashUrl(hash_url, function (err, hashUrl) {
        if (err) return next(err);

        if (!hashUrl) {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: "Истекло время активности ссылки на восстановления пароля. Пройдите процесс восстановление пароля повтороно."
          };

          res.redirect('/admin/recovery');

        } else {
          realEmail = hashUrl.email;
          noend();
        }
      });
    }

    function empty() {

      if (!req.body.user.email ) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Поля формы обязательны для заполнения.'
        };
        req.session.repeatData = {
          errEmail: true, pass: submitPass
        };

        delete req.session.captcha;
        res.redirect(303, '/recovery/'+ hash_url);

      } else if(!req.body.user.pass) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Поля формы обязательны для заполнения.'
        };
        req.session.repeatData = {
          errPass: true, pass: submitPass
        };

        delete req.session.captcha;
        res.redirect(303, '/recovery/'+ hash_url);

      } else {
        noend();
      }
    }

    function validate() {

      if (/[а-яА-Я]/.test(submitPass)) {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'В поле "Пароль" нужно вводить цифры и английские буквы. Переключитесь на английскую раскладку клавиатуры.'
        };
        req.session.repeatData = {
          errPass: true, pass: submitPass
        };
        res.redirect(303, '/recovery/'+ hash_url);

      } else if (valid.isMin(4, submitPass) === false) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Длина пароля должна быть не менее 4-х символов.'
        };
        req.session.repeatData = {
          errPass: true, pass: submitPass
        };
        res.redirect(303, '/recovery/'+ hash_url);

      } else if (valid.hasLetters(submitPass) === false) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Пароль должен содержать буквы.'
        };
        req.session.repeatData = {
          errPass: true, pass: submitPass
        };
        res.redirect(303, '/recovery/'+ hash_url);

      } else if (valid.hasDigits(submitPass) === false) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Пароль должен содержать цифры.'
        };
        req.session.repeatData = {
          errPass: true, pass: submitPass
        };
        res.redirect(303, '/recovery/'+ hash_url);

      } else if (submitEmail.length > 41) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Длина почтового ящика должна быть меньше 40 символов.'
        };
        req.session.repeatData = {
          errEmail: true, pass: submitPass
        };
        res.redirect(303, '/recovery/'+ hash_url);

      } else if (!(submitEmail.indexOf('.') > 0 && submitEmail.indexOf('@') > 0) || /[^a-zA-Z0-9.@_-]/.test(submitEmail)) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Почтовый ящик имеет неверный формат.'
        };
        req.session.repeatData = {
          errEmail: true, pass: submitPass
        };
        res.redirect(303, '/recovery/'+ hash_url);

      } else if (submitPass.length > 13) {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Пароль должен составлять не более 12 символов.'
        };

        req.session.repeatData = {
          errPass: true, pass: submitPass
        };

        res.redirect(303, '/recovery/'+ hash_url);

      } else {
        noend();
      }
    }

    function runDB() {

      Auth.saveNewPass(submitPass, hash_url, function (err, result) {

        if (err) return next(err);

        if (result.rowCount === 1) {

          req.session.uid = realEmail;
          res.redirect('/admin/template/admin');

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: 'Ошибка в ближайшее время будет устранена.'
          };

          req.session.repeatData = {
            email: realEmail
          };

          let mailer = new Mailer({
            from: conf.get('mailerFrom'), // адрес отправителя
            to: conf.get('mailWebMaster'), // список получателей
            subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
            html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
          });

          mailer.mail(function (err, info, nodemailer) {
          });

          res.redirect(303, '/recovery/'+ hash_url);
        }

      })

    }

    let tasks = [getEmail, empty, validate, runDB];

    function noend() {
      let currentTask = tasks.shift();
      if (currentTask) currentTask();
    }

    noend();
  }
};

exports.recoveryForm = function (req, res) {

  let list_menu = '';

  if (req.session.uid) {

    res.redirect('/admin/template/admin');

  } else {

    let captcha = svgCaptcha.createMathExpr({color: true, noise: 3});
    req.session.captcha = captcha.text;

    main_menu.menu(pathname = 'нет', function (err, result) {
      if (err) return next(err);

      list_menu = result;

      res.render('auth/recovery',
        {
          title: 'Восстановление пароля',
          listMenu: list_menu,
          total: captcha.data
        });
    });

  }
};

exports.recoverySubmit = function (req, res, next) {

  let submitEmail = req.body.user.email.trim();

  function empty() {

    if (!req.body.user.email ) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Поля формы обязательны для заполнения.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail
      };

      delete req.session.captcha;
      res.redirect('/admin/recovery');

    } else {
      noend();
    }
  }

  function noSum() {

    let captcha = req.body.user.captcha * 1;
    let answer = req.session.captcha * 1;

    if (captcha !== answer) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Сумма рассчитана неверно.'
      };
      req.session.repeatData = {
        errSum: true, email: submitEmail
      };
      delete req.session.captcha;
      res.redirect('/admin/recovery');

    } else {
      delete req.session.captcha;
      noend();
    }
  }

  function validate() {

    if (submitEmail.length > 41) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Должно быть меньше 40 символов.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail
      };
      res.redirect('/admin/recovery');

    } else if (!(submitEmail.indexOf('.') > 0 && submitEmail.indexOf('@') > 0) || /[^a-zA-Z0-9.@_-]/.test(submitEmail)) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Почтовый ящик имеет неверный формат.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail
      };
      res.redirect('/admin/recovery');

    } else {
      noend();
    }
  }

  function runDB() {

    Auth.getByNameRebuild(submitEmail, function (err, email) {

      if (err) return next(err);
      if (!email) {
        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: "Почтовый ящик " + submitEmail + " не зарегистрирован!"
        };

        req.session.repeatData = {
          errEmail: true, email: submitEmail
        };
        res.redirect('/admin/register');

      } else {

        Auth.recordHashUrl(submitEmail, function (err, result) {
          if (err) return next(err);

          if (result.rowCount === 1) {

            let date = conf.get('dateEmail') / 1000 / 60;

            req.session.flash = {
              type: 'success',
              intro: 'Успех!',
              message: "На почтовый ящик " + submitEmail + " отправленно сообщение с инструкцией для восстановления пароля. " +
              "Инструкция действительна в течении " + Math.round(date) + " минут."
            };

            let mailer = new Mailer({
              from: conf.get('mailerFrom'), // адрес отправителя
              to: submitEmail, // список получателей
              subject: '🔑  Восстановление пароля на ' + conf.get('siteName'), // Сюжетная линия
              html: '<p>Кто-то недавно запросил восстановление пароля на сайте <b>' + conf.get('siteName') + '</b>.' +
              ' Кликните' +
              ' по <a style="text-decoration: underline" href="http://' + conf.get("siteName") + conf.get("pathRecovery") + '/' + result.rows[0].hash_url + '">ссылке</a> чтобы завершить восстановление пароля и' +
              ' пройти в личный кабинет.</p> <h3>Вы не запрашивали восстановление пароля?</h3> <p>Если Вы не' +
              ' запрашивали' +
              ' востановление пароля, ничего делать не нужно, через ' + date + ' минут запрос на сайте ' +
              ' <b>' + conf.get("siteName") + '</b> будет удалён ' +
              ' автоматически.</p>'
            });

            mailer.mail(function (err, info, nodemailer) {
            });

            res.redirect('/admin/recovery');
          }
        });
      }
    });
  }

  let tasks = [empty, noSum, validate, runDB];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();

};

exports.registerForm = function (req, res, next) {

  let list_menu = '';

  if (req.session.uid) {

    res.redirect('/admin/template/admin');

  } else {

    let captcha = svgCaptcha.createMathExpr({color: true, noise: 3});
    req.session.captcha = captcha.text;

    main_menu.menu(pathname = 'нет', function (err, result) {
      if (err) return next(err);

      list_menu = result;

      res.render('auth/register',
        {
          title: 'Регистрация',
          listMenu: list_menu,
          total: captcha.data
        });
    });

  }
};

exports.registerSubmit = function (req, res, next) {

  let submitEmail = req.body.user.email.trim();
  let submitPass = req.body.user.pass.trim();

  function empty() {

    if (!req.body.user.email ) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Поля формы обязательны для заполнения.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail , pass: submitPass
      };

      delete req.session.captcha;
      res.redirect('/admin/register');

    } else if(!req.body.user.pass) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Поля формы обязательны для заполнения.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };

      delete req.session.captcha;
      res.redirect('/admin/register');

    } else {
      noend();
    }
  }

  function noSum() {

    let captcha = req.body.user.captcha * 1;
    let answer = req.session.captcha * 1;

    if (captcha !== answer) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Сумма рассчитана неверно.'
      };
      req.session.repeatData = {
        errSum: true, email: submitEmail , pass: submitPass
      };
      delete req.session.captcha;
      res.redirect('/admin/register');

    } else {
      delete req.session.captcha;
      noend();
    }
  }

  function validate() {

    if (/[а-яА-Я]/.test(submitPass)) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'В поле "Пароль" нужно вводить цифры и английские буквы. Переключитесь на английскую раскладку клавиатуры.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/register');


    } else if (valid.isMin(4, submitPass) === false) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Длина пароля должна быть не менее 4-х символов.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/register');

    } else if (valid.hasLetters(submitPass) === false) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: ' Пароль должен содержать буквы.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/register');

    } else if (valid.hasDigits(submitPass) === false) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Пароль должен содержать цифры.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/register');


    } else if (submitEmail.length > 41) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Почтовый ящик должен состоять не более 40 символов.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/register');

    } else if (!(submitEmail.indexOf('.') > 0 && submitEmail.indexOf('@') > 0) || /[^a-zA-Z0-9.@_-]/.test(submitEmail)) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Почтовый ящик имеет неверный формат.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/register');

    } else if (submitPass.length > 13) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Пароль должен состоять не более 12 символов.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/register');
    } else {
      noend();
    }
  }

  function runDB() {

    Auth.getByName(submitEmail, function (err, user) {
      if (err) return next(err);

      let date = user.date_registration;

      if (user.email) {
        req.session.flash = {
          type: 'warning',
          intro: 'Внимание!',
          message: ' Почтовый ящик ' + user.email + ' <b>был зарегистрирован ' + msDate.msDateYear(date) + '</b>. Введите учётные данные в поля' +
          ' формы.'
        };
        req.session.repeatData = {
          errEmail: true, email: submitEmail , pass: submitPass
        };
        res.redirect('/admin/login');

      } else {

        user = new Auth({
          email: submitEmail,
          pass: submitPass,
          url_hash: hash.get(),
          date_registration: Date.now()
        });


        user.getRole(function (err, result) {

          if (err) return next(err);

          if (result.rowCount > 0 || conf.get('administrator') === submitEmail) {

            user.temporarilySave(function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {

                let date = conf.get('dateEmail') / 1000 / 60;

                let mailer = new Mailer({
                  from: conf.get('mailerFrom'), // адрес отправителя
                  to: submitEmail, // список получателей
                  subject: '🔑  Регистрация на ' + conf.get('siteName'), // Сюжетная линия
                  html: '<p>Кто-то недавно запросил регистрацию на сайте <b>' + conf.get('siteName') + '</b>.' +
                  ' Кликните' +
                  ' по <a style="text-decoration: underline" href="http://' + conf.get("siteName") + conf.get("pathRegistration") + '/' + user.url_hash + '">ссылке</a> чтобы завершить регистрацию и' +
                  ' пройти в личный кабинет.</p> ' + '</br> Ссылка: http://' + conf.get("siteName") + conf.get("pathRegistration") + '/' + user.url_hash +
                  '<h3>Вы не запрашивали регистрацию?</h3> <p>Если Вы не запрашивали' +
                  ' регистрацию, ничего делать не нужно, через ' + date + ' минут запрос о регистрации на сайте <b>' + conf.get("siteName") + '</b> будет удалён ' +
                  ' автоматически.</p>'
                });

                mailer.mail(function (err, info, nodemailer) {
                });

                req.session.flash = {
                  type: 'success',
                  intro: 'Успех!',
                  message: 'На почтовый ящик <b>' + submitEmail + '</b> отправлена ссылка для входа в' +
                  ' личный кабинет. ' + 'Ссылка действительна в течении ' + Math.round(date) + ' минут.'
                };


                res.redirect('/admin/register');

              } else {

                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка сервера!',
                  message: 'Ошибка в ближайшее время будет устранена.'
                };

                let mailer = new Mailer({
                  from: conf.get('mailerFrom'), // адрес отправителя
                  to: conf.get('mailWebMaster'), // список получателей
                  subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
                  html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
                });

                mailer.mail(function (err, info, nodemailer) {
                });

                res.redirect('/admin/register');
              }
            });

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка регистрации!',
              message: 'Вы не можете зарегистрироваться, не созданы роли. Обратитесь к администратору.'
            };

            res.redirect('/admin/register');
          }
        });
      }
    });
  }

  let tasks = [empty, noSum, validate, runDB];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();
};

exports.loginForm = function (req, res, next) {

  let list_menu = '';

  if (req.session.uid) {

    res.redirect('/admin/template/admin');

  } else {

    let captcha = svgCaptcha.createMathExpr({color: true, noise: 3});
    req.session.captcha = captcha.text;

    main_menu.menu(pathname = 'нет', function (err, result) {
      if (err) return next(err);

      list_menu = result;

      res.render('auth/login',
        {
          title: 'Авторизация',
          listMenu: list_menu,
          total: captcha.data
        });
    });

  }
};

exports.loginSubmit = function (req, res, next) {

  let submitEmail = req.body.user.email.trim().toLowerCase();
  let submitPass = req.body.user.pass.trim();
  let submitRemember = req.body.user.remember;
  let dateLogin = conf.get('dateLogin');
  let allNumInput = conf.get('allNumInput');
  let numInput = null;
  let oldDate = null;
  let wait = '';

  function empty() {

    if (!req.body.user.email ) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Поля формы обязательны для заполнения.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail , pass: submitPass
      };

      delete req.session.captcha;
      res.redirect('/admin/login');

    } else if(!req.body.user.pass) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Поля формы обязательны для заполнения.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };

      delete req.session.captcha;
      res.redirect('/admin/login');

    } else {
      noend();
    }
  }

  function noSum() {

    let captcha = req.body.user.captcha * 1;
    let answer = req.session.captcha * 1;

    if (captcha !== answer) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Сумма рассчитана неверно.'
      };
      req.session.repeatData = {
        errSum: true, email: submitEmail , pass: submitPass
      };
      delete req.session.captcha;
      res.redirect('/admin/login');

    } else {
      delete req.session.captcha;
      noend();
    }
  }

  function validate() {

    if (/[а-яА-Я]/.test(submitPass)) {
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'В поле "Пароль" нужно вводить цифры и английские буквы. Переключитесь на английскую раскладку клавиатуры.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/login');

    } else if (submitEmail.length > 41) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Должно быть не более 40 символов.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/login');

    } else if (!(submitEmail.indexOf('.') > 0 && submitEmail.indexOf('@') > 0) || /[^a-zA-Z0-9.@_-]/.test(submitEmail)) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Почтовый ящик имеет неверный формат.'
      };
      req.session.repeatData = {
        errEmail: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/login');

    } else if (submitPass.length > 13) {

      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка проверки!',
        message: 'Пароль должен составлять не более 12 знаков.'
      };
      req.session.repeatData = {
        errPass: true, email: submitEmail , pass: submitPass
      };
      res.redirect('/admin/login');
    } else {
      noend();
    }
  }

  function clean() {
    Auth.cleanLogin(function (err, result) {
      if (err) return next(err);
      if (result.rowCount > 0) {
        noend();
      } else {
        noend();
      }
    })
  }

  function init() {

    Auth.getMailLogin(submitEmail, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        oldDate = result.rows[0].init_date;
        numInput = result.rows[0].num_input;

        let newDate = Date.now();
        oldDate = Number(oldDate);
        numInput = Number(numInput);

        wait = oldDate - newDate;
        wait = wait / 1000 / 60;
        wait = Math.round(wait);
        wait += 1;

        let str = '';
        switch (allNumInput) {
          case 0:
            str = '';
            break;
          case 1:
            str = 'раз';
            break;
          case 2:
            str = 'раза';
            break;
          case 3:
            str = 'раза';
            break;
          case 4:
            str = 'раза';
            break;
          default :
            str = 'раз';
            break;
        }

        let str1 = '';
        switch (wait) {
          case 0:
            str1 = '';
            break;
          case 1:
            str1 = 'минуту';
            break;
          case 2:
            str1 = 'минуты';
            break;
          case 3:
            str1 = 'минуты';
            break;
          case 4:
            str1 = 'минуты';
            break;
          default :
            str1 = 'минут';
            break;
        }

        /*        console.log('oldDate', oldDate);
                console.log('newDate', newDate);
                console.log(typeof oldDate);
                console.log(typeof newDate);*/

        if (oldDate > newDate) {


          if (err) return next(err);

          req.session.flash = {
            type: 'danger',
            intro: 'Время ожидания!',
            message: 'Через <strong>' + wait + ' ' + str1 + '</strong> сервер возобновит проверку паролей для учётной записи: ' + submitEmail + '. Ввeдите пароль после указанного времени ожидания.'
          };

          req.session.repeatData = {
            errEmail: true, email: submitEmail , pass: submitPass
          };
          res.redirect('/admin/login');

        } else {
          noend();
        }

      } else {
        noend();
      }

    });
  }


  function getUser() {

    Auth.getMailUsers(submitEmail, function (err, result) {
      if (err) return next(err);

      if (result.rowCount > 0) {

        Auth.getMailLogin(submitEmail, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            noend();

          } else {

            numInput = 1;

            let dateNow = Date.now();

            Auth.setMailLogin(submitEmail, dateNow, numInput, function (err, result) {
              if (err) return next(err);

              if (result.rowCount > 0) {
                noend();
              } else {
                req.session.flash = {
                  type: 'danger',
                  intro: 'Ошибка сервера!',
                  message: 'Ошибка в ближайшее время будет устранена.'
                };

                req.session.repeatData = {
                  errEmail: true, email: submitEmail , pass: submitPass
                };

                let mailer = new Mailer({
                  from: conf.get('mailerFrom'), // адрес отправителя
                  to: conf.get('mailWebMaster'), // список получателей
                  subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
                  html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
                });

                mailer.mail(function (err, info, nodemailer) {
                });

                res.redirect('/admin/login');
              }
            })
          }

        })

      } else {

        req.session.flash = {
          type: 'danger',
          intro: 'Ошибка проверки!',
          message: 'Почтовый ящик ' + submitEmail + ' не зарегистрирован на сайте. Пройдите регистрацию.'
        };
        req.session.repeatData = {
          errEmail: true, email: submitEmail , pass: submitPass
        };
        res.redirect('/admin/register');

      }
    })

  }

  function runDB() {

    Auth.authenticate(submitEmail, submitPass, function (err, user) {
      if (err) return next(err);

      if (user) {

        Auth.deleteLogin(submitEmail, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            req.session.uid = user.email;

            if (submitRemember === '1') {
              res.cookie('user', user.email, {maxAge: conf.get("maxAge"), signed: true, httpOnly: true});
            }

            res.redirect('/admin/template/admin');

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: 'Ошибка в ближайшее время будет устранена.'
            };

            req.session.repeatData = {
              email: submitEmail
            };

            let mailer = new Mailer({
              from: conf.get('mailerFrom'), // адрес отправителя
              to: conf.get('mailWebMaster'), // список получателей
              subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
              html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
            });

            mailer.mail(function (err, info, nodemailer) {
            });

            res.redirect('/admin/login');
          }
        });

      } else {

        Auth.getMailLogin(submitEmail, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {

            oldDate = result.rows[0].init_date;
            numInput = result.rows[0].num_input;
            noend();

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: 'Ошибка в ближайшее время будет устранена.'
            };

            req.session.repeatData = {
              email: submitEmail
            };

            let mailer = new Mailer({
              from: conf.get('mailerFrom'), // адрес отправителя
              to: conf.get('mailWebMaster'), // список получателей
              subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
              html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
            });

            mailer.mail(function (err, info, nodemailer) {
            });

            res.redirect('/admin/login');
          }

        });
      }
    });
  }

  function redirectLogin() {

    let dateNow = Date.now();
    oldDate = Number(oldDate);
    oldDate = oldDate + dateLogin;
    numInput = Number(numInput);
    let defNumInput = allNumInput - numInput;

    let str = '';
    switch (allNumInput) {
      case 0:
        str = '';
        break;
      case 1:
        str = 'раз';
        break;
      case 2:
        str = 'раза';
        break;
      case 3:
        str = 'раза';
        break;
      case 4:
        str = 'раза';
        break;
      default :
        str = 'раз';
        break;
    }

    let str1 = '';
    switch (defNumInput) {
      case 0:
        str1 = '';
        break;
      case 1:
        str1 = 'попытка';
        break;
      case 2:
        str1 = 'попытки';
        break;
      case 3:
        str1 = 'попытки';
        break;
      case 4:
        str1 = 'попытки';
        break;
      default :
        str1 = 'попыток';
        break;
    }

    wait = oldDate - dateNow;
    wait = dateLogin / 1000 / 60;
    wait = Math.round(wait);

    let str2 = '';
    switch (wait) {
      case 0:
        str2 = '';
        break;
      case 1:
        str2 = 'минуту';
        break;
      case 2:
        str2 = 'минуты';
        break;
      case 3:
        str2 = 'минуты';
        break;
      case 4:
        str2 = 'минуты';
        break;
      default :
        str2 = 'минут';
        break;
    }

    let str3 = 'Остались';
    if (defNumInput === 1) {
      str3 = 'Осталась';
    }


    if (defNumInput === 0) {

      let date = dateNow + dateLogin;

      Auth.updateLoginDateCount(submitEmail, date, 1, function (err, result) {
        if (err) return next(err);

        if (result.rowCount > 0) {
          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка проверки!',
            message: numInput + ' ' + str + ' был указан неверный пароль. Через <strong>' + wait + ' ' + str2 + '</strong>' +
            ' сервер возобновит проверку пароля для учётной записи: ' + submitEmail + '.'
          };
          req.session.repeatData = {
            errPass: true, email: submitEmail , pass: submitPass
          };
          res.redirect('/admin/login');

        } else {

          req.session.flash = {
            type: 'danger',
            intro: 'Ошибка сервера!',
            message: 'Ошибка в ближайшее время будет устранена.'
          };

          req.session.repeatData = {
            errPass: true, email: submitEmail , pass: submitPass
          };

          let mailer = new Mailer({
            from: conf.get('mailerFrom'), // адрес отправителя
            to: conf.get('mailWebMaster'), // список получателей
            subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
            html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
          });

          mailer.mail(function (err, info, nodemailer) {
          });

          res.redirect('/admin/login');
        }

      });

    } else {

      //console.log('dateNow', new Date(dateNow).getHours() + ':' + new Date(dateNow).getMinutes());
      //console.log('oldDate', new Date(oldDate).getHours() + ':' + new Date(oldDate).getMinutes());

      if (dateNow > oldDate && numInput !== 0) {

        numInput = numInput + 1;
        Auth.updateLoginDateCount(submitEmail, dateNow, numInput, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: 'Указан неверный пароль. ' + str3 + ' <strong>' + defNumInput + ' ' + str1 + '</strong>.'
            };
            req.session.repeatData = {
              errPass: true, email: submitEmail , pass: submitPass
            };
            res.redirect('/admin/login');

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: 'Ошибка в ближайшее время будет устранена.'
            };

            req.session.repeatData = {
              errPass: true, email: submitEmail , pass: submitPass
            };

            let mailer = new Mailer({
              from: conf.get('mailerFrom'), // адрес отправителя
              to: conf.get('mailWebMaster'), // список получателей
              subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
              html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
            });

            mailer.mail(function (err, info, nodemailer) {
            });

            res.redirect('/admin/login');
          }

        });

      } else {

        numInput = numInput + 1;
        Auth.updateLoginCount(submitEmail, numInput, function (err, result) {
          if (err) return next(err);

          if (result.rowCount > 0) {
            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка проверки!',
              message: 'Указан неверный пароль. ' + str3 + ' <strong>' + defNumInput + ' ' + str1 + '</strong>.'
            };
            req.session.repeatData = {
              errPass: true, email: submitEmail , pass: submitPass
            };
            res.redirect('/admin/login');

          } else {

            req.session.flash = {
              type: 'danger',
              intro: 'Ошибка сервера!',
              message: 'Ошибка в ближайшее время будет устранена.'
            };

            req.session.repeatData = {
              errPass: true, email: submitEmail , pass: submitPass
            };

            let mailer = new Mailer({
              from: conf.get('mailerFrom'), // адрес отправителя
              to: conf.get('mailWebMaster'), // список получателей
              subject: 'Error ошибка на ' + conf.get('siteName'), // Сюжетная линия
              html: '<p>' + callsites()[0].getFileName() + '</p><p>' + callsites()[0].getLineNumber() + '</p>'
            });

            mailer.mail(function (err, info, nodemailer) {
            });

            res.redirect('/admin/login');
          }

        });
      }
    }
  }


  let tasks = [empty, noSum, validate, /*clean, */init, getUser, runDB, redirectLogin];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }

  noend();
};
