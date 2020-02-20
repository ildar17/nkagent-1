window.onload = function() {

  let url = location.href;

  if(url.indexOf('/admin/template/apartment') > -1)checkUpdates();
  if(url.indexOf('/admin/template/cottages') > -1)checkUpdates();
  if(url.indexOf('/admin/template/commercial') > -1)checkUpdates();
  if(url.indexOf('/admin/template/agency') > -1)checkUpdatesAgency();
  if(url.indexOf('/admin/template/admin') > -1)checkUpdatesAdmin();

  return;
};

function saveImg() {

  let req = new XMLHttpRequest();
  let fileInput = document.getElementById('the-file');
  let csrf = document.getElementById('csrf');

  let file;
  file = fileInput.files[0];
  if(!file) return;

  let formData;
  formData = new FormData();

  if (file.type === 'image/jpeg' || file.type === 'image/png' /*|| file.type === 'image/gif'*/) {

    formData.append('file', file);
    formData.append('_csrf', csrf.value);

    let url = document.createElement('a');
    url.href = location.href;
    let arrSearch = (url.search.split('?')[1]).split('&');
    let edit = null;

    for (let i = 0; i < arrSearch.length; i++) {

      if (arrSearch[i].indexOf('edit') !== -1) {
        edit = arrSearch[i].split('=');
      }
    }

    req.onreadystatechange = function () {

      if (req.readyState !== 4) return;

      let resText = req.responseText;
      resText = JSON.parse(resText);
      if(resText[0].type === 'result'){
        resText = getPhoto(resText);
        let insertImg = document.getElementById('insertImg');
        insertImg.innerHTML = resText;
      } else if(resText[0].type === 'resultNull'){

        let insertImg = document.getElementById('insertImg');
        insertImg.innerHTML = '';
      } else if(resText[0].type === 'error'){
        let intro = resText[1].intro;
        let message = resText[1].message;
        let type = resText[1].type;
        getAlert(type, intro, message);
      }

      if (resText) {
        let elem = document.getElementsByClassName('fileinput-filename');
        let elem1 = document.getElementsByClassName("fileinput");
        elem1[0].className = 'fileinput fileinput-new';
        elem[0].innerHTML = '';
        return;
      }
    };

    let path = "/admin/ajax?photoEdit=" + edit[1];
    req.open("POST", path, true);
    req.send(formData);

  } else {

    let type = 'alert-danger';
    let intro = 'Ошибка проверки!';
    let message = 'Для загрузки изображения допускается файлы с расширением .jpg .png';
    getAlert(type, intro, message);
    let elem = document.getElementsByClassName('fileinput-filename');
    let elem1 = document.getElementsByClassName("fileinput");
    elem1[0].className = 'fileinput fileinput-new';
    elem[0].innerHTML = '';

    return;
  }
}

function dropImg(id) {

  let url = document.createElement('a');
  url.href = location.href;
  let arrSearch = (url.search.split('?')[1]).split('&');
  let edit = null;
  for (let i = 0; i < arrSearch.length; i++) {

    if (arrSearch[i].indexOf('edit') !== -1) {
      edit = arrSearch[i].split('=');
    }
  }

  let req = new XMLHttpRequest();

  req.onreadystatechange = function () {
    if (req.readyState !== 4) return;

    let resText = req.responseText;
    resText = JSON.parse(resText);

    if(resText[0].type === 'result'){
      resText = getPhoto(resText);

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = resText;

    } else if(resText[0].type === 'resultNull'){

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = '';
    } else if (resText[0].type === 'error'){

      let intro = resText[1].intro;
      let message = resText[1].message;
      let type = resText[1].type;
      getAlert(type, intro, message);
    }

    return;

  };

  let path = "/admin/ajax?dropPhoto=" + id + "&dropEdit=" + edit[1];
  req.open("GET", path, true);
  req.send(null);

}

function getPhoto(resText) {

  let str = '';

  for(let i = 1; i < resText.length; i++){

    str += "\n\t"+'<div class="col-xs-5 col-sm-2 col-md-2 col-lg-1">'+"\n";
    str += "\t\t"+'<a href="/images/'+resText[i].title+'" class="thumbnail" data-fancybox data-toolbar="false" data-small-btn="true">'+"\n";
    str += "\t\t"+'<img src="/images/'+resText[i].title+'">'+"\n";
    str += "\t\t"+'<div class="caption">'+"\n";
    str += "\t\t\t"+'<div class="row">'+"\n";
    str += "\t\t\t\t"+'<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">'+"\n";
    str += "\t\t\t\t\t"+'<button class="btn btn-danger btn-xs fileinput-exists" onclick="dropImg('+resText[i].id_photo+'); return false">Удалить</button>'+"\n";
    str += "\t\t\t\t"+'</div>'+"\n";
    str += "\t\t\t"+'</div>'+"\n";
    str += "\t\t"+'</div>'+"\n";
    str += "\t\t"+'</a>'+"\n";
    str += "\t"+'</div>'+"\n";

  }
  return str;
}

function checkUpdates() {

  let url = document.createElement('a');
  url.href = location.href;
  if(url.href.indexOf('edit')===-1){
    return;
  }
  let arrSearch = (url.search.split('?')[1]).split('&');
  let edit = null;
  for (let i = 0; i < arrSearch.length; i++) {

    if (arrSearch[i].indexOf('edit') !== -1) {
      edit = arrSearch[i].split('=');
    }
  }

  let req = new XMLHttpRequest();

  req.onreadystatechange = function () {

    if (req.readyState !== 4) return;

    let resText = req.responseText;
    resText = JSON.parse(resText);

    if(resText[0].type === 'result'){
      resText = getPhoto(resText);

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = resText;

    } else if(resText[0].type === 'resultNull'){

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = '';

    } else if(resText[0].type === 'error'){

      let intro = resText[1].intro;
      let message = resText[1].message;
      let type = resText[1].type;
      getAlert(type, intro, message);
    }

    return;
  };

  let path = "/admin/ajax?photoEditOnload=" + edit[1];
  req.open("GET", path, true);
  req.send(null);
}

function saveImgAgency() {

  let req = new XMLHttpRequest();
  let fileInput = document.getElementById('the-file');
  let csrf = document.getElementById('csrf');

  let file;
  file = fileInput.files[0];
  if(!file) return;

  let formData;
  formData = new FormData();

  if (file.type === 'image/jpeg' || file.type === 'image/png') {

    formData.append('file', file);
    formData.append('_csrf', csrf.value);

    let url = document.createElement('a');
    url.href = location.href;
    let arrSearch = (url.search.split('?')[1]).split('&');
    let edit = null;

    for (let i = 0; i < arrSearch.length; i++) {

      if (arrSearch[i].indexOf('edit') !== -1) {
        edit = arrSearch[i].split('=');
      }
    }

    req.onreadystatechange = function () {

      if (req.readyState !== 4) return;

      let resText = req.responseText;
      resText = JSON.parse(resText);

      if(resText[0].type === 'result'){
        resText = getPhotoAgency(resText);
        let insertImg = document.getElementById('insertImg');
        insertImg.innerHTML = resText;

        let btnSelect = document.getElementById('btnSelect');
        if(insertImg.textContent){
          btnSelect.style.display = 'none';
        } else {
          btnSelect.style.display = 'block';
        }

      } else if(resText[0].type === 'resultNull'){

        let insertImg = document.getElementById('insertImg');
        insertImg.innerHTML = '';
      } else if(resText[0].type === 'error'){
        let intro = resText[1].intro;
        let message = resText[1].message;
        let type = resText[1].type;
        getAlert(type, intro, message);
      }

      if (resText) {
        let elem = document.getElementsByClassName('fileinput-filename');
        let elem1 = document.getElementsByClassName("fileinput");
        elem1[0].className = 'fileinput fileinput-new';
        elem[0].innerHTML = '';
        return;
      }
    };

    let path = "/admin/template/agency?photoEdit=" + edit[1];
    req.open("POST", path, true);
    req.send(formData);

  } else {

    let type = 'alert-danger';
    let intro = 'Ошибка проверки!';
    let message = 'Для загрузки изображения допускается файлы с расширением .jpg .png';
    getAlert(type, intro, message);
    let elem = document.getElementsByClassName('fileinput-filename');
    let elem1 = document.getElementsByClassName("fileinput");
    elem1[0].className = 'fileinput fileinput-new';
    elem[0].innerHTML = '';

    return;
  }
}

function checkUpdatesAgency() {

  let url = document.createElement('a');
  url.href = location.href;
  if(url.href.indexOf('edit')===-1){
    return;
  }
  let arrSearch = (url.search.split('?')[1]).split('&');
  let edit = null;
  for (let i = 0; i < arrSearch.length; i++) {

    if (arrSearch[i].indexOf('edit') !== -1) {
      edit = arrSearch[i].split('=');
    }
  }

  let req = new XMLHttpRequest();

  req.onreadystatechange = function () {

    if (req.readyState !== 4) return;

    let resText = req.responseText;
    resText = JSON.parse(resText);

    if(resText[0].type === 'result'){
      resText = getPhotoAgency(resText);

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = resText;

      let btnSelect = document.getElementById('btnSelect');
      if(insertImg.textContent){
        btnSelect.style.display = 'none';
      } else {
        btnSelect.style.display = 'block';
      }

    } else if(resText[0].type === 'resultNull'){

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = '';

    } else if(resText[0].type === 'error'){

      let intro = resText[1].intro;
      let message = resText[1].message;
      let type = resText[1].type;
      getAlert(type, intro, message);
    }

    return;
  };

  let path = "/admin/template/agency?photoEdit=" + edit[1];
  req.open("GET", path, true);
  req.send(null);
}

function dropImgAgency(id) {

  let req = new XMLHttpRequest();

  req.onreadystatechange = function () {
    if (req.readyState !== 4) return;

    let resText = req.responseText;
    resText = JSON.parse(resText);

    if(resText[0].type === 'result'){
      resText = getPhoto(resText);

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = resText;

    } else if(resText[0].type === 'resultNull'){

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = '';
      let btnSelect = document.getElementById('btnSelect');

      if(insertImg.textContent){
        btnSelect.style.display = 'none';
      } else {
        btnSelect.style.display = 'block';
      }

    } else if (resText[0].type === 'error'){

      let intro = resText[1].intro;
      let message = resText[1].message;
      let type = resText[1].type;
      getAlert(type, intro, message);
    }

    return;

  };

  let path = "/admin/template/agency?dropPhoto=" + id;
  req.open("GET", path, true);
  req.send(null);
}

function getPhotoAgency(resText) {

  let str = '';

  for(let i = 1; i < resText.length; i++){
    str += "\n\t"+'<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">'+"\n";
    str += "\t\t"+'<a href="/images/'+resText[i].title+'" class="thumbnail" data-fancybox data-toolbar="false" data-small-btn="true">'+"\n";
    str += "\t\t"+'<img src="/images/'+resText[i].title+'">'+"\n";
    str += "\t\t"+'<div class="caption">'+"\n";
    str += "\t\t\t"+'<div class="row">'+"\n";
    str += "\t\t\t\t"+'<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">'+"\n";
    str += "\t\t\t\t\t"+'<button class="btn btn-danger btn-xs fileinput-exists" onclick="dropImgAgency('+resText[i].id_photo+'); return' +
      ' false">Удалить</button>'+"\n";
    str += "\t\t\t\t"+'</div>'+"\n";
    str += "\t\t\t"+'</div>'+"\n";
    str += "\t\t"+'</div>'+"\n";
    str += "\t\t"+'</a>'+"\n";
    str += "\t"+'</div>'+"\n";
  }
  return str;

}

function saveImgAdmin() {

  let req = new XMLHttpRequest();
  let fileInput = document.getElementById('the-file');
  let csrf = document.getElementById('csrf');
  let file;
  file = fileInput.files[0];
  if(!file) return;

  let formData;
  formData = new FormData();

  if (file.type === 'image/jpeg' || file.type === 'image/png') {

    formData.append('file', file);
    formData.append('_csrf', csrf.value);

    req.onreadystatechange = function () {
      if (req.readyState !== 4) return;

      let resText = req.responseText;
      resText = JSON.parse(resText);

      if(resText[0].type === 'result'){
        resText = getPhotoAdmin(resText);

        let insertImg = document.getElementById('insertImg');
        insertImg.innerHTML = resText;
        let btnSelect = document.getElementById('btnSelect');
        if(insertImg.textContent){
          btnSelect.style.display = 'none';
        } else {
          btnSelect.style.display = 'block';
        }

      } else if(resText[0].type === 'resultNull'){

        let insertImg = document.getElementById('insertImg');
        insertImg.innerHTML = '';
      } else if (resText[0].type === 'error'){

        let intro = resText[1].intro;
        let message = resText[1].message;
        let type = resText[1].type;
        getAlert(type, intro, message);
      }

      if (resText) {
        let elem = document.getElementsByClassName('fileinput-filename');
        let elem1 = document.getElementsByClassName("fileinput");
        elem1[0].className = 'fileinput fileinput-new';
        elem[0].innerHTML = '';
        return;
      }

    };

    let path = "/admin/template/admin?photoAdmin=true";
    req.open("POST", path, true);
    req.send(formData);



  } else {
    let type = 'alert-danger';
    let intro = 'Ошибка проверки!';
    let message = 'Для загрузки изображения допускается файлы с расширением .jpg .png';
    getAlert(type, intro, message);
    let elem = document.getElementsByClassName('fileinput-filename');
    let elem1 = document.getElementsByClassName("fileinput");
    elem1[0].className = 'fileinput fileinput-new';
    elem[0].innerHTML = '';

    return;
  }

}

function checkUpdatesAdmin(){

  let userEmail = document.getElementById('userEmail');
  let email = userEmail.textContent;

  let req = new XMLHttpRequest();

  req.onreadystatechange = function () {
    if (req.readyState !== 4) return;

    let resText = req.responseText;
    resText = JSON.parse(resText);

    if(resText[0].type === 'result'){
      resText = getPhotoAdmin(resText);

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = resText;
      let btnSelect = document.getElementById('btnSelect');
      if(insertImg.textContent){
        btnSelect.style.display = 'none';
      } else {
        btnSelect.style.display = 'block';
      }

    } else if(resText[0].type === 'resultNull'){

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = '';

    } else if(resText[0].type === 'error'){

      let intro = resText[1].intro;
      let message = resText[1].message;
      let type = resText[1].type;
      getAlert(type, intro, message);
    }

    return;
  };

  let path = "/admin/template/admin?userEmail=" + email;
  req.open("GET", path, true);
  req.send(null);
}

function dropImgAdmin(id) {

  let req = new XMLHttpRequest();

  req.onreadystatechange = function () {
    if (req.readyState !== 4) return;

    let resText = req.responseText;
    resText = JSON.parse(resText);

    if(resText[0].type === 'result'){
      resText = getPhoto(resText);

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = resText;

    } else if(resText[0].type === 'resultNull'){

      let insertImg = document.getElementById('insertImg');
      insertImg.innerHTML = '';
      let btnSelect = document.getElementById('btnSelect');

      if(insertImg.textContent){
        btnSelect.style.display = 'none';
      } else {
        btnSelect.style.display = 'block';
      }

    } else if (resText[0].type === 'error'){

      let intro = resText[1].intro;
      let message = resText[1].message;
      let type = resText[1].type;
      getAlert(type, intro, message);
    }

    return;

  };

  let path = "/admin/template/admin?dropPhoto=" + id;
  req.open("GET", path, true);
  req.send(null);
}

function getPhotoAdmin(resText) {

  let str = '';

  for(let i = 1; i < resText.length; i++){
    str += "\n\t"+'<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">'+"\n";
    str += "\t\t"+'<a href="/images/'+resText[i].title+'" class="thumbnail" data-fancybox data-toolbar="false" data-small-btn="true">'+"\n";
    str += "\t\t"+'<img src="/images/'+resText[i].title+'">'+"\n";
    str += "\t\t"+'<div class="caption">'+"\n";
    str += "\t\t\t"+'<div class="row">'+"\n";
    str += "\t\t\t\t"+'<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">'+"\n";
    str += "\t\t\t\t\t"+'<button class="btn btn-danger btn-xs fileinput-exists" onclick="dropImgAdmin('+resText[i].id_photo+'); return false">Удалить</button>'+"\n";
    str += "\t\t\t\t"+'</div>'+"\n";
    str += "\t\t\t"+'</div>'+"\n";
    str += "\t\t"+'</div>'+"\n";
    str += "\t\t"+'</a>'+"\n";
    str += "\t"+'</div>'+"\n";
  }
  return str;

}

function getAlert(type, intro, message) {
  let elem = document.getElementById('imgError');
  elem.className = "alert " + type;
  elem.style.display = "block";
  let elemP = document.getElementById('alertStr');
  elemP.innerHTML = "<strong>" + intro + "</strong>" + " " + message;


  setTimeout(function () {
    elemP.innerHTML = "";
    elem.style.display = "none";
  }, 4000);
}

