var faker = require('faker');
var md5 = require('md5');
var mongoose = require('mongoose');

//connect mongoose
/*mongoose.connect('mongodb://localhost/chat', {
  useMongoClient: true
})
*/

mongoose.connect('mongodb://linhvan:12345@ds023435.mlab.com:23435/chatexample', {
	 useMongoClient: true
})

var models = require('../../../models/user.js')

var randomName, randomEmail, randomSex, randomAge, status;

//ham tra ve 1 so  nguyen nam trong khoang max, min
function RandomInt(max, min)
{
  return Math.floor(Math.random() * ( max + 1 - min) + min);
}

//random gioi tinh cua nguoi dung
function RandomSex()
{
	var Sex = ["boy", "girl", "unknow"]
	var index = RandomInt(2, 0)
	
	return Sex[index];
}

//for(var i = 0; i < 100; i++)
	//console.log(faker.image.imageUrl())

for(var i = 0; i < 100; i++)
{
	randomName = faker.name.findName(); // Rowan Nikolaus
	randomEmail = faker.internet.email(); // Kassandra.Haley@erich.biz
	randomAge = RandomInt(60, 16)
	randomSex = RandomSex()
	console.log("Name: " + randomName + "  Email: " + randomEmail 
	  + "  Age: " + randomAge + " Sex: " + randomSex + "  md5: " + md5("123456"))
	
	var user_chat = new models.User({
		username: randomName,
		email: randomEmail,
		password: md5("123456"),
		image: "/1.png",//anh mac dinh
		role: "User",
		age: randomAge,
		sex: randomSex,
		status: 0
	})

	//luu lai
	user_chat.save(function(err)
	{
		if(err)
			console.log(err)
		
		console.log("Done.")
	}) 
}

/*
var user_chat = new models.User({
		username: "Administrator",
		email: "duanwebptudweb@gmail.com",
		password: md5("123456"),
		image: "/1.png",//anh mac dinh
		role: "Admin_all",
		age: 26,
		sex: "boy",
		hobbies:"yêu các bạn nữ xinh đẹp",
		status: 0
	})
	
	//luu lai
	user_chat.save(function(err)
	{
		if(err)
			console.log(err)
		
		console.log("Done.")
	})
*/