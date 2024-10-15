import { expect } from 'chai';
import dbClient from '../utils/db';

describe('dbClient', () => {
  before(async () => {
    await dbClient.connect();
  });

  after(async () => {
    await dbClient.disconnect();
  });

  it('should connect to the database', () => {
    expect(dbClient.db).to.exist;
  });

  it('should perform a simple query', async () => {
    const result = await dbClient.db.collection('users').find({}).toArray();
    expect(result).to.be.an('array');
  });
});
