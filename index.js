const express = require('express');
const app = express();
require('dotenv').config({ path: __dirname + '/./.env' });
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 6000;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const User = require('./models/user');

const auth_router = require('./routes/authRouter');
const user_router = require('./routes/userRouter');
const library_router = require('./routes/libraryRouter');
const book_router = require('./routes/bookRouter');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const corsOptions = {
  credentials: true,
  origin: 'http://localhost:3000',
};
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// For authentication middleware
app.use(async (req, res, next) => {
  if (req.headers['x-access-token']) {
    const accessToken = req.headers['x-access-token'];
    const { exp, userId } = jwt.verify(accessToken, process.env.JWT_SECRET);
    let date = new Date().getTime();
    date = Math.floor(date / 1000);
    // Check if token has expired
    if (exp < date) {
      console.log('Exp errora girdi');
      return res.status(401).json({
        error: 'JWT token has expired, please login to obtain a new one',
      });
    }
    res.locals.loggedInUser = await User.findById(userId);
    next();
  } else {
    next();
  }
});

app.use('/auth', auth_router);
app.use('/user', user_router);
app.use('/library', library_router);
app.use('/book', book_router);

app.listen(port, () => {
  console.log(`Server running at here ${port}`);
});
