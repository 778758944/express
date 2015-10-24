/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-20 20:27:54
 * @version $Id$
 */
var fortunes=["1","2","3","4","5"];
exports.getfortune=function(){
	return fortunes[Math.round(Math.random()*5)];
}
