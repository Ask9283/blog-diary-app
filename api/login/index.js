const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createRateLimiter } = require('../shared/rateLimiter');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '1h';

// レート制限: 同一IPから15分間に5回まで
const isLoginRateLimited = createRateLimiter('login', 5, 15 * 60 * 1000);

module.exports = async function (context, req) {
    const clientIp = (req.headers['x-forwarded-for'] || req.headers['client-ip'] || 'unknown').split(',')[0].trim();
    if (isLoginRateLimited(clientIp)) {
        context.res = {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'ログイン試行回数が多すぎます。しばらくお待ちください。' }
        };
        return;
    }

    const { username, password } = req.body || {};

    if (!username || !password) {
        context.res = {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'ユーザー名とパスワードが必要です。' }
        };
        return;
    }

    const correctUsername = process.env.ADMIN_USERNAME;
    const correctPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    try {
        const isUsernameValid = username === correctUsername;
        const isPasswordValid = await bcrypt.compare(password, correctPasswordHash);

        if (isUsernameValid && isPasswordValid) {
            const token = jwt.sign(
                { username: username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRY }
            );
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, token: token }
            };
        } else {
            context.res = {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'ユーザー名またはパスワードが正しくありません。' }
            };
        }
    } catch (error) {
        context.log.error('Login error:', error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'ログイン処理中にエラーが発生しました。' }
        };
    }
};
