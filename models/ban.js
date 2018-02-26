var mongoose = require('mongoose')
var Schema = mongoose.Schema
//reference trong mongodb
var ban = new Schema({
	id_user_ban: {//neu nguoi dung bi xoa thi gia tri tham chieu nay se khong ton tai
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},//ma nguoi dung 1
	name: String,
	email: String,
	description: String,
	time: Date,
	created_at: Date
})

ban.pre('save', function(next){
	var crrD = new Date().toISOString()
	this.created_at = crrD;
	next()
})

var Ban = mongoose.model('Ban', ban)

module.exports ={
	Ban : Ban
}

