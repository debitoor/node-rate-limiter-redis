const pkg = require('./package.json');

const redis = require('redis');
const path = require('path');
const fs = require('fs');
const once = require('once');

const NodeRateLimiter = require('node-rate-limiter');

const script = fs.readFileSync(path.join(__dirname, 'script.lua'), 'utf-8');

module.exports = RedisAdaptor;

RedisAdaptor.name = 'redis';
RedisAdaptor.ver = pkg.version;

function RedisAdaptor(opts) {
    opts = opts || {};
    opts.timeout = opts.timeout || NodeRateLimiter.defaultTimeout;
    opts.client = opts.client || redis.createClient();

    const adaptorOpts = opts;

    this.prepare = (callback) => prepare(adaptorOpts, callback); 
    this.reset = (id, callback) => reset(adaptorOpts, id, callback); 
    this.get = (id, opts, callback) => get(adaptorOpts, id, opts, callback);
}

function reset(adaptorOpts, id, callback) {
    const keyClient = 'ratelimiter.' + id;
    const keyClientTotal = keyClient + '.total';
    const keyClientLimit = keyClient + '.limit';

    const onDoneOnce = once(onDone);

    adaptorOpts.client
        .multi()
        .del(keyClientTotal)
        .del(keyClientLimit)
        .exec(onExecDoneOnce);

    let timerId = registerTimeout(adaptorOpts.timeout, onExecDoneOnce);


    function onDone(err, res) {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }

        callback(err, res);
    }
}

function get(adaptorOpts, id, opts, callback) {
    const limit = opts && opts.limit || NodeRateLimiter.defaultRateLimit;
    const expire = opts && opts.expire || NodeRateLimiter.defaultExpiration;
    
    const onEvalshaDoneOnce = once(onEvalshaDone);

    adaptorOpts.client.evalsha(adaptorOpts.scriptSha, 3, id, limit, expire, onEvalshaDoneOnce);
    let timerId = registerTimeout(adaptorOpts.timeout, onEvalshaDoneOnce);


    function onEvalshaDone(err, res) {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
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

    const onScriptLoadedOnce = once(onScriptLoaded);

    adaptorOpts.client.script('load', script, onScriptLoadedOnce);
    let timerId = registerTimeout(adaptorOpts.timeout, onScriptLoadedOnce);


    function onScriptLoaded(err, sha) {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }

        if (err) {
            return callback(err);
        }

        adaptorOpts.scriptSha = sha;
        callback(null);
    }
}

function registerTimeout(timeout, callback) {
    return setTimeout(() => {
        const error = new NodeRateLimiter.TimeoutError(null, {after: adaptorOpts.timeout});
        callback(error);
    }, timeout);
}