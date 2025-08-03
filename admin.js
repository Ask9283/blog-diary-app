document.addEventListener('DOMContentLoaded', async () => {
    const noteForm = document.getElementById('note-form');
    const successMessage = document.getElementById('success-message');
    const errorMessageDiv = document.getElementById('error-message');
    const logoutButton = document.getElementById('logout-button');
    const noteList = document.getElementById('note-list');
    const formTitle = document.getElementById('form-title');
    const formSubmitButton = document.getElementById('form-submit-button');
    const formCancelButton = document.getElementById('form-cancel-button');
    const noteIdInput = document.getElementById('note-id');

    const showError = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
        setTimeout(() => { errorMessageDiv.style.display = 'none'; }, 5000);
    };

    const showSuccess = (message) => {
        successMessage.textContent = message;
        setTimeout(() => { successMessage.textContent = ''; }, 3000);
    };

    // --- API呼び出し (本物) ---
    const api = {
        getNotes: async () => {
            const response = await fetch('/api/get-notes');
            if (!response.ok) throw new Error('Failed to fetch notes');
            return await response.json();
        },
        createNote: async (note) => {
            const response = await fetch('/api/create-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(note)
            });
            if (!response.ok) throw new Error('Failed to create note');
            return await response.json();
        },
        updateNote: async (note) => {
            const response = await fetch('/api/update-note', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(note)
            });
            if (!response.ok) throw new Error('Failed to update note');
            return await response.json();
        },
        deleteNote: async (id) => {
            const response = await fetch(`/api/delete-note?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete note');
        }
    };

    // --- フォームの状態をリセット ---
    const resetForm = () => {
        noteForm.reset();
        noteIdInput.value = '';
        formTitle.textContent = '新しい日記を追加';
        formSubmitButton.textContent = 'この内容で投稿する';
        formCancelButton.style.display = 'none';
    };

    // --- 日記リストを描画 ---
    const renderNoteList = (notes) => {
        noteList.innerHTML = '';
        if (!notes) return;
        notes.forEach(note => {
            const item = document.createElement('li');
            item.className = 'note-list-item';
            item.innerHTML = `
                <span class="note-list-item-title">${note.title}</span>
                <div class="note-list-item-actions">
                    <button class="edit-button" data-id="${note.id}">編集</button>
                    <button class="delete-button" data-id="${note.id}">削除</button>
                </div>
            `;
            noteList.appendChild(item);
        });
    };

    // --- ページ全体の再読み込み ---
    const refreshPage = async () => {
        try {
            const notes = await api.getNotes();
            renderNoteList(notes);
        } catch (error) {
            console.error(error);
            showError('日記リストの読み込みに失敗しました。');
        }
    };

    // --- フォーム送信処理 (作成/更新) ---
    noteForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = noteIdInput.value || null;
        const noteData = {
            title: document.getElementById('note-title').value,
            content: document.getElementById('note-content').value,
            tags: document.getElementById('note-tags').value,
        };

        try {
            if (id) {
                await api.updateNote({ ...noteData, id });
                showSuccess('日記を更新しました！');
            } else {
                await api.createNote(noteData);
                showSuccess('新しい日記を投稿しました！');
            }
            resetForm();
            await refreshPage();
        } catch (error) {
            console.error(error);
            showError('操作に失敗しました。');
        }
    });

    // --- 編集/削除ボタンのイベント処理 ---
    noteList.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('edit-button')) {
            try {
                const notes = await api.getNotes();
                const note = notes.find(n => n.id === id);
                if (note) {
                    noteIdInput.value = note.id;
                    document.getElementById('note-title').value = note.title;
                    document.getElementById('note-content').value = note.content;
                    document.getElementById('note-tags').value = note.tags;
                    formTitle.textContent = '日記を編集';
                    formSubmitButton.textContent = '更新する';
                    formCancelButton.style.display = 'inline-block';
                    window.scrollTo(0, 0);
                }
            } catch (error) {
                showError('編集データの読み込みに失敗しました。');
            }
        } else if (target.classList.contains('delete-button')) {
            if (confirm('本当にこの日記を削除しますか？')) {
                try {
                    await api.deleteNote(id);
                    showSuccess('日記を削除しました。');
                    await refreshPage();
                } catch (error) {
                    console.error(error);
                    showError('削除に失敗しました。');
                }
            }
        }
    });
    
    // キャンセルボタン
    formCancelButton.addEventListener('click', resetForm);

    // ログアウトボタン
    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });

    // --- 初期表示 ---
    await refreshPage();
});
