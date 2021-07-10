const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { findUserByEmail,  } = require('./helpers.js');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// URLs Database:
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "123456" },
  "b3xBn3": {
    longURL: "http://www.cnn.com",
    userId: "123456" },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "987654" },
  "7sm3xK": {
    longURL: "http://www.nbc.com",
    userId: "987654" }
};

// Users Database:
const users = {
  "123456": {
    id: "123456",
    email: "majs@gmail.com",
    password: bcrypt.hashSync("111", saltRounds)
  },
  "987654": {
    id: "987654",
    email: "papg@gmail.com",
    password: bcrypt.hashSync("222", saltRounds)
  }
};

// Function to generate random string of six alphanumeric value
const generateRandomString = () => {
  const random = Math.random().toString(36).substring(2,8);
  return random;
};

//Create a new User
const addNewUser = (email, textPassword) => {
  const userId = generateRandomString();
  const password = bcrypt.hashSync(textPassword, saltRounds);
  const newUserObj = {
    id: userId,
    email,
    password
  };
  users[userId] = newUserObj;
  return userId;
};

// Function to return URLs by user
const urlsForUser = (id, urlDatabase) => {
  const currentUser = id;
  let userUrls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userId === currentUser) {
      userUrls[key] = urlDatabase[key];
    }
  }
  return userUrls;
};

//redirect main site to login page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Login user
app.get("/login", (req, res) => {
  const templateVars = {username: users[req.session['user_id']], users};
  console.log("TEST", templateVars);
  res.render('urls_login', templateVars);
});

// User login
app.post("/login", (req, res) => {
  const user = findUserByEmail(req.body.email, users);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session['user_id'] = user.id;
    res.redirect('/urls');
  } else {
    res.status(400).send("Error: You are not registered <a href='/register'>(register here!)</a> or You are using the wrong combination <a href='/login'>(try again!)</a>");
  }
});

//Show URLs page with the list
app.get("/urls", (req, res) => {
  const userLogged = users[req.session["user_id"]];
  if (!userLogged) { //if the user is not logged
    res.status(400).send("Error: First, <a href='/register'> register </a> or <a href='/login'> login </a>, thanks!!");
    return;
  }
  const urls = urlsForUser(req.session["user_id"], urlDatabase);
  const templateVars = { username: users[req.session["user_id"]], urls};
  res.render("urls_index", templateVars);
});
// New URLs
app.get("/urls/new", (req, res) => {
  const userLogged = users[req.session["user_id"]];
  if (!userLogged) {
    res.redirect('/login');
    return;
  }
  const templateVars = { username: users[req.session["user_id"]]};
  res.render("urls_new", templateVars);
});

//list the URLs
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const validation = 'http://';
  if (longURL.includes(validation)) {
    urlDatabase[shortURL] = {
      longURL,
      userId: users[req.session["user_id"]].id
    };
  } else {
    urlDatabase[shortURL] = {
      longURL: `${validation}${longURL}`,
      userId: users[req.session["user_id"]].id
    };
  }
  res.redirect(`/urls/${shortURL}`);
});
// Receive the shortURL
app.get("/urls/:shortURL", (req, res) => {
  const userLogged = users[req.session["user_id"]];
  const temp = req.params.shortURL;
  //1. First condition is to check whether the shortURL is existing or not?
  if (!urlDatabase[temp]) {
    res.status(400).send('Error: The shortURL does not exists in the database. Please try with another one!');
  }
  //2. Check for the Condition if user is not logged in
  if (!userLogged) {
    res.status(400).send('Error: You are not logged. Try again!');
  } else {
    //3. if the user is logged in and then urls does not belong to the user!
    if (urlDatabase[temp].userId !== req.session.user_id) {
      res.status(400).send('Error: This URL is not belong to you. Try again!');
    } else { //url belongs to the particular users
      const templateVars = { shortURL: temp, longURL: urlDatabase[temp]["longURL"], username: users[req.session["user_id"]]};
      console.log("TESST", templateVars);
      res.render("urls_show", templateVars);
    }
  }
});
// Link the shortURL to the website
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURLObj = urlDatabase[shortURL];
  if (longURLObj) {
    res.redirect(longURLObj.longURL);
  } else {
    res.send('Error: The URL is not registered! go back and try another one.');
  }
});
//  Delete the url
app.post("/urls/:shortURL/delete", (req, res) => {
  const userLogged = [req.session["user_id"]];
  const urlDel = req.params.shortURL;
  if (!userLogged) {
    return res.redirect('/login');
  }
  delete urlDatabase[urlDel];
  res.redirect("/urls");
});
// Edit the url
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL].longURL = req.body.longURL;
  //userId: users[req.session["user_id"]]};
  res.redirect(`/urls/${shortURL}`);
});
// Get register
app.get("/register", (req, res) => {
  const templateVars = { username: users[req.session['username']]};
  res.render('urls_register', templateVars);
});
// Register new users
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  const user = findUserByEmail(email, users);
  if (!email || !password) {
    res.status(400).send("Error: You need an Email and Password to Register. Please <a href='/register'> try again</a>");
    return;
  }
  if (user) {
    res.status(400).send("Error: Email already exists. Please <a href='/register'> try again</a>");
    return;
  } else {
    const userId = addNewUser(email, password);
    req.session['user_id'] = userId;
    res.redirect("/urls");
  }
});
// User logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.status(400).send("Error: You are not registered <a href='/register'>(register here!)</a> or You are not logged <a href='/login'>(try again!)</a>");
});

