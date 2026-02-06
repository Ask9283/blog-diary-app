document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const result = await response.json();
                sessionStorage.setItem('authToken', result.token);
                window.location.href = 'admin.html';
            } else if (response.status === 429) {
                errorMessage.textContent = 'ログイン試行回数が多すぎます。しばらくお待ちください。';
            } else {
                errorMessage.textContent = 'ユーザー名またはパスワードが違います。';
            }
        } catch (error) {
            console.error('Login request failed:', error);
            errorMessage.textContent = 'ログイン処理中にエラーが発生しました。';
        }
    });
});
