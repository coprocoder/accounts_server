const bcrypt = require('bcrypt-nodejs');

// Compare (password from request) and (password hash from db)
module.exports.isValidPassword = function(passwordHashFromDB, passwordInput) {
  return bcrypt.compareSync(passwordHashFromDB, passwordInput);
}

// Generates hash using bCrypt
module.exports.createHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}