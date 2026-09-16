const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const userModel = require('../src/Model/user.model');

describe('POST /api/auth/logout', () => {
    let user;
    let token;

    beforeEach(async () => {
        user = await userModel.create({
            username: 'logout-user',
            email: 'logout@example.com',
            password: await bcrypt.hash('secret123', 10),
            fullname: {
                firstname: 'Logout',
                lastname: 'User',
            },
        });

        token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
        );
    });

    test('logs out the authenticated user and clears the token cookie', async () => {
        const response = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', `token=${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Logout successful' });

        const cookies = response.headers['set-cookie'];
        expect(cookies).toEqual(expect.arrayContaining([
            expect.stringMatching(/^token=;/),
        ]));
        expect(cookies.join(';')).toMatch(/Max-Age=0|Expires=/i);
    });

    test('rejects logout without an auth cookie', async () => {
        const response = await request(app).post('/api/auth/logout');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    test('rejects logout with an invalid auth token', async () => {
        const response = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', 'token=invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
    });
});