// Find user email in users object
const findUserByEmail = (email, users) => {
  for (let user of Object.keys(users)) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

// Function to generate random string of six alphanumeric value
const generateRandomString = () => {
  const random = Math.random().toString(36).substring(2,8);
  return random;
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

module.exports = { findUserByEmail, generateRandomString,urlsForUser };