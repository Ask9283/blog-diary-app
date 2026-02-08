const jwt = require('jsonwebtoken');

function verifyToken(req) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return { error: 'JWT_SECRET is not configured' };
    }
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'No Authorization header' };
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, secret);
        return { user: decoded };
    } catch (err) {
        return { error: err.message };
    }
}

function unauthorizedResponse(reason) {
    return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: '認証が必要です。ログインしてください。', reason: reason || 'unknown' })
    };
}

module.exports = { verifyToken, unauthorizedResponse };
