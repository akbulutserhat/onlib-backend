const Book = require('../models/book');
const User = require('../models/user');
const Library = require('../models/library');
const { Schema } = require('mongoose');

const populateQuery = [
  { path: 'books.book' },
  { path: 'users.user', select: 'firstName email' },
  { path: 'orders.books', select: 'image title' },
  { path: 'orders.user', select: 'firstName email' },
];

exports.getLibraries = async (req, res, next) => {
  const libraries = await Library.find({}).select('-users -books -orders');

  res.status(200).json({
    data: libraries,
  });
};

exports.getLibrary = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const library = await Library.findById(libraryId).select('-users -orders');
    await library.populate('books.book').execPopulate();
    if (!library) return next(new Error('Library does not exist')); // display of errors will be fixed.
    res.status(200).json({
      data: library,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.addUserToLibrary = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const userId = req.params.userId;
    const { userData } = req.body;
    const { ssn, phone } = userData;
    const library = await Library.findOneAndUpdate(
      { _id: libraryId, 'users.user': { $ne: userId } },
      {
        $push: {
          users: { user: userId, private_info: { ssn, phone } },
        },
      },
      { new: true, useFindAndModify: false }
    );
    if (library) {
      // No duplicate
      await library.populate(populateQuery).execPopulate();
      res.status(200).json({
        data: library,
        message: 'User was added to the library.',
      });
    } else {
      // There is a duplication. Dont need to adding.
      res.status(400).json({
        message: 'User was already added to the library. Dont need to adding !',
      });
    }
  } catch (err) {
    res.status(500).json({
      error,
    });
  }
};

exports.increaseStock = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const bookId = req.params.bookId;
    await Library.findOneAndUpdate(
      { _id: libraryId, 'books.book': { $eq: bookId } },
      { $inc: { 'books.$.stock': 1 } },
      { new: false, useFindAndModify: false }
    );
    res.status(200).json({
      message: 'Number of stock was increased.',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const orderId = req.params.orderId;
    const { status } = req.body;
    const library = await Library.findOneAndUpdate(
      { _id: libraryId, 'orders._id': { $eq: orderId } },
      { $set: { 'orders.$.status': status } },
      { new: true, useFindAndModify: false }
    );
    await library.populate(populateQuery).execPopulate();
    res.status(200).json({
      data: library,
      message: 'status of order was updated.',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const bookId = req.params.bookId;
    const { newStock } = req.body;
    const library = await Library.findOneAndUpdate(
      { _id: libraryId, 'books.book': { $eq: bookId } },
      { $set: { 'books.$.stock': newStock } },
      { new: true, useFindAndModify: false }
    );
    await library.populate(populateQuery).execPopulate();
    res.status(200).json({
      data: library,
      message: 'Number of stock was updated.',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.getLibraryForAttendant = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const library = await Library.findById(libraryId);
    await library.populate(populateQuery).execPopulate();
    if (!library) return next(new Error('Library does not exist')); // display of errors will be fixed.
    res.status(200).json({
      data: library,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.addLibrary = async (req, res, next) => {
  try {
    const library = await Library.create(req.body);

    res.status(200).json({
      data: library,
      message: 'Library has been added succesfully.',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.addBookToLibrary = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const bookId = req.params.bookId;
    const library = await Library.findOneAndUpdate(
      { _id: libraryId, 'books.book': { $ne: bookId } },
      {
        $push: {
          books: { book: bookId, stock: parseInt(Math.random() * 10) + 1 },
        },
      },
      { new: true, useFindAndModify: false }
    );
    if (library) {
      // No duplicate
      await library.populate(populateQuery).execPopulate();
      res.status(200).json({
        data: library,
        message: 'Book was added to the library.',
      });
    } else {
      // There is a duplication. stock of book will be increase.
      this.increaseStock(req, res, next);
    }
    await Book.findOneAndUpdate(
      { _id: bookId, libraries: { $ne: libraryId } },
      { $push: { libraries: libraryId } },
      { new: true, useFindAndModify: false }
    );
  } catch (err) {
    res.status(500).json({
      err,
    });
  }
};

exports.clear_orders = async (req, res) => {
  const libraryId = req.params.libraryId;
  await Library.findByIdAndUpdate(
    { _id: libraryId },
    { $set: { orders: [] } },
    { safe: true, useFindAndModify: false }
  );

  res.status(200).json({
    message: `Orders has been cleared`,
  });
};

exports.clear_library_books = async (req, res) => {
  try {
    const libraryId = req.params.libraryId;
    await Library.findByIdAndUpdate(
      { _id: libraryId },
      { $set: { books: [] } },
      { safe: true, useFindAndModify: false }
    );

    res.status(200).json({
      message: `Books has been cleared`,
    });
  } catch (err) {
    res.status(500).json({
      err,
    });
  }
};

exports.updateLibrary = async (req, res, next) => {
  try {
    const update = req.body;
    const libraryId = req.params.libraryId;
    await Library.findByIdAndUpdate(libraryId, update);
    const library = await Library.findById(libraryId);
    res.status(200).json({
      data: library,
      message: 'Library has been updated',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.deleteLibrary = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const data = await Library.findByIdAndDelete(libraryId);
    res.status(200).json({
      data,
      message: 'Library has been deleted',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.deleteBookFromLibrary = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const bookId = req.params.bookId;
    const library = await Library.findByIdAndUpdate(
      libraryId,
      { $pull: { books: { book: bookId } } },
      { new: true, useFindAndModify: false }
    );
    await Book.findByIdAndUpdate(
      bookId,
      { $pull: { libraries: libraryId } },
      { safe: true, useFindAndModify: false }
    );
    await library.populate(populateQuery).execPopulate();
    res.status(200).json({
      data: library,
      message: 'Book was deleted from the library.',
    });
  } catch (err) {
    res.status(500).json({
      err,
    });
  }
};
