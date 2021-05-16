const Book = require('../models/book');
const Category = require('../models/category');

const populateQuery = [{ path: 'books' }];

exports.fillCategories = async (req, res, next) => {
  try {
    const books = await Book.find({});
    books.forEach((book) => {
      book.categories.forEach(async (category) => {
        if (category) {
          await Category.findOneAndUpdate(
            {
              title: category,
            },
            { $push: { books: book._id } },
            { new: true, useFindAndModify: false }
          );
        }
      });
    });
    res.status(200).json({
      msg: 'Category table was filled.',
    });
  } catch (error) {
    res.status(500).json({
      msg: `Error occured ${error}`,
    });
  }
};

exports.distinctCategories = async (req, res, next) => {
  const categories = await Book.distinct('categories');
  categories.forEach((category) => {
    if (category) {
      const newCategory = new Category({ title: category });
      newCategory.save();
    }
  });
  res.status(200).json({
    data: categories,
    count: categories.length,
  });
};

exports.getCategories = async (req, res, next) => {
  const categories = await Category.find({});
  const count = await Category.countDocuments();
  res.status(200).json({
    data: categories,
    count,
  });
};

exports.getCategory = async (req, res, next) => {
  const categoryId = req.params.categoryId;
  const category = await Category.findById(categoryId);
  await category.populate(populateQuery).execPopulate();
  res.status(200).json({
    data: category,
  });
};
