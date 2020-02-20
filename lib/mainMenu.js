let Main = require('../controllers/home/main/model/index');

exports.menu = function (pathname, fn) {

  let pathname1 = pathname;

  pathname = pathname.substr(1, pathname.length);

  let list_menu = '';

  Main.getPermit(function (err, result) {
      if (err) return fn(err);

      if(result.rowCount > 0){

        let list = '';

        if(pathname1 === '/'){

          list += '<li class="active"><a href="/">Главная страница</a></li>\n';

        } else {
          list += '<li><a href="/">Главная страница</a></li>\n';
        }

        for(let i = 0; i < result.rows.length; i++){

          if(result.rows[i].temp === 'apartment' || result.rows[i].temp === 'cottages' || result.rows[i].temp === 'commercial' || result.rows[i].temp === 'agency' || result.rows[i].temp === 'article'){

            if(pathname === result.rows[i].temp){
              list += "\t"+'<li class="active"><a href="/'+result.rows[i].temp+'">' + result.rows[i].name + '</a></li>\n';
            } else {
              list += "\t"+'<li><a href="/'+result.rows[i].temp+'">' + result.rows[i].name + '</a></li>\n';
            }

          }
        }

        list_menu = list;
        list = '';

        fn(null, list_menu);

      } else {
        fn(null, '');
      }

    });

};