const redis = require('redis');
const async = require('async');
const client = redis.createClient();

const RateLimiter = require('ratelimiter');
const NodeRateLimiter = require('node-rate-limiter');
const RedisAdaptor = require('../source/redis-adaptor');

const nodeRateLimiter = new NodeRateLimiter(new RedisAdaptor({ client: client, timeout: 20000 }));

const methodsMap = {
	'RateLimiter': getRateLimitMathod_RateLimiter,
	'NodeRateLimiter': getRateLimitMathod_NodeRateLimiter
};


let isValidateArgs = false;

let args = process.argv.reduce((memo, v) => {
	switch (v) {
	case '--validate':
	case '-v':
		isValidateArgs = true;
		break;
	default:
		memo.push(v);
		break;
	}

	return memo;
}, []);


if (args.length < 3 || !methodsMap[args[2]]) {
	printUsage();
	process.exit(1);
}

let getRateLimitMathod = methodsMap[args[2]];
let requestsTimeframe = 20000;
let requestsAmount = 50000;

if (args.length >= 4) {
	requestsTimeframe = parseInt(args[3]);

	if (Number.isNaN(requestsTimeframe) || requestsTimeframe < 500) {
		printUsage();
		process.exit(1);
	}
}
if (args.length >= 5) {
	requestsAmount = parseInt(args[4]);

	if (Number.isNaN(requestsAmount) || requestsAmount < 2) {
		printUsage();
		process.exit(1);
	}
}

if (isValidateArgs) {
	process.exit(0);
}


client.on('error', function (err) {
	console.log('Redis error: ' + err);
});


client.on('ready', function () {
	run(getRateLimitMathod, (err, avg) => {
		console.log('     ', err ? JSON.stringify(err) : 'avg exec time: ' + avg.toFixed(4) + 's for ' + requestsAmount + ' requests in ' + (requestsTimeframe / 1000).toFixed(4) + 's');
		process.exit(0);
	});
});


function getRateLimitMathod_RateLimiter(clientId, callback) {
	new RateLimiter({ id: clientId, db: client, max: 5000, duration: 10000 }).get(callback);
}

function getRateLimitMathod_NodeRateLimiter(clientId, callback) {
	nodeRateLimiter.get(clientId, {}, callback);
}

function getRandomClientId() {
	return (100000000 + 2000 * Math.random()).toString();
}

function run(getRateLimitMathod, callback) {
	getRateLimitMathod(getRandomClientId(), (err, res) => {
		getRateLimitMathod(getRandomClientId(), (err, res) => {

			const tasks = [];
			let totalTicks = 0;

			for (let i = 0; i < requestsAmount; i++) {
				tasks.push((callback) => setTimeout(() => {
					const date = + new Date();
					getRateLimitMathod(getRandomClientId(), (err, res) => {
						totalTicks += +new Date() - date;
						callback(err, res);
					});
				}, Math.random() * requestsTimeframe));
			}

			async.parallel(tasks, (err, res) => {
				if (err) {
					return callback(err);
				}
				callback(null, totalTicks / 1000 / requestsAmount);
			});

		});
	});
}

function printUsage() {
	console.log('');
	console.log('usage:');
	console.log('       node index.js method [interval] [requests]');
	console.log('');
	console.log('params:');
	console.log('  method:');
	console.log('       - RateLimiter');
	console.log('       - NodeRateLimiter');
	console.log('');
	console.log('  interval:');
	console.log('       - represents timeframe of all requests in milliseconds (500..)');
	console.log('');
	console.log('  requests:');
	console.log('       - represents number of requests that suppose to be done in current timeframe (2..)');
	console.log('');
	console.log('');
}