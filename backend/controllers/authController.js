const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    console.log('Register request received:', req.body);
    try {
        const { name, email, password, role, department } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const userId = await User.create({ name, email, password, role, department });
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.Password);

        console.log("LOGIN DEBUG: User found:", user);
        console.log("LOGIN DEBUG: Password match:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.UserID || user.id, role: user.Role || user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.UserID || user.id,
                name: user.Name || user.name,
                email: user.Email || user.email,
                role: user.Role || user.role,
                department: user.Department || user.department
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, password, department } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Validate that role is not being manipulated here. 
        // We trust the query in userModel to NOT include Role column update.
        await User.update(userId, { name, email, password, department });

        // Fetch updated user to return
        const updatedUser = await User.findById(userId);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.UserID,
                name: updatedUser.Name,
                email: updatedUser.Email,
                role: updatedUser.Role,
                department: updatedUser.Department
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};
