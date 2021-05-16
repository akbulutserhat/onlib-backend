const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema({
  title: { type: String },
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
  ],
});

module.exports = mongoose.model('Category', categorySchema);
