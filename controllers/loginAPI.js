var express = require('express')
var path = require('path')
var app = express()
var router = express.Router()
var models = require('../models/user')
var mongoose = require('mongoose')
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy
var GoogleStrategy = require('passport-google-oauth20').Strategy
var localhost_aaa = 0;


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

//using facebook to login
//webpage https://developers.facebook.com/apps/1956919321249751/fb-login/
passport.use(new FacebookStrategy({
    clientID: '1956919321249751',
    clientSecret: '384d97d8428140eb09a00c3bbce41f43',
    callbackURL: "/user/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
  	//older code
    //User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    //	console.log(user)
      //return cb(err, user);
   // });

   //update code
   if (profile) {
		user = profile;
		return done(null, user);//se tra ve thong tin nguoi dung o router
	}else {
		return done(null, false);
	}	
  }
));

router.route('/auth/facebook').get(
	passport.authenticate('facebook',  { scope : 'email' }))

router.route('/auth/facebook/callback').
get(passport.authenticate('facebook', { failureRedirect: '/logsg' }),
  function(req, res) {
  	  console.log(req.user)
  	  models.User.findOne({'facebook_id' : req.user.id}).
	  exec(function(err, value){
	  	if(err){
	  		throw err
	  	}else
	  	{
	  	//	console.log("value " + value)
	  		if(value == null){
           		//luu tru thong tin nguoi dung
	  			var user_chat = new models.User({
					username: req.user.displayName,
					email: req.user.id+"_facebookprovider@gmail.com",
					facebook_id: req.user.id,
					password: "underfinded",
					image: "/1.png",//anh mac dinh
					role: "User",
					age: -5,
					status: 1 //trang thai online la 1 vi khi dang ki thanh cong nguoi dung se duoc dieu huong
				//thang sang trang home
	   			})

			    //luu lai
	 		    user_chat.save(function(err){
           		   if(err)
               	      console.log(err)
	 		    })
	  		}

	  	    setTimeout(function(){
	  			models.User.findOne({'facebook_id' : req.user.id}).
	  			exec(function(err, value){
	  				if(err)
	  					throw err
	  				
	  				//khoi tao lai phien lam viec
		   	 		req.session.name = value.username;
    		 		req.session.email = value.email;
    		 		req.session.age = value.age;
    		 		req.session.image = value.image; 
    		 		req.session.chat_id = value._id
           	 		// Successful authentication, redirect to login
           	 		code_facebook_login = 12321;//tao ra 1 bien de login trong app
           			res.redirect('/');
           		})

	  	  	}, 2000)	
	  	}
	  })
})

/*app.get('/auth/facebook',
  passport.authenticate('facebook'));
 
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home. 
    res.redirect('/');
}); */

//trang https://console.developers.google.com/apis/credentials?project=phamlinhcute-185422
//su dung tai khoan google dang nhap
passport.use(new GoogleStrategy({
    clientID: '172823239135-mp40vrhdbi5tblo33rd0vtn0k4dkpube.apps.googleusercontent.com',
    clientSecret: 'Z4UPARdW1Dyy4LwjXVbJn2gt',
    callbackURL: "http://localhost:5555/user/auth/google/callback"
 //   callbackURL: "https://app-chat-phamlinh.herokuapp.com/user/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    if (profile) {
		user = profile;
		return done(null, user);
	}else {
		return done(null, false);
	}	
  }
));

router.route('/auth/google').get(passport.authenticate('google',{ scope: ['profile'] }),
  function(req, res){
    // The request will be redirected to Google for authentication, so
    // this function will not be called.
     res.redirect('logsg');
  });

router.route('/auth/google/callback').get( 
  passport.authenticate('google', { failureRedirect: '/logsg' }),
  function(req, res) {

    // Successful authentication, redirect home.
  //  console.log(req.user)
 //   console.log(req.user.photos[0].value)

    models.User.findOne({'google_id' : req.user.id}).
     exec(function(err, value){
      if(err){
         throw err
      }else
      {
         if(value == null){
            var Gender = "unknow"
            if(req.user.gender == "female")
               Gender = "girl"
            else Gender = "boy"

               //luu tru thong tin nguoi dung
            var user_chat = new models.User({
               username: req.user.displayName,
               email: req.user.id+"_googleprovider@gmail.com",
               google_id: req.user.id,
               password: "underfinded",
               gender: Gender,
               image: req.user.photos[0].value,//anh mac dinh
               role: "User",
               age: -5,
               status: 1 //trang thai online la 1 vi khi dang ki thanh cong nguoi dung se duoc dieu huong
            //thang sang trang home
               })

             //luu lai
             user_chat.save(function(err){
                  if(err)
                     console.log(err)
             })
         }

         setTimeout(function(){
            models.User.findOne({'google_id' : req.user.id}).
            exec(function(err, value){
               if(err)
                  throw err
               
               //khoi tao lai phien lam viec
               req.session.name = value.username;
               req.session.email = value.email;
               req.session.age = value.age;
               req.session.image = value.image; 
               req.session.chat_id = value._id
                  // Successful authentication, redirect to login
               code_google_login = 1234321;//tao ra 1 bien de login trong app
               res.redirect('/');
            })

         }, 2000) 
      }
     })
  });


module.exports = router;