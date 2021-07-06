const express = require('express');
const router = express.Router();
const { allowIfLoggedin } = require('../middlewares/auth');
const { grantAccess } = require('../middlewares/grantAccess');
const userController = require('../controllers/userController');

router.get('/:userId', allowIfLoggedin, userController.getUser);

router.get(
  '/users/page=:page&limit=:limit',
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
  '/add/basket/:libraryId/:bookId',
  allowIfLoggedin,
  userController.addBookToBasket
);

router.post(
  '/delete/:libraryId/:bookId',
  allowIfLoggedin,
  userController.deleteBookFromBasket
);

router.post(
  '/add/add-favorites/:bookId',
  allowIfLoggedin,
  userController.addBookToFavorite
);

router.post(
  '/delete-favorites/:bookId',
  allowIfLoggedin,
  userController.deleteBookFromFavorite
);

router.post('/confirm', allowIfLoggedin, userController.confirmBasket);

router.post('/clear', allowIfLoggedin, userController.clearRentedArray);

router.post('/clear-basket', allowIfLoggedin, userController.clearBasket);

module.exports = router;
