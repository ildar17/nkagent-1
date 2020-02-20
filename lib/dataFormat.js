exports.emailLogin = function (str) {
   let arr = str.split('@');
   return arr[0];
};