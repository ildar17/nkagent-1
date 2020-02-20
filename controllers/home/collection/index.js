let Collection = require('./model/index');
let main_menu = require("../../../lib/mainMenu");
let url = require('url');

exports.list = function (req, res, next) {

  let hash_url = req.params.hashCollection.trim();

  console.log(hash_url);

  function listRender() {

    res.render('home/collection',
      {
        layout: 'collection',
        hello: 'Hello world!'

      }
    );

  }

  let tasks = [listRender];

  function noend(node, user, action) {
    let currentTask = tasks.shift();
    if (currentTask) currentTask(node, user, action);
  }

  noend();

};

