const mongoose = require('mongoose');
const { Schema } = mongoose;

const librarySchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  books: [
    {
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
      stock: { type: Number, min: 0 },
    },
  ],
  orders: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      books: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Book',
        },
      ],
      status: {
        type: String,
        default: 'preparing',
        enum: ['preparing', 'ready', 'delivered', 'received'],
      },
      order_date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  users: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      private_info: {
        ssn: String, // For example: Tc No
        phone: String,
      },
    },
  ],
});

module.exports = mongoose.model('Library', librarySchema);
