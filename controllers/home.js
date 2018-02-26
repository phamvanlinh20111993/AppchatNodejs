var express = require('express')
var path = require('path')
var app = express()
var multipart  = require('connect-multiparty')//upload file dung connect-multiparty
var multipartMiddleware = multipart()
var router = express.Router()
//var server = require('http').createServer(app)  
//var io = require('socket.io')(server)
var models = require('../models/user')
var models1 = require('../models/message')
var models2 = require('../models/warning')
var models3 = require('../models/delmessage')
var models4 = require('../models/chatstatus')
var md5 = require('md5')
var fs = require('fs');
var num_of_user_online = 0;
var mongoose = require('mongoose')
var CryptoJS = require("crypto-js");//mã hóa chuỗi
var cloudinary = require('cloudinary')

//khởi tạo session 
/*var session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
});

var sharedsession = require("express-socket.io-session");

// Use express-session middleware for express
app.use(session);

// Use shared session middleware for socket.io
// setting autoSave:true
io.use(sharedsession(session, {
   autoSave:true
}));  */


//tao thu muc chua anh dai dien voi tham so dau vao la ma nguoi dung
function Create_directory(user_id)
{
	try{
		var create_directory = 'Image/' + user_id;
		fs.mkdirSync(create_directory)
		console.log('Da tao thanh cong thu muc chua anh.')
	}catch(err)
	{
		if(err.code == 'EEXIST')
			console.log("Thu muc chua anh nay da ton tai.")
		else
			console.log(err)
	}
}

//xoa thu muc chua anh dai dien voi tham so dau vao la ma nguoi dung
function Delete_file_in_directory(user_id)
{
	var del_directory = 'Image/' + user_id;
  	if(fs.existsSync(del_directory))
    {
    	fs.readdirSync(del_directory).forEach(function(file, index){//de quy xoa file trong thu muc
      	var curPath = del_directory + "/" + file;
      	if(fs.lstatSync(curPath).isDirectory()) { // recurse
        		  Delete_file_in_directory(curPath)
      	}else{ // delete file
        		fs.unlinkSync(curPath);
      	}
    	});
    //	fs.rmdirSync(del_directory);
  	}
}

//hàm này sẽ loại bỏ các giá trị là những người dùng bị yêu cầu tắt chat
//tham số users là những người dùng được trả về trong danh sách, 
//tham số user_remove là những người dùng bị ghi mã tắt chát
function Turn_of_chat_someone(users, user_remove)
{
   var index = 0, pos = 0, Lgth = user_remove.length;
   while(index < Lgth)
   {
      for(pos = 0; pos < users.length; pos++)
      {
         if((users[pos]._id).toString() === (user_remove[index].who_was_turned_of).toString())
         {
            users.splice(pos, 1)//loai bo nguoi dung
            break;
         }
      }

      index++
   }

   return users;
}

//ham tra ve 1 so  nguyen nam trong khoang max, min
function RandomInt(max, min)
{
  return Math.floor(Math.random() * (max + 1 - min) + min);
}

//ham tra ve gia tri la dia chi email duoc ma hoa 1 vai gia tri
function Decode_email(data)
{
	var hide_email = ""
	
	hide_email = data.substring(3, data.length)
	data = "***" + hide_email
	
	return data
}

//ham ho tro sap xep cac ban ghi trong thuat toan sap xep tron
function Merge(Count_num_message, Array_index, first, between, last)
{
   var i = first, j = between + 1, count = 0;
   var temp = []
   var temp1 = new Array();

   while(i <= between && j <= last){//sap xep lai mang tu 2 vi tri first -> between va between -> last
      if(Count_num_message[i].count < Count_num_message[j].count){ // luu mang da sap xep vao mot mang phu
         temp[count] = Count_num_message[i];
         temp1[count] = Array_index[i];
         count ++;
         i++; 
      }else{
         temp[count] = Count_num_message[j];
         temp1[count] = Array_index[j];
         count++;
         j++;
      }
   }

   while(i <= between){// truong hop j chay het tu between + 1 -> last nhung i chua chay het tu first->beween
      temp[count] = Count_num_message[i];
      temp1[count] = Array_index[i];
      count++;
      i++;
   }

   while(j <= last){// truong hop i chay het tu first -> between nhung j chua chay het tu beween + 1-> last
      temp[count] = Count_num_message[j];
      temp1[count] = Array_index[j];
      count++;
      j++;
   }
   i = first;
   for(count = 0; count < last - first + 1; count++){ //tra lai mang da sap xep co mang cu tu vi tri first
      Count_num_message[i] = temp[count];
      Array_index[i] = temp1[count]
      i++;
   }
}

//ham sắp xếp trộn các tin nhắn theo thứ tự ưu tiên so luong tin nhan
//example:
/*
   var array = { 9,8,7,6,5,4,3,2,1 };
   var n = array.length;
   
   Merge_sort_message_count(Count_num_message, Array_index, 0, n - 1)
*/
function Merge_sort_message_count(Count_num_message, Array_index, left, right)
{

   if(left < right){
      var mid = parseInt((right + left)/2)
      Merge_sort_message_count(Count_num_message, Array_index, left, mid)
      Merge_sort_message_count(Count_num_message, Array_index, mid + 1, right)
      Merge(Count_num_message, Array_index, left, mid, right)
   }

}


//router.route('/home/:chat_partner')//dieu huong app dung params: url co dang  http://localhost:5555/user/home/591ea6bfddd4c61a84994480
//.get(function(req, res)
//{
//	console.log("tim kiem id la "+ req.params.chat_partner)
//})

router.route('/home')//dieu huong app
.get(function(req, res)
{
   var send_signal = "signal"
   
   if(!req.query && !req.params){
       res.status(404).json({ error: 'Something is wrong. We dont know your request.' });
   }
	/* nguoi dung muon tim kiem 1 ai do bang cach paste dia chi url dang 
	 http://localhost:5555/user/home?chat_partner=59265cc3b097ec1038755728 
	 ta can tach lay gia tri nay va hien thi theo yeu cau nguoi dung
	 --phan nang cao
	 */

	if(typeof req.query.chat_partner != 'undefined')
	{	
		if(req.cookies && !req.session)//co ton tai cookie, nhung khong ton tai phien lam viec
		{
			// Giải mã chuỗi là cookieName, cookiePass
			var bytes  = CryptoJS.AES.decrypt(req.cookies.CookieName, md5("toilatacgiausername"));
			var bytes1 = CryptoJS.AES.decrypt(req.cookies.CookiePass, md5("toilatacgiapassword"));
			
			var emailofuser = bytes.toString(CryptoJS.enc.Utf8);//chuỗi string
			var passofuser = bytes1.toString(CryptoJS.enc.Utf8);
			
			models.User.findOne({$and:[ {'email' : emailofuser}, {'password' : md5(passofuser)} ]})
			.exec(function(err, user){
				if(err)
					throw err
		      
				if(user.length > 0){
				  //khoi tao phien lam viec cho nguoi dung
				  req.session.name = user.username;
				//  req.session.password =  user.password;
				  req.session.image = user.image;
				  req.session.email =  user.email;
				  req.session.age =  user.age;
				  req.session.chat_id =  user._id
			   /*	res.render('home', {search_id: req.query.chat_partner})
			      client se viet trong the script dang 
				  var search = "<%- if(typeof search_id !== 'underfined')?search_id: 'empty'%>" */
				  //console.log(req.query.chat_partner)
				  //req.session.search_id = req.query.chat_partner
				  //res.render('home')-- mới sược hôm nay: 2h35p sáng ngày 28/7/2017
				}else{
					console.log("Co ke co tinh hack page.")
					send_signal = "signal redirect"
				}
			})
			
		}else if(!req.cookies && !req.session){//khong ton tai cookie va phien
      console.log("Co ke co dasdsad.")
			send_signal = "signal redirect"//tin hieu xin dieu hướng
		//	code_err = 3;//ma loi
		}//con lai 2 truong hop la : + có cookie và có session ta sẽ không làm gì
		//                           + không có cookie và có sesion cũng không làm gì
	}	
	
	if(req.query.askdoiturnofthisperson && req.session)
  {//request len server hoi xem co tat chat voi nguoi nay hay khong

         models4.Chatstatus.find({$and:[
            {'who_turnofchat': req.query.youask}, 
            {'who_was_turned_of': req.query.askdoiturnofthisperson}
         ]}, 
         function(err, userturnof){
            if (err) throw err;
			
            if(userturnof.length > 0){
			  //search infor
			   models.User.find({'_id': req.query.askdoiturnofthisperson},
				   {'email': 1})
			   .exec(function(err, username){
				   if(err)   throw err
				   res.send("Bạn đã tắt chat với "+username[0].email+". Bật chat ngay bây giờ ???")
			   })
            }else
               res.send("nomatch")
         })

   }else if(req.query.younotseenmessage && req.session.email)//trả về danh sách các tin nhắn chưa đọc theo độ ưu tiên
   {                                    //cac tin nhan chua doc duoc xep dau tien, da doc roi thi uu tien theo 
                                         //theo thoi gian gan voi thoi gian hien tai nhat  

      const take_num_notseenmessage = 10//lay 10 nguoi nhan tin cho ban som nhat
      var Num_of_notseenmessage = parseInt(req.query.numofrequests*take_num_notseenmessage) 

      //dem so luong nguoi co nhan tin voi nhau
       models1.Message.aggregate([
         {
            $match:
            {'id_user_B': mongoose.Types.ObjectId(req.query.younotseenmessage)}
         },//chua xem tin nhan
         {
            $group:
            { "_id": "$id_user_A",
               "count": { "$sum": 1 }
            }
         }
      ])
      .exec(function(err, idLength)
      {
         if(err)
            throw err

         var Num_of_chat =  parseInt(idLength.length) 

         if(Num_of_chat > (Num_of_notseenmessage - take_num_notseenmessage))
         {

            var Skip_fields = parseInt(Num_of_chat) - Num_of_notseenmessage;
            var Limit_fields = take_num_notseenmessage;
            
            if(Skip_fields < 0){
               Limit_fields = take_num_notseenmessage + Skip_fields;
               Skip_fields = 0;
            }

            //truy van theo cach 1, có sử dụng limit
            models1.Message.aggregate([
               {
                  $match:
                  {'id_user_B': mongoose.Types.ObjectId(req.query.younotseenmessage)}
               },//chua xem tin nhan
               {
                  $group:
                  { 
                     "_id": "$id_user_A",
                     "maxdate": { "$max": "$created_at" }
                  }
               },
               {
                  $sort:
                     {"maxdate": 1}
               },
               { $limit: Limit_fields + Skip_fields },
               { $skip: Skip_fields }
               
            ])
            .exec(function(err, iduser)
            {
         
         /*  })
            //truy van theo cách thứ 2 không dùng được limit
            models1.Message.find(//bạn là người nhận tin nhắn
               {'id_user_B': req.query.younotseenmessage}//chua xem tin nhan
            )
            .distinct('id_user_A')
            .exec(function(err, iduser)
            { */
               if(err) throw err

               //giai quyet bat dong bo trong truy van foreach dung bluebird
               models.User.find(
                  {'_id': iduser}, 
                  {'_id': 1, 'username': 1, 'email': 1, 'image': 1, 'age': 1}
               ).then(function(users)
               {
                  var Account_message = []

                  users.forEach(function(u)//lay tin nhan tu csdl co tham chieu den nguoi dung
                  {
                     Account_message.push(models1.Message.find({$and:
                        [
                           { 'id_user_A': u._id }, 
                           { 'id_user_B': req.query.younotseenmessage }
                        ]}, 
                        { 'created_at': 1, 'content': 1, 'id_user_A': 1}//lay 2 fields la created_at va content
                     )
                     .populate({
                        path:'id_user_A',
                        select: {'password': 0, 'updated_at': 0, 'status': 0, '__v': 0} //bo qua may truong nay
                     })
                     .sort({'created_at': -1})//sap xep theo thoi gian giam dan
                     .limit(1))
                  })

                  return Promise.all(Account_message); //dong bo tin nhan va nguoi dung

               }).then(function(Result)
               {
               // console.log("tham chieu" + users)
               //  console.log("mang object gia tri   " + Result + "   " + Result[0][0].id_user_B.image)
			   
			      //fix lai email--an 1 vai ki tu trong email
			      for(var index = 0; index < Result.length; index++)
					Result[index][0].id_user_A.email = Decode_email(Result[index][0].id_user_A.email)
				  
                  res.send(Result)

               }).catch(function(error) 
               {
                  console.log('one of the queries failed ' + error);
                  res.status(500).json({error: "Error server.!!!"})
               });
            })

         }else{
            res.send("The end.")
         }

      })

   }else if(req.query.younotseenmessage_count && req.session.email )//dem so luong tin nhan chua doc cua nguoi dung
   {

      var Numofmessagenotseen = 0;

      models1.Message.find({ $and:
         [{'id_user_B': req.query.younotseenmessage_count}, {'check' : 1}]//chua xem cac tin nhan
      })                                                                 //duoc gui den ban
      .distinct('id_user_A', function(err, num)
      {
        // console.log("nguoi dung: " + num)
         if(err) throw err

         res.send("messagesnotseen"+ num.length)//mã kèm theo giá trị
      })

   }else//kiem tra session da duoc khai bao moi chuyen qua trang khac
   {
		if(!req.session.email){//nguoi dung chua dang nhap
			res.status(304).redirect('logsg');
		}else
		{
			console.log("ip user " + req.connection.remoteAddress)
			//luu lai session
			req.session.save(function(err) {
				// session saved 
				if(err) console.log(err)
			})
		
			if(send_signal == "signal redirect")
			{
				res.status(304).redirect('logsg')
				send_signal = "signal"//restart lại như ban đầu, phòng tránh lỗi
			}else{
				
				//luu trang thai cua nguoi dung tren csdl de tien theo doi
				models.User.findOneAndUpdate({'email': req.session.email}, {'status': 1},
				function(err, user){
					if (err) 
						throw err;
					
					//kiem tra xem nguoi dung vao trang home co phai la admin hay khong
					if(user.role == "Admin_all"){
						//neu la admin thi can han che mot so chuc nang, gui mã về font end
						res.render('home', {limit_function: "limit"});
					
					}else{
						//neu la nguoi dung binh thuong
						res.render('home');
					}
					
				});
			}
		  
		}
	}

})
.post(multipartMiddleware, function(req, res)
{
	
	//khong ton tai session
	if(!req.session)
		res.redirect('logsg');

   if(!req.body)
    {
         //bad request
         console.log("Có hacker xâm nhập. cảnh báo cảnh báo.!!!!")
         //response bad request
         res.status(404).json({ error: 'Something is wrong. You are trying to hack my web.:)))' });
    }

	//tien hanh dang xuat nguoi dung
	if(req.body.request_log_out == 1)
	{
		//cap nhat trang thai on hay off cua nguoi dung
		models.User.findOneAndUpdate({ '_id': req.session.chat_id }, 
			{'status_logout': 1, 'status': 0}//nguoi dung dang xuat khoi ung dung, offline
		,function(err){
			if(err)
				throw err;
			
			req.session.destroy(function(err){
				// cannot access session here 
				if(err) console.log(err)
			})
			res.redirect('logsg');
		})
		
	}
	
	//Upload anh dai dien
	if(typeof req.files != 'undefined' && req.session.email )
   {//neu co file gui len
		fs.readFile(req.files.File.path, function (err, data)
      {
    		var imageName = req.files.File.name
    		if(!imageName)
        {
      		console.log("There was an error")
      		res.redirect("/home");
      		res.end();
    		}else
         {
    			Create_directory(req.session.chat_id)//tao lai thu muc, neu ton tai thi khong tao
    	     Delete_file_in_directory(req.session.chat_id)//xoa thu muc
    	   
    		   var dirname = path.resolve(__dirname, "..");
      	 	var newPath = dirname + "/Image/" + req.session.chat_id + "/" + imageName;
      	 //	var link_img = "/" + req.session.chat_id + "/" + req.files.File.name;
      	 	console.log(newPath)

      		fs.writeFile(newPath, data, function (err) {
      			if(err){
          		   return res.end("Error uploading file.");
        		  }
				  
				cloudinary.uploader.upload(newPath, 
				function(result){ 
				    req.session.image = result.url;//cap nhat anh

					models.User.findOne({'email': req.session.email})
					.exec(function(err, user){
						if(err)
							throw err
							
						//xoa anh cu tren cloudinary
						if(typeof user.image_public_id != 'undefined'){
							cloudinary.uploader.destroy(user.image_public_id, 
							function(result) { 
					 			console.log(result) 
					 		   });
						}	
						//cap nhat duong dan anh vao csdl
						models.User.findOneAndUpdate({'email': req.session.email}, 
							{'image': result.url, 'image_public_id': result.public_id},
						function(err, user) {
							if (err)  throw err;
						
							//kiem tra xem nguoi dung vao trang home co phai la admin hay khong
							if(user.role == "Admin_all"){
								//neu la admin thi can han che mot so chuc nang, gui mã về font end
								res.render('home', {limit_function: "limit"});
							}else{
								//neu la nguoi dung binh thuong
								res.render('home');
							}
						});		
					})	
				});  
      	 	});
         }
 		});
	}

  //nhan query canh bao nguoi dung
  if(req.body.warning_someone && req.session.email )
  {
      // luu du lieu vao co so du lieu
      var Awarning = new models2.Warning({
        who_warn: req.session.chat_id,
        who_was_warn: req.body.warning_someone,
        code_warn: req.body.warning, // gia tri canh bao
      })

      //luu lai canh bao cua nguoi dung
      Awarning.save(function(err){
         if(err) 
            console.log("Loi luu canh bao nguoi dung: " + err)
         //tiến hành cập nhật vào csdl người dùng, số lượng người dùng bên kia bị cảnh báo
         models2.Warning.find({"who_was_warn": req.body.warning_someone})
         .count(function(err, num)
         {
            if(err)
               throw err
            var Sum_warn = parseInt(num)
          //  console.log("So luong canh báo  " + num + " cua " + req.body.warning_someone)
            Sum_warn++;

            models.User.findByIdAndUpdate(req.body.warning_someone, //tim kiem id cua nguoi dung
               {"num_of_was_warn": Sum_warn}, { upsert: true })
            .exec(function(error)
             {
               // body...
               if(error)
                  console.log("Error for update this value. Error: " + error)

                res.send("Cảnh báo thành công. Hệ thống sẽ xử lí yêu cầu của bạn sớm nhất có thể.")
            })
         })

      })
  }

  //tắt chat voi nguoi dung nao đó
  if(req.body.you_turnofchat && req.session.email )
  {
      //cap nhat vao csdl
      models4.Chatstatus.update({ $and:
         [
            {'who_turnofchat': req.body.you_turnofchat}, {'who_was_turned_of': req.body.who_was_blocked}
         ]},

         {'created_at': new Date().toISOString()},//thoi gian ISOS trong mongodb

         {upsert: true})//cho phep tao gia tri moi neu khong phu hop
      .exec(function(err){
         if(err)    throw err
       //  console.log(req.body.you_turnofchat + "  " + req.body.who_was_blocked)
         res.send("Thành công.")
      })
    
  }

}).put(function(req, res)
{
	
   //khong ton tai session
   if(!req.session)
	   res.redirect('logsg');
   
   //ton tai gia tri request
   if(!req.body){
      res.status(404).json({ error: 'Something is wrong. We dont know your request.' });
   }

  //nguoi dung quen mat khau va yeu cau nhap lai mat khau trong qua trinh dang nhap
  if(typeof req.body.repassword != 'undefined' && req.session.email ){
    res.render('home');
  }

  //nhan du lieu cap nhat thong tin nguoi dung
  if(req.body.update_user_info && req.session.email)
  {
    /*  mảng này tương ứng có các giá trị sau Update_info[0]- tương ứng là mã người dùng
      Update_info[1]- tương ứng là giá trị cập nhật tên người dùng
      Update_info[2]- tương ứng là sở thích người dùng
      Update_info[3]- tương ứng là giới tính
      Update_info[4]- tương ứng là mật khẩu
    */
      var Update_info = JSON.parse(req.body.update_user_info)
      var Information = "";

    /* Việc cập nhật thông tin không thể tùy tiện, chỉ cho phép update 3 tháng(90 ngày) 1 lần, đầu tiên, 
      cần truy vấn kiểm tra xem nguoif dùng đã cập nhật bao giờ chưa */
      models.User.find({"_id": Update_info[0]})
      .select({"update_infor": 1, "_id": 0})// lay truong cap nhat password
      .exec(function(err, user)
      {
         Information = user
       
         //neu do dai user la 1 thi nguoi dung chua cap nhat bao gio
         //neu la user la 2 thi nguoi dung da cap nhat roi, can kiem tra thoi gian xem co lon hon 3 thang khong
         setTimeout(function()
         {
			var passofuserupdate = ""
			
            if(typeof Information[0].update_infor == 'undefined')
            {//khong thay doi mat khau
			   if(Update_info[4].substring(Update_info[4].length-11, Update_info[4].length)=="oldpassword")
				   passofuserupdate = Update_info[4].substring(0, Update_info[4].length-11)
			   else//co thay doi mat khau
				   passofuserupdate = md5(Update_info[4])
			
               models.User.findOneAndUpdate({"_id": Update_info[0]}, 
               { "$set": 
				   {'username': Update_info[1], 'password':  passofuserupdate, 'sex': Update_info[3], 'hobbies': Update_info[2], 'update_infor': new Date()}},
               function(err, user) {
                  if(err)  
					  throw err;
				  req.session.name = Update_info[1];
                  res.send("Đã cập nhật thành công. Vui lòng đăng nhập lại.")
				  
               });
			 
            }else
            {
               var Date_now = new Date();
               var Date_update = new Date(Information[0].update_infor)//chinh thoi gian IOSdate sang standard Date
               if((Date_now - Date_update) < 24*3600*5*1000)//xac dinh thoi gian nho hon 5 ngay
               {
                  var Time_remain = Date_now - Date_update
                  res.send("Bạn đã cập nhật thông tin. Thời gian update tiếp theo phải sau 15 ngày nữa." + Time_remain)
               }else
               {	//khong thay doi mat khau
				   if(Update_info[4].substring(Update_info[4].length-11, Update_info[4].length)=="oldpassword")
						passofuserupdate = Update_info[4].substring(0, Update_info[4].length-11)
				   else//thay doi mat khau
						passofuserupdate = md5(Update_info[4])
					
                   models.User.findOneAndUpdate({"_id": Update_info[0]}, 
                   { "$set": 
                     {'username': Update_info[1], 'password':  passofuserupdate, 'sex': Update_info[3], 'hobbies': Update_info[2], 'update_infor': new Date()}},
                   function(err, user) {//user la thong tin truoc khi cap nhat--khong dung de change session
                     if(err)  
						 throw err;
					 req.session.name = Update_info[1];
					// console.log(req.session.name + "   " + user.username)
                     res.send("Đã cập nhật thành công. Vui lòng đăng nhập lại để check.")
                  });
				  
               }
            }

         }, 400)

    });

 }

  //cập nhập các tin nhắn đã đọc ứng với người dùng
  if(req.body.youreadmessage && req.session.email )
  {
      models1.Message.update({$and:
         [
            {'id_user_B': req.body.youreadmessage}, //tat ca tin nhan duoc gui cho A duoc coi la da xem
            {'check': 1}
         ]},
         {'check': 0},//da xem tin nhan
         {multi: true})
      .exec(function(err){
         if(err)
            throw err

         console.log("ham nay lai chay.")
         res.send("Ok done.")
      })
  }

}).delete(function(req, res)
{
	
	//khong ton tai session
   if(!req.session)
	   res.redirect('logsg');
	
   //khong ton tai gia tri request
   if(!req.body)
   {
       console.log("Loi request")
      res.status(404).json({ error: 'Something is wrong. We dont know your request.' });
   }
  /*
      Ý tưởng cho việc xóa tin nhắn như sau:
        A và B nhắn tin cho nhau, có csdl message sẽ lưu trữ nội dung tin nhắn giữa 2 người. Bây giờ khi A hoặc
        B muốn xóa tin nhắn giữa 2 người, để tôn trọng quyền của A, Khi B "xóa tin nhắn" thì chỉ B không nhìn thấy
        nội dung tin nhắn giữa 2 người. Còn A vẫn nhìn thấy(giống facebook). Vậy tin nhắn chỉ thực sự bị xóa hoàn 
        toàn khi cả A và B đều muốn xóa tin nhắn của nhau. Có thể dùng cách sau để triển khai ý tưởng trên:

          Tạo thêm 1 collection nữa đặt là Delmessage có các fields: id_A: String-chứa id của A, id_B: String-
          chứa id của A.Thêm 1 trường rất quan trọng là thời gian yêu cầu xóa - Time_del: Date. Bây giờ khi A muốn
          xóa tin nhắn giữa 2 người(B chưa muốn), và A và B lại có những nội dung tin nhắn mới với nhau. Câu hỏi
          đặt ra: Ta sẽ lấy dữ liệu như thế nào để hiển thị ??? Đầu tiên cần truy vấn collection Delmessage với 
          query String condition là Id của A(A yêu cầu) và B nếu có Datetime, lưu lại đặt biến là timedel , 
          sau đó truy vấn collection message load nội dung tin nhắn giữa 2 người với điều kiện nội dung tin nhắn 
          đó có thời gian sau timedel.1 điểm lưu ý là khi B cũng muốn xóa tin nhắn giữa 2 người, ta sẽ so sánh thời
          điểm yêu cầu xóa của A và B, nếu thời gian nào nào ở xa thời điểm hiện tại hơn thì tiến hành xóa thực sự
          collection message. Câu lệnh truy vấn lấy timedel phải thoải mãn thời gian yêu cầu timedel gần thời gian
          hiện tại nhất.

   */

  else if(req.body.you_delconversation && req.session.email)
  {
   
    var Count_message_del = 0;//số lương tin nhắn hiện có
   /* //tao 1 document ghi lai thoi diem hien tai muon xoa tin nhan
    var delmess = new models3.Delmessage({
        user_a_del: req.body.you_delconversation,
        user_b_del: req.body.who_was_del,
      })

      delmess.save(function(err){
        if(err)
           console.log("Da luu yeu cau xoa tin nhan: " + err)
        res.send("Đã xóa thành công.")
      }) */

      //tao neu khong tim thay document phu hop
      models3.Delmessage.update({$and:
         [
            {'user_a_del': req.body.you_delconversation}, 
            {'user_b_del': req.body.who_was_del}
         ]},
         {'timedel': new Date().toISOString()},
         {upsert: true})
      .exec(function(err){
         if(err)
            throw err
         res.send("Đã xóa thành công.")
      })

    
    //khi cả 2 muốn xóa tin nhắn của nhau thì xóa hoàn toàn khỏi csdl
    setTimeout(function()
    {

      models3.Delmessage.find({$and:
         [{'user_a_del': req.body.who_was_del}, {'user_b_del': req.body.you_delconversation}]
      })
      .limit(1)
      .sort({'created_at': -1})
      .exec(function(err, times){
         if(err)
            throw err
       //  console.log(JSON.stringify(times))
         if(times.length > 0)
         {
            models1.Message.remove({ $and:[
            {
               $or:[//tim noi dung nhan tin giua 2 nguoi
               { 
                  $and:[{'id_user_A': req.body.you_delconversation}, {'id_user_B': req.body.who_was_del}]
               }, 
               {
                  $and:[{'id_user_A': req.body.who_was_del}, {'id_user_B': req.body.you_delconversation }] 
               }]
            },
            { 
               'created_at': {$lte: (times[0].timedel).toISOString()}
            }
            ]}, false).exec(function(err)//xoa nhieu ban ghi tim thay
            {
               if (err){ 
                  throw err;
                  res.status(500).json({error: "Error server.!!!" + err})
               }
               console.log('Messages between '+req.body.who_was_del +' and '+ req.body.you_delconversation+' successfully deleted!');
            })
         }
      }) 

    }, 3000)//xoa sau thoi gian 3s
  }

  //khi người dùng muốn bật chat với ai đó cần xóa bản ghi để khôi phục lại trạng thái ban đầu
  else if(req.body.rehabilitatethisperson && req.session.email )
  {
      var who_was_turned_of_by_you = req.body.rehabilitatethisperson

      models4.Chatstatus.remove({$and:[
         {'who_turnofchat': req.body.yourequest}, 
         {'who_was_turned_of': who_was_turned_of_by_you}]
      }).exec(function(err, data)
      {
         if(err) 
            throw err

       //  console.log("Xoa thanh cong ban ghi." + data)
         res.send(JSON.stringify({ notify:'Done.!!!', id: who_was_turned_of_by_you }))
      })
  }

  else{
       console.log("Loi request. Vui long thay doi cau truc truy van.")
       res.status(404).json({ error: 'Something is wrong. We dont know your request.' });
  }

})


//load nguoi dung-nang cao cach tim kiem(neu co thoi gian)
router.route('/home/loaduser')
.get(function(req, res){
	
	//khong ton tai session
   if(!req.session)
	   res.redirect('logsg');

    //load danh sach nguoi dung tu csdl, cần có độ ưu tiên hiển thị những người online trước, sau đó
   //là những người offline với thòi gian online gần nhất với thời điểm hiện tại.Như vậy sort field
   //by status(online hay offline) và time(thời gian off gần nhất)
  if(req.query.loaduser && req.session.email )//co ton tai tai khoan thi moi cho lay du lieu
  {
      //load gia tri nguoi dung ban dau
      var num_of_rq = req.query.num_of_user
      const take_num_loaduser = 12//hằng số giá trị số lượng người dùng được trả về
      
      if(req.query.loaduser == 1)//đây là các mã mà client gửi lên req.query.loaduser
      {                        // nếu mã là 1, client yêu cầu lấy người dùng trong mạng nội bộ

         //đếm số người dùng trong app chat 
         models.User.find({ $and:[ {'role': {$ne: "Admin_all"}},
            {'email': {$ne: req.session.email} } ] })
         .count()
         .exec(function(err, num)
         {
            if(err)
               throw err

            if(num > (num_of_rq - take_num_loaduser)){
               var Skip_fields = parseInt(num_of_rq) - take_num_loaduser;
               var Limit_fields = take_num_loaduser;
            
               if(Skip_fields < 0){
                  Limit_fields = take_num_loaduser + Skip_fields;
                  Skip_fields = 0;
               }
             //  console.log(Skip_fields + "   " + Limit_fields)

               //bo qua email cua admin, admin khong chat trong app
               models.User.find({ $and:[ {'role': {$ne: "Admin_all"} },
                 {'email': {$ne: req.session.email} } ] }, 
                 {created_at: 0, password: 0, __v: 0})
               .sort({status: -1, updated_at: -1})
               .limit(Limit_fields)//gioi han so nguoi can tim
               .skip(Skip_fields)//bo qua so ban ghi tinh tu vi tri dau tien
               .exec(function(err, users)
               {
                  if (err) throw err;
				  
				//  console.log("users la " + JSON.stringify(users))
				  //chinh lai gia tri cua email
				  for(var index = 0; index < users.length; index++)
					users[index].email = Decode_email(users[index].email)
				
                  //tìm kiếm và trả về những người dùng bị chủ nhân yêu cầu không nhìn thấy mặt
                  models4.Chatstatus.find({ 'who_turnofchat': req.session.chat_id }, 
                   function(err, user_remove){
                     if (err) throw err;
					 
                     // Turn_of_chat_someone(users, user_remove)
                     if(user_remove.length > 0)
                     {
                      // console.log(user_remove)
					   for(var index = 0; index < users.length; index++)
							users[index].email = Decode_email(users[index].email)
					  
                        res.send(Turn_of_chat_someone(users, user_remove))
                     }else{
						// console.log(users)
						 
                        res.send(users)//truyen stringify
                     }
                  })

               })

            }else{
               res.send({over_data: "The end."})//truyen ve string
            }
         })
         
      //mã req.query.loaduser là 2 tương ứng với người dùng muốn random 1 người nhóm chat
      }else if(req.query.loaduser == 2 && req.session.email )//tra ve mot nguoi dung random trong danh sach online
      {// có 1 vấn đề đặt ra là hàm random trả về người dùng hiện tại.Người dùng sẽ nt vs chính mình?            

         var Length_of_document;
         models.User.find({}).count(function(err, count)
         {
            Length_of_document = count

            var Random = RandomInt(parseInt(Length_of_document), 0)//random 1 nguoi dua tren vi 
                                       //tri cua nguoi dung trong danh sach
           // console.log(Random + " do dai " + Length_of_document)
            if(Random == 0) Random = 1;//trường hợp skip bỏ qua 

            models.User.find({})
            .limit(1)
            .skip(Random - 1)
            .exec(function(err, user)
            {
				if (err) throw err;
				
				if(user[0].email != req.session.email){//random trung chinh minh
					for(var index = 0; index < user.length; index++)
						user[index].email = Decode_email(user[index].email)
				
					res.send(user)
				}else
					res.send({over_data: "Not found random users. Try again. =)))"})
            }) 
         });
	  
	  //ma tim kiem nay tuong ung voi truy tim nguoi dung trong app
	  }else if(req.query.loaduser == 080695 && req.session.email)
	  {
		  var value = req.query.valsearch
		  models.User.find({_id: value})
         .limit(1)//tim kiem req.query.num nguoi gan dung nhat
         .exec(function(err, users)
         {
            if (err) throw err;
            //console.log("load di " + users)
			for(var index = 0; index < users.length; index++)
				users[index].email = Decode_email(users[index].email)
			
            res.send(users)
         })
        
      }else //với các mã req.query.loaduser không xác đinh, mặc định người dùng tìm kiếm người dùng chat
		  //load nguoi dung voi gia tri tim kiem value duoc nhap boi nguoi dung
      {
         //tim kiếm giá trị gần đúng theo email hoặc tên người dùng khi co nguoi muon tim email
         var valu = req.query.valsearch
		  
		  if(valu.substring(0, 3) == "***")
			valu = valu.substring(3, valu.length)
		  
         models.User.find(
         {
            $or:[//tim kiem gia tri gan dung voi gia tri $options: 'i' khong phan biet hoa thuong
               {username:{'$regex' : '.*' +valu+ '.*', $options: 'i'}}, 
                {email: {'$regex' : '.*' +valu+ '.*', $options: 'i'}}
            ]
         })
         .limit(parseInt(req.query.num))//tim kiem req.query.num nguoi gan dung nhat
         .exec(function(err, users)
         {
            if (err) throw err;
            //console.log("load di " + users)
			if(users.length > 0){//co tim thay du lieu tra ve
				for(var index = 0; index < users.length; index++)
					users[index].email = Decode_email(users[index].email)
				
				res.send(users)
			}else
				res.send({over_data: "Not match value search. Try again"})//khong tim thay du lieu phu hop
			  
         })
      }

  }

})

//load tin nhan cho nguoi dung
router.route('/home/takemessage')
.get(function(req, res){
	
	//khong ton tai session
    if(!req.session)
	   res.redirect('logsg');

    if(req.query.loadmessagea && req.session.email )//req.query.loadmessagea la ma id nguoi dung hien tai muon load message
   {                              //req.query.loadmessageb la nguoi ma nguoi dung hien tai đang nhan tin cung

      //khi kick vào 1 người dùng nào đó server sẽ load, mọi tin nhắn giữa khi người bên kia gửi tin nhắn
      //đến cho chủ thới đều coi là đã xem, vậy cần update lại trạng thái đã đọc tin nhắn giữa 2 người
      //id_user_A là người gửi, id_user_B là người nhận
      models1.Message.update({ $and:[
         { 'id_user_B': req.query.loadmessagea }, {'id_user_A': req.query.loadmessageb}, { 'check': 1 }
      ]}, 
         { 'check': 0 }, //cai dat lai gia tri tuong ung voi $set
         {multi: true })//thay đổi tất cả bản ghi tìm thấy
      .exec(function(err){
         if(err)
            throw err
        // console.log("Da update thanh cong. " + req.query.loadmessagea + "   " + req.query.loadmessageb)
      })


      /* mỗi lần người dùng thanh scroll trong hôp thoại chat thì nếu người dùng cứ request lên liên tục 
       thì đó không phải là 1 ý tưởng tốt. Do đó cần truy cấn csdl tìm ra số lượng tin nhắn hiện tại của
       người dùng với đối phương. do mỗi lần request, số lương tin nhắn cần hiển thị sẽ tăng dần lên, tới
       1 thời điểm nào đó thì số lượng tin nhắn cần hiện thị = số bản ghi thực trong bản ghi, khi đó hệ thống
       sẽ không trả về dữ liệu nữa
      */
      var Count_message = 0;//số lương tin nhắn hiện có
      const take_num_loadmessage = 15;//hằng số load số lương tin nhắn giữa 2 người dùng
      var Timedel = new Date("October 6, 1995 15:15:15").toISOString()//thoi gian duoc khoi tao mac dinh truoc khi app hinh thanh

      //xac dinh xem nguoi dung co xoa tin nhan khong
      models3.Delmessage.find({$and:
         [{'user_a_del': req.query.loadmessagea}, {'user_b_del': req.query.loadmessageb}]
      })
      .limit(1)//gioi han so ban ghi
      .sort({'timedel': -1})//sap xep tang dan theo thoi gian
      .exec(function(err, times){
         if(err)
            throw err
       
         if(times.length > 0){//co ton tai thoi gian xoa
            Timedel = (times[0].timedel).toISOString()
          //  console.log("Thoi gian la 112: " + (times[0].timedel))
         }

         //dem so luong tin nhan giua 2 nguoi luc xoa va chua xoa cua nhau
         models1.Message.find({ $and:[ 
            { $or:[{
               $and:[
                  {'id_user_A': req.query.loadmessagea}, {'id_user_B': req.query.loadmessageb}]}, {

               $and:[
                  {'id_user_A': req.query.loadmessageb}, {'id_user_B': req.query.loadmessagea}]
            }]},
            { 'created_at': { $gte: Timedel }}
                  ]})
         .count(function(err, num)
         {
             Count_message = num;

             //  console.log("so luong tin nhan la: " + Count_message + " " + req.query.num)
             //Hệ thống chỉ trả về mỗi lần request của người dùng 15 tin nhắn bắt đầu từ những tin nhắn mới nhất trở về
            //trước
            if(Count_message > (req.query.num - take_num_loadmessage))
            {
               var Skip_field = Count_message - req.query.num;
               var Limit_field = take_num_loadmessage;
            
               if(Skip_field < 0){
                  Limit_field = take_num_loadmessage + Skip_field;
                  Skip_field = 0;
               }


               models1.Message.find({$and:[{
                  $or:[{
                     $and:[{'id_user_A': req.query.loadmessagea}, {'id_user_B': req.query.loadmessageb}]}, {

                     $and:[{'id_user_A': req.query.loadmessageb}, {'id_user_B': req.query.loadmessagea}]}
                  ]},

                  {'created_at': { $gte: Timedel }} //so sanh thoi gian
               ]})
               .populate({//truy van bo qua null  { "$exists": true, "$ne": null }....
                  path: 'id_user_A',
                  match: 
                  {
                     $or:[{'_id': req.query.loadmessagea}, 
                        {'_id': req.query.loadmessageb}
                  ]},
                  select: {'password': 0, 'updated_at': 0, 'status': 0,  'update_infor': 0} //bo qua ca truong nay
               })
               .skip(Skip_field)// bo qua Skip_field ban ghi
               .limit(Limit_field)//gioi han so ban ghi
               .sort({'created_at': 1})//sap xep tang dan theo thoi gian
               .exec(function(err, message)
               {
                  // console.log(message)
                  if (err) 
                     return handleError(err);
				//  console.log(message)
                  res.send(message)
                });
            }else//2 nguoi dung lan đầu nhắn tin với nhau khi request lên server thì trả về trang rỗng
            {//thử dùng res.render('home') để fix tạm thời
               res.send("The end.")//gia tri string tra ve < 15 ki tu de client khong request nua
            }

         })

      })
   }

})

router.route('/home/topmessage')
.get(function(req, res)
{
	
	//khong ton tai session
   if(!req.session)
	   res.redirect('logsg');
	
	//khong ton tai gia tri request
   if(!req.query){
      res.status(404).json({error: "Not syntax."})
   }

   if(req.query.showtopmessage && req.session.email)
   {
      const take_showtopmessage = 100
      var num_request = parseInt(req.query.showtopmessage)*take_showtopmessage
      var iduser_message = []//bien toan cuc
      //thuc hien dem so luong tin nhan giua 2 nguoi dung voi nhau
         models1.Message.aggregate(
         [{
            $lookup:{
               from: "users",
               localField: "id_user_A",
               foreignField: "_id",
               as: "matchuser"
            }
         }
         ,{
            $lookup:{
               from: "users",
               localField: "id_user_B",
               foreignField: "_id",
               as: "matchuser"
            }
         },
         {$unwind: "$matchuser"},
         {
            $match:
            {
               $and:[{ $or:[ {'id_user_A': mongoose.Types.ObjectId(req.session.chat_id) }, //2 nguoi nhan tin
                           {'id_user_B': mongoose.Types.ObjectId(req.session.chat_id)} ] }, //cho nhau
                   //  {"matchuser.status": 1},//trang thai online la 1
                    /* { "matchuser._id": {$ne: mongoose.Types.ObjectId(req.session.chat_id) } } */] //k phai chinh ng dung  
            }
         },
         {
            $group:
            {
               "_id": {
                  'id_user_A': '$id_user_A',
                  'id_user_B': '$id_user_B'
               },
               "count": { "$sum": 1 }
            }
         },
         {
            $sort:{
               "matchuser.status": -1,
               "count": -1
            }
         },
         { $limit: num_request}, 
         { $skip: 0 } ])
         .then(function(iduser)
         {

          //  console.log(iduser)

            var index = 0, pos = 0;
            var Position_message = new Array()

            //dong bo giua tin nhan gui di va tin nhan duoc nhan
            for(index = 0; index < iduser.length; index++)
            {
               Position_message[index] = index;
               if(iduser[index]._id.id_user_A!= req.session.chat_id){
                  iduser_message[pos] = {
                     _id: iduser[index]._id.id_user_A,
                     count: iduser[index].count
                  }
                  pos++
               }

               if(iduser[index]._id.id_user_B != req.session.chat_id){
                  iduser_message[pos] = {
                     _id: iduser[index]._id.id_user_B,
                     count: iduser[index].count
                  }
                  pos++
               }
            }

            //dem so luong tin nhan tong cong da nhan cua nguoi dung voi nhung nguoi khac
            for(index = 0; index < iduser_message.length - 1; index++)
            {
               for(pos = index+1; pos < iduser_message.length; pos++)
               {
                  if(iduser_message[index]._id.toString() == iduser_message[pos]._id.toString()){
                     iduser_message[index].count += iduser_message[pos].count
                     iduser_message.splice(pos, 1)
                     break;
                  }
               }
            }

            Merge_sort_message_count(iduser_message, Position_message , 0, iduser_message.length-1)

            var Information_user = []

            iduser_message.forEach(function(id)
            {
               Information_user.push(models.User.find({"_id": id._id},
                  {'password': 0, 'updated_at': 0, 'age': 0, 'sex': 0, 'hobbies': 0, 'role': 0, 'status_logout': 0,
                     'num_of_was_warn': 0, '__v': 0, 'created_at': 0, 'update_infor': 0}))
            })

            return Promise.all(Information_user); //dong bo tin nhan va nguoi dung
             

         }).then(function(Result)
         {
            var Result_users = []
            for(var index = 0; index < iduser_message.length; index++)
            {
				//an 1 so ki tu trong email
				Result[index][0].email = Decode_email(Result[index][0].email)
				
                Result_users[index] = {
                  count: iduser_message[index].count,
                  users: Result[index]
                }
            }

            res.send(JSON.stringify(Result_users))

         }).catch(function(error) 
         {
            console.log('one of the queries failed ' + error);
            res.status(500).json({error: "Error server."})
         });

   }else
   {
      console.log("xay ra loi, co the trang web dang bi hack")
      res.status(400).json({error: "Not found."})
   }
})

router.route('/home/infobupdate')
.post(function(req, res)
{
	//khong ton tai session
    if(!req.session)
	   res.res.status(304).send({kickoff: "you was kick out."})
   
	if( req.session.email && req.body.yourequest ){
		models.User.find({'email': req.session.email}, {password: 1, hobbies: 1, sex: 1})
		.exec(function(err, info){
			if(err){
				throw err
				res.status(500).send({err: "Server xay ra loi. Tam dung hoat dong."})
			}else{
				res.status(200).send(JSON.stringify(info))
			}
		})
	}
})


//dieu huong
router.route('/logsg')
.get(function (req, res){
	res.render('login_signup');
})

//dieu huong sang chat nhom
router.route('/home/chatgroup')
.get(function (req, res){

   res.render('chatgroup');
})

//kiem tra su offline cua nguoi dung
//var Onorofline = function(email, time){
//	this.email = email;
//	this.time = time;
//}
/*var index = 0, flag = false, Length;
var Useronoroffline_email = [];//dia chi email
var SocketID = [];//moi connect tuong ung voi 1 ID

//khi clien connect vao server
io.on('connection', function(client)
{  
    console.log('Client connected ' + client.id);//nguoi dung ket noi vao server có 1 giá trị id

    //nhan thong tin la id cua nguoi dung dang nhan tin cung
    client.on('chattingwithsomeone', function(userid)
    {
      client.handshake.session.youarechattingwith = userid
      client.handshake.session.save()//luu lai gia tri nay
    })

    client.on('chat', function(data)//nguoi dung lang nghe tren su kien chat nhan tin cho doi phuong 
    {    
      var id_sender = data.substring(0, 24);//24 so dau la ma nguoi gui
      var id_receiver = data.substring(24, 48);//24 so tiep theo la ma nguoi nhan
      var content = data.substring(48, data.length);//con lai la noi dung chat

      if(data.length > 44){//phải có người gửi thì mới lưu tin nhắn

         // biến này xác định trạng thái tin nhắn đã đọc hay chưa
         var status_read_message = 0;

         //nếu mã người gửi cũng trùng với mã người dùng đang nhắn tin cùng
         //khi người dùng nhắn tin với ai đó thì trên thanh người dùng, tên người dùng đó có màu đỏ

         if((client.handshake.session.youarechattingwith).toString() === id_sender.toString())
            status_read_message = 0;//người dùng chắc chắn đã xem
         else                        // không trùng tức là người dùng khác gửi tin nhăn đến
            status_read_message = 1;//chưa đọc tin nhắn

         // luu du lieu vao co so du lieu, trường user_a_del để xác nhận 1 trong 2 người dùng muốn xóa
         //tin nhắn giữa 2 người họ, khi cả user_a_del và user_b_del cùng chứa mã id của 2 người dùng với
         //nhau thì tin nhắn sẽ thực sự bị xóa trong csdl
         var Amessage = new models1.Message({
            id_user_A: id_sender,
            id_user_B: id_receiver,
            content: content, //noi dung tin nhan
            check: status_read_message//la gia tri de xac dinh da ai doc tin nhan hay chua, mặc định 1 là chưa xem, 0 là đã xem
		   })

         Amessage.save(function(err){
            if(err) 
               console.log("Loi luu tin nhan: " + err)
         })

		    data = id_sender.concat(id_receiver)
		    data = data.concat(content)
	   	 //client.emit('reply', data);
		    client.broadcast.emit('reply', data);//server gui tin nhan den nguoi nhận
      }

    });

    //nguoi dung tat chat thoat khoi page :))), co thong bao ai do da offline
    client.on('disconnect', function()
    {
      
        delete client.handshake.session.youarechattingwith;
        client.handshake.session.save();

        Length = Useronoroffline_email.length
        for(index = 0; index < Length; index++)
        {
          if((client.id) == SocketID[index])
          {
            client.emit('offline', Useronoroffline_email[index].concat("55555"))
            client.broadcast.emit('offline', Useronoroffline_email[index].concat("55555"))

            //luu trang thai nguoi dung vao csdl(trang thai offline)
            models.User.findOneAndUpdate({ 'email': Useronoroffline_email[index]}, 
               {"$set": 
                  { 'status': 0, 'updated_at': new Date().toISOString()} },//cap nhat thoi gian offline
            function(err, user) {
              if (err) throw err;
            });

            //xoa nguoi offline khoi danh danh nguoi dung online
            Useronoroffline_email.splice(index, 1)
            SocketID.splice(index, 1)  
            break;
          }
        }
        //Thong bao cho tat ca may trong server khi co ai do offline
        client.broadcast.emit('useronline', Useronoroffline_email.length)
        client.emit('useronline', Useronoroffline_email.length)
    });
  
    //thong bao nhung ai dang online
    client.on('online', function(data)
    {
    	//xet thoi gian, cho nguoi dung online
      Length = Useronoroffline_email.length
    	for(index = 0; index < Length; index ++)//nguoi dung da ton tai roi thi khong them
      {
        if(Useronoroffline_email[index] == data)
        {
          SocketID[index] = client.id;//sua lai gia tri ID cua nguoi dung

          client.broadcast.emit('offline', data)//bao voi tat ca may khac la tao online
          models.User.findOneAndUpdate({'email': data}, {'status': 1},//cap nhat csdl bao la t online
          function(err, user) {
            if (err) throw err;
          });
          flag = true;
          break;
        }
      }

      //neu chua ton tai nguoi dung
      if(flag == false)
      {
        Length = Useronoroffline_email.length
        Useronoroffline_email[Length] = data;

        models.User.findOneAndUpdate({'email': data}, {'status': 1},//nguoi dung moi thi cap nhat vao csdl
        function(err, user) {
          if (err) throw err;
        });
        SocketID[Length] = client.id;
        
        //thong bao cu the nguoi nao do online
        client.broadcast.emit('offline', data)
      }else flag = false;//khoi tao lai gia tri

    	client.broadcast.emit('useronline', Useronoroffline_email.length)//do dai khong thay doi hoac thay 
                                                             //doi neu co them nguoi dung moi 
    	client.emit('useronline', Useronoroffline_email.length)
   
    })

  //nguoi dung dang nhap tin nhan, báo cho phía bên đối tác: tao đang nhập tin nhắn cho mày
  client.on('chatting', function(data){
    client.broadcast.emit('typing...', data)
  })

}); 

//tao cong de nhan tin
var port = process.env.PORT || 5556;
var ip = process.env.IP || '192.168.1.175'

server.listen(port, ip, function(){
	console.log('Server dang lang nghe nguoi dung chat tai cong %s:%s!', ip, port)
}); 

/*server.listen(port, function(){
	console.log('Server dang lang nghe nguoi dung chat tai cong %s!', port)
}); */



module.exports = router;