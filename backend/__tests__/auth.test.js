const request = require('supertest');
const { startMemoryDb, stopMemoryDb, clearDb } = require('./setup');

// Env must be set before requiring the app so dotenv doesn't override it
let app;

beforeAll(async () => {
  await startMemoryDb();
  app = require('../server');
});

afterAll(async () => {
  await stopMemoryDb();
});

beforeEach(async () => {
  await clearDb();
});

const validUser = {
  username: 'alice',
  email: 'alice@example.com',
  password: 'hunter2pw',
};

describe('POST /api/auth/register', () => {
  test('creates a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ username: 'alice', email: 'alice@example.com' });
    expect(res.body.user.password).toBeUndefined();
  });

  test('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, username: 'alice2' });
    expect(res.status).toBe(409);
  });

  test('rejects weak password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  test('rejects invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('returns a token on correct credentials', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('returns 401 on wrong password', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrong-password-99' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me (protected)', () => {
  test('401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns the user when a valid token is provided', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('alice');
    expect(res.body.user.password).toBeUndefined();
  });
});
