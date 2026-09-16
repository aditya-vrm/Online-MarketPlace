const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../Model/user.model');

async function registerUser(req, res) {
	const { username, email, password, fullname:{ firstname, lastname }} = req.body;

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
        address:user.address,
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
            address: user.address,
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
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
            address: user.address,
        },
    });
}

module.exports = { registerUser, loginUser, getCurrentUser };

