document.addEventListener('DOMContentLoaded', async () => {
    const cardGrid = document.getElementById('card-grid');
    const searchBox = document.querySelector('.search-box');
    const tagListContainer = document.getElementById('tag-list');
    const paginationContainer = document.getElementById('pagination-container');
    const errorMessageDiv = document.getElementById('error-message');
    const loaderMain = document.getElementById('loader-main');
    const loaderTags = document.getElementById('loader-tags');

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

            const imageRegex = /!\[.*?\]\((.*?)\)/;
            const match = note.content.match(imageRegex);
            let contentPreviewHTML;

            if (match) {
                // 画像が見つかった場合、画像プレビューを表示
                contentPreviewHTML = `<div class="card-image-preview" style="background-image: url('${match[1]}')"></div>`;
            } else {
                // 画像が見つからない場合、テキストプレビューを表示
                contentPreviewHTML = `<p class="card-content-preview">${note.content}</p>`;
            }

            // タイトルが上で、タグは表示しない新しい構造
            card.innerHTML = `
                <h3>${note.title}</h3>
                ${contentPreviewHTML}
            `;

            link.appendChild(card);
            cardGrid.appendChild(link);
        });
    };
    
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

    const getSortedTags = (notes) => {
        const tagCounts = {};
        if (!notes) return {};
        notes.forEach(note => {
            if (!note.tags) return;
            const tags = note.tags.split(' ').filter(tag => tag.startsWith('#'));
            tags.forEach(tag => {
                if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(item => ({ tag: item[0], count: item[1] }));
    };

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
        loaderMain.style.display = 'block';
        cardGrid.style.display = 'none';
        paginationContainer.style.display = 'none';
        try {
            const searchTerm = searchBox.value;
            const { notes, totalItems } = await fetchNotesFromAPI(currentPage, searchTerm);
            renderCards(notes);
            renderPagination(totalItems);
        } finally {
            loaderMain.style.display = 'none';
            cardGrid.style.display = 'grid';
            paginationContainer.style.display = 'flex';
        }
    };

    searchBox.addEventListener('input', () => {
        currentPage = 1;
        loadNotes();
    });

    // --- 初期表示処理 ---
    const initializePage = async () => {
        loaderTags.style.display = 'block';
        tagListContainer.style.display = 'none';
        loaderMain.style.display = 'block';
        cardGrid.style.display = 'none';
        paginationContainer.style.display = 'none';

        try {
            const params = new URLSearchParams(window.location.search);
            const searchParam = params.get('search');
            if (searchParam) {
                searchBox.value = searchParam;
            }

            const tagsPromise = fetchNotesFromAPI(1, '');
            const notesPromise = fetchNotesFromAPI(currentPage, searchBox.value);

            const [tagsResult, notesResult] = await Promise.all([tagsPromise, notesPromise]);

            renderTags(tagsResult.notes);
            renderCards(notesResult.notes);
            renderPagination(notesResult.totalItems);

        } finally {
            loaderTags.style.display = 'none';
            tagListContainer.style.display = 'block';
            loaderMain.style.display = 'none';
            cardGrid.style.display = 'grid';
            paginationContainer.style.display = 'flex';
        }
    };

    await initializePage();
});
