import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';

chai.use(chaiHttp);
const { expect } = chai;

describe('API Endpoints', () => {
  let token; // to store authentication token

  before(async () => {
    // Optional: create a user and log in to get token if your routes are protected
    const res = await chai.request(app)
      .post('/users')
      .send({ username: 'testUser', password: 'testPassword' });
    expect(res.status).to.equal(201);
    token = res.body.token; // assuming your response includes a token
  });

  it('GET /status', async () => {
    const res = await chai.request(app).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ status: 'OK' });
  });

  it('GET /stats', async () => {
    const res = await chai.request(app).get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('users');
    expect(res.body).to.have.property('files');
  });

  it('POST /users', async () => {
    const res = await chai.request(app)
      .post('/users')
      .send({ username: 'newUser', password: 'newPassword' });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
  });

  it('GET /connect', async () => {
    const res = await chai.request(app)
      .get('/connect')
      .set('x-token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Connected');
  });

  it('GET /disconnect', async () => {
    const res = await chai.request(app)
      .get('/disconnect')
      .set('x-token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Disconnected');
  });

  it('GET /users/me', async () => {
    const res = await chai.request(app)
      .get('/users/me')
      .set('x-token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('username', 'testUser');
  });

  it('POST /files', async () => {
    const res = await chai.request(app)
      .post('/files')
      .set('x-token', token)
      .send({
        name: 'testFile.txt',
        type: 'file',
        data: 'VGhpcyBpcyBhIHRlc3Qu',
      });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
  });

  it('GET /files/:id', async () => {
    const fileId = 'your-file-id'; // Replace with an actual file ID
    const res = await chai.request(app)
      .get(`/files/${fileId}`)
      .set('x-token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('name', 'testFile.txt');
  });

  it('GET /files', async () => {
    const res = await chai.request(app)
      .get('/files?page=1')
      .set('x-token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('PUT /files/:id/publish', async () => {
    const fileId = 'your-file-id'; // Replace with an actual file ID
    const res = await chai.request(app)
      .put(`/files/${fileId}/publish`)
      .set('x-token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('isPublic', true);
  });

  it('PUT /files/:id/unpublish', async () => {
    const fileId = 'your-file-id'; // Replace with an actual file ID
    const res = await chai.request(app)
      .put(`/files/${fileId}/unpublish`)
      .set('x-token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('isPublic', false);
  });

  it('GET /files/:id/data', async () => {
    const fileId = 'your-file-id'; // Replace with an actual file ID
    const res = await chai.request(app)
      .get(`/files/${fileId}/data`)
      .set('x-token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('data'); // Adjust based on your response structure
  });
});
