const redis = require('redis');
const path = require('path');
const fs = require('fs');

const defaultRateLimit = 5000;
const defaultExpiration = 1000 * 60 * 60;

const script = fs.readFileSync(path.join(__dirname, 'script.lua'), 'utf-8');
let scriptSha;

module.exports = RedisAdaptor;


function RedisAdaptor(database) {
    this.prepare = (callback) => prepare(database, callback); 
    this.reset = (id, callback) => reset(database, id, callback); 
    this.get = (id, opts, callback) => get(database, id, opts, callback);
}

function reset(db, id, callback) {
    const keyClient = 'ratelimiter.' + id;
    const keyClientTotal = keyClient + '.total';
    const keyClientLimit = keyClient + '.limit';

    db
        .multi()
        .del(keyClientTotal)
        .del(keyClientLimit)
        .del(keyClientExpire)
        .exec((err) => callback(err));
}

function get(db, id, opts, callback) {
    const limit = opts && opts.limit || defaultRateLimit;
    const expire = opts && opts.expire || defaultExpiration;

    db.evalsha(scriptSha, 3, id, limit, expire, (err, res) => {
        if (err) {
            return callback(err);
        }
        const result = {
            limit: res[0], 
            remaining: res[0] - res[1] + 1, 
            reset: res[2]
        };
        callback(null, result);
    });
}

function prepare(database, callback) {
    if (scriptSha) {
        return callback(null);
    }

    database.script('load', script, onScriptLoad);


    function onScriptLoad(err, sha) {
        if (err) {
            return callback(err);
        }

        scriptSha = sha;
        callback(null);
    }
}