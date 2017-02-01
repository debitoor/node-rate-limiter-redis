const package = require('./package.json');

const redis = require('redis');
const path = require('path');
const fs = require('fs');
const once = require('once');

const NodeRateLimiter = require('node-rate-limiter');


const defaultRateLimit = 5000;
const defaultExpiration = 1000 * 60 * 60;
const defaultTimeout = 500;

const script = fs.readFileSync(path.join(__dirname, 'script.lua'), 'utf-8');

module.exports = RedisAdaptor;


RedisAdaptor.name = 'redis';
RedisAdaptor.ver = package.version;

function RedisAdaptor(opts) {
    opts = opts || {};
    opts.timeout = opts.timeout || defaultTimeout;
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

    const onExecDoneOnce = once(callback);

    adaptorOpts.client
        .multi()
        .del(keyClientTotal)
        .del(keyClientLimit)
        .exec(onExecDoneOnce);

    setTimeout(() => onExecDoneOnce(new NodeRateLimiter.TimeoutError()), adaptorOpts.timeout);
}

function get(adaptorOpts, id, opts, callback) {
    const limit = opts && opts.limit || defaultRateLimit;
    const expire = opts && opts.expire || defaultExpiration;
    
    const onEvalshaDoneOnce = once(onEvalshaDone);

    adaptorOpts.client.evalsha(adaptorOpts.scriptSha, 3, id, limit, expire, onEvalshaDoneOnce);
    setTimeout(() => onEvalshaDoneOnce(new NodeRateLimiter.TimeoutError()), adaptorOpts.timeout);


    function onEvalshaDone(err, res) {
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
    setTimeout(() => onScriptLoadedOnce(new nodeRateLimiter.TimeoutError()), adaptorOpts.timeout);


    function onScriptLoaded(err, sha) {
        if (err) {
            return callback(err);
        }

        adaptorOpts.scriptSha = sha;
        callback(null);
    }
}