
// controllers/authController.js
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

// Controllers
exports.getRegister = (req, res) => {
  res.render('users/register');
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, password2, role } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
      errors.push({ msg: 'Please enter all fields' });
    }
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
      errors.push({ msg: 'Password must be at least 6 characters' });
    }
    if (errors.length > 0) {
      return res.render('users/register', { errors, name, email, password, password2, role });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/users/register');
    }

    const hashed = await bcrypt.hash(password, 10);
    user = new User({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role || 'renter'
    });
    await user.save();
    req.flash('success_msg', 'You are registered and can now login');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Server error');
    res.redirect('/users/register');
  }
};

exports.getLogin = (req, res) => {
  res.render('users/login');
};

exports.postLogin = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) console.error(err);
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
};

// Middleware (merged here as you requested)
exports.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/users/login');
};

exports.forwardAuthenticated = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

exports.ensureOwner = function (req, res, next) {
  if (req.isAuthenticated() && String(req.user.role || '').trim().toLowerCase() === 'owner') {
    return next();
  }
  req.flash('error_msg', 'Only owners can access this resource');
  res.redirect('/');
};

exports.ensureRenter = function (req, res, next) {
  if (req.isAuthenticated() && String(req.user.role || '').trim().toLowerCase() === 'renter') {
    return next();
  }
  req.flash('error_msg', 'Only renters can access this resource');
  res.redirect('/');
};

