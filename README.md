# node-rate-limiter-redis [![Build Status](https://travis-ci.org/debitoor/node-rate-limiter-redis.svg?branch=master)](https://travis-ci.org/debitoor/node-rate-limiter-redis)

Redis adaptor for [node-rate-limiter](https://github.com/debitoor/node-rate-limiter)

# Requirements

Redis 2.6.0+ ([lua scripting](https://redis.io/commands/evalsha), [pexpire](https://redis.io/commands/pexpire), [pttl](https://redis.io/commands/pttl) support)

# Install

```
$ npm install node-rate-limiter-redis
```

# Usage
```js
    const NodeRateLimiter = require('node-rate-limiter');

    const adaptor = new RedisAdaptor({
        client: redisClient,    // instance of redis client [redis.createClient()]
        timeout: 100            // timeout for reset/get methods call [NodeRateLimiter.defaults.timeout]
    });
    const nodeRateLimiter = new NodeRateLimiter(adaptor);
```
P.S. please, read [node-rate-limiter](https://github.com/debitoor/node-rate-limiter) README file for complete usage guide

# Benchmark

You can benchmark performance and compare results with [node-ratelimiter](https://github.com/tj/node-ratelimiter)

#### Linux/MacOS
```
 $ ./bin/benchmark.sh
```
#### Windows
```
 > .\bin\benchmark.cmd
```

# License

[MIT](https://raw.githubusercontent.com/debitoor/node-rate-limiter-redis/master/LICENSE)
