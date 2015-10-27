/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-27 20:20:46
 * @version $Id$
 */

var main=require("./main.js");
module.exports=function(app){
	app.get("/",main.home);
	app.get("/about",main.about);
}