import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('redisClient', () => {
  before(async () => {
    await redisClient.connect();
  });

  after(async () => {
    await redisClient.quit();
  });

  it('should connect to Redis', () => {
    expect(redisClient).to.exist;
  });

  it('should set and get a key', async () => {
    await redisClient.set('testKey', 'testValue');
    const value = await redisClient.get('testKey');
    expect(value).to.equal('testValue');
  });
});
