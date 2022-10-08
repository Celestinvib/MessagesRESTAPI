const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async(req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('validation failed.');
        error.statusCode = 422;
        error.data = errors.array(); //Keep the original error and pass it to the frontend
        throw error;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    try {
        const hashedPw = await bcrypt.hash(password, 12);
        
        const user = new User({
            email: email,
            password: hashedPw,
            name: name
        });
        await user.save();
        res.status(201).json({ message: 'User created!' , userId: user._id});

    }catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;

    const user = await User.findOne({email: email});

    if(!user) {
        const error = new Error('A user with this email could not be found');
        error.statusCode = 401;
        throw error; 
    }
    loadedUser = user;

    try {
        const isEqual = await bcrypt.compare(password,user.password); //Compare the bcrypt password entered with the user password 
        if(!isEqual) { 
            const error = new Error('Wrong password!');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({
            email: loadedUser.email, 
            userId: loadedUser._id.toString()
        }, 
        process.env.JWT_PRIVATE_KEY, //Private jwt signature
        {expiresIn: '1h'}
        );

        res.status(200).json({
            token: token, 
            userId: loadedUser._id.toString()
        })

    }catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}

exports.getUserStatus = async (req, res, next) => {
    const user = await User.findById(req.userId);
    try {

        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ status: user.status });

    }catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    
}

exports.updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status;
    const user = await User.findById(req.userId)
    
    try {
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }

        user.status = newStatus;
        await user.save();

        res.status(200).json({message: 'User updated.'});

    }catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}