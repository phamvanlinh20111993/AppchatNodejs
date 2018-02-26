var express = require('express')
var path = require('path')
var app = express()
var multipart  = require('connect-multiparty')//upload file dung connect-multiparty
var multipartMiddleware = multipart()
var router = express.Router()
var server = require('http').createServer(app)  
var models = require('../models/user')
var models1 = require('../models/message')
var md5 = require('md5')
var fs = require('fs');
var num_of_user_online = 0;
var mongoose = require('mongoose')
var CryptoJS = require("crypto-js");//mã hóa chuỗi
var cloudinary = require('cloudinary')

//make random name file
function make_png_file()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 30; i++ )//ten file anh co ngau nhien 30 ki tu
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

//upload iamge take by camera
router.route('/upload/camera')
.post(function(req, res)
{
	if(req.body && req.session){
		var base64Data = req.body.upload_camera_image.replace(/^data:image\/png;base64,/, "");
        var dirname = path.resolve(__dirname, "..");
		var pathsave = dirname + "/public/image/" + make_png_file() + ".png"
		//console.log(dirname)
		
		fs.writeFile(pathsave, base64Data, 'base64', function(err) {
			if(err)
				throw err
			res.send(JSON.stringify(pathsave))
		});
	}
	
	
})

//upload image in local
router.route('/upload/image')
.post(multipartMiddleware, function(req, res)
{
	if(req.files && req.session){
		console.log("run me ok now...")

		fs.readFile(req.files.imageupload.path, function (err, data)
      	{
      		var imageName = req.files.imageupload.name
    		if(!imageName)
        	{
      			console.log("There was an error.")
    		}else{
    			console.log(imageName)

    			var dirname = path.resolve(__dirname, "..");
      	 		var newPath = dirname + "/public/image/"  + imageName;
      	 		
      	 		fs.writeFile(newPath, data, function (err) {
      				if(err){
          		   		return res.end("Error uploading file.");
        		  	}
        		  	res.send(JSON.stringify(newPath))
      	 		});
    		}
         
      	})
	}
	
})

//upload document
router.route('/upload/document')
.post(multipartMiddleware, function(req, res)
{
	if(req.files && req.session){
		console.log("ok fine now...")
		fs.readFile(req.files.documentupload.path, function (err, data)
      	{
      		var documentName = req.files.documentupload.name
    		if(!documentName)
        	{
      			console.log("There was an error.")
    		}else{
    			console.log(documentName)

    			var dirname = path.resolve(__dirname, "..");
      	 		var newPath = dirname + "/public/data/"  + documentName;
      	 		
      	 		fs.writeFile(newPath, data, function (err) {
      				if(err){
          		   		return res.end("Error uploading file.");
        		  	}
        		  	res.send(JSON.stringify(newPath))
      	 		});
    		}
         
      	})
	}
	
})

//upload video
router.route('/upload/video')
.post(multipartMiddleware, function(req, res)
{
	if(req.files && req.session){
		console.log(" ok baby now...")
		fs.readFile(req.files.videoupload.path, function (err, data)
      	{
      		var videoName = req.files.videoupload.name
    		if(!videoName)
        	{
      			console.log("There was an error.")
    		}else{
    			console.log(videoName)

    			var dirname = path.resolve(__dirname, "..");
      	 		var newPath = dirname + "/public/data/"  + videoName;
      	 		
      	 		fs.writeFile(newPath, data, function (err) {
      				if(err){
          		   		return res.end("Error uploading file.");
        		  	}
        		  	res.send(JSON.stringify(newPath))
      	 		});
    		}
         
      	})
	}
	
})


module.exports = router;