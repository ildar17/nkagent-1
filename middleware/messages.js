module.exports = function(req, res, next){

	res.locals.flashAuth = req.session.flashAuth || {};

	res.locals.removeMessages = function(){
		delete req.session.flashAuth;
	};

	next();
};

