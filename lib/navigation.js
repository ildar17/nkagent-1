let url = require('url');

exports.navpageArticle = function (str, urlParsed, all, limit, linkLimit, urlPage, letName, fn) {

  if (!urlPage) urlPage = 1;

  let startChar = '<span class="laquo">&laquo;</span>';
  let prevChar = '<span class="lsaquo">&lsaquo;</span>';
  let nextChar = '<span class="rsaquo">&rsaquo;</span>';
  let endChar = '<span class="raquo">&raquo;</span>';
  let querylets = {};

  if (Number(urlPage) === 0) urlPage = 1;

  querylets = urlParsed.query;

  if (querylets[letName]) {
    delete querylets['edit'];
  }

  if (querylets[letName]) {
    delete querylets['drop'];
  }

  if (querylets[letName]) {
    delete querylets[letName];
  }

  let i = null;
  let strPath = '';

  for (let key in querylets) {

    i++;
    if (i === 1) {
      strPath += key + '=' + querylets[key];
    }

    if (i > 1) {
      strPath += '&' + key + '=' + querylets[key];
    }

  }

  let link = urlParsed.pathname + '?' + strPath;

  let pages = Math.ceil(all / limit);

  let pagesArr = {};

  for (i = 0; i < pages; i++) {
    pagesArr[i + 1] = i * limit + limit;
  }

  let allPages = array_chunk(pagesArr, linkLimit);

  let returnUrlPage = '';

  for (let j = 0; j < allPages.length; j++) {

    for (let key1 in allPages[j]) {

      if (Number(key1) === Number(urlPage)) {
        returnUrlPage = allPages[j];
      }

    }

  }

  let size_querylets = Object.keys(querylets).length;

  str += '<nav aria-label="Page navigation">' + '\n';
  str += '<div class="pagination"><span class="strnav">Навигация страниц:</span><ul class="pagination">' + "\n";
  if (urlPage > linkLimit) {
    str += '\t<li><a aria-label="Previous" href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=1">' + startChar + '</a></li>' + "\n";
    str += '\t<li><a href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + ( urlPage - 1 ) + '">' + prevChar + '</a></li>' + "\n";
  }

  if (returnUrlPage) {

    for (let key2 in returnUrlPage) {

      if (key2 === urlPage) {
        str += '\t<li class="active"><a href="' + link;
        if (size_querylets > 0) str += '&';
        str += letName + '=' + key2 + '">' + '<span>' + key2 + '</span>' + '</a></li>' + "\n";
      }

      if (key2 !== urlPage) {
        str += '\t<li><a href="' + link;
        if (size_querylets > 0) str += '&';
        str += letName + '=' + key2 + '">' + key2 + '</a></li>' + "\n";
      }
    }
  }

  let url = urlPage * 1 + 1;
  if (url > pages) url = pages;

  if (urlPage !== String(pages)) {
    str += '\t<li><a href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + url + '">' + nextChar + '</a></li>' + "\n";
    str += '\t<li><a aria-label="Next" href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + pages + '">' + endChar + '</a></li>' + "\n";
  }
  str += '</ul></div>' + "\n";
  str += '</nav>' + '\n';


  return fn(null, str);

};


exports.navpage = function (str, urlParsed, all, limit, linkLimit, urlPage, letName, fn) {

  if (!urlPage) urlPage = 1;

  let startChar = '<span class="laquo">&laquo;</span>';
  let prevChar = '<span class="lsaquo">&lsaquo;</span>';
  let nextChar = '<span class="rsaquo">&rsaquo;</span>';
  let endChar = '<span class="raquo">&raquo;</span>';
  let querylets = {};

  if (Number(urlPage) === 0) urlPage = 1;

  querylets = urlParsed.query;

  if (querylets[letName]) {
    delete querylets['edit'];
  }

  if (querylets[letName]) {
    delete querylets['drop'];
  }

  if (querylets[letName]) {
    delete querylets[letName];
  }

  let i = null;
  let strPath = '';

  for (let key in querylets) {

    i++;
    if (i === 1) {
      strPath += key + '=' + querylets[key];
    }

    if (i > 1) {
      strPath += '&' + key + '=' + querylets[key];
    }

  }

  let link = urlParsed.pathname + '?' + strPath;

  let pages = Math.ceil(all / limit);

  let pagesArr = {};

  for (i = 0; i < pages; i++) {
    pagesArr[i + 1] = i * limit + limit;
  }

  let allPages = array_chunk(pagesArr, linkLimit);

  let returnUrlPage = '';

  for (let j = 0; j < allPages.length; j++) {

    for (let key1 in allPages[j]) {

      if (Number(key1) === Number(urlPage)) {
        returnUrlPage = allPages[j];
      }

    }

  }

  let size_querylets = Object.keys(querylets).length;

  str += '<nav aria-label="Page navigation">' + '\n';
  str += '<ul class="pagination">' + "\n";
  if (urlPage > linkLimit) {
    str += '<li><a aria-label="Previous" href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=1">' + startChar + '</a></li>' + "\n";
    str += '<li><a href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + ( urlPage - 1 ) + '">' + prevChar + '</a></li>' + "\n";
  }

  if (returnUrlPage) {

    for (let key2 in returnUrlPage) {

      if (key2 === urlPage) {
        str += '<li class="active"><a href="' + link;
        if (size_querylets > 0) str += '&';
        str += letName + '=' + key2 + '">' + '<span>' + key2 + '</span>' + '</a></li>' + "\n";
      }

      if (key2 !== urlPage) {
        str += '<li><a href="' + link;
        if (size_querylets > 0) str += '&';
        str += letName + '=' + key2 + '">' + key2 + '</a></li>' + "\n";
      }
    }
  }

  let url = urlPage * 1 + 1;
  if (url > pages) url = pages;

  if (urlPage !== String(pages)) {
    str += '<li><a href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + url + '">' + nextChar + '</a></li>' + "\n";
    str += '<li><a aria-label="Next" href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + pages + '">' + endChar + '</a></li>' + "\n";
  }
  str += '</ul>' + "\n";
  str += '</nav>' + '\n';


  return fn(null, str);

};

exports.navPageApartment = function (str, urlParsed, all, limit, linkLimit, urlPage, letName) {

  if (!urlPage) urlPage = 1;

  let startChar = '<span class="laquo">&laquo;</span>';
  let prevChar = '<span class="lsaquo">&lsaquo;</span>';
  let nextChar = '<span class="rsaquo">&rsaquo;</span>';
  let endChar = '<span class="raquo">&raquo;</span>';
  let querylets = {};

  if (urlPage == 0) urlPage = 1;

  querylets = urlParsed.query;

  if (querylets[letName]) {
    delete querylets['edit'];
  }

  if (querylets[letName]) {
    delete querylets['drop'];
  }

  if (querylets[letName]) {
    delete querylets[letName];
  }

  let i = null;
  let strPath = '';

  for (let key in querylets) {

    i++;

    if (i == 1) {
      strPath += key + '=' + querylets[key];
    }

    if (i > 1) {
      strPath += '&' + key + '=' + querylets[key];
    }

  }

  let link = urlParsed.pathname + '?' + strPath;

  let pages = Math.ceil(all / limit);

  let pagesArr = {};

  for (i = 0; i < pages; i++) {
    pagesArr[i + 1] = i * limit + limit;
  }

  let allPages = array_chunk(pagesArr, linkLimit);

  let returnUrlPage = '';

  for (let j = 0; j < allPages.length; j++) {

    for (let key1 in allPages[j]) {

      if (key1 * 1 == urlPage) {
        returnUrlPage = allPages[j];
      }

    }

  }

  let size_querylets = Object.keys(querylets).length;

  str += '\t'+'<nav aria-label="Page navigation">' + '\n';
  str += '\t\t'+'<ul class="pagination">' + "\n";
  if (urlPage > linkLimit) {
    str += '<li><a aria-label="Previous" href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=1">' + startChar + '</a></li>' + "\n";
    str += '<li><a href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + ( urlPage - 1 ) + '">' + prevChar + '</a></li>' + "\n";
  }

  if (returnUrlPage) {

    for (let key2 in returnUrlPage) {
      /*
       str += '<li><a href="' + link; if( size_querylets > 0 ) str += '&'; str += letName + '=' + key2 + '">';
       if( key2 == urlPage ) { str += '<span>' + key2 + '</span>'; }
       if( key2 != urlPage ) { str += key2; }
       str += '</a></li>' + "\n";
       */
      if (key2 == urlPage) {
        str += '\t\t\t'+'<li class="active"><a href="' + link;
        if (size_querylets > 0) str += '&';
        str += letName + '=' + key2 + '">' + '<span>' + key2 + '</span>' + '</a></li>' + "\n";
      }

      if (key2 != urlPage) {
        str += '\t\t\t'+'<li><a href="' + link;
        if (size_querylets > 0) str += '&';
        str += letName + '=' + key2 + '">' + key2 + '</a></li>' + "\n";
      }
    }
  }

  let url = urlPage * 1 + 1;
  if (url > pages) url = pages;
  if (urlPage != pages) {
    str += '<li><a href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + url + '">' + nextChar + '</a></li>' + "\n";
    str += '<li><a aria-label="Next" href="' + link;
    if (size_querylets > 0) str += '&';
    str += letName + '=' + pages + '">' + endChar + '</a></li>' + "\n";
  }
  str += '\t\t'+'</ul>' + "\n";
  str += '\t'+'</nav>' + '\n';


  return str;

};

function array_chunk(input, size) {

  let x = null;
  let h = {};
  let n = [];
  let key1 = [];

  let i = null;

  for (let k in input) {
    i++
  }

  if (i > size) {

    for (let key in input) {

      x++;

      h[key] = input[key];

      if (( x % size ) == 0) {

        n.push(h);

        h = {};

        key1 = [];
        key1.push(key);

      }
    }

    h = {};

    for (let key3 in input) {

      if (key3 * 1 > key1[0] * 1) {
        h[key3] = input[key3];
      }
    }

    n.push(h);

  } else {

    for (let key in input) {
      h[key] = input[key];
    }

    n.push(h);

  }

  return n;
}

exports.linkQuery = function (edit, drop, party, req) {

  let urlParsed = url.parse(req.url, true);
  let querylets = {};

  querylets = urlParsed.query;

  if (querylets[edit]) {
    delete querylets[edit];
  }

  if (querylets[drop]) {
    delete querylets[drop];
  }

  if (querylets[party]) {
    delete querylets[party];
  }

  let i = null;
  let strPath = '';

  for (let key in querylets) {

    i++;

    strPath += '&' + key + '=' + querylets[key];
  }

  return strPath;

};

