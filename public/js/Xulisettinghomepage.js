   
   //kiem tra tinh hop le cua ten nguoi dung
    function Check_error_name(val)
    {
      var string = "";

      if(val !="")
      {
         if(val.length > 4){//ten su dung chua noi dung tho tuc
            var obscene = ["địt", "dit", "đit", "lồn", "lon", "lòn", "lôn", "lon'", "chịch", "chich", "buồi", "buoi", "buôi", "fuck", "bitch", "bop vu", "bop vú", "bóp vu", "bóp vú", "vcl", "đm", "dm", "ngu", "đít","lỗ l", "cl", "liem chim", "liếm chim", "blow job", "mút cu", "cặc", "căc", "vl", "con cac"];
            for(var pos = 0; pos < obscene.length; pos++)
            {
              if(val.includes(obscene[pos]) == true){
                string  = "Tên của bạn chứa nội dung vô văn hóa.";
                break;
              }
            }
          }else   string  = "Tên chứa ít nhất 4 kí tự";
        }else   string  = "Không để trống tên của bạn.";

        return string;
     }

     //ham gui tin hieu den server ve viec cap nhat thong tin cua nguoi dung
     //tham so Update_infor la 1 mang chua các thong tin update của người dùng
     //có tham số chỉ cho phép cập nhật 1 lần duy nhất, vì server không thể xử lí quá nhiều yêu cầu
     var Count_update_infor_user = 0;
     function Update_infor_user(Update_info)
     {	
     		if(Count_update_infor_user == 0){//chỉ cho phép cập nhật 1 lần
     			//su dung ajax
     			Update_info[0] = yid;//lay ma phan biet nguoi dung
				
				//bao cho server biet nguoi dung khong doi mat khau
				if(ypass == Update_info[4])
					Update_info[4] += "oldpassword"
				
     			$.ajax({
     				type: "PUT",
     				url: "/user/home",
     				data:{ update_user_info: JSON.stringify(Update_info)},//chuyen mang thanh string upload len server
     				success: function(data)
               {
                  var Length = data.length //lấy độ dài của string
                  var Time_remain, Data;
                  if(Length > 60)//Server không trả vể việc update dữ liệu thành công, khi đó dữ liệu trả vể
                  {              //kèm theo thời gian đã update, client sẽ xử lí và hiện ra cho người dùng
                     Time_remain = parseInt(data.substring(75, Length));
                     Time_remain += parseInt(new Date().getTime())
                     Data = data.substring(0, 75);
     					   alert(Data + " Thời gian update tiếp theo " + Time_stand_para(Time_remain))

                  }else
                      alert(data)
                      location.reload();
     					$('#myModal').modal('hide');//an modal boostrap
     				}
     			})
     		}else{
     			alert("Bạn đã cập nhật thông tin. Thời gian update tiếp theo phải sau 15 ngày nữa.")
     			$('#myModal').modal('hide');//an modal boostrap
     		}
     		Count_update_infor_user++;
     }

     //ham canh bao nguoi dung, voi gia tri la các giá trị cảnh báo
     var count_user_warnning_someone = 0;
     function Warnning_Someone(who_warning, value)
     {	
     		//su dung ajax
         if(count_user_warnning_someone < 6)
         {
     		  $.ajax({
     			    type: "POST",
     			    url: "/user/home",
     			    data:{ warning_someone: who_warning, warning: value },
     			    success: function(data)
               {
     				   alert(data)
     				   $('#myModal1').modal('hide');
					   location.reload()
     			   }
     		   })
         }else{
             $('#myModal10').modal('show');
             setTimeout(function() {
                // body...
                $('#myModal10').modal('hidden');
             }, 2000)
         }
         count_user_warnning_someone ++;
     }

     
    //tắt chat với 1 số người, với 2 tham sô là 
    //you là mã số của bạn, someone là mã số người bạn muốn tắt chat
    function TurnOfChat_someone(you, someone)
    {
    	//su dung ajax
     		$.ajax({
     			type: "POST",
     			url: "/user/home",
     			data:{you_turnofchat: you, who_was_blocked: someone},
     			success: function(data){
     				alert(data)
               location.reload()//refresh lại trang web
     			}
     		})
    }

    //Xóa vĩnh viễn hội thoại với 1 số người, với 2 tham sô là 
    //you là mã số của bạn, someone là mã số người bạn muốn xóa tin nhắn
    function Del_conversation_someone(you, someone)
    {
      //su dung ajax
      $.ajax({
         type: "DELETE",
         url: "/user/home",
         data:{you_delconversation: you, who_was_del: someone},
         success: function(data){
            alert(data)
            location.reload()//refresh lại trang web
         }
      })
    }
	
	//ham lay thong tin cap nhat thong tin cua nguoi dung
	function Infor_beforeupdate(callback)
    {
    	//su dung ajax
     	$.ajax({
     		type: "POST",
     		url: "/user/home/infobupdate",
     		data:{yourequest: yid},
     		success: function(data)
			{
				if(typeof callback == 'function')
					callback(data);//tra ve du lieu
     		}
     	})
    }
	
	//hien thi modal
	var ypass = ""
	function UpdateProfile()
	{
		Infor_beforeupdate(function(data){
			if(typeof data.err != 'undefined')
			{
				alert(data.err)
			}else if(typeof data.kickoff != 'undefined'){
				location.href = "./user/logsg"
			}else
			{
				//hien thi modal
				$('#myModal').modal('show')
				var infouser = JSON.parse(data)
				ypass = infouser[0].password
				
				if(infouser[0].hobbies){
					Change_your_profile_body_textarea[0].value = infouser[0].hobbies
				}
				
				if(infouser[0].sex){
					if(infouser[0].sex == "boy")
						Change_your_profile_body_input[6].checked = true	
					else if(infouser[0].sex == "girl")
						Change_your_profile_body_input[7].checked = true	
				}
			}
		})
	}

  //tat hop thoai chat voi nguoi dung dang nhan tin hien tai
	function TurnOfChat()
	{
		var index = 0, user_name = "", id_user = "";

      if(Information_user('truefalse'))
      {
         //lay ten nguoi dung 
         user_name = Information_user('name')
		id_user = Information_user('id') // lay id nguoi dung  
		var r = confirm("Bạn chắc chắn tắt chat với "+ user_name + ", Sau 10 ngày hệ thống sẽ tự động bật chat ???")
		if(r == true){
			TurnOfChat_someone(yid, id_user)
		}
      }else{
		  alert("Bạn chưa chọn ai để tắt cuộc hội thoại.")
	  }

	}

  //xóa cuộc hội thoại của người dùng, nội dung tin nhắn đã từng nhắn tin với người dùng bất kì sẽ bị xóa
  function DelConversation()
  {   
      var user_name = "", id_user = "";

      if(Information_user('truefalse'))
      {
         //lay ten nguoi dung 
         user_name = Information_user('name')//lay ten nguoi dung bi xoa
         id_user = Information_user('id') // lay id nguoi dung  ben kia 
		 var r = confirm("Bạn chắc chắn xoá hết hội thoại với "+ user_name + "???")
		 if(r == true){
			Del_conversation_someone(yid, id_user)
		 }
      }else{
		  alert("Bạn chưa chọn ai để xóa nội dung hội thoại.")
	  }

  }

    //thuc hien cai dat hien thi tin nhan....tren trang chu
	//DOM thay doi, bat su kien cho thay doi thong tin nguoi dung
	var Change_your_profile = document.getElementById('myModal')

	//DOM thay doi, bat su kien viec canh bao nguoi dung khac
	var Warnning_someone = document.getElementById('myModal1')

	//DOM thay doi, bat su kien viec thay doi cai dat
	var Setting_your_app = document.getElementById('myModal2')

	//thay doi main body tren thay doi cai dat
	var Setting_your_app_body = Setting_your_app.getElementsByClassName("modal-body")

	//thay doi main body tren thay doi thong tin nguoi dung
	var Change_your_profile_body = Change_your_profile.getElementsByClassName("modal-body")

	//lay cac gia tri input bao gom tuoi, ten, so thich nguoi dung
	var Change_your_profile_body_input = Change_your_profile_body[0].getElementsByTagName("input")

	//lay cac gia tri textarea update thong tin nguoi dung
	var Change_your_profile_body_textarea = Change_your_profile_body[0].getElementsByTagName("textarea")

	//Bat loi nguoi dung khi nhap sai
	var Change_your_profile_body_error = Change_your_profile_body[0].getElementsByClassName("tagp")

	//Submit button thong tin
	var Change_your_profile_body_submit = Change_your_profile_body[0].getElementsByTagName("button")

	//thay doi main body tren thay doi cac checkbox
	var Warnning_someone_body = Warnning_someone.getElementsByClassName("modal-body")

	//lay cac gia tri checkbox kiem tra chi cho check vao 1 o
	var Warnning_someone_body_checkbox = Warnning_someone_body[0].getElementsByClassName("checkbox")

	//lay gia tri button trong body
	var Warnning_someone_body_button = Warnning_someone_body[0].getElementsByTagName("button")

	//lay gia tri cua o textbox tuong ung
	var Warnning_someone_body_checkbox_input = Warnning_someone_body[0].getElementsByTagName("input")
	var position_checkbox = 0, jj, indd;

	 //ham bat su kien khi nguoi dung muon hien thi tin nhan nguoi dung
   function Show_password(it)
   {	
   	//ham chi thuc hien neu nguoi dung nhap thay doi password va gia tri mat khau khong rong
     	if(Change_your_profile_body_input[1].checked == true && Change_your_profile_body_input[4].value != "")
     	{
     		it.style.color = "orange";
     		var After = Change_your_profile_body_input[4]//tao the input truoc the input nay
     		var In = Change_your_profile_body[0].getElementsByClassName("input-group")
     		Create_input_tag(After, In[3], Change_your_profile_body_input[4].value)//trong the div

     		setTimeout(function(){
     			Delete_input_tag(In[3])
     			it.style.color = "black"
     		}, 4000)// xoa the nay sau thoi gian 4s
     	}
   }

   //ham tao the input type text de hien thi password nguoi dung
   //tham so after la tao the nay o truoc hay sau the nao(input, div, ..)
   function Create_input_tag(After, In, val)
   {
   	var para = document.createElement("input");
   	para.setAttribute('type', 'text');
		para.setAttribute('value', val);
		para.setAttribute('class', 'form-control')
		para.setAttribute('disabled', 'true')

		In.insertBefore(para, After);
		Change_your_profile_body_input[5].style.display = "none"//an the input nay
   }

   //ham xoa the input
   function Delete_input_tag(it)
   {
		var child = it.getElementsByTagName("input")
		child[1].style.display = "block"
		it.removeChild(child[0]);
   }

	//ham bat loi nguoi dung khi nguoi dung nhap sai gia tri, validate input
	//gom 2 tham so Value la gia tri nhap vao, pos la vi tri cua the input trong form
   function Capture_error_update_infor(val, pos)
   {
   	var Str = "";
   	switch(pos)
   	{
   		case 0: //chinh sua ten
   			Str = Check_error_name(val.toLowerCase());
   			break

   		case 1://nhap password hien tai
   			if(val.length < 6)  
              Str = "Mật khẩu lớn hơn 6 kí tự.";
            else if(val == "") 
              Str = "Không để trống trường mật khẩu.";
		  //bien doi ve dang md5 de so sanh
           	else if(md5(val).localeCompare(ypass) != 0)//day khong phai la mat khau cu cua nguoi dung
           		Str = "Đây không phải mật khẩu hiện tại của bạn.";
            break;

         case 2://nhap mat khau moi 
         	//mat khau moi khong duoc trung voi mat khau cu
         	if(val != "")
         	{
         		if(val.length < 6)  
              		Str = "Mật khẩu lớn hơn 6 kí tự.";
         		else if(val.localeCompare(ypass) == 0)
         			Str = "Đây chính là mật khẩu hiện tại của bạn.";
         	}else  Str = "Không để trống trường này.";
         	break

         case 3:
         	//nhap lại mật khẩu mới 1 lần nữa để người dùng ghi nhớ mật khẩu
         	var new_pass = Change_your_profile_body_input[4].value;
         	if(val.localeCompare(new_pass) != 0)
         		Str = "Mật khẩu mới không trùng khớp.";
         	if(val == "") Str = "Không để trống trường này.";
        		break

   	}

   	return Str;
   }

   //check loi cua so thich nguoi dung
   function Check_error_hobbies(val)
   {
   	var Str = "";

      if(val == ""){
        	Str = "Không được để trống sở thích của bạn ";
      }else{
      	if(val.length < 10){
      		Str = "Sở thích quá ngắn. ";
      	}else{
        		var obscene = ["địt", "dit", "đit", "lồn", "lon", "lòn", "lôn", "lon'", "chịch", "chich", "buồi", "buoi", "buôi", "fuck", "bitch", "bop vu", "bop vú", "bóp vu", "bóp vú", "vcl", "đm", "dm", "ngu", "đít","lỗ l", "cl", "liem chim", "liếm chim", "blow job", "mút cu", "cặc", "căc", "vl", "con cac"];
        	 	for(var pos = 0; pos < obscene.length; pos++)
         	{
            	if(val.localeCompare(obscene[pos]) == 0){
               	Str  = "Không ghi sở thích mất lịch sự vào đây.";
               	break;
            	}
         	}
      	}
      }

      return Str;
   }


	//xac dinh vi tri cua cac the checkbox
	for(var i = 0; i <  Warnning_someone_body_checkbox.length; i++)
      Warnning_someone_body_checkbox_input[i].alt = i;

   //xac dinh vi tri cua cac the input cap nhat thay doi thong tin nguoi dung
	for(var i = 0; i < Change_your_profile_body_input.length; i++)
      Change_your_profile_body_input[i].alt = i;

   //bat su kien checkbox
	for(indd = 0; indd < Warnning_someone_body_checkbox.length; indd++)
	{
		Warnning_someone_body_checkbox_input[indd].addEventListener("click", function()
		{
			if(this === document.activeElement){
            position_checkbox = parseInt(this.alt);
         }

			for(jj = 0; jj < Warnning_someone_body_checkbox.length; jj++){
				Warnning_someone_body_checkbox_input = Warnning_someone_body_checkbox[jj].getElementsByTagName("input")
				Warnning_someone_body_checkbox_input[0].checked == false;
			}

			//kiem tra chi cho nguoi dung check 1 vi tri
			for(jj = 0; jj < Warnning_someone_body_checkbox.length; jj++){
				Warnning_someone_body_checkbox_input = Warnning_someone_body_checkbox[jj].getElementsByTagName("input")
				if(position_checkbox == jj){
					Warnning_someone_body_checkbox_input[0].checked == true
					continue;
				}else{
					Warnning_someone_body_checkbox_input[0].checked = false;
				}
			}

		})
	}

	//canh bao nguoi dung, an warning
	var Warnning_someone_body_form = Warnning_someone_body[0].getElementsByTagName("form")//form warning
	Warnning_someone_body_button[0].addEventListener("click", function(){
		 var true_false = false, valu = "";
		 for(jj = 0; jj < Warnning_someone_body_checkbox.length; jj++){
				Warnning_someone_body_checkbox_input = Warnning_someone_body_checkbox[jj].getElementsByTagName("input")
				if(Warnning_someone_body_checkbox_input[0].checked == true){
					valu = Warnning_someone_body_checkbox_input[0].value
					true_false = true;
					break
				}
			}
		if(true_false){
			var  who_warning;
         if(Information_user('truefalse'))//người dùng đang nói chuyện với ai
         {
            who_warning = Information_user('id')//lay id ma nguoi dung se canh bao
			Warnning_Someone(who_warning, valu)//tham so who_warning la cảnh báo ai, valu là mã cảnh báo
         }else{
			 alert("Bạn chưa chọn người dùng nào để cảnh báo.");
		 }
			 
		}
		 	
	})

  	//vi tri 1, 2 la checkbox nhap pass hay khong
  	//thay doi password
  	Change_your_profile_body_input[1].addEventListener("click", function(){
  		if(this === document.activeElement){//kick hoat vao o input
  			Change_your_profile_body_input[2].checked = false;//bo check o o kia
  			Change_your_profile_body_input[3].disabled = false;
  			Change_your_profile_body_input[4].disabled = false;
  			Change_your_profile_body_input[5].disabled = false;

  		}
  	})

  	//khong thay doi password
  	Change_your_profile_body_input[2].addEventListener("click", function(){
  		if(this === document.activeElement)
  		{//kick hoat vao o input
  			Change_your_profile_body_input[1].checked = false;
  			//cho phep nguoi dung cap nhat thong tin vao các thẻ này
  			Change_your_profile_body_input[3].disabled = true;
  			Change_your_profile_body_input[4].disabled = true;
  			Change_your_profile_body_input[5].disabled = true;
  			//reset toan bo noi dung cua password khi nguoi dung khong muon tich bo thay doi pass
  			Change_your_profile_body_error[1].innerHTML = ""
  			Change_your_profile_body_error[2].innerHTML = ""
			Change_your_profile_body_error[3].innerHTML = ""
			Change_your_profile_body_input[3].value = ""
			Change_your_profile_body_input[4].value = ""
			Change_your_profile_body_input[5].value = ""
  		}
  	})

	//cap nhat ten
	Change_your_profile_body_input[0].addEventListener("blur", function(){
      Error_update = Capture_error_update_infor(Change_your_profile_body_input[0].value, 0);
		if(Error_update != "")//co loi xay ra
			Change_your_profile_body_error[0].innerHTML = Error_update//hien thi thong bao loi
	})

	//bat su kien khi nguoi dung thay doi thong tin, nhap pass hien tai
	Change_your_profile_body_input[3].addEventListener("blur", function(){
		if(Change_your_profile_body_input[1].checked == true)
		{//khi nguoi dung muon thay doi password 
			var Error_update = Capture_error_update_infor(Change_your_profile_body_input[3].value, 1);
			if(Error_update != "")//co loi xay ra
				Change_your_profile_body_error[1].innerHTML = Error_update//hien thi thong bao loi
      }
	})

	//nhap mat khau moi
	Change_your_profile_body_input[4].addEventListener("blur", function(){
		if(Change_your_profile_body_input[1].checked == true)
		{//khi nguoi dung muon thay doi password 
			var Error_update = Capture_error_update_infor(Change_your_profile_body_input[4].value, 2);
			if(Error_update != "")//co loi xay ra
				Change_your_profile_body_error[2].innerHTML = Error_update//hien thi thong bao loi
      }
	})

	//nhap lai mat khau moi
	Change_your_profile_body_input[5].addEventListener("blur", function(){
		if(Change_your_profile_body_input[1].checked == true)
		{//khi nguoi dung muon thay doi password 
			var Error_update = Capture_error_update_infor(Change_your_profile_body_input[5].value, 3);
			if(Error_update != "")//co loi xay ra
				Change_your_profile_body_error[3].innerHTML = Error_update//hien thi thong bao loi
      }
	})

	//the textarea khi nguoi dung muon cap nhat so thich 
	Change_your_profile_body_textarea[0].addEventListener("blur", function(){
		var Error_update = Check_error_hobbies(Change_your_profile_body_textarea[0].value)
		if(Error_update != ""){
			Change_your_profile_body_error[4].innerHTML = Error_update;
		}
	})

	//tat thong bao loi the textarea khi nguoi dung kick vao thẻ đó
	Change_your_profile_body_textarea[0].addEventListener("click", function(){
		Change_your_profile_body_error[4].innerHTML = "";
	})

	//tat thong bao loi
	for(indd = 0; indd < Change_your_profile_body_input.length - 3; indd++)
	{
		Change_your_profile_body_input[indd].addEventListener("click", function(){
		 	if(this === document.activeElement){
		 		if(parseInt(this.alt) == 0){
		 			Change_your_profile_body_error[0].innerHTML = "";
		 		}else{
		 			if(parseInt(this.alt) != 2 && parseInt(this.alt) != 1 && parseInt(this.alt) < 7)
           			Change_your_profile_body_error[(parseInt(this.alt) - 2)].innerHTML = "";
           	}
		 	}
		})
	}

	//cap nhat thong tin nguoi dung, an submit
	//phai tien hanh kiem tra form co xay ra loi hay khong, neu có thi không submit form
	var True_or_false = true, Error_update = "";
	Change_your_profile_body_submit[0].addEventListener("click", function()
	{
		True_or_false = true
		//phat hien loi cua nguoi dung
		Error_update = Capture_error_update_infor(Change_your_profile_body_input[0].value, 0)
		if(Error_update != ""){
			Change_your_profile_body_error[0].innerHTML = Error_update;
			True_or_false = false;
		}
		//neu nguoi dung thay doi password
		if(Change_your_profile_body_input[1].checked == true){
			for(var position123 = 3; position123 < 6; position123++){
				Error_update = Capture_error_update_infor(Change_your_profile_body_input[position123].value, (position123 - 2))
				if(Error_update != ""){
					Change_your_profile_body_error[(position123 - 2)].innerHTML = Error_update;
					True_or_false = false;
				}
			}
		}

		//thong tin ve so thich
		if(Check_error_hobbies(Change_your_profile_body_textarea[0].value) != ""){
			Change_your_profile_body_error[4].innerHTML = Check_error_hobbies(Change_your_profile_body_textarea[0].value);
			True_or_false = false;
		}

		//	console.log(True_or_false)
		if(True_or_false == true){
			var Update_infos = []//mang thong tin cap nhat nguoi dung
			Update_infos[1] = Change_your_profile_body_input[0].value;//gia tri sau khi nhap, ten nguoi dùng
			Update_infos[2] = Change_your_profile_body_textarea[0].value;;//gia tri sau khi nhap,sở thích
			var index42;
			//cap nhat thay doi gioi tinh
			for(index42 = 6; index42 < 9; index42++){
				if(Change_your_profile_body_input[index42].checked){
					Update_infos[3] = Change_your_profile_body_input[index42].value
					break
				}
			}

			//kiem tra co thay doi password k
			if(Change_your_profile_body_input[1].checked == true){
				Update_infos[4] = Change_your_profile_body_input[5].value;
			}else{
				Update_infos[4] = ypass;
			}

			Update_infor_user(Update_infos)//submit form using ajax
		}
	})

   //Top tin nhắn hiển thị của người dùng tham so num la so luong request
   function Top_chat_users(num, callback)
   {
      //su dung ajax
        $.ajax({
          type: "GET",
          url: "/user/home/topmessage",
          data:{showtopmessage: num}, 
          success: function(data)
          {
            if(typeof callback == "function")
               callback(data);//tra ve du lieu
          }
        })
   }

   //ham se bat su kien nhan tin voi nguoi dung
   function Click_to_chat(userid)
   {  
      var indd = 0, Save_status_user_now = "", usernothere = false;
      //tìm kiếm xem ai đã nhắn tin cho mk
      for(indd = 0; indd < Status_user_div.length; indd++)
      {
                  
         Span_status_user_div = Status_user_div[indd].getElementsByTagName("span")
         Input_hidden_id_user = Status_user_div[indd].getElementsByTagName("input")
         
         if(Input_hidden_id_user[1].value.localeCompare(userid) == 0)
         {
            Chat(Span_status_user_div[0])//kick tu dong vao nguoi dung do
            //load scroll đến vị trí đó để người dùng tiện theo dõi =)))
            Sub_div_infor_user_on[0].scrollTop = (Sub_div_infor_user_on[0].scrollHeight*indd)/Status_user_div.length - 120
            usernothere = true
            break
         }
      }

      //nguoi dung khong nam trong danh sach thi phai tim kiem trong csdl va them vao
      if(!usernothere)
      {
         Load_user(080695, userid, 1, function(data){
            Show_list_user(data, 080695, userid)
            Sub_div_infor_user_on[0].scrollTop  =  Sub_div_infor_user_on[0].scrollHeight - 50

            //tu dong kich vao nguoi dung do :)))
            Span_status_user_div = Status_user_div[(Status_user_div.length - 1)].getElementsByTagName("span")
            Chat(Span_status_user_div[0])

            H5_status_user_div = Status_user_div[(Status_user_div.length - 1)].getElementsByTagName("h5")
            H5_status_user_div.innerHTML = "(Có tin nhắn đến...)"

         })
      }

      $('#myModal1000').modal('hide');
   }

   //ham hien thi list danh sach top nhan tin

   function Show_chat_users(data)
   {
       //khai bao bien
      var Model = document.getElementById("myModal1000")
      var Model_body = Model.getElementsByClassName("modal-body")[0]
      var Model_body_table = Model_body.getElementsByTagName("table")[0]
      var Model_body_table_tbody = Model_body_table.getElementsByTagName("tbody")[0]
      document.getElementById("showloadingchatusers").style.display = "none"
      Model_body_table_tbody.innerHTML = ""

      data = JSON.parse(data)
      var ind = 0, Length = data.length, ele = ""

      if(Length > 0)
      {
         var Count_on = 0;
         document.getElementById("Total_top_chat").innerHTML = "Total: " + Length
         for(ind = Length - 1; ind >= 0; ind--)
         {
            ele += '<tr>'
            ele += '<td style="text-align: center;">'  +  (Length - ind)   +  '</td>'
            ele += '<td style="text-align: center;"><img src="'+data[ind].users[0].image+'" class="img-rounded" alt="Lỗi ảnh đại diện" style="height: 40px;width: 40px;"></td>'
            ele += '<td style="text-align: center;" data-toggle="tooltip" title="'+ data[ind].users[0].email +'"><h4 style="cursor: pointer;"><i>'  +  data[ind].users[0].username  +  '</i></h4></td>'

            ele += '<td style="text-align: center;"> <h4></b>'  +  data[ind].count   +  '</b></h4></td>'
            if(parseInt(data[ind].users[0].status) == 0){
               ele += '<td style="text-align: center;">Off</td>'
               ele += '<td style="text-align: center;">None</td>'
            }
            else{
               Count_on++
               ele += '<td style="text-align: center;">On</td>'
               ele += '<td style="text-align: center;"><button type="button" class="btn" onclick = "Click_to_chat(\''+data[ind].users[0]._id+'\')">Click</button></td>'
            }
        
            ele += '</tr></br>'
         }
         Model_body_table_tbody.innerHTML += ele
         document.getElementById("Online_loadingchatusers").innerHTML = "Online: <i style='color:red;'>" + Count_on + "</i>"

      }else{
          document.getElementById("Total_top_chat").innerHTML = "Total: 0"
          Model_body_table_tbody.innerHTML += '<div class="alert alert-info"><strong>Infor!</strong> Bạn chưa nhắn tin cho ai. Hãy chat với ai đó và chúng tôi sẽ duy trì liên lạc cho bạn </div>'
      }

   }

   var Showtopmessage = document.getElementById("showtopmessage")
   Showtopmessage.addEventListener("click", function()
   {
      $('#myModal1000').modal('show')
      window.history.pushState(yid, "topmessage", "/user/home?topmessage=" + yid);
      document.getElementById("showloadingchatusers").style.display = "block"

      Top_chat_users(1, function(data){
         Show_chat_users(data)
      }) 
   })