const nodemailer = require('nodemailer');


module.exports = Mailer;

function Mailer(obj) {
  for (let key in obj) {
    this[key] = obj[key];
  }
}

Mailer.prototype.mail = function (fn) {

  let transporter;

  let mailOptions = {
    from: this.from, // адрес отправителя
    to: this.to, // список получателей
    subject: this.subject, // Сюжетная линия
    text: this.text, // тело обычного текста
    html: this.html // html body
  };

  function test() {

    nodemailer.createTestAccount((err, account) => {
      if (err) return fn(err);
      noend();
    });

  }

  function transport() {

    transporter = nodemailer.createTransport({
      service: 'Mail.Ru',
      secure: false, // true для 465, false для других портов
      auth: {
        user: 'mail@nkagent.ru', // генерируемый эфирный пользователь
        pass: '%57Rimma'  // генерируемый эфирный пароль
      }
    });

    noend();
  }


  function transmit() {

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) return fn(err);

      fn(null, info, nodemailer);

    });
  }


  let tasks = [ test, transport, transmit ];

  function noend() {
    let currentTask = tasks.shift();
    if (currentTask) currentTask();
  }
  noend();

};