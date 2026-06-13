const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const { User } = require('./models')
const options = {};

function comparePass(userPassword, databasePassword) {
  return bcrypt.compareSync(userPassword, databasePassword);
}

passport.serializeUser((user, done) => {
  console.log('user', user)
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log('id', id)

  return User.findOne({
    where:{
      id:id
    }
  })
  .then((user) => { done(null, user); })
  .catch((err) => { done(err,null); });
});

passport.use(new LocalStrategy(options, (email, password, done) => {
  console.log('email', email)

  User.findOne({
    where:{
      email:email
    }
  })
  .then((user) => {
    console.log('user h0',user)
    if (!user) return done(null, false);
    if (!comparePass(password, user.password)) {
      return done(null, false);
    } else {
      return done(null, user);
    }
  })
  .catch((err) => { return done(err); });
}));
