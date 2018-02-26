var mongoose = require('mongoose')
var Schema = mongoose.Schema
//reference trong mongodb
var notify = new Schema({
	title: String,
	content: String,
	author: String,
	to: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	created_at: Date
})

notify.pre('save', function(next){
	var crrD = new Date().toISOString()
	this.created_at = crrD;
	next()
})

var Notify = mongoose.model('Notify', notify)

module.exports ={
	Notify : Notify
}

