module.exports = function(req, res, next){

	res.locals.repeatData = req.session.repeatData || {};

	res.locals.removeRepeatData = function(){
		delete req.session.repeatData;
	};

	next();
};