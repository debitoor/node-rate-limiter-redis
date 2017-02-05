# node-rate-limiter-redis

Redis adaptor for [node-rate-limiter](https://github.com/mujichOk/node-rate-limiter)

# Usage

```js
    const NodeRateLimiter = require('node-rate-limiter');

    const adaptor = new RedisAdaptor({
        client: redisClient,    // instance of redis client [redis.createClient()]
        timeout: 100            // timeout for reset/get methods call [NodeRateLimiter.defaultTimeout]
    });
    const nodeRateLimiter = new NodeRateLimiter(adaptor);
```

# License

  [MIT](https://raw.githubusercontent.com/mujichOk/node-rate-limiter-redis/master/LICENSE)