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
var http=require("http");
var mongoose=require("mongoose");
var server;

mongoose.connect("mongodb://localhost/meadowlark");
var Vacation=require("./vacation.js");
var Attraction=require("./attraction.js");
var VacationInSeasonListener=require("./vacationin.js");
var mongoSession=require("session-mongoose")(require("connect"));
var sessionStore=new mongoSession({
	url:"mongodb://localhost/meadowlark"
})
var dataDir=__dirname+"/data";
var photoDir=dataDir+"/photo";
fs.existsSync(dataDir)||fs.mkdirSync(dataDir);
fs.existsSync(photoDir)||fs.mkdirSync(photoDir);

//MONGOOSE数据库

Vacation.find(function(err,vacations){
	if(vacations.length) return;

	new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description: 'Spend a day sailing on the Columbia and ' + 
            'enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-getaway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of rock climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});


var convertFromUSD=function(value,currency){
	switch(currency){
		case "USD":
		return value*1;

		case "GBP":
		return value*0.6;

		case "BTC":
		return value*0.222;
	}
}



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


//vhost创建子域名
var vhost=require("vhost");
var admin=express.Router();
app.use(vhost("admin.*",admin));
admin.get("/",function(req,res){
	res.send("hello world");
});

admin.get("/users",function(req,res){
	res.render("admin/users.handlebars");
})




//错误域处理
app.use(function(req,res,next){
	var domain=require("domain").create();
	domain.on("error",function(err){
		console.error("domain error",err.stack);
		try{
			setTimeout(function(){
				console.log("failsave shutdown");
				process.exit(1);
			},5000);
			//从集群中断开
			var worker=require("cluster").worker;
			if(worker) worker.disconnect();

			server.close();

			try{
				next(err);
			}
			catch(err){
				console.log("deal error failed");
				res.statusCode=500;
				res.setHeader("content-type","text/plain");
				res.end("server error");
			}
		}
		catch(err){
			console.log("unable to send 500");
		}
	});
	domain.add(req);
	domain.add(res);
	domain.run(next);
})





/*静态文件处理*/
app.use(express.static(__dirname+"/public"));


//开发环境差异
switch(app.get("env")){
	case "development":
		app.use(require("morgan")("dev"));
		break;

	case "production":
		 app.use(require("express-logger")({
		 	path:__dirname+"/log/request.log"
		 }))
}

app.use(function(req,res,next){
	var cluster=require("cluster");
	if(cluster.isWorker){
		console.log("worked on "+cluster.worker.id);
	}
	next();
})













/*表单处理*/
app.use(require("body-parser")());
app.use(require("cookie-parser")(credentials.cookieSecret));
app.use(require("express-session")({store:sessionStore}));

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
		if(err){
			return res.redirect(303,"/error");
		}
		if(err){
			req.session.flash={
				type:"danger",
				intro:"Oops",
				message:"error occured"
			}
			return res.redirect("303","/contest/vacation-photo");
		}
		var photo=files.photo;
		var path=photoDir+"/"+field.name;
		var photoPath=path+"/"+photo.name;
		fs.existsSync(path)||fs.mkdirSync(path);
		fs.renameSync(photo.path,photoPath);

		req.session.flash={
			type:"success",
			intro:"goodluck",
			message:"you have been entered into the contest"
		}




		// var read=fs.createReadStream(files.photo.path);
		// var write=fs.createWriteStream(__dirname+"/public/upload/photo2.png");
		// read.pipe(write);
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
});

var speacil=function(req,res,next){
	console.log("special");
	next();
}


app.get("/",speacil,function(req,res){
	// res.type("text/plain");
	// res.send("Meadowlark Travel");
	// console.log(req);
	req.session.userName="jack";
	if(!req.cookies.monster){
		res.cookie("monster","nom nom");
		res.cookie("signed_monster","nom nom",{signed:true});
	}
	else{
		// console.log(req.cookies.monster);
		// console.log(req.signedCookies.signed_monster)
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

app.get("/set-currency/:currency",function(req,res){
	req.session.currency=req.params.currency;
	return res.redirect(303,"/vacations");
})

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

app.get("/fail",function(req,res){
	throw new Error("nope");
});

app.get("/epic-fail",function(req,res){
	process.nextTick(function(){
		throw new Error("baoboo");
	})
});

app.get("/vacations",function(req,res){
	Vacation.find({available:true},function(err,vacations){
		var currency=req.session.currency;
		var context={
			vacations:vacations.map(function(vacation){
				return {
					sku:vacation.sku,
					name:vacation.name,
					description:vacation.description,
					price:convertFromUSD(vacation.priceInCents/100,currency),
					inSeason:vacation.inSeason
				}
			})
		};

		console.log(context);
		res.render("vacation",context);
	})
});

app.get("/notify-me-when-in-season",function(req,res){

	res.render("notify-me-when-in-season",{sku:req.query.sku})
});

app.post("/notify-me-when-in-season",function(req,res){
	VacationInSeasonListener.update(
		{email:req.body.email},
		{$push:{skus:req.body.sku}},
		{upsert:true},
		function(err){
			if(err){
				console.log(err.stack);
				req.session.flash={
					type:"danger",
					intro:"Ooops",
					message:"there was an error occueed"
				}
				return res.redirect(303,"/vacations");
			}
			req.session.flash={
				type:"success",
				intro:"ThANK YOU",
				message:"you will be notify"
			};
			return res.redirect(303,"/vacations");
		}
		)
})

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

function startServer(){
	server=http.createServer(app).listen(app.get("port"),function(){
		console.log("express started in "+app.get('env')+" on http://localhost:"+app.get("port"));
	});
}

if(require.main===module){
	startServer();
}
else{
	module.exports=startServer;
}

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











