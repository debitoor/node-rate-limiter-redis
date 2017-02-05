local totalKey = "noderatelimiter." .. KEYS[1] .. ".total"
local limitKey = "noderatelimiter." .. KEYS[1] .. ".limit"

redis.call("setnx", limitKey, KEYS[2])
local setnx = redis.call("setnx", totalKey, 0)
local pttl = redis.call("pttl", totalKey)
local total = redis.call("incr", totalKey)
local limit = tonumber(redis.call("get", limitKey))

if total > limit then 
    total = limit + 1
end

if setnx == 1 or pttl < 0 then
    redis.call("pexpire", totalKey, KEYS[3])
    redis.call("pexpire", limitKey, KEYS[3])
    pttl = KEYS[3]
end

return {limit, total, pttl}