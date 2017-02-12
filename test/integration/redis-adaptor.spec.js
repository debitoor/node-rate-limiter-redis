const RedisAdaptor = require('../../source/redis-adaptor');

describe('RedisAdaptor', () => {
	const id = 'client.1';

	it('should be class instance', () =>
		expect(() => RedisAdaptor()).to.throw(assert.AssertionError).to.have.property('message').contains('new RedisAdaptor(...)')
	);

	describe('reset(id, callback)', () => {
		const adaptor = new RedisAdaptor({ timeout: 10000 });

		before((done) =>
			adaptor.prepare(done)
		);

		it('should return no errors', () => {
			adaptor.reset(id, (err) => {
				expect(err).to.not.exist;
			});
		});
	});

	describe('get(id, opts, callback)', () => {
		const adaptor = new RedisAdaptor({timeout: 1000 });
		const opts = { limit: 10, expire: 2000 };
		let refresh = opts.expire;

		before((done) =>
			adaptor.prepare(done)
		);
		before((done) =>
			adaptor.reset(id, done)
		);

		[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0].forEach((v, i) => {
			it('should return valid limit\'s info on call #' + (i + 1), (done) => {
				adaptor.get(id, opts, (err, limit) => {
					expect(limit).to.be.ok;
					expect(limit).to.have.property('limit', 10);
					expect(limit).to.have.property('remaining', v);
					expect(limit).to.have.property('refresh').to.be.most(opts.expire);
					expect(limit.refresh).to.be.most(refresh);

					refresh = limit.refresh;
					done();
				});
			});
		});

		it('should return limit\'s info with reseted remaining attempts on call afte expire', function (done) {
			this.timeout(opts.expire * 2);

			setTimeout(() => {
				adaptor.get(id, opts, (err, limit) => {
					expect(limit).to.be.ok;
					expect(limit).to.have.property('limit', 10);
					expect(limit).to.have.property('remaining', 10);
					expect(limit).to.have.property('refresh').to.be.eq(opts.expire);
					done();
				});
			}, opts.expire * 1.1);
		});


		describe('when execution time is out of timeframe', function () {
			this.timeout(2500);

			it('should call onTimeouted', (done) => {
				const opts = { limit: 10, expire: 2000 };

				const client = {
					script: function () {
						const callback = arguments[arguments.length - 1];
						setTimeout(() => callback(null, '1234567890987654321'));
					},
					evalsha: function () {
						const callback = arguments[arguments.length - 1];
						setTimeout(() => callback(null, [0, 0, 0]), 2000);
					}
				};

				const adaptor = new RedisAdaptor({
					client: client, timeout: 1000, onTimeouted: (err, res, ticks) => {
						expect(res).to.be.a('array');
						expect(ticks).to.be.at.least(2000);
						done();
					}
				});

				adaptor.get(id, opts, (err, res) => {
					expect(err).to.be.a('object').to.have.property('name', 'TimeoutError');
				});
			});
		});

	});

});