let moment = require('moment');
moment.locale('ru');

exports.msDate = function (ms) {

  let d = new Date(ms*1);

  let dateEnd = moment(d).format('DD-MM-YYYY HH:mm');

  if(dateEnd === '01-01-1970 03:00'){
   dateEnd = '';
  }

  return dateEnd;
};

exports.msDateYear = function (ms) {

  let d = new Date(ms*1);
  let dateEnd = moment(d).format('DD-MM-YY');

  if(dateEnd === '01-01-1970'){
    dateEnd = '';
  }

  return dateEnd;
};

exports.clip = function (str) {

   if('string' == typeof str){

      if(str.length > 100){

         let len = str.length;
         let str1 = str.substr(0, 100);
         let str2 = str.substr(100, (len - 1));
         let arrStr2 = str2.split(' ');
         return str1 + arrStr2[0] + '...';

      } else {
         return str;
      }

   } else {
      return str;
   }
};

exports.clip300 = function (str) {
   
   if('string' == typeof str){
      
      if(str.length > 300){
         
         let len = str.length;
         let str1 = str.substr(0, 100);
         let str2 = str.substr(100, (len - 1));
         let arrStr2 = str2.split(' ');
         return str1 + arrStr2[0] + '...';
         
      } else {
         return str;
      }
      
   } else {
      return str;
   }
};

exports.clipnbsp = function (str) {
   
   if(str.length > 100){
      
      let len = str.length;
      let str1 = str.substr(0, 100);
      let str2 = str.substr(100, (len - 1));
      let arrStr2 = str2.split('&nbsp');
      return str1 + arrStr2[0] + '...';
      
   } else {
      return str;
   }
};
