//module.exports = {
// 	secret:'secret',
// 	url: 'mongodb://localhost/chat'
// } 

module.exports.setConfig = function(){
	process.env.MONGOOSE_CONNECT = "mongodb://linhvan:12345@ds023435.mlab.com:23435/chatexample"
}