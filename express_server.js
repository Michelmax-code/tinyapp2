const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { findUserByEmail, generateRandomString, urlsForUser } = require('./helpers.js');
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

//redirect main site to urls page
app.get("/", (req, res) => {
  const userLogged = users[req.session["user_id"]];
  if (userLogged) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Login user
app.get("/login", (req, res) => {
  const templateVars = {username: users[req.session['user_id']], users};
  const userLogged = users[req.session["user_id"]];
  if (userLogged) {
    res.redirect("/urls");
  } else {
    res.render('urls_login', templateVars);
  }
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

//list the URLs
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const validation = 'http://';
  const userLogged = users[req.session["user_id"]];
  if (userLogged) {
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
  } else {
    res.status(400).send("Error: You are not logged!. Please <a href='/register'> register </a> or <a href='/login'> login </a> to can do changes.");
  }
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

// Receive the shortURL
app.get("/urls/:shortURL", (req, res) => {
  const userLogged = users[req.session["user_id"]];
  const temp = req.params.shortURL;
  //1. First condition is to check whether the shortURL is existing or not?
  if (!urlDatabase[temp]) {
    res.status(400).send('Error: The shortURL does not exists in the database. Please try with another one!');
    return;
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
    return res.status(400).send("Error: First, <a href='/register'> register </a> or <a href='/login'> login </a>, thanks!!");
  }
  if (urlDatabase[req.params.shortURL].userId !== req.session.user_id) {
    res.status(400).send('Error: This URL is not belong to you. Try again!');
  } else {
    delete urlDatabase[urlDel];
    res.redirect("/urls");
  }
});

// Edit the url
app.post("/urls/:id", (req, res) => {
  const userLogged = req.session["user_id"];
  const shortURL = req.params.id;
  if (!userLogged) {
    return res.status(400).send("Error: First, <a href='/register'> register </a> or <a href='/login'> login </a>, thanks!!");
  }
  if (urlDatabase[shortURL].userId !== userLogged) {
    res.status(400).send('Error: This URL is not belong to you. Try again!');
  } else {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

// Get register
app.get("/register", (req, res) => {
  const templateVars = { username: users[req.session['username']]};
  const userLogged = users[req.session["user_id"]];
  if (userLogged) {
    res.redirect("/urls");
    return;
  }
  res.render('urls_register', templateVars);
});

// Register new users
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  const user = findUserByEmail(email, users);
  //1. Verify if the forms are complete
  if (!email || !password) {
    res.status(400).send("Error: You need an Email and Password to Register. Please <a href='/register'> try again</a>");
    return;
  }
  //2. Verify if the user already exists
  if (user) {
    res.status(400).send("Error: Email already exists. Please <a href='/register'> try again</a>");
    return;
  } else { //3. Create the new user
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

// Listen initialized
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

