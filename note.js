// DOMの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', async () => { // ★★★ asyncを追加 ★★★
    const noteDetailContainer = document.getElementById('note-detail-container');
    const tagListContainer = document.getElementById('tag-list');

    /**
     * APIからデータを取得する処理をシミュレートする関数。
     */
    const fetchNotesFromAPI = async () => {
        console.log('Fetching data (simulation)...');
        return Promise.resolve(notesData);
    };

    /**
     * 全ての日記データからタグを集計し、頻度順にソートして返す関数
     */
    const getSortedTags = (notes) => {
        const tagCounts = {};
        notes.forEach(note => {
            const tags = note.tags.split(' ').filter(tag => tag.startsWith('#'));
            tags.forEach(tag => {
                if (tag) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            });
        });
        return Object.entries(tagCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([tag, count]) => ({ tag, count }));
    };

    /**
     * ソートされたタグリストをサイドバーに描画する関数
     */
    const renderTags = (sortedTags) => {
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
    const allNotes = await fetchNotesFromAPI();

    // タグリストを描画
    const sortedTags = getSortedTags(allNotes);
    renderTags(sortedTags);

    // 詳細ページの表示処理
    const params = new URLSearchParams(window.location.search);
    const noteId = parseInt(params.get('id'), 10);
    const note = allNotes.find(n => n.id === noteId);

    if (note) {
        document.title = note.title;
        noteDetailContainer.innerHTML = `
            <h1>${note.title}</h1>
            <p class="content">${note.content}</p>
            <p class="tags">${note.tags}</p>
        `;
    } else {
        noteDetailContainer.innerHTML = '<h1>エラー</h1><p>指定された日記は見つかりませんでした。</p>';
    }
});
