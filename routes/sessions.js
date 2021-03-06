var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var connect = require('connect');
var GitHubStrategy = require('passport-github').Strategy;

var GITHUB_CLIENT_ID = "f15bb76b68279c20ce4c";
var GITHUB_CLIENT_SECRET = "16b4ee54f1043591636fae42d1aa604a1590db0a";


router.get('/new', function(req, res, next) {
    res.render('sessions/new');
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getUserByUsername(username, function(err, user) {
            if (err) throw err;
            if (!user) {
                return done(null, false, {
                    message: 'Unknown User'
                });
            }
            User.comparePassword(password, user.password, function(err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Invalid password'
                    });
                }
            });
        });
    }));


passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: "https://code-fish.herokuapp.com/auth/github/callback"
}, function(accessToken, refreshToken, profile, done) {
       User.findOne({
           'githubId': profile.id
       })
       .then(function (user) {
           if (!user) {
               var newUser = {
                   username: profile.displayName || profile.username,
                   githubId: profile.id
               };

               if (profile._json.avatar_url) {
                 newUser.avatar = new Buffer(profile._json.avatar_url, 'binary');
               }
               user = new User(newUser);
               return user.save();
           }
           return user;
       })
       .then(function (user) {
           done(null, user);
       })
       .catch(function (err) {
           return done(err);
       });
   }));



passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

router.post('/new',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/sessions/new',
        failureFlash: true
    }));

router.get('/destroy', function(req, res) {
    req.logout();
    req.flash('success_msg', 'Successfully signed out');
    res.redirect('/');
});


module.exports = router;
