document.addEventListener('DOMContentLoaded', () => {
    // UI 元素引用
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');

    const startGameButton = document.getElementById('start-game-button');
    const restartGameButton = document.getElementById('restart-game-button');

    const timerDisplay = document.getElementById('timer-display');
    const scoreDisplay = document.getElementById('score-display');
    const phraseDisplay = document.getElementById('phrase-display');
    const userInput = document.getElementById('user-input');
    const messageDisplay = document.getElementById('message-display');
    const finalScoreDisplay = document.getElementById('final-score');

    // 新增高分榜相关 UI 元素
    const highscoresListContainer = document.getElementById('highscores-list-container');
    const highscoresStatus = document.getElementById('highscores-status');
    const highscoresList = document.getElementById('highscores-list');
    const playerNameInput = document.getElementById('player-name-input');
    const saveScoreButton = document.getElementById('save-score-button');
    const saveMessage = document.getElementById('save-message');
    const saveScoreSection = document.getElementById('save-score-section');


    // 游戏配置和状态
    const GAME_DURATION_SECONDS = 60; // 游戏时长
    const PHRASES = [ // 速记题目列表
        "快速输入这些文字以提高你的速记速度",
        "熟能生巧是提高任何技能的关键",
        "欢迎来到速记大师游戏，挑战你的打字速度",
        "Firebase让应用开发变得更简单",
        "用JavaScript编写代码非常有趣",
        "在GitHub Pages上部署你的Web应用",
        "实践是最好的老师，不停地练习吧",
        "耐心和专注是成功的基础",
        "不要放弃，每次尝试都是进步",
        "享受编程的乐趣，创造无限可能"
    ];

    let currentPhraseIndex = 0;
    let score = 0;
    let timeLeft = GAME_DURATION_SECONDS;
    let timerInterval = null;
    let gameRunning = false;

    // Firebase 引用
    let db; // Firestore 数据库实例
    let firestoreFunctions; // 存储从 index.html 暴露的 Firestore 函数

    // --- 游戏流程函数 ---

    // 初始化游戏（绑定事件监听器）
    async function initGame() { // 将其标记为 async，因为会调用异步的 displayHighScores
        startGameButton.addEventListener('click', startGame);
        restartGameButton.addEventListener('click', startGame);
        userInput.addEventListener('keydown', handleUserInput);
        saveScoreButton.addEventListener('click', savePlayerScore); // 新增保存分数按钮事件

        // 如果 Firebase 已经初始化，则获取 Firestore 实例和函数
        if (window.firebaseApp && window.firebaseDb && window.firebaseFirestore) {
            db = window.firebaseDb;
            firestoreFunctions = window.firebaseFirestore;
            console.log("Firestore DB instance and functions are available in script.js");
            await displayHighScores(); // 游戏开始时显示高分榜
        } else {
            console.error("Firebase App, Firestore instance, or Firestore functions not found. Make sure they are initialized correctly in index.html");
            highscoresStatus.innerText = "无法加载高分榜：Firebase未初始化。";
        }
    }

    // 开始游戏
    function startGame() {
        // 重置游戏状态
        currentPhraseIndex = 0;
        score = 0;
        timeLeft = GAME_DURATION_SECONDS;
        gameRunning = true;

        // 更新显示
        scoreDisplay.innerText = `得分: ${score}`;
        timerDisplay.innerText = `时间: ${timeLeft}s`;
        messageDisplay.innerText = ''; // 清空提示信息
        userInput.value = ''; // 清空输入框
        saveMessage.innerText = ''; // 清空保存信息
        playerNameInput.value = ''; // 清空玩家名字
        saveScoreButton.disabled = false; // 启用保存按钮
        playerNameInput.disabled = false; // 启用名字输入框
        saveScoreSection.style.display = 'block'; // 显示保存分数区域

        // 切换屏幕
        startScreen.style.display = 'none';
        endScreen.style.display = 'none';
        gameScreen.style.display = 'block';

        // 启动计时器
        startTimer();

        // 显示第一个短语
        displayNextPhrase();

        // 自动聚焦输入框
        userInput.focus();
    }

    // 启动计时器
    function startTimer() {
        clearInterval(timerInterval); // 清除任何之前的计时器
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = `时间: ${timeLeft}s`;

            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // 显示下一个短语
    function displayNextPhrase() {
        if (currentPhraseIndex < PHRASES.length) {
            phraseDisplay.innerText = PHRASES[currentPhraseIndex];
            userInput.value = ''; // 清空输入框
            messageDisplay.innerText = ''; // 清空提示
            userInput.classList.remove('correct-input', 'incorrect-input'); // 清除输入框样式
            userInput.focus();
        } else {
            // 所有题目都已完成，游戏结束
            endGame();
        }
    }

    // 处理用户输入
    function handleUserInput(event) {
        if (!gameRunning) return; // 如果游戏未运行，则不处理输入

        const typedText = userInput.value; // 获取当前输入框的值
        const currentPhrase = PHRASES[currentPhraseIndex];

        // 实时输入反馈：
        // 比较用户当前输入与正确短语的匹配前缀
        const isCorrectPrefix = currentPhrase.startsWith(typedText);
        if (isCorrectPrefix) {
            userInput.classList.remove('incorrect-input');
            userInput.classList.add('correct-input');
        } else {
            userInput.classList.remove('correct-input');
            userInput.classList.add('incorrect-input');
        }

        // 当用户按下 Enter 键时，检查短语
        if (event.key === 'Enter') {
            const userTypedPhrase = userInput.value.trim();

            if (userTypedPhrase === currentPhrase) { // 使用 currentPhrase 而不是 PHRASES[currentPhraseIndex]
                score++; // 加分
                scoreDisplay.innerText = `得分: ${score}`;
                messageDisplay.innerText = '✅ 正确！';
                messageDisplay.classList.remove('incorrect');
                messageDisplay.classList.add('correct');
                currentPhraseIndex++; // 准备下一题
                displayNextPhrase(); // 显示下一题
            } else {
                messageDisplay.innerText = '❌ 错误，请重试！';
                messageDisplay.classList.remove('correct');
                messageDisplay.classList.add('incorrect');
                userInput.value = ''; // 清空输入框以便重试
                userInput.focus();
                userInput.classList.remove('correct-input', 'incorrect-input'); // 清除输入框的颜色反馈
            }
            event.preventDefault(); // 阻止Enter键的默认行为（如表单提交）
        }
    }

    // 游戏结束
    async function endGame() { // 将其标记为 async
        gameRunning = false;
        clearInterval(timerInterval); // 停止计时器

        // 更新最终分数
        finalScoreDisplay.innerText = score;

        // 切换屏幕
        gameScreen.style.display = 'none';
        endScreen.style.display = 'block';

        // 确保保存分数区域可见并启用
        saveScoreSection.style.display = 'block';
        saveScoreButton.disabled = false;
        playerNameInput.disabled = false;
        playerNameInput.value = ''; // 清空上次玩家的名字
        saveMessage.innerText = ''; // 清空上次保存信息

        // 立即刷新高分榜
        await displayHighScores();
    }

    // --- Firebase 高分榜功能 ---

    // 保存玩家分数到 Firestore
    async function savePlayerScore() {
        if (!db || !firestoreFunctions) {
            saveMessage.innerText = "Firestore 未初始化，无法保存分数。";
            return;
        }

        const playerName = playerNameInput.value.trim();
        if (playerName.length === 0) {
            saveMessage.innerText = "请输入你的名字！";
            return;
        }
        if (playerName.length > 20) {
            saveMessage.innerText = "名字不能超过20个字符！";
            return;
        }

        saveScoreButton.disabled = true; // 禁用按钮防止重复提交
        playerNameInput.disabled = true; // 禁用名字输入框
        saveMessage.innerText = "正在保存...";

        try {
            // 使用从 window.firebaseFirestore 暴露出来的函数
            await firestoreFunctions.addDoc(firestoreFunctions.collection(db, "highscores"), {
                name: playerName,
                score: score,
                timestamp: firestoreFunctions.serverTimestamp() // 使用服务器时间戳
            });
            saveMessage.innerText = "分数保存成功！";
            // 刷新高分榜
            await displayHighScores();
        } catch (error) {
            console.error("保存分数失败:", error);
            saveMessage.innerText = `保存失败: ${error.message}`;
            saveScoreButton.disabled = false; // 保存失败则重新启用按钮
            playerNameInput.disabled = false; // 重新启用名字输入框
        }
    }

    // 从 Firestore 获取并显示高分榜
    async function displayHighScores() {
        if (!db || !firestoreFunctions) {
            highscoresStatus.innerText = "Firestore 未初始化，无法加载高分榜。";
            return;
        }

        highscoresStatus.innerText = "加载中...";
        highscoresList.innerHTML = ''; // 清空现有列表

        try {
            // 使用从 window.firebaseFirestore 暴露出来的函数
            const q = firestoreFunctions.query(
                firestoreFunctions.collection(db, "highscores"),
                firestoreFunctions.orderBy("score", "desc"), // 按分数降序排列
                firestoreFunctions.orderBy("timestamp", "asc"), // 分数相同时，按时间升序（先记录的排前面）
                firestoreFunctions.limit(10) // 只显示前10名
            );
            const querySnapshot = await firestoreFunctions.getDocs(q);

            if (querySnapshot.empty) {
                highscoresStatus.innerText = "暂无高分记录。";
            } else {
                highscoresStatus.innerText = ""; // 清除加载状态
                let rank = 1;
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const listItem = document.createElement('li');
                    // serverTimestamp() 返回的是 Timestamp 对象，需要转换为 JavaScript Date 对象
                    const date = data.timestamp ? data.timestamp.toDate().toLocaleString('zh-CN') : '未知时间';
                    listItem.innerHTML = `<strong>#${rank}.</strong> ${data.name}: ${data.score} 分 <span style="font-size:0.8em; color: #888;">(于 ${date})</span>`;
                    highscoresList.appendChild(listItem);
                    rank++;
                });
            }
        } catch (error) {
            console.error("加载高分榜失败:", error);
            highscoresStatus.innerText = `加载高分榜失败: ${error.message}`;
        }
    }


    // 确保 Firebase 初始化后再初始化游戏逻辑
    if (window.firebaseApp && window.firebaseDb && window.firebaseFirestore) {
        initGame();
    } else {
        // 备用机制，以防 Firebase 初始化稍微延迟
        const checkFirebaseReady = setInterval(() => {
            if (window.firebaseApp && window.firebaseDb && window.firebaseFirestore) {
                clearInterval(checkFirebaseReady);
                db = window.firebaseDb;
                firestoreFunctions = window.firebaseFirestore;
                initGame();
            }
        }, 100);
    }
});
