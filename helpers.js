// Returns a user from a database given an email
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
};

// Returns urls belonging to the user with a given id
const urlsForUser = function(id, database) {
  const result = {};
  for (let url in database) {
    if (database[url].userID === id) {
      result[url] = database[url];
    }
  }
  return result;
};

// Return a string of 6 random characters
const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports = { getUserByEmail, urlsForUser, generateRandomString };