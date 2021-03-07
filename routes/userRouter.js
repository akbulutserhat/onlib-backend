const express = require('express');
const router = express.Router();
const { allowIfLoggedin } = require('../middlewares/auth');
const { grantAccess } = require('../middlewares/grantAccess');
const userController = require('../controllers/userController');

router.get('/:userId', allowIfLoggedin, userController.getUser);

router.get(
  '/users',
  allowIfLoggedin,
  grantAccess('updateAny', 'profile'),
  userController.getUsers
);

router.put(
  '/:userId',
  allowIfLoggedin,
  grantAccess('updateAny', 'profile'),
  userController.updateUser
);

router.delete(
  '/:userId',
  allowIfLoggedin,
  grantAccess('deleteAny', 'profile'),
  userController.deleteUser
);

router.post(
  '/:libraryId/:bookId',
  allowIfLoggedin,
  userController.addBookToBasket
);

router.post(
  '/delete/:libraryId/:bookId',
  allowIfLoggedin,
  userController.deleteBookFromBasket
);

router.post('/confirm', allowIfLoggedin, userController.confirmBasket);

router.post('/clear', allowIfLoggedin, userController.clearRentedArray);

module.exports = router;
