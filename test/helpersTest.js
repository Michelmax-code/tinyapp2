const { assert } = require('chai');

const { findUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const userInfo = findUserByEmail("user@example.com", testUsers);
    const expectedOutput = { id: "userRandomID", email: "user@example.com", password: "purple-monkey-dinosaur" };
    // Write your assert statement here
    //assert.equal(userInfo.id, expectedOutput.id);
    assert.equal(userInfo.email, expectedOutput.email);
    //assert.equal(userInfo.password, expectedOutput.password);
  });

  it('should return undefined for invalid email', function() {
    const userInfo = findUserByEmail('user033@example.com', testUsers);
    const expectedOutput = false;
    // Write your assert statement here
    assert.equal(userInfo, expectedOutput);
  });

  it('should return a user with valid email', function() {
    const userInfo = findUserByEmail('user2@example.com', testUsers);
    const expectedOutput = { id: "user2RandomID", email: "user2@example.com", password: "dishwasher-funk" };
    // Write your assert statement here
    //assert.equal(userInfo.id, expectedOutput.id);
    assert.equal(userInfo.email, expectedOutput.email);
    //assert.equal(userInfo.password, expectedOutput.password);
  });
});