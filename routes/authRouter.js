const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { allowIfLoggedin } = require('../middlewares/auth');

router.post('/signup', authController.signup);

router.post('/login', authController.loginValidate, authController.login);

router.get('/user', allowIfLoggedin, authController.getAuthenticatedUser);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', allowIfLoggedin, authController.logout);
router.get(
  '/:id/refresh-tokens',
  allowIfLoggedin,
  authController.getRefreshTokens
);

module.exports = router;
