var express = require('express')
var app = express()
var bodyParser = require('body-parser')//Đây là một lớp trung gian node.js để xử lí JSON, dự liệu thô, text và mã hóa URL.
var server = require('http').createServer(app) 
var io = require('socket.io')(server);
var morgan = require('morgan') //log/show request and response from client/server
var mongoose = require('mongoose')
	mongoose.Promise = require('bluebird');//dong bo trong truy van moogoose
var md5 = require('md5') // su dung md5 ma hoa pass
var path = require('path')
var session = require('express-session')//bat session luu tru thong tin trong phien lam viec
var mongoStore = require('connect-mongo')(session)
var passport = require('passport')
var cloudinary = require('cloudinary')
var cookieParser = require('cookie-parser')//su dung cookie trong nodejs
var LocalStrategy = require('passport-local').Strategy
var flash = require('connect-flash')//chuong trinh bi loi req.flash is not a funtion,
//dung ham nay de khac phuc loi nay :)))
//connect-float la mot module la mot truong hop dac biet cua session de luu tru message de
//thong bao cho nguoi dung

 //var configDB = require('./models/database')
 //mongoose.connect(configDB.url)

var config = require('./models/database');
config.setConfig();
mongoose.connect(process.env.MONGOOSE_CONNECT);

//tai khoan cloudary moi: phamvanlinh20111993@gmail.com
				  //pass: phamvanlinh20111993

//config cloudinary
cloudinary.config({ 
  cloud_name: 'uet', 
  api_key: '992147968271347', 
  api_secret: 'M9TfXOrwtKx0SklY5wOrxPJv-MU' 
});

var port = process.env.PORT||5555;

app.use(passport.initialize());
//app.use(passport.session());

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}))//limit data transfer from client
app.use(bodyParser.json())

app.use(session({
	secret:'secret',
	saveUninitialized: true,
	resave: false,
	cookie: {maxAge: 24*3600*1000},//neu de secure:true thi session khong duoc khoi tao???
	store: new mongoStore({  // luu session vao co so du lieu mongodb
    	mongooseConnection: mongoose.connection,
    	collection: 'sessions' // default
  	})
}))

app.use(flash())
app.use(cookieParser())//su dung cookie
//app.use(passport.initialize())
//app.use(passport.session())

app.get('/', function(req, res)//khi nguoi dung go localhost:5555 => url se ra localhost:5555/user/logsg
{
	//res.render('login_signup')
	res.redirect('user/logsg');
})

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.set('private', path.join(__dirname, 'private'))
app.set('Image', path.join(__dirname, 'Image'))

app.use(express.static(__dirname + '/views'));//su dung cac file tĩnh trong views
app.use(express.static(__dirname + '/Image'));//su dung cac file tĩnh trong Image
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next){
	res.locals.session = req.session;//su dung session trong file client vi du session.name trong file home.ejs
	next();
});

var login = require('./controllers/login')
var signup = require('./controllers/signup')
var home = require('./controllers/home')
var admin = require('./controllers/admin')
var get_data_upload = require('./controllers/get_data_upload')
var loginwithAPI = require('./controllers/loginAPI')

app.use('/user', login)
app.use('/user', signup)
app.use('/user', home)
app.use('/user', admin)
app.use('/user', get_data_upload)
app.use('/user', loginwithAPI)

var session1 = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
});

var sharedsession = require("express-socket.io-session");

// Use express-session middleware for express
app.use(session1);

// Use shared session middleware for socket.io
// setting autoSave:true cccc
io.use(sharedsession(session1, {
    autoSave:true
})); 


var index = 0, flag = false, Length;
var Useronoroffline_id = [];//dia chi email
var Status_on = [];//mang ghi lai trang thai cap nhat csdl
//so nguoi dung online
var Num_user_on = 0;
//ket noi csdl
var models = require('./models/user')
var models1 = require('./models/message')

//khi clien connect vao server
io.on('connection', function(client)
{  
    console.log('Client connected ' + client.id);//nguoi dung ket noi vao server có 1 giá trị id
	//Num_user_on ++;//so nguoi online tang len 1
	 //thong bao nhung ai dang online
    client.on('online', function(yiduser)//tham so data la email cua nguoi dung
    {
	 client.user_id = yiduser;//gan id nguoi dung cho session socket
     Length = Useronoroffline_id.length
	 
     for(index = 0; index < Length; index ++)//nguoi dung da ton tai roi thi khong them
      {
        if(Useronoroffline_id[index] == yiduser)
        {
		  client.possition = index;
		  //xet thoi gian, cho nguoi dung online
	      client.broadcast.emit('offline', yiduser)//bao voi tat ca may khac la tao online
		  
		  if(Status_on[index] != 1){//nguoi nay chua online bao gio
			models.User.findOneAndUpdate({'_id': yiduser}, {'status': 1},//cap nhat csdl bao la t online-status = 1
			function(err, user) {
				if (err) 
					throw err;
				
				Status_on[index] = 1//gia tri 1 online
			});
			
		  }

          flag = true;
          break;
        }
      }

    //neu chua ton tai nguoi dung thì cập nhật csdl và khởi tạo giá trị ban đầu Status_on
      if(!flag)
      {
        Length = Useronoroffline_id.length
        Useronoroffline_id[Length] = yiduser;	
		
		//khoi tao session vi tri
		client.possition = Length;
		
		models.User.findOneAndUpdate({'_id': yiduser}, {'status': 1},//nguoi dung moi thi cap nhat vao csdl
		function(err, user) {
			if (err) 
				throw err;
		});
		
		Status_on[Length] = 1//gia tri 1 tương ứng với online
		
        //thong bao cu the nguoi nao do online
        client.broadcast.emit('offline', yiduser)// gia tri nguoi dung offline
      }else 
		  flag = false;//khoi tao lai gia tri

    	client.broadcast.emit('useronline', Useronoroffline_id.length)//do dai khong thay doi hoac thay 
                                                             //doi neu co them nguoi dung moi 
    	client.emit('useronline', Useronoroffline_id.length)
	
		//client.broadcast.emit('useronline', Num_user_on)                                              
    //	client.emit('useronline', Num_user_on)
   
    })
	
	 //update code
    client.on('createroomchat', function(data){
      var yid = data.id_y;//24 so dau la ma nguoi gui
      var aid = data.id_a;//24 so tiep theo la ma nguoi nhan
      if(yid > aid){
         client.join(yid + aid)
         client.room = yid + aid
      }else{
         client.join(aid + yid)
         client.room = aid + yid
      }
	  
      console.log("da tao room " + client.room)
    })
	
    //nhan thong tin la id cua nguoi dung dang nhan tin cung
    client.on('chattingwithsomeone', function(userid)
    {
      client.handshake.session.youarechattingwith = userid
      client.handshake.session.save()//luu lai gia tri nay
    })

   client.on('chat', function(data)//nguoi dung lang nghe tren su kien chat nhan tin cho doi phuong 
   {    
        var id_sender = data.id_send;//24 so dau la ma nguoi gui
        var id_receiver = data.id_receive;//24 so tiep theo la ma nguoi nhan
        var content = data.data;//con lai la noi dung chat

      if(id_sender && id_receiver){//phải có người gửi thì mới lưu tin nhắn
         // biến này xác định trạng thái tin nhắn đã đọc hay chưa
         var status_read_message = 0;
		 
         //nếu mã người gửi cũng trùng với mã người dùng đang nhắn tin cùng
         //khi người dùng nhắn tin với ai đó thì trên thanh người dùng, tên người dùng đó có màu đỏ

         if((client.handshake.session.youarechattingwith).toString() === id_sender.toString())
            status_read_message = 0;//người dùng chắc chắn đã xem
         else                       // không trùng tức là người dùng khác gửi tin nhăn đến
            status_read_message = 1;//chưa đọc tin nhắn
		
		 //neu offline thi can gui tin hieu yeu cau reload lai trang web
		 //vi nhieu nguoi dung co the vao cung 1 tai khoan 
		 if(client.possition < Useronoroffline_id.length 
			&& Useronoroffline_id[client.possition] != id_sender){
			client.emit('reloadtoonline', {signal: 'Reload'})
		 }
		
		//nguoi dung nhan tin binh thuong
		if(typeof data.code_id == 'undefined'){
			// luu du lieu vao co so du lieu, trường user_a_del để xác nhận 1 trong 2 người dùng muốn xóa
			//tin nhắn giữa 2 người họ, khi cả user_a_del và user_b_del cùng chứa mã id của 2 người dùng với
			//nhau thì tin nhắn sẽ thực sự bị xóa trong csdl
			content = content.replace(/</g, "&lt;").replace(/>/g, "&gt;")//check noi dung tn
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
			
			io.sockets.in(client.room).emit('reply', {//server gui tin nhan den nguoi nhận
		     	data: content, 
				id_send: id_sender,
				id_receive: id_receiver
			});
			
		}else{
		 
			cloudinary.uploader.upload(content, 
			function(result)
			{
				var Amessage = new models1.Message({
					id_user_A: id_sender,
					id_user_B: id_receiver,
					content: result.url, //noi dung tin nhan la dia chi url
					public_id: result.public_id,
					check: status_read_message//la gia tri de xac dinh da ai doc tin nhan hay chua, mặc định 1 là chưa xem, 0 là đã xem
				})
    
				Amessage.save(function(err){
					if(err) 
						console.log("Loi luu tin nhan: " + err)
				
					console.log("new link: " + result.url)
				
					io.sockets.in(client.room).emit('reply', {
						data: content,
                        code_id: 1,						
						id_send: id_sender,
					    id_receive: id_receiver
				    });
			    })	 

			/*cloudinary.uploader.destroy(result.public_id, 
			function(result) { 
				console.log(result) 
		    });	 */		
		  })
		}
		
		 //kiem tra xem nguoi phia ben kia co dang nt cho mk k?
		io.sockets.in(client.room).emit('testchat', {
			id_send: id_sender,
			id_receive: id_receiver
		});
		
		console.log("Đã nhắn tin vào room " + client.room)
      }

    });

    //nguoi dung tat chat thoat khoi page :))), co thong bao ai do da offline
    client.on('disconnect', function()
    {
		//Num_user_on--;
		client.leave(client.room);
        delete client.handshake.session.youarechattingwith;
        client.handshake.session.save();	
		
		//ghi nhan tam thoi
		Length = Useronoroffline_id.length
		for(index = 0; index < Length; index++)
		{
			if(client.user_id == Useronoroffline_id[index]){
				Status_on[index] = 0;//nguoi dung offline
				//update session possition
				client.possition = index;
				break;
			}
		}
		
		//chay ham setTimeout nay de chac chan nguoi dung offline
		setTimeout(function(){
			//sau khoang thoi gian 15s nguoi dung co gia tri #1 thi la offline hoan toan
			if(Status_on[client.possition] != 1)
			{
				//thong bao nguoi dung offline cho client, them ma xac nhan ton tại gia tri
				if(client.user_id){
					client.emit('offline', client.user_id.concat("55555"))//thêm mã kí hiệu là offline
					client.broadcast.emit('offline', client.user_id.concat("55555"))
				}
			
				//luu trang thai nguoi dung vao csdl(trang thai offline)
				models.User.findOneAndUpdate({ '_id': client.user_id }, 
				{"$set": 
					{ 'status': 0, 'updated_at': new Date().toISOString()} },//cap nhat thoi gian offline
				function(err, user){
					if (err) 
						throw err;
				});
			
				//xoa nguoi offline khoi danh danh nguoi dung online ơ vi tri Possition
				for(index = 0; index < Length; index++){
					if(client.user_id == Useronoroffline_id[index]){
						Useronoroffline_id.splice(index, 1)
						break;
					}
				}
				
				console.log("Người dùng " + client.user_id + " đã offline. ")
			}else//hien thi thong bao nguoi dung da offline
				console.log("Người dùng " + client.user_id + " load lại trang.")
			
			//Thong bao cho tat ca may trong server khi co ai do offline
			//client.broadcast.emit('useronline', Num_user_on)
			//client.emit('useronline',  Num_user_on)
			
			client.broadcast.emit('useronline', Useronoroffline_id.length)
			client.emit('useronline', Useronoroffline_id.length)
			
		}, 15000)//set thoi gian de chac chan nguoi dung offline chu khong phai dang load lai page		
		
    });

  //nguoi dung dang nhap tin nhan, báo cho phía bên đối tác: tao đang nhập tin nhắn cho mày
  client.on('chatting', function(data){
      client.broadcast.emit('typing...', data)
  })

});

//ham check nguoi online nhưng do lỗi server chưa cập nhật được
//thoi gian check la 5 phút/lần
const time_set = 1000*300
const error_user_on = 1;//sai số với thực tế là 1 người
var flag_user_on = false;


/*function Query_mongo_loop(index, Length, callback)
{
	if(index < Length)
	{
		var flag_user_on = false;
		for(var pos = 0; pos < Useronoroffline_id.length; pos++)
        {
			if(users[index]._id == Useronoroffline_id[pos]){
				flag_user_on = true;
				break;
            }
        }
               	 //cap nhat lai gia tri
        if(!flag_user_on){
            models.User.findOneAndUpdate({'_id': users[index]._id}, {'status': 0},
            function(err){
                if(err)
                  throw err
			  
			    console.log("da run2 " + index)
				Query_mongo_loop(index + 1, Length, callback)	   
                
            });
        }
    }else{
		callback();
	}
	
} */


setInterval(function()
{
   if(Useronoroffline_id.length < 500){//server co duoi 500 nguoi online thi tien hanh kiem tra
      models.User.find({"status": 1})
      .count()
      .exec(function(err, Amount){
         if(err)
            throw err
         //co su sai lech, server chay sai, sua ngay
         if(Amount - Useronoroffline_id.length >= error_user_on)
         {
            models.User.find({"status": 1}, {"_id": 1})//chi lay gia tri _id
            .sort({"updated_at": 1})
            .exec(function(err, users)
            {
               if(err)
                  throw err

               console.log("da run1" + JSON.stringify(users))
		    
		// Chay theo kieu muon dong bo giua cac tien trinh
		//	   Query_mongo_loop(0, users.length, function(){
		//		   console.log("Hoan tat viec chay.")
		//	   })
				//ton tai nguoi dung dang online
			   if(users.length > 0){
               //tra ve thang thai offline
				  for(var index = 0; index < users.length; index++){
					for(var pos = 0; pos < Useronoroffline_id.length; pos++)
					{
						flag_user_on = false;
						if(users[index]._id == Useronoroffline_id[pos]){
							flag_user_on = true;
							break;
						}
					}
					//cap nhat lai gia tri
					if(!flag_user_on){
						models.User.findOneAndUpdate({'_id': users[index]._id}, {'status': 0},
						function(err){
							if(err)
								throw err
						});
					}

				 }
			   }

            })
         }
      })
   }

}, time_set)
//tai khoan Mlab: PhamVanLinh-Phamvanlinh12345
//pass dang nhap: e10adc3949ba59abbe56e057f20f883e

server.listen(port, function(){
	console.log('Server dang chay tai cong %s!', port)
});
