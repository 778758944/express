/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2015-10-20 19:19:50
 * @version $Id$
 */
var express=require("express");
var fortune=require("./lib/fortune.js");
var formidable=require("formidable");
var fs=require("fs");
var credentials=require("./credentials.js");
var nodemailer=require("nodemailer");



// console.log(fortune.getfortune());

var app=express();

var handlebars=require("express3-handlebars")
               .create({
               	defaultLayout:"main",
               	helpers:{
               		section:function(name,options){
               			if(!this._sections) this._sections={};
               			this._sections[name]=options.fn(this);
               			return null;
               		}
               	}
           });

app.engine("handlebars",handlebars.engine);
app.set("view engine","handlebars");


function getWeather(){
	return {
		locations:[
			{
				name:"shanghai",
				forecastUrl:"http://www.baidu.com",
				iconUrl:'/img/logo.png',
				weather:"overcast",
				temp:'30'
			},
			{
				name:"beijing",
				forecastUrl:"http://www.baidu.com",
				iconUrl:'/img/logo.png',
				weather:"overcast",
				temp:'33'
			},
			{
				name:"hangzhou",
				forecastUrl:"http://www.baidu.com",
				iconUrl:'/img/logo.png',
				weather:"overcast",
				temp:'20'
			}
		]
	}
}












/*静态文件处理*/
app.use(express.static(__dirname+"/public"));













/*表单处理*/
app.use(require("body-parser")());
app.use(require("cookie-parser")(credentials.cookieSecret));
app.use(require("express-session")());

app.get("/newsletter",function(req,res){
	res.render("newsletter",{csrf:"csrf token goes here"});
})

app.post("/process",function(req,res){
	if(req.xhr||req.accept("json,html")==="json"){
		res.send({success:true});
	}
	else{
		res.redirect(303,"/thank-you");
	}
});

app.get("/contest/vacation-photo",function(req,res){
	var now=new Date();
	res.render("vacation-photo",{
		year:now.getFullYear(),
		month:now.getMonth()
	})
});
app.post("/contest/vacation-photo/:year/:month",function(req,res){
	var form=new formidable.IncomingForm();
	form.parse(req,function(err,field,files){
		var read=fs.createReadStream(files.photo.path);
		var write=fs.createWriteStream(__dirname+"/public/upload/photo2.png");
		read.pipe(write);
		res.redirect(303,"/thank-you");
	});
})




app.set("port",process.env.PORT||3000);
app.use(function(req,res,next){
	if(!res.locals.partials){
		res.locals.partials={};
	}
	res.locals.partials.weather=getWeather();
	next();	
})


app.get("/",function(req,res){
	// res.type("text/plain");
	// res.send("Meadowlark Travel");
	// console.log(req);
	req.session.userName="jack";
	if(!req.cookies.monster){
		res.cookie("monster","nom nom");
		res.cookie("signed_monster","nom nom",{signed:true});
	}
	else{
		console.log(req.cookies.monster);
		console.log(req.signedCookies.signed_monster)
	}
	// res.clearCookie("monster");
	res.render("home");
});
app.get("/thank-you",function(req,res){
	res.render("thank-you");
})

app.get("/jquery",function(req,res){
	res.render("jquerytest");
})

app.get("/about",function(req,res){
	// res.type("text/plain");
	// res.send("About Meadowlark Travel");
	console.log(req.session.userName);
	
	res.render("about",{layout:"microsite",fortune:fortune.getfortune()});	
});

app.get("/list",function(req,res){
	var data={
		currency:{
			name:"dollars",
			abbrev:"usd"
		},
		tours:[
			{name:"hood river",price:"99"},
			{name:"oregon coast",price:"159"}
		],
		specialsUrl:"/january-specials",
		currencies:["USD","GBP","BTC"]
	}
	res.render("list",data);
});

// app.use(function(req,res,next){
// 	if(!res.locals.partials){
// 		res.locals.partials={};
// 	}
// 	res.locals.partials.weather=getWeather();
// 	next();	
// })


//定制404
app.use(function(req,res){
	// res.type("text/plain");
	res.status(404);
	// res.send("404-not found");
	res.render("404")
});


//定制500yemi

app.use(function(req,res){
	console.log(err.stack);
	// res.type("text/plain");
	res.status(500);
	// res.send("500-server error");
	res.render("500");
});

app.listen(app.get("port"),function(){
	console.log("express started on http://localhost:"+app.get("port"));
	var mailTransport=nodemailer.createTransport({
		host:"mail.qq.com",
		secureConnection:true,
		auth:{
			user:credentials.gmail.user,
			pass:credentials.gmail.pass
		}
	});

	mailTransport.sendMail({
		from: 'Fred Foo ✔ <foo@blurdybloop.com>', // sender address
	    to: '778758944@qq.com', // list of receivers
	    subject: 'Hello ✔', // Subject line
	    text: 'Hello world ✔', // plaintext body
	    html: '<b>Hello world ✔</b>' // html body
	},function(err){
		if(err){
			console.log(err);
		}
	});
});

// //邮件
// var mailTransport=nodemailer.createTransport("SMTP",{
// 	host:"mail.qq.com",
// 	secureConnection:true,
// 	auth:{
// 		user:credentials.gmail.user,
// 		pass:credentials.gmail.password
// 	}
// });

// mailTransport.sendMail({
// 	from: 'Fred Foo ✔ <foo@blurdybloop.com>', // sender address
//     to: '778758944@qq.com', // list of receivers
//     subject: 'Hello ✔', // Subject line
//     text: 'Hello world ✔', // plaintext body
//     html: '<b>Hello world ✔</b>' // html body
// },function(err){
// 	if(err){
// 		console.log(err);
// 	}
// });











