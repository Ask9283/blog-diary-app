document.addEventListener('DOMContentLoaded', async () => {
    const cardGrid = document.getElementById('card-grid');
    const searchBox = document.querySelector('.search-box');
    const tagListContainer = document.getElementById('tag-list');
    const paginationContainer = document.getElementById('pagination-container');
    const errorMessageDiv = document.getElementById('error-message');

    let currentPage = 1;
    const pageSize = 6; // 1ページあたりの表示件数

    const showError = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    };

    const fetchNotesFromAPI = async (page = 1, searchTerm = '') => {
        try {
            // APIをシミュレート
            console.log(`Fetching data (page: ${page}, search: "${searchTerm}")...`);
            
            // 実際のAPI呼び出しに備え、URLにパラメータを追加する形を模倣
            // const response = await fetch(`/api/get-notes?page=${page}&search=${searchTerm}`);
            // if (!response.ok) throw new Error...
            // const { notes, totalItems } = await response.json();
            // return { notes, totalItems };

            // --- 以下は現在のシミュレーションコード ---
            let filteredData = notesData;

            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                filteredData = notesData.filter(note =>
                    note.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                    note.content.toLowerCase().includes(lowerCaseSearchTerm) ||
                    note.tags.toLowerCase().includes(lowerCaseSearchTerm)
                );
            }

            const totalItems = filteredData.length;
            const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
            
            return Promise.resolve({ notes: paginatedData, totalItems });
        } catch (error) {
            showError('日記データの読み込みに失敗しました。');
            return { notes: [], totalItems: 0 };
        }
    };

    const renderCards = (notes) => {
        cardGrid.innerHTML = '';
        if (notes.length === 0) {
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
        notes.forEach(note => {
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
            link.href = `?search=${tagInfo.tag}`;
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
    const { notes: allNotesForTags } = await fetchNotesFromAPI(1, ''); // タグは全件から生成
    renderTags(allNotesForTags);
    
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
        searchBox.value = searchParam;
    }
    
    loadNotes();
});
