// Returns a user from the database given an email
function getUserByEmail(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
}
module.exports = { getUserByEmail };