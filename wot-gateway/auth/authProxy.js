var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');
var https = require('https');
var proxy = require('./middleware/proxy.js');
var fs = require('fs');
var config = require('./config/config.json').config;
var token = require('./config/config.json').things[0].token;
var path = require('path');
var cors = require('cors');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var shell = require('shelljs');

var keyFilePath = path.join(__dirname, 'config', 'privateKey.pem');
var key_file = fs.readFileSync(keyFilePath, 'utf8');

var caFilePath = path.join(__dirname, 'config', 'caCert.pem');
var cert_file = fs.readFileSync(caFilePath, 'utf8');

var passphrase = 'WoT-Gateway';

var tlsConfig = {
  key: key_file,
  cert: cert_file,
  passphrase: passphrase
};

/**
 * Configure the local strategy for use by Passport.
 * 
 * The local strategy require a 'verify' function which receives the credentials
 * ('username' and 'password') submitted by the user. The function must verify
 * that the password is correct and then invoke 'done' with a user object, which
 * will be set at 'req.user' in route handlers after authentication.
 */
passport.use(new Strategy({
  passReqToCallback: true // allows us to pass back the entire request to the callback
},
  function (req, username, password, done) {
    db.users.checkPassword(password, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); }
      return done(null, user);
    });
  }));


/**
 * Configure Passport authenticated session persistence.
 * 
 * In order to restore authentication state across HTTP requests, Passport needs
 * to serialize users into and deserialize users out of the session. The
 * typical implementation of this is as simple as supplying the user ID when
 * serializing, and querying the user record by ID from the database when
 * deserializing.
 */
passport.serializeUser(function (user, done) {
  //console.log('serialize user with id ' + user.id);
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  //console.log('deserialize user with id ' + id);
  db.users.findById(id, function (err, user) {
    if (err) { return done(err); }
    done(null, user);
  });
});

// Create a new Express application
var app = express();

// Configure view engine to render EJS templates
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

morgan.token('date', function () {
  var date = new Date();
  //date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toString();
});

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling
app.use(morgan(':date :method :url :status :res[content-length] - :response-time ms'));
app.use(cookieParser());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(cors());
app.use(require('express-session')({ secret: 'Jozin z Bazin', resave: false, saveUninitialized: false }));
app.use(express.static(__dirname + '/views'));

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // use connect-flash for flash messages stored in session

// Define routes
app.get('/login',
  function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  }); // GET /login

/**
 * Authentication if user interacts via browser
 * (uses redirects and flash messages)
 */
app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login',
    failureFlash: true // allow flash messages
  })); // POST /login

/**
 * Authentication if user interacts via Web App
 * (uses only HTTP status codes)
 */
// app.post('/login', function (req, res, next) {
//   //console.log('Cookies: ', req.cookies);
//   passport.authenticate('local', function (err, user, info) {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       return res.sendStatus(401);
//     }
//     // log in the user
//     req.logIn(user, function (err) {
//       if (err) {
//         return next(err);
//       }
//       // once login succeeded, return the current API token along with the profile page
//       res.setHeader('Access-Control-Expose-Headers', ['Token', 'User']);
//       res.setHeader('Token', token);
//       // also send the user object, so the user of the web app can be identified
//       res.setHeader('User', JSON.stringify(user));
//       return res.render('profile', { user: req.user, message: req.flash('pwChangedMessage') });
//     });
//   })(req, res, next);
// }); // POST /login

app.get('/logout',
  function (req, res) {
    req.logout();
    res.redirect('/login');
  }); // GET /logout

app.get('/reset',
  function (req, res) {
    db.users.reset(function (err) {
      if (err) {
        req.flash('loginMessage', 'failed to reset password');
        // res.redirect('/login');
        res.render('login', { message: req.flash('loginMessage') });
      } else {
        req.flash('loginMessage', 'Password reseted to factory settings. Please enter the password found in the operation manual.');
        // res.redirect('/login');
        res.render('login', { message: req.flash('loginMessage') });
      }
    });
  }); // GET /reset

app.get('/connectWLAN',
  function (req, res) {
    // req.flash('WLANMessage', 'Test.');
    res.render('connectWLAN', { message: req.flash('WLANMessage') });
  }); // GET /connectWLAN

app.post('/connectWLAN',
  function (req, res, next) {
    var password = req.body.password;
    var ssid = req.body.ssid;

    console.log('Trying to connect to WLAN ' + ssid + ' with password ' + password);
    shell.exec('sudo nmcli dev wifi connect ' + ssid + ' password ' + password + '', function (code, stdout, stderr) {
      console.log('Exit code:', code);
      console.log('Program output:', stdout);
      console.log('Program stderr:', stderr);
      if (code !== 0) {
        console.log('failed to connect to WiFi ' + ssid);
        req.flash('WLANMessage', stderr);
      } else {
        console.log('connected to WiFi ' + ssid);
        req.flash('WLANMessage', stdout);
      }

      res.render('connectWLAN', { message: req.flash('WLANMessage') });
    });
  }); // POST /connectWLAN


/** NOT USED ANYMORE, function also implemented in the custom authorisation middleware
 * npm middleware, uses redirects to /login if user isn't authenticated
 * use this when client interacts with a browser
 */
// app.use(require('connect-ensure-login').ensureLoggedIn());

/**
 * custom authorisation middleware, checks if user is authenticated.
 * Uses either only status code 401 (if client interacts via a Web App)
 * or redirects to login (when client interacts with a browser)
 */
app.use(function (req, res, next) {
  // if the request is neither authorized via cookie
  // nor the right token and user-object in the header, send a plain 401 status
  // console.log('Authorization: ' + req.get('authorization'));
  // console.log('isAuthenticated: ' + req.isAuthenticated());
  // console.log('user: ' + req.get('user'));
  if ((!req.isAuthenticated || !req.isAuthenticated()) &&
    (!isTokenValid(req) || !hasUserHeader(req))) {
    // console.log('Request is not authenticated!');
    // console.log('Token is valid: ' + isTokenValid(req));
    // console.log('User header is present: ' + hasUserHeader(req));

    // without redirect, only plain status code
    // return res.sendStatus(401);

    // with redirect to /login
    return res.redirect('/login');
  }
  // console.log('Request is authenticated!');
  next();
}); // authorisation middleware

function isTokenValid(req) {
  var reqToken = req.body.token || req.get('authorization') ||
    req.query.token || req.headers['Authorization'];
  // console.log('checking if token is valid, because it is:');
  // console.log(reqToken == token);
  return reqToken == token;
} // isTokenValid

function hasUserHeader(req) {
  //console.log('checking if user header is present');
  var reqUser = req.body.user || req.get('user') ||
    req.query.user || req.headers['user'];
  if (reqUser) {
    try {
      reqUser = JSON.parse(reqUser);
      if (reqUser.id >= 0) {
        // add the user object to the user-property of the request,
        // so the following middlewares can use it (useful for /editProfile)
        req.user = reqUser;
        return true;
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  } else {
    return false;
  }
} // hasUserHeader

// beyond this line, all routes can only be accessed if the user is logged in
// or authenticated via token & user in the request header

app.get('/profile',
  function (req, res) {
    res.render('profile', { user: req.user, message: req.flash('pwChangedMessage') });
  }); // GET /profile

app.get('/editProfile',
  function (req, res) {
    console.log('user: ' + JSON.stringify(req.user));
    res.render('editProfile', { user: req.user, message: req.flash('pwChangeFailedMessage') });
  }); // GET /editProfile


app.post('/editProfile',
  function (req, res) {
    var id = req.user.id;
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;

    db.users.changePassword(id, oldPassword, newPassword, confirmPassword,
      function (success, message) {
        if (!success) {
          console.log('did not change password');
          req.flash('pwChangeFailedMessage', message);
          res.status(420);  // Policy Not Fulfilled
          res.redirect('/editProfile');
          // res.render('editProfile', { user: req.user, message: req.flash('pwChangeFailedMessage') });
        } else {
          console.log('successfully changed password');
          req.flash('pwChangedMessage', message);
          res.redirect('/profile');
          // res.render('profile', { user: req.user, message: req.flash('pwChangedMessage') });
        }
      }); // changePassword
  }); // POST /editProfile

app.get('/application',
  function (req, res) {
    res.render('application');
  }); // GET /application

app.get('/error',
  function (req, res) {
    res.render('error', { user: req.user, message: req.flash('errorMessage') });
  }); // GET /error


// add the proxy server middleware, which adds the API-Token of the
// WoT-Server to the request and proxy all requests and responses
app.use(proxy());

// Don't show the whole call stack in the response if there's an error
app.use(function (error, req, res, next) {
  if (error) {
    console.log(error);
    res.sendStatus(500);    // Internal Server Error
  } else {
    next();
  }
});

var httpServer = https.createServer(tlsConfig, app);

httpServer.listen(config.sourcePort, function () {
  console.log('WoT Authentication Proxy started on port: %d', config.sourcePort);
});

