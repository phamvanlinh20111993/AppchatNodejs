var express = require('express')
var app = express()
var router = express.Router()
var models = require('../models/user')
var models1 = require('../models/ban')
var session = require('express-session')
var md5 = require('md5')
var CryptoJS = require("crypto-js");//mã hóa chuỗi


/*var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
	function (username, password, done){
		models.User.findOne({username: username}, function(err, user){
			if(err){
				return done(err);
			}
			if(!user){
				return done(null, false, { message: 'Incorrect username.' });
			}
			if(user.password != password){
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);//xac thuc dung tai khoan
		});
	}
))

passport.serializeUser(function(user, done){//hàm được gọi khi xác thực 
                                            //thành công để lưu thông tin user vào session
  console.log("cc  " + user.id)
	done(null, user.id);
})

passport.deserializeUser(function(id, done){//hàm được gọi bởi passport.session .Giúp ta 
                    //lấy dữ liệu user dựa vào thông tin lưu trên session và gắn vào req.user
	models.User.findById(id, function (err, user){
		 console.log("fuck you "+ user)
		done(err, user);
	})
}) 

router.route('/login')
.post(passport.authenticate('local', 
	{  failureRedirect: '/user/logsg',
	   successRedirect: '/user/home',//req.login
	   badRequestMessage : 'Missing username or password.',
	   failureFlash: true 
    }
 )) */
 
 //ham tra ve co tham so
function Time_transfer(ISOdate)
{
    dt = new Date(ISOdate)
    var  time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + ", "+ dt.getDate()+ "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear();
    return time;
}

//ham tra ve cac session cua nguoi dung va sau do dieu huong
function Redirect_user(req, res, value)
{
	//	 var yourinfor = JSON.stringify(value);
   //	 yourinfor = JSON.parse(you);//thong tin cua nguoi dung dang nhap
	req.session.name = value.username;
	//req.session.password = req.body.password;
	req.session.image = value.image;
	req.session.email = req.body.username;
	req.session.age = value.age;
	
	//nguoi dung khong muon ghi nho dang nhap
	if(typeof req.body.rememberme != 'undefined'){//maxAge la 1 ngay
		//mã hóa cookie đảm bảo an toàn
		var usernameofuser = CryptoJS.AES.encrypt(req.body.username, md5("toilatacgiausername")).toString();
		var passwordofuser = CryptoJS.AES.encrypt(req.body.password, md5("toilatacgiapassword")).toString();
		
		var bytes  = CryptoJS.AES.decrypt(usernameofuser, md5("toilatacgiausername"));
		res.cookie('CookieName', usernameofuser, { maxAge: 3600*24*1000, httpOnly: true })
		res.cookie('CookiePass', passwordofuser, { maxAge: 3600*24*1000, httpOnly: true })
	}
	//tao mot ma chat duy nhat cho nguoi dung la ma luu mac dinh trong csdl
	req.session.chat_id = value._id
	
	models.User.findOneAndUpdate({ '_id': req.session.chat_id }, 
		{'status_logout': 0}, {upsert: true}//khi nguoi dung dang nhap thi status_logout = 0
		,function(err){					    //upsert la tao them truong neu truong khong ton tai
			if(err)
				throw err;
		})
		
	if(value.role == "Admin_all"){//tai khoan admin
		res.redirect('admin');
	}else{
		res.redirect('home');
	}
	
}
 
router.route('/login')
 .post(function(req, res)
{	
	if(!req.body.username && !req.body.password)
	{
		console.log("Có hacker xâm nhập. cảnh báo cảnh báo.!!!!")
		console.log("Ip address hacker: " + req.ip + "    " + req.connection.remoteAddress)
		//response bad request
		res.status(404).json({ error: 'Something is wrong. You are trying to hack my web. I take your ip haha. :))))' });
	}else{
		//console.log(req.body.username +"    " + req.body.password)
		//ten nguoi dung chinh la email da dang ki
		models.User.findOne({'email' : req.body.username, 'password': md5(req.body.password)}).
		exec(function(err, value){
			if(err){
		  	 console.log(err);
			 
			}else{
				
				if(value != null)
				{
					//nguoi dung nay da dang nhap va online
					if(value.status == 1){
						//tra ve trang dang nhap
						console.log("Tai khoan nay da duoc dang nhap.")
						error_user = "Tài khoản này đang được sử dụng. Vui lòng thử lại."
						res.status(304).redirect("logsg")
					}else{
						//tim kiem trong collection ban thoi gian so voi thoi gian hien tai
						models1.Ban.findOne({ $and:[ {'email' : value.email},//gia tri email match
						{'time': {$lt: new Date().toISOString()} } ] })//time nho lon hon thoi gian hien tai
						.sort({ 'time': -1 })//sap xep theo thoi gain gan day nhat
						.exec(function(err, notmatch)
						{
							if(err)
								throw err
					
							//neu nguoi dung chua bi ban lan nao
							if(notmatch == null)
							{
								//tao cac bien can thiet nhu session hoac ma loi cho nguoi dung
								Redirect_user(req, res, value)
								delete code_err;//xóa mãi lỗi ẩn giao diện
						
							}else//tài khoản người dùng bị khóa, khóa 1 thời gian hoặc khóa vĩnh viễn
							{	
								var time = "";
								//tai khoan nay bi khoa vinh vien
								if(new Date(notmatch.time).toString() == new Date("October 6, 1995 15:15:15").toString())
								{
									time = "khóa vĩnh viễn"
									//console.log(time)
								}else{ //truong hop nay tai khoan nguoi dung chi bi khoa mot thoi gian
									time = Time_transfer(time)
								}
		
								//tao ra 1 doi tuong gui ve phia client
								var BanUser = {
									id: notmatch._id,
									name: notmatch.name,
									email: notmatch.email,
									time: time,
									description: notmatch.description,
									created: Time_transfer(notmatch.created_at)
								}
								//console.log(BanUser)
								//tao ra ma loi
								code_err = 2;
								var Lock_user = JSON.stringify(BanUser)
								res.render("login_signup", {BanUser : JSON.parse(Lock_user)})
								delete BanUser;
								delete Lock_user;
							//	res.redirect('logsg');//dieu huong sang trang logsg
							}
						})
					}
					
				}else{
					if(typeof error_user != 'undefined')
						delete error_user
					code_err = 0;
					//res.redirect('logsg');
					res.status(400).render("login_signup", {})
				}
			}
		})
	}
 
})
.put(function(req, res)
{
	//nguoi dung quen mat khau yeu cau xac minh lại
	if(typeof User_enter_code != 'undefined')
	{
		if(User_enter_code == req.body.mailauthor)
		{
			models.User.findOneAndUpdate({email: req.body.youremail},
 			 {password: md5(req.body.repassword)}).
			exec(function(err, value){
				if(err){
					console.log(err)
				}else{
					//khoi tao lai phien lam viec
		   	 		req.session.name = value.username;
    		 	//	req.session.password = value.password;
    		 		req.session.email = value.email;
    		 		req.session.age = value.age;
    		 		req.session.image = value.image; 
    		 		req.session.chat_id = value._id
					res.redirect('home');
				}
			})
			
		}else{
			res.send("555")//ma loi
		}
		
		delete User_enter_code, name, email, age, pass;
	}

})
.get(function(req, res){
	res.redirect("logsg")
	
})
.delete(function(req, res){
	
	
})

module.exports = router;