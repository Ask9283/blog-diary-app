document.addEventListener('DOMContentLoaded', async () => {
    // HTMLから要素を取得
    const noteForm = document.getElementById('note-form');
    const successMessage = document.getElementById('success-message');
    const errorMessageDiv = document.getElementById('error-message');
    const logoutButton = document.getElementById('logout-button');
    const noteList = document.getElementById('note-list');
    const formTitle = document.getElementById('form-title');
    const formSubmitButton = document.getElementById('form-submit-button');
    const formCancelButton = document.getElementById('form-cancel-button');
    const noteIdInput = document.getElementById('note-id');
    const loader = document.getElementById('loader');
    const imageUploadInput = document.getElementById('image-upload');
    const uploadStatus = document.getElementById('upload-status');
    const noteContentTextarea = document.getElementById('note-content');
    const livePreview = document.getElementById('live-preview');
    
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('modal-confirm-delete');
    const cancelDeleteBtn = document.getElementById('modal-cancel-delete');
    const modalOverlay = deleteModal.querySelector('.modal-overlay');

    let loadedNotes = [];
    let noteIdToDelete = null;

    const showError = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
        setTimeout(() => { errorMessageDiv.style.display = 'none'; }, 5000);
    };

    const showSuccess = (message) => {
        successMessage.textContent = message;
        setTimeout(() => { successMessage.textContent = ''; }, 3000);
    };

    const api = {
        getNotes: async () => {
            const response = await fetch('/api/get-notes?pageSize=1000'); 
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

    // ★★★ ここから下を新規追加 ★★★
    // note.jsから持ってきた、本文を解析する関数
    const parseContent = (content, allNotes) => {
        if (!content) return '<p class="preview-placeholder">ここに本文のプレビューが表示されます。</p>';
        let parsed = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const wikiLinkRegex = /\[\[(.*?)\]\]/g;
        parsed = parsed.replace(wikiLinkRegex, (match, title) => {
            const linkedNote = allNotes.find(note => note.title.trim() === title.trim());
            if (linkedNote) {
                return `<a href="note.html?id=${linkedNote.id}" class="wiki-link" target="_blank">${title}</a>`;
            } else {
                return `<span class="new-page-link">${title}</span>`;
            }
        });
        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        parsed = parsed.replace(imageRegex, (match, alt, src) => {
            return `<img src="${src}" alt="${alt}" class="embedded-image">`;
        });
        return parsed;
    };

    // プレビューを更新する関数
    const updatePreview = () => {
        const content = noteContentTextarea.value;
        livePreview.innerHTML = `<div class="content">${parseContent(content, loadedNotes)}</div>`;
    };
    // ★★★ ここまで新規追加 ★★★

    const resetForm = () => {
        noteForm.reset();
        noteIdInput.value = '';
        formTitle.textContent = '新しい日記を追加';
        formSubmitButton.textContent = 'この内容で投稿する';
        formCancelButton.style.display = 'none';
        updatePreview(); // プレビューもリセット
    };

    const renderNoteList = (notes) => {
        noteList.innerHTML = '';
        if (!notes) return;
        notes.forEach(note => {
            const item = document.createElement('li');
            item.className = 'note-list-item';
            const imageRegex = /!\[.*?\]\((.*?)\)/;
            const match = note.content.match(imageRegex);
            let imagePreview = '';
            if (match) {
                imagePreview = `<img src="${match[1]}" alt="preview" class="note-list-item-thumbnail">`;
            }
            item.innerHTML = `
                ${imagePreview}
                <span class="note-list-item-title">${note.title}</span>
                <div class="note-list-item-actions">
                    <button class="edit-button" data-id="${note.id}">編集</button>
                    <button class="delete-button" data-id="${note.id}">削除</button>
                </div>
            `;
            noteList.appendChild(item);
        });
    };

    const refreshPage = async () => {
        loader.style.display = 'block';
        noteList.style.display = 'none';
        try {
            const response = await api.getNotes();
            loadedNotes = response.notes; 
            renderNoteList(loadedNotes);
            updatePreview(); // ページ読み込み時にもプレビューを初期化
        } catch (error) {
            console.error(error);
            showError('日記リストの読み込みに失敗しました。');
        } finally {
            loader.style.display = 'none';
            noteList.style.display = 'block';
        }
    };

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

    noteList.addEventListener('click', (event) => {
        const target = event.target;
        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('edit-button')) {
            const note = loadedNotes.find(n => n.id === id);
            if (note) {
                noteIdInput.value = note.id;
                document.getElementById('note-title').value = note.title;
                document.getElementById('note-content').value = note.content;
                document.getElementById('note-tags').value = note.tags;
                formTitle.textContent = '日記を編集';
                formSubmitButton.textContent = '更新する';
                formCancelButton.style.display = 'inline-block';
                window.scrollTo(0, 0);
                updatePreview(); // 編集時にもプレビューを更新
            }
        } else if (target.classList.contains('delete-button')) {
            noteIdToDelete = id;
            deleteModal.classList.add('is-open');
        }
    });
    
    imageUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        uploadStatus.textContent = 'アップロード中...';
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData 
            });
            if (!response.ok) {
                let errorResult;
                try {
                    errorResult = await response.json();
                } catch (e) {
                    errorResult = { message: `アップロードに失敗しました。 (Status: ${response.status})` };
                }
                throw new Error(errorResult.message);
            }
            const result = await response.json();
            const imageUrl = result.imageUrl;
            const markdownImage = `\n![${file.name}](${imageUrl})\n`;
            noteContentTextarea.value += markdownImage;
            uploadStatus.textContent = '完了！';
            updatePreview(); // 画像挿入後にもプレビューを更新
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.textContent = `失敗: ${error.message}`;
        } finally {
            imageUploadInput.value = '';
            if (uploadStatus.textContent === '完了！') {
                setTimeout(() => { uploadStatus.textContent = ''; }, 3000);
            } else {
                setTimeout(() => { uploadStatus.textContent = ''; }, 7000);
            }
        }
    });

    // ★★★ ここを新規追加 ★★★
    // テキストエリアに入力があるたびにプレビューを更新
    noteContentTextarea.addEventListener('input', updatePreview);

    const closeDeleteModal = () => {
        deleteModal.classList.remove('is-open');
        noteIdToDelete = null;
    };

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!noteIdToDelete) return;
        try {
            await api.deleteNote(noteIdToDelete);
            showSuccess('日記を削除しました。');
            await refreshPage();
        } catch (error) {
            console.error(error);
            showError('削除に失敗しました。');
        } finally {
            closeDeleteModal();
        }
    });

    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    modalOverlay.addEventListener('click', closeDeleteModal);
    
    formCancelButton.addEventListener('click', resetForm);

    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });

    await refreshPage();
});
