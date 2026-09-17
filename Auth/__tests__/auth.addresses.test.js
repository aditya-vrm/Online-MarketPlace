const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const userModel = require('../src/Model/user.model');

describe('Address APIs', () => {
    let user;
    let token;

    beforeEach(async () => {
        user = await userModel.create({
            username: 'address-user',
            email: 'address@example.com',
            password: 'hashed-password',
            fullname: {
                firstname: 'Address',
                lastname: 'User',
            },
            addresses: [
                {
                    street: '1 First Street',
                    city: 'New York',
                    state: 'NY',
                    country: 'United States',
                    pincode: '10001',
                    phone: '+14155552671',
                    isDefault: true,
                },
                {
                    street: '2 Second Street',
                    city: 'Boston',
                    state: 'MA',
                    country: 'United States',
                    pincode: '02108',
                    phone: '+14155552672',
                    isDefault: false,
                },
            ],
        });

        token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
        );
    });

    describe('GET /api/auth/user/me/addresses', () => {
        test('lists saved addresses and marks the default address', async () => {
            const response = await request(app)
                .get('/api/auth/user/me/addresses')
                .set('Cookie', `token=${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                addresses: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(String),
                        street: expect.any(String),
                        city: expect.any(String),
                        state: expect.any(String),
                        country: expect.any(String),
                        pincode: expect.any(String),
                        phone: expect.any(String),
                        isDefault: expect.any(Boolean),
                    }),
                ]),
            });

            expect(response.body.addresses.filter((address) => address.isDefault)).toHaveLength(1);
        });

        test('rejects unauthenticated requests', async () => {
            const response = await request(app).get('/api/auth/user/me/addresses');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Unauthorized' });
        });
    });

    describe('POST /api/auth/user/me/addresses', () => {
        test('adds a valid address', async () => {
            const response = await request(app)
                .post('/api/auth/user/me/addresses')
                .set('Cookie', `token=${token}`)
                .send({
                    street: '123 Main Street',
                    city: 'New York',
                    state: 'NY',
                    country: 'United States',
                    pincode: '10001',
                    phone: '+14155552671',
                    isDefault: true,
                });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                address: expect.objectContaining({
                    street: '123 Main Street',
                    pincode: '10001',
                    phone: '+14155552671',
                    isDefault: true,
                }),
            });
        });

        test('rejects an invalid pincode and phone number', async () => {
            const response = await request(app)
                .post('/api/auth/user/me/addresses')
                .set('Cookie', `token=${token}`)
                .send({
                    street: '123 Main Street',
                    city: 'New York',
                    state: 'NY',
                    country: 'United States',
                    pincode: '123',
                    phone: 'abc',
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ path: 'pincode' }),
                    expect.objectContaining({ path: 'phone' }),
                ]),
            );
        });
    });

    describe('DELETE /api/auth/user/me/addresses/:addressId', () => {
        test('removes a saved address', async () => {
            const addressId = user.addresses[0]._id.toString();
            const response = await request(app)
                .delete(`/api/auth/user/me/addresses/${addressId}`)
                .set('Cookie', `token=${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ message: 'Address deleted successfully' });

            const updatedUser = await userModel.findById(user._id);
            expect(updatedUser.addresses).toHaveLength(1);
            expect(updatedUser.addresses[0].isDefault).toBe(true);
        });

        test('rejects unauthenticated requests', async () => {
            const response = await request(app)
                .delete('/api/auth/user/me/addresses/507f1f77bcf86cd799439011');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Unauthorized' });
        });
    });
});