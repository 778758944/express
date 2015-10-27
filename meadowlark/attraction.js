/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-27 20:51:59
 * @version $Id$
 */
var mongoose=require("mongoose");

var attractionSchma=mongoose.Schema({
	name:String,
	description:String,
	location:{lat:Number,lng:Number},
	histroy:{
		event:String,
		notes:String,
		email:String,
		date:String,
	},
	updateId:String,
	approved:Boolean
});

var Attraction=mongoose.model("Attraction",attractionSchma);
module.exports=Attraction;
