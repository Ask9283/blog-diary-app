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
    };

    const showSuccess = (message) => {
        successMessage.textContent = message;
        setTimeout(() => { successMessage.textContent = ''; }, 3000);
    };

    // --- API呼び出し (シミュレーション) ---
    const api = {
        getNotes: async () => Promise.resolve(notesData),
        createNote: async (note) => {
            const newNote = { ...note, id: Date.now() };
            notesData.unshift(newNote);
            return Promise.resolve(newNote);
        },
        updateNote: async (note) => {
            const index = notesData.findIndex(n => n.id === note.id);
            if (index > -1) {
                notesData[index] = { ...notesData[index], ...note };
                return Promise.resolve(notesData[index]);
            }
            return Promise.reject('Note not found');
        },
        deleteNote: async (id) => {
            const index = notesData.findIndex(n => n.id === id);
            if (index > -1) {
                notesData.splice(index, 1);
                return Promise.resolve({ message: 'Deleted' });
            }
            return Promise.reject('Note not found');
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
            showError('日記リストの読み込みに失敗しました。');
        }
    };

    // --- フォーム送信処理 (作成/更新) ---
    noteForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = noteIdInput.value ? parseInt(noteIdInput.value, 10) : null;
        const noteData = {
            title: document.getElementById('note-title').value,
            content: document.getElementById('note-content').value,
            tags: document.getElementById('note-tags').value,
        };

        try {
            if (id) {
                // 更新
                await api.updateNote({ ...noteData, id });
                showSuccess('日記を更新しました！');
            } else {
                // 新規作成
                await api.createNote(noteData);
                showSuccess('新しい日記を投稿しました！');
            }
            resetForm();
            refreshPage();
        } catch (error) {
            showError('操作に失敗しました。');
        }
    });

    // --- 編集/削除ボタンのイベント処理 ---
    noteList.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id ? parseInt(target.dataset.id, 10) : null;
        if (!id) return;

        if (target.classList.contains('edit-button')) {
            // 編集
            const note = notesData.find(n => n.id === id);
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
        } else if (target.classList.contains('delete-button')) {
            // 削除
            try {
                await api.deleteNote(id);
                showSuccess('日記を削除しました。');
                refreshPage();
            } catch (error) {
                showError('削除に失敗しました。');
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
    refreshPage();
});
