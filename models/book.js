const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true, default: 'Anonymous' },
  image: String,
  descriptions: [],
  categories: [],
  readLink: String,
  libraries: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Library',
    },
  ],
});

module.exports = mongoose.model('Book', bookSchema);
