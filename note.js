document.addEventListener('DOMContentLoaded', async () => {
    const noteDetailContainer = document.getElementById('note-detail-container');
    const tagListContainer = document.getElementById('tag-list');
    const errorMessageDiv = document.getElementById('error-message');
    const loader = document.getElementById('loader');

    const showError = (message) => {
        if(loader) loader.style.display = 'none';
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    };

    const fetchAllNotes = async () => {
        try {
            // ページネーションを無視して全件取得するために、pageSizeを大きな値に設定
            const response = await fetch('/api/get-notes?pageSize=1000'); 
            if (!response.ok) throw new Error('Failed to fetch notes');
            return await response.json();
        } catch (error) {
            console.error(error);
            showError('日記データの読み込みに失敗しました。');
            return { notes: [] }; // APIの形式に合わせて空のオブジェクトを返す
        }
    };

    const renderTags = (allNotes) => {
        const tagCounts = {};
        if (!allNotes) return;
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
        if(loader) loader.style.display = 'block';
        try {
            // ★★★ ここから下を更新しました ★★★
            // APIからの応答(オブジェクト)をapiResponseとして受け取る
            const apiResponse = await fetchAllNotes();
            // その中から日記の配列(notes)を取り出す
            const allNotes = apiResponse.notes; 

            renderTags(allNotes);

            const params = new URLSearchParams(window.location.search);
            const noteId = params.get('id'); 

            if (noteId && allNotes && allNotes.length > 0) {
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
        } finally {
            if (loader) {
                 loader.style.display = 'none';
            }
        }
    };

    await loadPage();
});
