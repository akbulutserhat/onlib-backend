const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { allowIfLoggedin } = require('../middlewares/auth');
const { grantAccess } = require('../middlewares/grantAccess');

router.post(
  '/',
  allowIfLoggedin,
  grantAccess('updateAny', 'profile'),
  libraryController.addLibrary
);

router.post(
  '/:libraryId/:bookId',
  allowIfLoggedin,
  grantAccess('readAny', 'profile'),
  libraryController.addBookToLibrary
);

router.post(
  '/:libraryId',
  allowIfLoggedin,
  grantAccess('readAny', 'profile'),
  libraryController.clear_orders
);

router.post(
  '/delete/:libraryId/:bookId',
  allowIfLoggedin,
  grantAccess('readAny', 'profile'),
  libraryController.deleteBookFromLibrary
);

router.get('/libraries', allowIfLoggedin, libraryController.getLibraries);

router.get('/:libraryId', allowIfLoggedin, libraryController.getLibrary);

router.get(
  '/attendant/:libraryId',
  allowIfLoggedin,
  grantAccess('readAny', 'profile'),
  libraryController.getLibraryForAttendant
);

router.delete(
  '/:libraryId',
  allowIfLoggedin,
  grantAccess('deleteAny', 'profile'),
  libraryController.deleteLibrary
);

router.put(
  '/:libraryId',
  allowIfLoggedin,
  grantAccess('readAny', 'profile'),
  libraryController.updateLibrary
);

module.exports = router;
