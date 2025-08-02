// api/get-notes/index.js

// data.jsの内容をAPI側にコピーして、データベースの代わりとする
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
];

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    context.res = {
        // status: 200, // デフォルトで200
        headers: { 'Content-Type': 'application/json' },
        body: notesData
    };
}
