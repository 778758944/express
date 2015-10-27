/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-25 12:12:41
 * @version $Id$
 */
var mongoose=require("mongoose");

var vacationInSeasonListenerSchema=mongoose.Schema({
	email:String,
	skus:[String]
});

var VacationInSeasonListener=mongoose.model("VacationInSeasonListener",vacationInSeasonListenerSchema);
module.exports=VacationInSeasonListener;
