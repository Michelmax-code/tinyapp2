const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const generateRandomString = () => {
  let random = Math.random().toString(36).substring(2,8);
  return random;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "123456": {
    id: "123456",
    email: "majs@gmail.com",
    password: "111"
  },
  "987654": {
    id: "987654",
    email: "papg@gmail.com",
    password: "222"
  }
};
// Find user email in users object
const findUserByEmail = (email, users) => {
  for (let user of Object.keys(users)) {
    if (users[user].email === email) {
      return users[user];
    }
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  let validation = 'http://';
  if (longURL.includes(validation)) {
    urlDatabase[shortURL] = longURL;
  } else {
    urlDatabase[shortURL] = `${validation}${longURL}`;
  }
  //console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  let temp = req.params.shortURL;
  const templateVars = { shortURL: temp, longURL: urlDatabase[temp], username: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  //console.log('TEST', longURL);
  res.redirect(longURL);
});
//  Delete the url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});
// Edit the url
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});
// User login
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});
// User logout
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});
// Get register
app.get("/register", (req, res) => {
  const templateVars = { username: req.cookies['username']};
  res.render('urls_register', templateVars);
});
// Register new users
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === '' || password === '') {
    res.send('400: Bad Request', 400);
  }
  if (findUserByEmail(req.body.email, users)) {
    res.send('400: Bad Request', 400);
  } else {
    const userId = generateRandomString();
    users[userId] = {
      id: userId,
      email,
      password
    };
    res.cookie('email', email);
    res.cookie('user_id', userId);
    console.log(users);
    res.redirect("/urls");
  }
});
