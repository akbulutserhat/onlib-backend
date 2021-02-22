const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const refreshTokenschema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  token: String,
  expires: Date,
  created: { type: Date, default: Date.now },
  createdByIp: String,
  revoked: Date,
  revokedByIp: String,
  replacedByToken: String,
});

refreshTokenschema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});

refreshTokenschema.virtual('isActive').get(function () {
  return !this.revoked && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', refreshTokenschema);
