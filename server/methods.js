Meteor.methods({
	bfx_auth: function(key, secret){
		bitfinex.api_key = key;
		bitfinex.api_secret = secret;
		return 'success';
	}
});