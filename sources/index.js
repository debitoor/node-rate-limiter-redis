const redis = require('redis');
const path = require('path');
const fs = require('fs');
const once = require('once');

const NodeRateLimiter = require('node-rate-limiter');

const script = fs.readFileSync(path.join(__dirname, 'script.lua'), 'utf-8');

module.exports = RedisAdaptor;


function RedisAdaptor(opts) {
	assert(this instanceof InMemoryAdaptor, 'RedisAdaptor should be created with new keyword: new RedisAdaptor(...)');

    opts = opts || {};
    opts.timeout = opts.timeout || NodeRateLimiter.defaultTimeout;
    opts.client = opts.client || redis.createClient();

    const adaptorOpts = opts;

	this.name = RedisAdaptor.name;
    
    this.prepare = (callback) => prepare(adaptorOpts, callback); 
    this.reset = (id, callback) => reset(adaptorOpts, id, callback); 
    this.get = (id, opts, callback) => get(adaptorOpts, id, opts, callback);
}

function reset(adaptorOpts, id, callback) {
    const keyClient = 'noderatelimiter.' + id;
    const keyClientTotal = keyClient + '.total';
    const keyClientLimit = keyClient + '.limit';

    const onDoneOnce = once(onDone);

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

        callback(err, res);
    }
}

function get(adaptorOpts, id, opts, callback) {
    const limit = opts && opts.limit || NodeRateLimiter.defaultRateLimit;
    const expire = opts && opts.expire || NodeRateLimiter.defaultExpiration;
    
    const onEvalshaDoneOnce = once(onEvalshaDone);

    adaptorOpts.client.evalsha(adaptorOpts.scriptSha, 3, id, limit, expire, onEvalshaDoneOnce);
    let timerId = registerTimeout(`get(${id}, ${JSON.stringify(opts)})`, adaptorOpts.timeout, onEvalshaDoneOnce);


    function onEvalshaDone(err, res) {
        if (timerId) {
            timerId = clearTimeout(timerId);
        }

        if (err) {
            return callback(err);
        }

        const result = {
            limit: res[0], 
            remaining: res[0] - res[1] + 1, 
            reset: res[2]
        };
        callback(null, result);
    }
}

function prepare(adaptorOpts, callback) {
    if (adaptorOpts.scriptSha) {
        return callback(null);
    }

    adaptorOpts.client.script('load', script, onScriptLoaded);


    function onScriptLoaded(err, sha) {
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