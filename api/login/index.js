// api/login/index.js
const crypto = require('crypto');

module.exports = async function (context, req) {
    const { username, password } = req.body;

    // 環境変数から正しいユーザー名とパスワードハッシュを取得
    const correctUsername = process.env.ADMIN_USERNAME;
    const correctPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!username || !password) {
        return context.res = { status: 400, body: "Username and password are required." };
    }

    // 入力されたパスワードをハッシュ化
    const inputPasswordHash = crypto.createHash('sha256').update(password).digest('hex');

    // ユーザー名とハッシュ化されたパスワードを比較
    if (username === correctUsername && inputPasswordHash === correctPasswordHash) {
        // 認証成功
        context.res = {
            status: 200,
            body: { success: true, message: "Login successful" }
        };
    } else {
        // 認証失敗
        context.res = {
            status: 401, // Unauthorized
            body: { success: false, message: "Invalid credentials" }
        };
    }
};
