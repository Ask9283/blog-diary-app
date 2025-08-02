// api/get-notes/index.js

const notesData = [
    {
        id: 1,
        title: 'HTMLとCSSの基本',
        content: 'Webページの骨格を作るのがHTML。見た目を整えるのがCSS。この二つはセットで使う。最初は難しく感じるかもしれないが、少しずつ慣れていくことが大切。',
        tags: '#HTML #CSS #Web開発'
    },
    {
        id: 2,
        title: 'ダークになった日',
        content: '画像で赤枠で囲った部分。特別な日はカードの色を変えて目立たせる。CSSでクラスを一つ追加するだけで実現できるのが面白い。記念日や重要な出来事があった日に使えそう。',
        tags: '#日記 #CSS'
    },
    {
        id: 3,
        title: 'レイアウトの技術',
        content: 'FlexboxとCSS Gridが現代のレイアウト手法の主流。特にGridはこういうカードレイアウトに最適。最初は戸惑うが、使えるようになるとレイアウトの自由度が格段に上がる。',
        tags: '#CSS #レイアウト'
    },
    {
        id: 4,
        title: 'Visual Studio Code',
        content: 'Live Server拡張機能を入れると、保存するだけでブラウザが自動更新されて最高に便利。他にも便利な拡張機能がたくさんあるので、色々試してみると良い。',
        tags: '#ツール #VSCode'
    },
    {
        id: 5,
        title: 'ページネーション',
        content: 'データが多くなってきたら必須の機能。API側でページング処理を行うのが効率的。',
        tags: '#機能 #API'
    },
    {
        id: 6,
        title: 'APIサーバーの役割',
        content: 'フロントエンドとデータベースの橋渡し役。セキュリティの担保も重要な責務。',
        tags: '#API #バックエンド'
    },
    {
        id: 7,
        title: 'デバッグの重要性',
        content: '開発者ツールを使いこなせると、エラーの原因特定が格段に速くなる。404, 500エラーとの戦いだった。',
        tags: '#開発 #デバッグ'
    }
];

module.exports = async function (context, req) {
    context.log('API: get-notes function processed a request.');

    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "6", 10);
    const searchTerm = (req.query.search || "").toLowerCase();

    let filteredData = notesData;

    if (searchTerm) {
        filteredData = notesData.filter(note =>
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm) ||
            note.tags.toLowerCase().includes(searchTerm)
        );
    }

    const totalItems = filteredData.length;
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

    const response = {
        notes: paginatedData,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page
    };

    context.res = {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
    };
}
