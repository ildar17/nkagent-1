let passwordValidator = require('password-validator');


exports.isMin = function (len, value) {

  let schema = new passwordValidator();

  schema.min(len);

  return schema.validate(value);

};

exports.isMax = function (len, value) {

  let schema = new passwordValidator();

  schema.max(len);

  return schema.validate(value);

};

exports.hasLetters = function (value) {

  let schema = new passwordValidator();

  schema.has().letters();

  return schema.validate(value);

};

exports.hasDigits = function (value) {

  let schema = new passwordValidator();

  schema.digits();

  return schema.validate(value);

};




