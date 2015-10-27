/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-27 20:19:15
 * @version $Id$
 */
var express=require("express");

var app=express();

var routes=require("./route.js")(app);

app.listen("3000",function(){
	console.log("express listen on 3000");
});