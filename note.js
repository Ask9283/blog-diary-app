document.addEventListener('DOMContentLoaded', async () => {
    const noteDetailContainer = document.getElementById('note-detail-container');
    const tagListContainer = document.getElementById('tag-list');
    const errorMessageDiv = document.getElementById('error-message');
    const loader = document.getElementById('loader');

    const showError = (message) => {
        loader.style.display = 'none';
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

    const loadPage = async () => {
        loader.style.display = 'block';
        try {
            const allNotes = await fetchAllNotes();
            renderTags(allNotes);

            const params = new URLSearchParams(window.location.search);
            const noteId = params.get('id'); 

            if (noteId && allNotes.length > 0) {
                const note = allNotes.find(n => n.id === noteId);

                if (note) {
                    document.title = note.title;
                    // ローダーを消してから中身を挿入
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
        } finally {
            // エラーがあってもなくても、最終的にローダーは非表示にする
            // ただし、中身が表示される場合はinnerHTMLで上書きされるので不要
            if (loader) {
                 loader.style.display = 'none';
            }
        }
    };

    await loadPage();
});
