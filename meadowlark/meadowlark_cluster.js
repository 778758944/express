/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-24 19:30:03
 * @version $Id$
 */

var cluster=require("cluster");

function startWork(){
	var worker=cluster.fork();
	console.log("worker start"+worker.id);
}

if(cluster.isMaster){
	require("os").cpus().forEach(function(){
		startWork();
	});

	cluster.on("disconnect",function(worker){
		console.log("worker "+worker.id+" is disconnect");
	});

	cluster.on("exit",function(worker,code,signal){
		console.log("worker "+worker.id+" is exit");
		startWork();
	});
}else{
	require("./meadowlark.js")();
}












