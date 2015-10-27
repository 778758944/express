/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-27 20:13:18
 * @version $Id$
 */
var main=require("main.js");
module.exports=function(app){
	app.get("/",main.home)
}
