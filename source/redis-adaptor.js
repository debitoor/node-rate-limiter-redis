const assert = require('assert');
const redis = require('redis');
const path = require('path');
const fs = require('fs');

const NodeRateLimiter = require('node-rate-limiter');

const script = fs.readFileSync(path.join(__dirname, 'script.lua'), 'utf-8');

module.exports = RedisAdaptor;


function RedisAdaptor(opts) {
	assert(this instanceof RedisAdaptor, 'RedisAdaptor should be created with new keyword: new RedisAdaptor(...)');

	opts = opts || {};
	opts.timeout = opts.timeout || NodeRateLimiter.defaults.timeout;
	opts.client = opts.client || redis.createClient();
	opts.onTimeouted = opts.onTimeouted || noop;

	const adaptorOpts = opts;

	this.name = RedisAdaptor.name;

	this.prepare = (callback) => prepare(adaptorOpts, callback);
	this.reset = (id, callback) => reset(adaptorOpts, id, callback);
	this.get = (id, opts, callback) => get(adaptorOpts, id, opts, callback);
}

function reset(adaptorOpts, id, callback) {
	let isCalled = false;
	const start = +new Date();

	const keyClient = 'noderatelimiter.' + id;
	const keyClientTotal = keyClient + '.total';
	const keyClientLimit = keyClient + '.limit';

	const onDoneOnce = onDone;

	adaptorOpts.client
		.multi()
		.del(keyClientTotal)
		.del(keyClientLimit)
		.exec(onDoneOnce);

	let timerId = registerTimeout(`reset(${id})`, adaptorOpts.timeout, onDoneOnce);


	function onDone(err, res) {
		if (timerId) {
			timerId = clearTimeout(timerId);
		}

		if (isCalled) {
			return adaptorOpts.onTimeouted(err, res, (+new Date() - start));
		}

		isCalled = true;

		callback(err, res);
	}
}

function get(adaptorOpts, id, opts, callback) {
	let isCalled = false;
	const start = +new Date();

	const limit = opts && opts.limit || NodeRateLimiter.defaultRateLimit;
	const expire = opts && opts.expire || NodeRateLimiter.defaultExpiration;

	adaptorOpts.client.evalsha(adaptorOpts.scriptSha, 3, id, limit, expire, onEvalshaDone);
	let timerId = registerTimeout(`get(${id}, ${JSON.stringify(opts)})`, adaptorOpts.timeout, onEvalshaDone);


	function onEvalshaDone(err, res) {
		if (timerId) {
			timerId = clearTimeout(timerId);
		}

		if (isCalled) {
			return adaptorOpts.onTimeouted(err, res, (+new Date() - start));
		}

		isCalled = true;

		if (err) {
			return callback(err);
		}

		const result = {
			limit: res[0],
			remaining: res[0] - res[1] + 1,
			refresh: parseInt(res[2])
		};
		callback(null, result);
	}
}

function prepare(adaptorOpts, callback) {
	if (adaptorOpts.scriptSha) {
		return callback(null);
	}

	adaptorOpts.client.script('load', script, onScriptLoaded);
	let timerId = registerTimeout('prepare', adaptorOpts.timeout, onScriptLoaded);


	function onScriptLoaded(err, sha) {
		if (timerId) {
			timerId = clearTimeout(timerId);
		}
		if (err) {
			return callback(err);
		}

		adaptorOpts.scriptSha = sha;
		callback(null);
	}
}

function registerTimeout(message, timeout, callback) {
	return setTimeout(() => {
		const error = new NodeRateLimiter.TimeoutError(message, {after: timeout});
		callback(error);
	}, timeout);
}

function noop() {}