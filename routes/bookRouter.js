const express = require('express');
const router = express.Router();
const { allowIfLoggedin } = require('../middlewares/auth');
const { grantAccess } = require('../middlewares/grantAccess');
const bookController = require('../controllers/bookController');

router.post(
  '/',
  allowIfLoggedin,
  grantAccess('readAny', 'profile'),
  bookController.addBook
);

router.get('/books/page=:page&limit=:limit', bookController.getBooks);

router.get('/:bookId', bookController.getBook);

router.delete(
  '/:bookId',
  allowIfLoggedin,
  grantAccess('deleteAny', 'profile'),
  bookController.deleteBook
);

router.put(
  '/:bookId',
  allowIfLoggedin,
  grantAccess('updateAny', 'profile'),
  bookController.updateBook
);

module.exports = router;
