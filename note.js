document.addEventListener('DOMContentLoaded', async () => {
    const noteDetailContainer = document.getElementById('note-detail-container');
    const tagListContainer = document.getElementById('tag-list');
    const errorMessageDiv = document.getElementById('error-message');
    const loader = document.getElementById('loader');

    const showError = (message) => {
        if (loader) loader.style.display = 'none';
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    };

    const fetchAllNotes = async () => {
        try {
            const response = await fetch('/api/get-notes?pageSize=1000');
            if (!response.ok) throw new Error('Failed to fetch notes');
            return await response.json();
        } catch (error) {
            console.error(error);
            showError('日記データの読み込みに失敗しました。');
            return { notes: [] };
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

    const parseContent = (content, allNotes) => {
        if (!content) return '';

        // 1. HTMLエスケープ (XSS対策)
        let parsed = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 2. Wikiリンクのパース
        const wikiLinkRegex = /\[\[(.*?)\]\]/g;
        parsed = parsed.replace(wikiLinkRegex, (match, title) => {
            const linkedNote = allNotes.find(note => note.title.trim() === title.trim());
            if (linkedNote) {
                return `<a href="note.html?id=${encodeURIComponent(linkedNote.id)}" class="wiki-link">${escapeHtml(title)}</a>`;
            } else {
                return `<span class="new-page-link">${escapeHtml(title)}</span>`;
            }
        });

        // 3. 画像Markdownのパース
        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        parsed = parsed.replace(imageRegex, (match, alt, src) => {
            if (src.match(/^https?:\/\//)) {
                return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="embedded-image">`;
            }
            return escapeHtml(match);
        });

        return parsed;
    };

    const findRelatedNotes = (currentNote, allNotes) => {
        if (!currentNote.tags) return [];

        const currentTags = currentNote.tags.split(' ').filter(t => t.startsWith('#'));
        if (currentTags.length === 0) return [];

        const related = [];
        for (const note of allNotes) {
            if (note.id === currentNote.id) continue;
            if (!note.tags) continue;

            const noteTags = note.tags.split(' ').filter(t => t.startsWith('#'));
            const sharedTags = currentTags.filter(t => noteTags.includes(t));

            if (sharedTags.length > 0) {
                related.push({ note, sharedTags });
            }
        }

        related.sort((a, b) => b.sharedTags.length - a.sharedTags.length);
        return related;
    };

    const loadPage = async () => {
        if (loader) loader.style.display = 'block';
        try {
            const apiResponse = await fetchAllNotes();
            const allNotes = apiResponse.notes;

            renderTags(allNotes);

            const params = new URLSearchParams(window.location.search);
            const noteId = params.get('id');

            if (noteId && allNotes && allNotes.length > 0) {
                const note = allNotes.find(n => n.id === noteId);

                if (note) {
                    document.title = note.title;

                    const parsedContent = parseContent(note.content, allNotes);

                    noteDetailContainer.innerHTML = `
                        <h1>${escapeHtml(note.title)}</h1>
                        <div class="content">${parsedContent}</div>
                        <p class="tags">${escapeHtml(note.tags)}</p>
                    `;

                    // 2ホップリンク: 関連する日記
                    const relatedNotes = findRelatedNotes(note, allNotes);
                    if (relatedNotes.length > 0) {
                        const relatedSection = document.createElement('section');
                        relatedSection.className = 'related-notes-section';

                        let relatedHTML = '<h2>関連する日記</h2><div class="related-cards-grid">';
                        for (const { note: relNote, sharedTags } of relatedNotes) {
                            const imageMatch = relNote.content ? relNote.content.match(/!\[.*?\]\((.*?)\)/) : null;
                            let cardImageHTML = '';
                            if (imageMatch && imageMatch[1].match(/^https?:\/\//)) {
                                cardImageHTML = `<div class="related-card-image" style="background-image: url('${escapeHtml(imageMatch[1])}')"></div>`;
                            }
                            relatedHTML += `
                                <a href="note.html?id=${encodeURIComponent(relNote.id)}" class="related-card">
                                    ${cardImageHTML}
                                    <div class="related-card-body">
                                        <h3>${escapeHtml(relNote.title)}</h3>
                                        <p class="related-card-tags">${sharedTags.map(t => escapeHtml(t)).join(' ')}</p>
                                    </div>
                                </a>
                            `;
                        }
                        relatedHTML += '</div>';
                        relatedSection.innerHTML = relatedHTML;

                        noteDetailContainer.parentNode.insertBefore(relatedSection, noteDetailContainer.nextSibling);
                    }
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
