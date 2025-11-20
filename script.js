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

    // --- 游戏流程函数 ---

    // 初始化游戏（绑定事件监听器）
    function initGame() {
        startGameButton.addEventListener('click', startGame);
        restartGameButton.addEventListener('click', startGame);
        userInput.addEventListener('keydown', handleUserInput);
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

        // 实时输入反馈 (可选，可根据需要细化)
        const typedText = userInput.value + (event.key.length === 1 ? event.key : ''); // 模拟输入后的值
        const currentPhrase = PHRASES[currentPhraseIndex];

        if (currentPhrase.startsWith(typedText)) {
            userInput.classList.remove('incorrect-input');
            userInput.classList.add('correct-input'); // 输入正确部分为绿色
        } else {
            userInput.classList.remove('correct-input');
            userInput.classList.add('incorrect-input'); // 输入错误为红色
        }

        // 当用户按下 Enter 键时，检查短语
        if (event.key === 'Enter') {
            const userTypedPhrase = userInput.value.trim();
            const correctPhrase = PHRASES[currentPhraseIndex];

            if (userTypedPhrase === correctPhrase) {
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
                userInput.classList.remove('correct-input'); // 移除输入框的正确反馈
            }
            event.preventDefault(); // 阻止Enter键的默认行为（如表单提交）
        }
    }

    // 游戏结束
    function endGame() {
        gameRunning = false;
        clearInterval(timerInterval); // 停止计时器

        // 更新最终分数
        finalScoreDisplay.innerText = score;

        // 切换屏幕
        gameScreen.style.display = 'none';
        endScreen.style.display = 'block';

        // 这里可以集成 Firebase Cloud Firestore 来保存高分！
        // if (window.firebaseApp) {
        //     const db = getFirestore(window.firebaseApp);
        //     // 假设你有一个用户，你可以将分数保存到 Firestore
        //     // await addDoc(collection(db, "highscores"), { score: score, timestamp: new Date() });
        //     console.log("游戏结束，可以考虑将分数保存到 Firebase Firestore。");
        // }
    }

    // 确保 Firebase 初始化后再初始化游戏逻辑
    if (window.firebaseApp) {
        initGame();
    } else {
        // 如果 Firebase 尚未初始化，则等待其初始化后再绑定事件
        // 实际上，由于你的 index.html 中 Firebase 初始化在 script.js 之前，
        // window.firebaseApp 应该已经可用。这里是更健壮的检查。
        const checkFirebaseReady = setInterval(() => {
            if (window.firebaseApp) {
                clearInterval(checkFirebaseReady);
                initGame();
            }
        }, 100);
    }
});
