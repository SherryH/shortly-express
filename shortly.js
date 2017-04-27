var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));


app.get('/', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/create', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/links', util.checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', util.checkUser,
function(req, res) {
  var uri = req.body.url;
  console.log('url: ', uri);
  console.log('req.body: ', req.body);
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});


/************************************************************/
// Write your authentication routes here
/************************************************************/
// POST/GET signup
// POST/GET login (indexpage)
// GET logout
app.get('/login',
function(req, res) {
  res.render('login');
});

//work on these functions:

app.post('/login', function(req, res){

  var username = req.body.username;
  var password = req.body.password;

  //look up in db
  new User({ username: username }).fetch().then(function(user) {
    if (user) {
      bcrypt.compare(password, user.get('password'), function(err, results) {
        if (!results) {
          console.log('wrong pw');
          res.redirect('/login');
        } else {
          req.session.regenerate(function() {
            console.log('req.session in post login:', req.session);
            req.session.user = user;
            console.log('req.session.user in post login:', req.session.user);
            res.redirect('/');
          });
        }
      });
    } else {
      console.log('wrong username');
      res.redirect('/login');
    }
  });
});
//
// Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });
  //take in username and password
  //check it against what we have in our DB
  //compare hashed passwords
  //if all things match up
  //grant them access

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req,res) {
  console.log("requestbody", req.body);
  var username = req.body.username;
  var password = req.body.password;


  new User({ username: username }).fetch().then(function(user) {
    console.log('user:', user);
    if (!user) {
      bcrypt.hash(password, null, null, function(err, hash) {
        console.log('hash:', hash);
        var newUser = new User({
          username: username,
          password: hash
        });
        console.log('newUser:', newUser);
        newUser.save().then(function() {
          req.session.regenerate(function() {
            console.log('req.session:', req.session);
            req.session.user = newUser;
          });
        });
      });
      //
    } else {
      console.log('user already exists');
      res.redirect('/signup');
    }
  }).catch((err)=>{ console.log('fetch user error', err); });

//   bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
//   // Store hash in your password DB.
// });
        // Links.create({
        //   url: uri,
        //   title: title,
        //   baseUrl: req.headers.origin
        // })
        // .then(function(newLink) {
        //   res.status(200).send(newLink);

});
  // get username
  // get pw
  // from req.body

  // save into database
  // interact with DB through knex/ORM

  // get a new user by adding to database
  // before adding password in password column of user table
  // hash it ?
  // and then create a session for that user

//**FILL OUT LOGOUT IN TEMPLATES
app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/login');
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
