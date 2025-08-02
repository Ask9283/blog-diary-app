document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // 本来はサーバーで検証する部分
        // ここでは 'admin' / 'password' を正しい組み合わせとする
        if (username === 'admin' && password === 'password') {
            // ログイン成功の証をセッションストレージに保存
            sessionStorage.setItem('isLoggedIn', 'true');
            // 管理ページにリダイレクト
            window.location.href = 'admin.html';
        } else {
            // ログイン失敗
            errorMessage.textContent = 'ユーザー名またはパスワードが違います。';
        }
    });
});
