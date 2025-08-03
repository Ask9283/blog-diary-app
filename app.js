document.addEventListener('DOMContentLoaded', async () => {
    const cardGrid = document.getElementById('card-grid');
    const searchBox = document.querySelector('.search-box');
    const tagListContainer = document.getElementById('tag-list');
    const paginationContainer = document.getElementById('pagination-container');
    const errorMessageDiv = document.getElementById('error-message');

    let currentPage = 1;
    const pageSize = 6;

    const showError = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    };

    const fetchNotesFromAPI = async (page = 1, searchTerm = '') => {
        try {
            const params = new URLSearchParams({
                page: page,
                pageSize: pageSize,
                search: searchTerm
            });
            const response = await fetch(`/api/get-notes?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Could not fetch notes:", error);
            showError('日記データの読み込みに失敗しました。');
            return { notes: [], totalItems: 0 };
        }
    };
    
    // この関数は変更ありません
    const renderCards = (notes) => {
        cardGrid.innerHTML = '';
        if (!notes || notes.length === 0) {
            cardGrid.innerHTML = '<p class="no-results">該当する日記がありません。</p>';
            return;
        }
        notes.forEach(note => {
            const link = document.createElement('a');
            link.href = `note.html?id=${note.id}`;
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <h3>${note.title}</h3>
                <p class="card-content-preview">${note.content}</p>
                <p class="card-tags">${note.tags}</p>
            `;
            link.appendChild(card);
            cardGrid.appendChild(link);
        });
    };
    
    // この関数は変更ありません
    const renderPagination = (totalItems) => {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / pageSize);
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.className = 'pagination-button';
            button.textContent = i;
            if (i === currentPage) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                currentPage = i;
                loadNotes();
            });
            paginationContainer.appendChild(button);
        }
    };

    // この関数は変更ありません
    const getSortedTags = (notes) => {
        const tagCounts = {};
        notes.forEach(note => {
            if (!note.tags) return;
            const tags = note.tags.split(' ').filter(tag => tag.startsWith('#'));
            tags.forEach(tag => {
                if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(item => ({ tag: item[0], count: item[1] }));
    };

    // この関数は変更ありません
    const renderTags = (allNotes) => {
        const sortedTags = getSortedTags(allNotes);
        tagListContainer.innerHTML = '';
        sortedTags.forEach(tagInfo => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `?search=${encodeURIComponent(tagInfo.tag)}`;
            link.textContent = `${tagInfo.tag} (${tagInfo.count})`;
            link.addEventListener('click', (event) => {
                event.preventDefault();
                searchBox.value = tagInfo.tag;
                currentPage = 1;
                loadNotes();
            });
            listItem.appendChild(link);
            tagListContainer.appendChild(listItem);
        });
    };

    const loadNotes = async () => {
        const searchTerm = searchBox.value;
        const { notes, totalItems } = await fetchNotesFromAPI(currentPage, searchTerm);
        renderCards(notes);
        renderPagination(totalItems);
    };

    searchBox.addEventListener('input', () => {
        currentPage = 1;
        loadNotes();
    });

    // --- 初期表示処理 ---
    const { notes: allNotesForTags } = await fetchNotesFromAPI(1, '');
    renderTags(allNotesForTags);
    
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
        searchBox.value = searchParam;
    }
    
    await loadNotes();
});
