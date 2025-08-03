// note.js
document.addEventListener('DOMContentLoaded', async () => {
    const noteDetailContainer = document.getElementById('note-detail-container');
    const tagListContainer = document.getElementById('tag-list');
    const errorMessageDiv = document.getElementById('error-message');

    const showError = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    };

    const fetchAllNotes = async () => {
        try {
            const response = await fetch('/api/get-notes');
            if (!response.ok) throw new Error('Failed to fetch notes');
            return await response.json();
        } catch (error) {
            console.error(error);
            showError('日記データの読み込みに失敗しました。');
            return [];
        }
    };

    const renderTags = (allNotes) => {
        const tagCounts = {};
        allNotes.forEach(note => {
            if (!note.tags) return;
            const tags = note.tags.split(' ').filter(tag => tag.startsWith('#'));
            tags.forEach(tag => {
                if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(item => ({ tag: item[0], count: item[1] }));

        tagListContainer.innerHTML = '';
        sortedTags.forEach(tagInfo => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `index.html?search=${encodeURIComponent(tagInfo.tag)}`;
            link.textContent = `${tagInfo.tag} (${tagInfo.count})`;
            listItem.appendChild(link);
            tagListContainer.appendChild(listItem);
        });
    };

    // --- メインの処理 ---
    const allNotes = await fetchAllNotes();
    renderTags(allNotes);

    const params = new URLSearchParams(window.location.search);
    // ★★★ ここを修正しました ★★★
    // parseInt()を削除し、IDを文字列として扱うように変更
    const noteId = params.get('id'); 

    if (noteId && allNotes.length > 0) {
        // IDが文字列同士で比較されるようにする
        const note = allNotes.find(n => n.id === noteId);

        if (note) {
            document.title = note.title;
            noteDetailContainer.innerHTML = `
                <h1>${note.title}</h1>
                <p class="content">${note.content}</p>
                <p class="tags">${note.tags}</p>
            `;
        } else {
            showError('指定された日記は見つかりませんでした。');
        }
    } else if (!noteId) {
        showError('表示する日記のIDが指定されていません。');
    }
});