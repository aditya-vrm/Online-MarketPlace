const request = require('supertest');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const userModel = require('../src/Model/user.model');

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await userModel.create({
            username: 'login-user',
            email: 'login@example.com',
            password: await bcrypt.hash('secret123', 10),
            fullname: {
                firstname: 'Login',
                lastname: 'User',
            },
        });
    });

    test('logs in with valid credentials and sets an auth cookie', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'login@example.com',
                password: 'secret123',
            });

        expect(response.status).toBe(200);
        expect(response.headers['set-cookie'][0]).toContain('token=');
        expect(response.body).toMatchObject({
            message: 'Login successful',
            user: {
                username: 'login-user',
                email: 'login@example.com',
            },
        });
        expect(response.body.user).not.toHaveProperty('password');
    });

    test('rejects invalid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'login@example.com',
                password: 'wrong-password',
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Invalid email or password' });
    });

    test('rejects invalid login data', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'not-an-email' });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: 'email' }),
                expect.objectContaining({ path: 'password' }),
            ]),
        );
    });
});