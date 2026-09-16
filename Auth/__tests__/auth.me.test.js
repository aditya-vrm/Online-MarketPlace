const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const userModel = require('../src/Model/user.model');

describe('GET /api/auth/me', () => {
    let user;

    beforeEach(async () => {
        user = await userModel.create({
            username: 'me-user',
            email: 'me@example.com',
            password: await bcrypt.hash('secret123', 10),
            fullname: {
                firstname: 'Me',
                lastname: 'User',
            },
        });
    });

    test('returns the authenticated user', async () => {
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
        );

        const response = await request(app)
            .get('/api/auth/me')
            .set('Cookie', `token=${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            user: {
                id: user._id.toString(),
                username: 'me-user',
                email: 'me@example.com',
                fullname: {
                    firstname: 'Me',
                    lastname: 'User',
                },
                role: 'user',
            },
        });
        expect(response.body.user).not.toHaveProperty('password');
    });

    test('rejects a request without an auth cookie', async () => {
        const response = await request(app).get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    test('rejects an invalid auth token', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Cookie', 'token=invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
    });
});