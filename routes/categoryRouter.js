const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/fill', categoryController.fillCategories);

router.get('/categories', categoryController.getCategories);

router.get(
  '/:categoryId/page=:page&limit=:limit',
  categoryController.getCategory
);

router.get('/distinct-categories', categoryController.distinctCategories);

module.exports = router;
