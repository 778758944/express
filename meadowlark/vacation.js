/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-25 11:07:14
 * @version $Id$
 */
var mongoose=require("mongoose");
var vacationSchema=mongoose.Schema({
	name:String,
	slug:String,
	category:String,
	sku:String,
	description:String,
	priceInCent:Number,
	tag:[String],
	inSeason:Boolean,
	available:Boolean,
	requireWaiver:Boolean,
	maximumGuest:Number,
	notes:String,
	packageSold:Number
});

vacationSchema.method.getDisplayPrice=function(){
	return "$"+(this.priceInCent/100).toFixed(2);
}
var Vacation=mongoose.model("Vacation",vacationSchema);
module.exports=Vacation;

