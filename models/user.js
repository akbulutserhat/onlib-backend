const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  role: {
    type: String,
    default: 'basic',
    enum: ['basic', 'supervisor', 'admin'],
  },
  favorited_books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
  ],
  books_in_the_basket: [
    {
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
      library: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Library',
      },
    },
  ],
  rented_books: [
    {
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
      library: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Library',
      },
      rented_date: {
        type: Date,
        default: Date.now,
      },
      is_delivered: {
        type: Boolean,
        default: false,
      },
    },
  ],
  debts: [
    {
      library: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Library',
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
  ],
  accessToken: {
    type: String,
  },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
