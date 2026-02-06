const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

function unauthorizedResponse() {
    return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: { error: '認証が必要です。ログインしてください。' }
    };
}

module.exports = { verifyToken, unauthorizedResponse };
