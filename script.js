
/* ========================================
   デュエマ対局時計
======================================== */

/* 時間設定 */
let initialTime = 10 * 60;
let times = [initialTime, initialTime];

/*
    -1 = 開始前
     0 = 先攻
     1 = 後攻
*/
let currentPlayer = -1;

let isRunning = false;
let isPaused = false;

let timerInterval = null;
let timeoutAlert = null;
let lastTime = 0;

let audioContext = null;


/* ========================================
   音声機能
======================================== */

function initializeAudio() {
    if (!audioContext) {
        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        audioContext = new AudioContext();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playTone(frequency, duration, volume = 0.2) {
    if (!audioContext || audioContext.state !== "running") {
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const startTime = audioContext.currentTime;

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );

    gainNode.gain.setValueAtTime(
        volume,
        startTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function playTurnSound() {
    initializeAudio();

    playTone(880, 0.12, 0.2);
}

function playTimeoutSound() {
    initializeAudio();

    const notes = [
        { frequency: 660, delay: 0 },
        { frequency: 440, delay: 0.35 },
        { frequency: 330, delay: 0.70 }
    ];

    notes.forEach(note => {
        setTimeout(() => {
            playTone(note.frequency, 0.3, 0.3);
        }, note.delay * 1000);
    });
}


/* ========================================
   画面切り替え
======================================== */

function showSettings() {
    clearInterval(timerInterval);
    clearTimeout(timeoutAlert);

    timerInterval = null;
    timeoutAlert = null;

    isRunning = false;
    isPaused = false;
    currentPlayer = -1;

    document.getElementById("settingsScreen")
        .classList.remove("hidden");

    document.getElementById("clockScreen")
        .classList.add("hidden");
}

function showClock() {
    document.getElementById("settingsScreen")
        .classList.add("hidden");

    document.getElementById("clockScreen")
        .classList.remove("hidden");

    updateDisplay();
}


/* ========================================
   時間表示
======================================== */

function formatTime(seconds) {
    seconds = Math.floor(Math.max(0, seconds));

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


/* ========================================
   設定画面
======================================== */

document.querySelectorAll(".preset-button").forEach(button => {
    button.addEventListener("click", () => {
        const minutes = Number(button.dataset.minutes);

        document.getElementById("minutesInput").value = minutes;
        document.getElementById("secondsInput").value = 0;

        document.querySelectorAll(".preset-button").forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");
    });
});

function clearPresetSelection() {
    document.querySelectorAll(".preset-button").forEach(button => {
        button.classList.remove("selected");
    });
}

document.getElementById("minutesInput").addEventListener(
    "input",
    clearPresetSelection
);

document.getElementById("secondsInput").addEventListener(
    "input",
    clearPresetSelection
);


/* ========================================
   対局開始
======================================== */

function startGame() {
    const minutes = Number(
        document.getElementById("minutesInput").value
    );

    const seconds = Number(
        document.getElementById("secondsInput").value
    );

    if (
        !Number.isInteger(minutes) ||
        !Number.isInteger(seconds) ||
        minutes < 0 ||
        minutes > 999 ||
        seconds < 0 ||
        seconds > 59
    ) {
        alert("時間を正しく入力してください。");
        return;
    }

    initialTime = minutes * 60 + seconds;

    if (initialTime <= 0) {
        alert("持ち時間は1秒以上にしてください。");
        return;
    }

    initializeAudio();

    times = [initialTime, initialTime];

    currentPlayer = -1;
    isRunning = false;
    isPaused = false;

    showClock();
}


/* ========================================
   表示更新
======================================== */

function updateDisplay() {
    const activePlayer =
        currentPlayer === -1 ? 0 : currentPlayer;

    const opponentPlayer = activePlayer === 0 ? 1 : 0;

    const playerNames = ["先攻", "後攻"];

    document.getElementById("currentTime").textContent =
        formatTime(times[activePlayer]);

    document.getElementById("opponentTime").textContent =
        formatTime(times[opponentPlayer]);

    document.getElementById("opponentPlayerName").textContent =
        playerNames[opponentPlayer] + "の残り時間";

    const clockScreen = document.getElementById("clockScreen");

    clockScreen.classList.toggle(
        "player-two-turn",
        activePlayer === 1
    );

    const status = document.getElementById("turnStatus");

    if (times[activePlayer] <= 0) {
        status.textContent = "時間切れ";
    } else if (currentPlayer === -1) {
        status.textContent = "先攻側をタップして開始";
    } else if (isPaused) {
        status.textContent = "一時停止中";
    } else {
        status.textContent = playerNames[activePlayer] + "のターン";
    }

    document.getElementById("pauseButton").textContent =
        isPaused ? "再開" : "一時停止";
}


/* ========================================
   時間切れ処理
======================================== */

function handleTimeout() {
    if (times[currentPlayer] > 0) {
        return;
    }

    times[currentPlayer] = 0;
    isRunning = false;

    clearInterval(timerInterval);
    timerInterval = null;

    updateDisplay();

    playTimeoutSound();

    const playerName =
        currentPlayer === 0 ? "先攻" : "後攻";

    timeoutAlert = setTimeout(() => {
        alert(playerName + "の時間切れです！");
        timeoutAlert = null;
    }, 1200);
}


/* ========================================
   タイマー
======================================== */

function startTimer() {
    if (timerInterval !== null) {
        return;
    }

    lastTime = Date.now();

    timerInterval = setInterval(() => {
        tickTimer();
    }, 50);
}

function tickTimer() {
    if (!isRunning || isPaused || currentPlayer === -1) {
        return;
    }

    const now = Date.now();

    const elapsed = (now - lastTime) / 1000;

    lastTime = now;

    times[currentPlayer] -= elapsed;

    if (times[currentPlayer] <= 0) {
        handleTimeout();
        return;
    }

    updateDisplay();
}


/* ========================================
   画面タップによる手番交代
======================================== */

function switchTurn() {
    if (times[0] <= 0 || times[1] <= 0) {
        return;
    }

    if (isPaused) {
        return;
    }

    // 最初のタップは先攻のタイマー開始
    if (currentPlayer === -1) {
        currentPlayer = 0;

        isRunning = true;

        startTimer();

        updateDisplay();

        return;
    }

    // タップした瞬間までの時間を現在のプレイヤーに反映
    tickTimer();

    if (!isRunning) {
        return;
    }

    // 手番交代
    currentPlayer = currentPlayer === 0 ? 1 : 0;

    playTurnSound();

    updateDisplay();
}


/* ========================================
   一時停止・再開
======================================== */

function togglePause() {
    if (!isRunning) {
        return;
    }

    if (!isPaused) {
        // 一時停止する瞬間までの時間を反映
        tickTimer();

        if (!isRunning) {
            return;
        }
    }

    isPaused = !isPaused;

    lastTime = Date.now();

    updateDisplay();
}


/* ========================================
   リセット
======================================== */

function resetTimer() {
    const confirmed = confirm(
        "対局を終了して設定画面に戻りますか？"
    );

    if (!confirmed) {
        return;
    }

    showSettings();
}


/* ========================================
   ボタンの動作
======================================== */

document.getElementById("startButton").addEventListener(
    "click",
    startGame
);

document.getElementById("turnButton").addEventListener(
    "click",
    switchTurn
);

document.getElementById("pauseButton").addEventListener(
    "click",
    togglePause
);

document.getElementById("resetButton").addEventListener(
    "click",
    resetTimer
);


/* ========================================
   初期表示
======================================== */

showSettings();
