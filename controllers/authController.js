const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { check, validationResult } = require('express-validator');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

exports.loginValidate = [
  check('email', 'Email is not valid').isEmail(),
  check('email', 'Email cannot be blank').notEmpty(),
  check('password', 'Password cannot be blank').notEmpty(),
  check('email').normalizeEmail({ remove_dots: false }),
];

exports.signup = async (req, res, next) => {
  // Check for validation error
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(errors);
  try {
    const { email, password, firstName, role } = req.body;
    const user = await User.findOne({ email });
    if (user)
      return res.status(401).json({
        message:
          'The email address you have entered is already associated with another account.',
      });
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      role: role || 'basic',
    });
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );
    newUser.accessToken = accessToken;
    await newUser.save();
    res.status(200).json({
      data: newUser,
      message: 'You registered succesfully',
      accessToken,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.login = async (req, res, next) => {
  // Check for validation erro
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(errors.array());
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .send({ msg: 'Double-check your email address and try again.' });
    const validPassword = await validatePassword(password, user.password);
    if (!validPassword)
      return res.status(401).send({ msg: 'Password is not correct' });
    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateJwtToken(user);
    const refreshToken = generateRefreshToken(user, ipAddress);

    // save refresh token
    await refreshToken.save();

    // return basic details and tokens
    return res.status(200).json({
      ...basicDetails(user),
      jwtToken,
      refreshToken: refreshToken.token,
    });
  } catch (error) {
    res.status(500).json({
      msg: `Error occured ${error}`,
    });
  }
};

exports.getAuthenticatedUser = async (req, res) => {
  if (!req.user) return res.status(404).json({ msg: 'No user' });
  const user = await User.findById(req.user._id).select('-password');
  return res.status(200).json({
    user,
  });
};

exports.refreshToken = async (req, res) => {
  const token = req.body.refreshToken;
  const ipAddress = req.ip;
  const refreshToken = await getRefreshToken(token);
  if (!refreshToken) return res.status(200).send(); // Bu normalde hata kodu göndermeli ama hata kodu gönderince client sıkıntı yaşıyor.
  const { user } = refreshToken;

  // replace old refresh token with a new one and save
  const newRefreshToken = generateRefreshToken(user, ipAddress);
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.save();
  await newRefreshToken.save();

  // generate new jwt
  const jwtToken = generateJwtToken(user);
  // return basic details and tokens
  return res.status(200).json({
    ...basicDetails(user),
    jwtToken,
    refreshToken: newRefreshToken.token,
  });
};

exports.logout = async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(userId, {
    accessToken: '',
  });
  return res.status(200).json({ message: 'Logout succesfull' });
};

exports.getRefreshTokens = async (req, res) => {
  const userId = req.params.id;
  // return refresh tokens for user
  const refreshTokens = await RefreshToken.find({ user: userId });
  return res.status(200).json({
    refreshTokens,
  });
};

const getRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ token }).populate('user');
  if (!refreshToken) return undefined;
  return refreshToken;
};

const generateJwtToken = (user) => {
  // create a jwt token containing the user id that expires in 15 minutes
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1w',
  });
};

const generateRefreshToken = (user, ipAddress) => {
  // create a refresh token that expires in 7 days
  return new RefreshToken({
    user: user._id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
};

const randomTokenString = () => {
  return crypto.randomBytes(40).toString('hex');
};

function basicDetails(user) {
  const { _id, firstName, lastName, email, role } = user;
  return { _id, firstName, lastName, email, role };
}
