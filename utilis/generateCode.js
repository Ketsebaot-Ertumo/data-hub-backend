const jwt = require('jsonwebtoken');

const generateConfirmationCode = () => {
    // Generate a random alphanumeric string
    // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const characters = '0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

function generateToken() {
    return jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '4hr' });
}


module.exports = { generateConfirmationCode, generateToken };