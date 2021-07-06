const Book = require('../models/book');
const Library = require('../models/library');
const User = require('../models/user');

exports.getUsers = async (req, res, next) => {
  const page = parseInt(req.params.page);
  const limit = parseInt(req.params.limit);
  const users = await User.find({})
    .select('fullName email role _id')
    .skip(limit * page)
    .limit(limit);
  const count = await User.countDocuments();
  res.status(200).json({
    data: users,
    count,
  });
};

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) return next(new Error('User does not exist'));
    res.status(200).json({
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const update = req.body;
    const userId = req.params.userId;
    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    res.status(200).json({
      data: user,
      message: 'User has been updated',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndDelete(userId);
    res.status(200).json({
      data: user,
      message: 'User has been deleted',
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

// Checking the stock of book in the library
exports.checkStock = async (libraryId, bookId) => {
  const stock = await Library.findOne({
    _id: libraryId,
    'books.book': bookId,
    'books.stock': { $gt: 0 },
  });

  return stock;
};

exports.addBookToBasket = async (req, res, next) => {
  try {
    const libraryId = req.params.libraryId;
    const bookId = req.params.bookId;
    const userId = req.user._id;

    const stock = this.checkStock(libraryId, bookId);
    if (stock) {
      const user = await User.findOneAndUpdate(
        { _id: userId, 'books_in_the_basket.book': { $ne: bookId } },
        {
          $push: { books_in_the_basket: { book: bookId, library: libraryId } },
        },
        { new: true, useFindAndModify: false }
      );
      if (user) {
        // No duplicate
        res.status(200).json({
          message: 'Book has been added to the basket.',
        });
      } else {
        // There is a duplication. Dont need to adding.
        res.status(404).json({
          message:
            'Book has been already added to the basket. Check the basket',
        });
      }
    } else {
      res.status(404).json({
        message: 'There is no stock of book in this library',
      });
    }
  } catch (err) {
    res.status(500).json({
      error,
    });
  }
};

exports.deleteBookFromBasket = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;
    await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { books_in_the_basket: { book: bookId } } },
      { safe: true, useFindAndModify: false }
    );

    res.status(200).json({
      message: 'Book has been deleted from the basket.',
    });
  } catch (err) {
    res.status(500).json({
      error,
    });
  }
};

// all items must same libraryId before confirm operation.
const checkBasketForSameLibrary = async (basketArray) => {
  const libraryArray = [];
  for (let index = 0; index < basketArray.length; index++) {
    const element = basketArray[index];
    libraryArray.push(element.library);
  }
  return libraryArray.every(
    (val) => toString(val) === toString(libraryArray[0])
  );
};

/*const checkAllStock = async (userId, basketArray) => {
  console.log(basketArray);
  let isGreaterThanZero = true;
  for (let index = 0; index < basketArray.length; index++) {
    const library = await Library.findOne({
      _id: basketArray[index].library,
      'books.book': basketArray[index].book,
    });
    console.log(library);
    if (!library) {
      // Automatic delete book from basket if there is no stock.
      await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { books_in_the_basket: { book: basketArray[index].book } } },
        { safe: true, useFindAndModify: false }
      );
      isGreaterThanZero = false;
    }
  }
  return isGreaterThanZero;
}; */

// All books stock should be decreased after confirm operation
const decreaseStockAmounts = async (basketArray) => {
  for (let index = 0; index < basketArray.length; index++) {
    const element = basketArray[index];
    await Library.findOneAndUpdate(
      { _id: element.library, 'books.book': element.book },
      { $inc: { 'books.$.stock': -1 } },
      { safe: true, useFindAndModify: false }
    );
  }
};

exports.confirmBasket = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId }).select(
      '-_id -books_in_the_basket._id'
    );
    const books_in_the_basket = user.books_in_the_basket.slice();
    const isSameLibrary = await checkBasketForSameLibrary(books_in_the_basket);
    console.log(isSameLibrary);
    if (!isSameLibrary)
      return res.status(400).json({
        message: 'There should only be the same library in the basket !',
      });
    /* const isStockEnough = await checkAllStock(userId, books_in_the_basket);
    console.log(isStockEnough);
    if (!isStockEnough)
      return res.status(400).json({
        message:
          'Books were out of stock and were automatically removed from the basket ! Check again the basket',
      }); */
    await User.findOneAndUpdate(
      { _id: userId },
      { $push: { rented_books: { $each: books_in_the_basket } } },
      { new: true, useFindAndModify: false }
    );
    let books = [];
    for (let index = 0; index < books_in_the_basket.length; index++) {
      const element = books_in_the_basket[index];
      books.push(element.book);
    }
    const library = await Library.findOneAndUpdate(
      { _id: books_in_the_basket[0].library },
      { $push: { orders: { books: books, user: userId } } },
      { new: true, useFindAndModify: false }
    );
    await decreaseStockAmounts(books_in_the_basket);
    // Clear the basket
    await User.findOneAndUpdate(
      { _id: userId },
      { $set: { books_in_the_basket: [] } },
      { safe: true, useFindAndModify: false }
    );
    res.status(200).json({
      message: `Your order has been confirmed. You have 2 days for go to the library. You can take your books with this id ${library._id}`,
    });
  } catch (err) {
    res.status(500).json({
      err,
    });
  }
};

exports.clearRentedArray = async (req, res, next) => {
  const userId = req.user._id;
  await User.findOneAndUpdate(
    { _id: userId },
    { $set: { rented_books: [] } },
    { safe: true, useFindAndModify: false }
  );

  res.status(200).json({
    message: `Rented array has been cleared`,
  });
};

exports.clearBasket = async (req, res, next) => {
  const userId = req.user._id;
  await User.findOneAndUpdate(
    { _id: userId },
    { $set: { books_in_the_basket: [] } },
    { safe: true, useFindAndModify: false }
  );

  res.status(200).json({
    message: `Basket has been cleared`,
  });
};

exports.addBookToFavorite = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    const user = await User.findOneAndUpdate(
      { _id: userId, favorited_books: { $ne: bookId } },
      { $push: { favorited_books: bookId } },
      { new: true, useFindAndModify: false }
    );
    if (user) {
      // No duplicate
      res.status(200).json({
        message: 'Book has been added to the favorited books.',
      });
    } else {
      // There is a duplication. Dont need to adding.
      res.status(404).json({
        message:
          'Book has been already added to the favorited books. Check the favorited books list!',
      });
    }
  } catch (err) {
    console.log('catche girdi');
    res.status(500).json({
      error,
    });
  }
};

exports.deleteBookFromFavorite = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { favorited_books: bookId } },
      { safe: true, useFindAndModify: false }
    );

    res.status(200).json({
      message: 'Book has been deleted from the favorited books.',
    });
  } catch (err) {
    res.status(500).json({
      error,
    });
  }
};
