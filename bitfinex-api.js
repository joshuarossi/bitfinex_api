crypto = Npm.require('crypto')

Bitfinex = function () {
	var _this = this;
//	Collections used to manage Bitfinex updating data
	this.Trades = new Mongo.Collection('trades');
	this.Bids = new Mongo.Collection('bids');
	this.Asks = new Mongo.Collection('asks');
	this.Tickers = new Mongo.Collection('tickers');
	this.Stats = new Mongo.Collection('stats');
	this.LendbookBids = new Mongo.Collection('lendbook_bids');
	this.LendbookAsks = new Mongo.Collection('lendbook_asks');
//	Collection to manage account status
	this.AccountStatus = new Mongo.Collection('account_status');
//	Authentication credentials
	this.url = "https://api.bitfinex.com/v1";
	this.api_key = '';
	this.api_secret = '';
//	Generic Order Object for helping create arrays
	this.generic_order = {
		'symbol': 'BTCUSD',
		'amount': 0.01,
		'price': 0.01,
		'exchange': 'bitfinex',
		'side': 'buy',
		'type': 'limit'
	};
//	Generic callback for db writes to avoid blocking the server
	this.genericCallback = function (error, id) {
		if (error){
			console.log(error);
		}
		if (id){
			console.log("id: " + id.toString());
		}
	};
//	Helper function to make authenticated requests
//	TODO: add in optional callback to all functions
	this.makeAuthenticatedRequest = function(endpoint, params, cb){
		var request_url = _this.url + endpoint;
		var nonce = new Date().getTime().toString();
		var payload = {
			'request': '/v1' + endpoint,
			'nonce': nonce
		};
		Object.keys(params).forEach(function (key){
			payload[key] = params[key];
		});
		payload = new Buffer(JSON.stringify(payload)).toString('base64');
		var signature = crypto.createHmac("sha384", _this.api_secret).update(payload).digest('hex');
		var headers = {
			'X-BFX-APIKEY': _this.api_key,
			'X-BFX-PAYLOAD': payload,
			'X-BFX-SIGNATURE': signature
		};
		var options = {};
		options.headers = headers;
		if (params.endpoint == '/order/cancel/all'){
			result = HTTP.get(request_url, options);
		}
		else{
			result = HTTP.post(request_url, options);
		}
		return result;
	};
//	Unauthenticated Requests
	this.getTicker = function(symbol){
		if (!symbol){
			symbol = 'BTCUSD';
		};
		var response = HTTP.get(_this.url + '/pubticker/' + symbol);
		return response.data;
	};
	this.getStats = function(symbol){
		if (!symbol){
			symbol = 'BTCUSD';
		};
		var response = HTTP.get(_this.url + '/stats/' + symbol);
		var a = response.data;
		a.timestamp = new Date();
		return response.data;
	};
	this.getLendbook = function(currency, limit_bids, limit_asks){
		if (!currency){
			currency = 'USD';
		};
		var options = {};
		options.params = {};
		if (limit_bids){
			options.params['limit_bids'] = limit_bids;
		}
		if (limit_asks){
			options.params['limit_asks'] = limit_asks;
		}
		var response = HTTP.get(_this.url + '/lendbook/' + currency, options);
		return response.data;
	};
	this.getOrderbook = function(symbol, limit_bids, limit_asks, group){
		if (!symbol){
			symbol = 'BTCUSD';
		};
		var options = {};
		options.params = {};
		if (limit_bids){
			options.params['limit_bids'] = limit_bids;
		}
		if (limit_asks){
			options.params['limit_asks'] = limit_asks;
		}
		if (group){
			options.params['group'] = group;
		}
		var response = HTTP.get(_this.url + '/book/' + symbol);
		var a = response.data;
		a.timestamp = new Date();
		a.type = 'orderbook';	
		return response.data;
	};
	this.getTrades = function(symbol, timestamp, limit_trades){
		if (!symbol){
			symbol = 'BTCUSD';
		};
		var options = {};
		options.params = {};
		if (timestamp){
			options.params['timestamp'] = timestamp;
		}
		if (limit_trades){
			options.params['limit_trades'] = limit_trades;
		}
		response = HTTP.get(_this.url + '/trades/' + symbol, options);
		return response.data;
	};
	this.getLends = function(currency, timestamp, limit_lends){
		if (!currency){
			currency = 'USD';
		};
		var options = {};
		options.params = {};
		if (timestamp){
			options.params['timestamp'] = timestamp;
		}
		if (limit_trades){
			options.params['limit_lends'] = limit_lends;
		}
		var response = HTTP.get(_this.url + '/lends/' + currency);
		return response.data;
	};
//	Authenticated requests (must have API_KEY and API_SECRET)
	this.getDepositAddress = function(method, wallet_name, renew){
		if (!method){
			method = 'bitcoin';
		}
		if (!wallet_name){
			wallet_name = 'exchange';
		}
		var endpoint = '/deposit/new';
		var params = {
			'method': method,
			'wallet_name': wallet_name,
			'renew': renew ? renew : 0
		};
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.createNewOrder = function(symbol, amount, price, side, type, is_hidden){
		var endpoint = '/order/new';
		var params = {
			'symbol': symbol,
			'amount': amount.toString(),
			'price': price.toString(),
			'exchange': 'bitfinex',
			'side': side,
			'type': type,
		};
		if (is_hidden){
			params.is_hidden = true;
		}
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.createNewOrders = function(array_of_order_objects){
		var endpoint = '/order/new/multi';
		var params = {};
		params.orders = array_of_order_objects;
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.cancelOrder = function(order_id){
		var endpoint = '/order/cancel';
		var params = {};
		params.order_id = order_id;
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.cancelOrders = function(array_of_order_ids){
		var endpoint = '/order/cancel/multi';
		var params = {};
		params.order_ids = array_of_order_ids;
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.cancelAllOrders = function(){
		var endpoint = '/order/cancel/all';
		var result = _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
	this.replaceOrder = function(order_id, symbol, amount, price, side, type, is_hidden){
		var endpoint = '/order/cancel/replace';
		var params = {
			'order_id': order_id,
			'symbol': symbol,
			'amount': amount.toString(),
			'price': price.toString(),
			'exchange': 'bitfinex',
			'side': side,
			'type': type,
		};
		if (is_hidden){
			params.is_hidden = true;
		}
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.getOrderStatus = function(order_id){
		var endpoint = '/order/status';
		var params = {
			'order_id': order_id
		};
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.getActiveOrders = function(){
		var endpoint = '/orders';
		var result =  _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
	this.getActivePositions = function(){
		var endpoint = '/positions';
		var result = _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
	this.claimPosition = function(position_id){
		var endpoint = '/position/claim';
		var params = {
			'position_id': position_id
		};
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.getBalanceHistory = function(currency, since, until, limit, wallet){
		var endpoint = '/history';
		var params = {
			'currency': currency ? currency : 'USD'
		};
		if (since){
			params['since'] = since;
		}
		if (until){
			params['until'] = until;
		}
		if (limit){
			params['until'] = until;
		}
		if (wallet && ["trading", "exchange", "deposit"].indexOf(wallet) != -1){
			params['wallet'] = wallet;
		}
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.getDepositsAndWithdrawals = function(currency, method, since, until, limit){
		var endpoint = '/history/movements';
		var params = {
			'currency': currency ? currency : 'USD'
		};
		if (since){
			params['since'] = since;
		}
		if (until){
			params['until'] = until;
		}
		if (limit){
			params['until'] = until;
		}
		if (method && ["bitcoin", "litecoin", "darkcoin", "wire"].indexOf(method) != -1){
			params['method'] = method;
		}
	};
	this.getPastTrades = function(symbol, timestamp, limit_trades){
		var endpoint = '/mytrades';
		params = {
			'symbol': symbol ? symbol : 'BTCUSD'
		}
		if (timestamp){
			params['timestamp'] = timestamp;
		}
		if (limit_trades){
			params['limit_trades'] = limit_trades;
		}
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.createNewOffer = function(currency, amount, rate, period, direction){
		var endpoint = '/offer/new';
		var params = {
			'amount': amount,
			'rate': rate,
			'period': period,
			'direction': direction
		};
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.cancelOffer = function(offer_id){
		var endpoint = '/offer/cancel';
		var params = {
			'offer_id': offer_id
		};
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.getOfferStatus = function(offer_id){
		var endpoint = '/offer/status';
		var params = {
			'offer_id': offer_id
		};
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.getActiveOffers = function(){
		var endpoint = '/offers';
		var result = _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
	this.getActiveOffers = function(){
		var endpoint = '/credits';
		var result = _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
	this.getSwapsUsed = function(){
		var endpoint = '/taken_swaps';
		var result = _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
	this.closeSwap = function(swap_id){
		var endpoint = '/swap/close';
		var params = {
			'swap_id': swap_id
		};
		var result = _this.makeAuthenticatedRequest(endpoint, params);
		return result.data;
	};
	this.getWalletBalances = function(){
		var endpoint = '/balances';
		var result = _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
	this.getAccountInfo = function(){
		var endpoint = '/account_infos';
		var result = _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
	this.getMarginInfo = function(){
		var endpoint = '/margin_infos';
		var result = _this.makeAuthenticatedRequest(endpoint, {});
		return result.data;
	};
};
bitfinex = new Bitfinex();
console.log('You now have an instance of the bitfinex API object available');