const crypto = require("crypto")

// Validate password with password in database
function validatePassword(password, hash, salt) {
    const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return hash == hashVerify
}

// Generate hash version of password
function genPassword(password) {
    const salt = crypto.randomBytes(32).toString('hex') // random value to help with complexity of hash
    const genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex') 

    return {
        salt,
        hash: genHash
    }
}

module.exports = {
    validatePassword,
    genPassword
}