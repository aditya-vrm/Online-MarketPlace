const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../Model/user.model');
const redis=require('../db/redis');

function serializeAddress(address) {
    const serializedAddress = address.toObject ? address.toObject() : { ...address };
    serializedAddress.id = serializedAddress._id.toString();
    delete serializedAddress._id;
    return serializedAddress;
}

async function registerUser(req, res) {
	const { username, email, password, fullname:{ firstname, lastname },role} = req.body;

    const isUserAlreadyExists = await userModel.findOne({ $or: [{ username }, { email }] });
    if (isUserAlreadyExists) {
        return res.status(409).json({ message: 'username or email already exists' });
    }
    const hash=await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password: hash,
        fullname: { firstname, lastname },
        role: role || 'user',
    });

    const token = jwt.sign({ 
        id: user._id,
        username:user.username,
        email:user.email,
        role:user.role,
        },
          process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: true, 
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({
        message: 'User registered successfully',
        user: { 
        id: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        addresses: user.addresses,
}}); 
}

async function loginUser(req, res) {
    const { username,email, password } = req.body;
    const user = await userModel.findOne({ $or: [{ username }, { email }] }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
    }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: 'Login successful',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
            addresses: user.addresses,
        },
    });
}

async function getCurrentUser(req, res) {
    const user = await userModel.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
        message:'user fetched successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
            addresses: user.addresses,
        },
    });
}
async function logoutUser(req, res) {

    const token = req.cookies.token;
    if (token) {
        await redis.set(`blacklist:${token}`,'true', 'EX', 24 * 60 * 60); // 1 day
    }
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
    });

    return res.status(200).json({ message: 'Logout successful' });
}
async function getUserAddresses(req, res) {

    const user = await userModel.findById(req.user.id).select('addresses');

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
        addresses: user.addresses.map(serializeAddress),
    });
}

async function addUserAddress(req, res) {
    const { street, city, state, country, pincode, phone, isDefault } = req.body;

    const user = await userModel.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (isDefault) {
        // If the new address is set as default, unset the previous default address
        user.addresses.forEach((address) => {
            address.isDefault = false;
        });
    }

    const newAddress = {
        street,
        city,
        state,
        country,
        pincode,
        phone,
        isDefault: isDefault || user.addresses.length === 0, // Set as default if it's the first address
    };

    user.addresses.push(newAddress);
    await user.save();

    const savedAddress = user.addresses[user.addresses.length - 1];

    return res.status(201).json({
        message: 'Address added successfully',
        address: serializeAddress(savedAddress),
    });
}

async function deleteUserAddress(req, res) {
    const { addressId } = req.params;

    const user = await userModel.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex((address) => address._id.toString() === addressId);

    if (addressIndex === -1) {
        return res.status(404).json({ message: 'Address not found' });
    }

    const deletedAddress = user.addresses.splice(addressIndex, 1)[0];

    // If the deleted address was the default, set the first address as default (if any)
    if (deletedAddress.isDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
        message: 'Address deleted successfully',
        deletedAddress,
    });
}   

module.exports = { registerUser, loginUser, getCurrentUser, logoutUser, getUserAddresses, addUserAddress, deleteUserAddress };


