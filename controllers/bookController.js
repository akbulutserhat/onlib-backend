const Book = require('../models/book');
const Library = require('../models/library');

exports.getBooks = async (req, res, next) => {
  const page = parseInt(req.params.page);
  const limit = parseInt(req.params.limit);
  const books = await Book.find({})
    .skip(limit * page)
    .limit(limit);
  const count = await Book.countDocuments();
  res.status(200).json({
    data: books,
    count,
  });
};

exports.getBook = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const book = await await Book.findById(bookId).populate({
      path: 'libraries',
      select: 'name address city',
    });
    if (!book) return next(new Error('Book does not exist')); // display of errors will be fixed.
    res.status(200).json({
      data: book,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.addBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);

    res.status(200).json({
      data: book,
      message: 'Book has been added succesfully.',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const update = req.body;
    const bookId = req.params.bookId;
    await Book.findByIdAndUpdate(bookId, update);
    const book = await Book.findById(bookId);
    res.status(200).json({
      data: book,
      message: 'Book has been updated',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const book = await Book.findByIdAndDelete(bookId);
    res.status(200).json({
      data: book,
      message: 'Book has been deleted',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};
