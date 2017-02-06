# node-rate-limiter-redis [![Build Status](https://travis-ci.org/mujichOk/node-rate-limiter-redis.svg?branch=master)](https://travis-ci.org/mujichOk/node-rate-limiter-redis)

Redis adaptor for [node-rate-limiter](https://github.com/mujichOk/node-rate-limiter)

# Requirements

Redis 2.6.0+ (lua script support)

# Usage
```js
    const NodeRateLimiter = require('node-rate-limiter');

    const adaptor = new RedisAdaptor({
        client: redisClient,    // instance of redis client [redis.createClient()]
        timeout: 100            // timeout for reset/get methods call [NodeRateLimiter.defaults.timeout]
    });
    const nodeRateLimiter = new NodeRateLimiter(adaptor);
```
P.S. please, read [node-rate-limiter](https://github.com/mujichOk/node-rate-limiter) README file for complete usage guide 

# License

[MIT](https://raw.githubusercontent.com/mujichOk/node-rate-limiter-redis/master/LICENSE)
