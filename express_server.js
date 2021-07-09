const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const generateRandomString = () => {
  let random = Math.random().toString(36).substring(2,8);
  return random;
};

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
// Find user email in users object
const findUserByEmail = (email, users) => {
  for (let user of Object.keys(users)) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};
// Function to return URL by user
const urlsForUser = (id, urlDatabase) => {
  let currentUser = id;
  let userUrls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userId === currentUser) {
      userUrls[key] = urlDatabase[key];
    }
  }
  return userUrls;
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
//Show  URLs page with the list
app.get("/urls", (req, res) => {
  const userLooged = users[req.session["user_id"]];
  if (!userLooged) {
    res.status(400).send("Error: First, <a href='/register'> register </a> or <a href='/login'> login </a>, thanks!!");
    return;
  }
  const urls = urlsForUser(req.session["user_id"], urlDatabase);
  const templateVars = { username: users[req.session["user_id"]], urls};
  //console.log("test logout", req.session);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userLogged = users[req.session["user_id"]];
  //console.log(userLogged);
  if (!userLogged) {
    res.redirect('/login');
    return;
  }
  const templateVars = { username: users[req.session["user_id"]]};
  res.render("urls_new", templateVars);
});
//list the URLs
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  let validation = 'http://';
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
  //console.log("TEST DATABASE", urlDatabase);
  res.redirect(`/urls/${shortURL}`);

});

app.get("/urls/:shortURL", (req, res) => {
  const userLogged = users[req.session["user_id"]];
  //console.log(userLogged);
  if (!userLogged) {
    res.redirect('/login');
    return;
  }
  let temp = req.params.shortURL;
  const templateVars = { shortURL: temp, longURL: urlDatabase[temp]["longURL"], username: users[req.session["user_id"]]};
  //console.log("test temp: ", temp);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  //console.log("TEST SHORTURL", shortURL);
  const longURLObj = urlDatabase[shortURL];
  if (longURLObj) {
    res.redirect(longURLObj.longURL);
  } else {
    res.send('Error: The URL is not registered! go back and try another one.');
  }
  //console.log('PARAMS', req.params);
  //console.log("test long url", longURL);
  //console.log("test datbase", urlDatabase);
  //res.redirect(longURL);
});
//  Delete the url
app.post("/urls/:shortURL/delete", (req, res) => {
  const userLogged = [req.session["user_id"]];
  let urlDel = req.params.shortURL;
  if (!userLogged) {
    return res.redirect('/login');
  } else if (urlDatabase[urlDel].userId !== userLogged) {
    res.send("This is not belong to you");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});
// Edit the url
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userId: users[req.session["user_id"]]};
  res.redirect(`/urls/${shortURL}`);
});
// User login
app.post("/login", (req, res) => {
  let user = findUserByEmail(req.body.email, users);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session['user_id'] = user.id;
    res.redirect('/urls');
  } else {
    res.status(403).send('Forbidden Error: You are not registered or You are using the wrong combination');
  }
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
  // const email = req.body.email;
  // const password = req.body.password;
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
  res.redirect("/login");
});
// Login user
app.get("/login", (req, res) => {
  let templateVars = {username: users[req.session['user_id']], users};
  res.render('urls_login', templateVars);
});
