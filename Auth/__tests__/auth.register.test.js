const request = require('supertest');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const userModel = require('../src/Model/user.model');

describe('POST /api/auth/register', () => {
    test('creates a user with a hashed password', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'new-user',
                email: 'new-user@example.com',
                password: 'plain-password',
                fullname: {
                    firstname: 'New',
                    lastname: 'User',
                },
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            username: 'new-user',
            email: 'new-user@example.com',
            role: 'user',
            fullname: {
                firstname: 'New',
                lastname: 'User',
            },
        });
        expect(response.body).not.toHaveProperty('password');

        const user = await userModel.findOne({ email: 'new-user@example.com' }).select('+password');
        expect(user).not.toBeNull();
        expect(user.password).not.toBe('plain-password');
        await expect(bcrypt.compare('plain-password', user.password)).resolves.toBe(true);
    });

    test('rejects invalid registration data', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'new-user',
                email: 'invalid-email',
                password: 'short',
                fullname: { firstname: 'New', lastname: 'User' },
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: 'email' }),
                expect.objectContaining({ path: 'password' }),
            ]),
        );
    });

    test('does not allow a duplicate email', async () => {
        await userModel.create({
            username: 'existing-user',
            email: 'existing@example.com',
            password: 'already-hashed',
            fullname: { firstname: 'Existing', lastname: 'User' },
        });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'another-user',
                email: 'existing@example.com',
                password: 'plain-password',
                fullname: { firstname: 'Another', lastname: 'User' },
            });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ message: 'username or email already exists' });
    });
});