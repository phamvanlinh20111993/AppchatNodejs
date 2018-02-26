//upload icon, video, audio, ..so on
var Upload_any_thing = document.getElementById("uploadanything")
var Upload_any_thing_table = Upload_any_thing.getElementsByTagName("table")[0]
//table td
var Upload_any_thing_table_icon = Upload_any_thing_table.getElementsByTagName("td")[0]
var Upload_any_thing_table_document = Upload_any_thing_table.getElementsByTagName("td")[1]
var Upload_any_thing_table_image = Upload_any_thing_table.getElementsByTagName("td")[2]
var Upload_any_thing_table_video = Upload_any_thing_table.getElementsByTagName("td")[3]
var Upload_any_thing_table_camera = Upload_any_thing_table.getElementsByTagName("td")[4]
var Upload_any_thing_table_call_video = Upload_any_thing_table.getElementsByTagName("td")[5]

//input type file with match event
var Upload_document = document.getElementById("uploaddocument")
var Upload_image = document.getElementById("uploadimage")
var Upload_video = document.getElementById("uploadvideo")
var max_file_size_image = 5*1024*1024//5MB
var max_file_size_document = 50*1024*1024//50MB


//get event from icon awesome
Upload_any_thing_table_icon.addEventListener("click", function(){
	var abc = confirm("choose some ")
})

//get event from document awesome
Upload_any_thing_table_document.addEventListener("click", function()
{
	Upload_document.click();

})

//su dung ajax voi XMLHttpRequest, upload len server, not refresh page
document.getElementById("uploadFormimage").onsubmit = function(event)
{
	console.log("why not run me")
	var imfomation = Upload_image.files[0]
	var name = imfomation.name
   	event.preventDefault();
    // Create a new FormData object.
    var formData = new FormData();
    // Add the file to the request.
    formData.append('imageupload', imfomation, name);
    // Set up the AJAX request.
    var xhr = new XMLHttpRequest();
    // Open the connection.
    xhr.open('POST', '/user/upload/image', true);
    xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
   // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // Set up a handler for when the request finishes.
    xhr.onload = function () {
        if (xhr.status === 200)
            console.log("da chay thanh cong")
        else
           	console.log("xay ra loi khong xac dinh. Sorry!!!")
    };

    // Send the Data to server
    xhr.send(formData);

    //take data from server responsible
    xhr.onreadystatechange = function(){
    	//State = 4 is request finished and response is ready, xhr.status == 200 is 200: "OK"
        if(xhr.readyState == 4 && xhr.status == 200){
        	var data_response = JSON.parse(xhr.responseText);
          //  console.log(xhr.responseText);

          	//ton tai value gui, ma nguoi gui va sau khi server load xong du lieu
        	if(data_response != "" && Partner_id.length > 23 
				&& Div_content_message[0].innerHTML.length > 10)
       	 	{
            	socket.emit('chat', {
               	 	data: data_response,
                	id_send: yid,
                	id_receive: Partner_id, 
					code_id: 0//ma nay la chup anh camera
           		 }) 

            //	console.log(data_response)

				var pos = data_response.indexOf("image")//tach chuoi
            	Create_message_send(data_response.substring(pos-1, data_response.length), Time_stand(), 1)
           		//dat scroll trong the div luon o cuoi the div 
           		setTimeout(function(){
           			Div_content_message[0].scrollTop = Div_content_message[0].scrollHeight - 20;
           		}, 400)
            	
            	this.value = "";
        	}
        }
    }
}


//chon file de upload, neu co chon file thi ham nay se chay
Upload_image.addEventListener("change", function(){
	var imfomation = Upload_image.files[0]
	if(imfomation){
   	 	var size = imfomation.size;//dung de han che viec upload file qua nang
		var name = imfomation.name;
		

		if(!TypeofFile(name))//ham nay o file Xulihomepage.js
			alert("Please choose an image file [jpg, gif, bmp, png, jpeg, gif, bgp, bat].")
		else if(size > max_file_size_image)
			alert("Image too big size. Please small than 5MB.")
		else
			document.getElementById("submitbuttonimage").click()//goi den ham submit trong form
	}
})

//get event from image awesome
Upload_any_thing_table_image.addEventListener("click", function(){
	Upload_image.click();

	//nguoi dung dang nhap tin nhan
    socket.emit('chatting', {
        id_send: yid,
        id_receive: Partner_id
    })
})

//get event from icon video
Upload_any_thing_table_video.addEventListener("click", function(){
	Upload_video.click();
})

function Upload_data_camera_img(img_base_64, callback)
{
    $.ajax({
        type: "POST",
        url: "/user/upload/camera",
        data:{upload_camera_image: img_base_64},
        success: function(data)//hien thi message
        {
            if(typeof callback == "function")
                callback(data);//tra ve du lieu
        }
    })
}



//chụp ảnh bằng camera
// Elements for taking the snapshot
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var video = document.getElementById('video');
var localstream;//dung de tắt camera
Upload_any_thing_table_camera.addEventListener("click", function(){
	$('#myModal50600').modal('show');

    // Trigger photo take
	document.getElementById("snap").addEventListener("click", function() {
		video.style.display = "none"
		context.drawImage(video, 0, 0, 640, 640);
		canvas.style.display = "block"
		video.pause()
	});
	
	//Restart take photo
	document.getElementById("restart").addEventListener("click", function() {
		video.style.display = "block"
		canvas.style.display = "none"
		video.play()
	});

	// Get access to the camera!
	if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		// Not adding `{ audio: true }` since we only want video now
		navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
			video.src = window.URL.createObjectURL(stream);
		    localstream = stream
			video.play();
		});
	}
})

//click nut x hoac button close tren modal chup camrera
$('#myModal50600').on('hidden.bs.modal', function () {
    // do something…
   // alert("close me modal camere")
    localstream.getTracks()[0].stop();//tat camera
})

//bat su kien nguoi dung chup xong va gui anh len server
document.getElementById("photographdone").addEventListener("click", function() {
	var dataURL = canvas.toDataURL("image/png");//danh dinh dang png
	video.src = ""
	localstream.getTracks()[0].stop()
	 //nguoi dung dang nhap tin nhan
    socket.emit('chatting', {
        id_send: yid,
        id_receive: Partner_id
    })
	
	//an modal
	$('#myModal50600').modal('hide');
	//ajax upload data img
	Upload_data_camera_img(dataURL, function(data){
		var urlimg = JSON.parse(data)
        //truong hop hi huu khi khong the lay duoc id nguoi dung
        if(Partner_id.length < 24)
            Partner_id = Information_user('id')
		
	    //ton tai value gui, ma nguoi gui va sau khi server load xong du lieu
        if(urlimg != "" && Partner_id.length > 23 
			&& Div_content_message[0].innerHTML.length > 10)
        {
            socket.emit('chat', {
                data: urlimg,
                id_send: yid,
                id_receive: Partner_id, 
				code_id: 0//ma nay la chup anh camera
            })
			var pos = urlimg.indexOf("image")
            Create_message_send(urlimg.substring(pos-1, urlimg.length), Time_stand(), 1)
           //dat scroll trong the div luon o cuoi the div, settime for show
           	setTimeout(function(){
           		Div_content_message[0].scrollTop = Div_content_message[0].scrollHeight-20;
           	}, 400)
            this.value = "";
        }
               
	})
});

//modal hide thi tat camera
/*if(!$('#myModal50600').hasClass('in')){
	video.src = ""
	localstream.getTracks()[0].stop()
} */

//gọi video  
Upload_any_thing_table_call_video.addEventListener("click", function(){
	alert("you click me")
})



