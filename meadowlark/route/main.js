/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-27 20:14:07
 * @version $Id$
 */
exports.home=function(req,res){
	res.send("hello world");
};

exports.about=function(req,res){
	res.send("about");
}
