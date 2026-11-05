
// ========================================
// デュエマ対局時計
// 設定画面・対局画面・効果音
// ========================================


// ========================================
// 時間設定
// ========================================

let initialTime = 10 * 60;

let times = [initialTime, initialTime];


// ========================================
// 対局状態
// ========================================

// -1 = 開始前
//  0 = 先攻
//  1 = 後攻

let currentPlayer = -1;

let isRunning = false;
let isPaused = false;

let timerInterval = null;
let lastTime = 0;


// ========================================
// 音声設定
// ========================================

// 音声を管理するオブジェクト
let audioContext = null;


// 音声を使用できる状態にする
function initializeAudio() {

    if (!audioContext) {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            console.warn("このブラウザは音声機能に対応していません");
            return;
        }

        audioContext = new AudioContext();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}


// ========================================
// 音を鳴らす基本機能
// ========================================

function playTone(frequency, duration, volume = 0.2) {

    if (!audioContext) {
        return;
    }

    if (audioContext.state !== "running") {
        return;
    }

    const oscillator = audioContext.createOscillator();

    const gainNode = audioContext.createGain();

    const startTime = audioContext.currentTime;

    // 音の種類
    oscillator.type = "sine";

    // 音の高さ
    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );

    // 音量
    gainNode.gain.setValueAtTime(
        volume,
        startTime
    );

    // 音を徐々に小さくする
    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration
    );

    // 音声を接続
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 再生
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}


// ========================================
// ① 手番切り替え音
// ========================================

function playTurnSound() {

    initializeAudio();

    if (!audioContext) {
        return;
    }

    // 短く聞き取りやすい電子音
    playTone(880, 0.12, 0.2);

}


// ========================================
// ② 時間切れ音
// ========================================

function playTimeoutSound() {

    initializeAudio();

    if (!audioContext) {
        return;
    }

    // 3回の警告音
    const notes = [
        { frequency: 660, delay: 0 },
        { frequency: 440, delay: 0.35 },
        { frequency: 330, delay: 0.70 }
    ];

    notes.forEach(note => {

        setTimeout(() => {

            playTone(
                note.frequency,
                0.3,
                0.3
            );

        }, note.delay * 1000);

    });

}


// ========================================
// 画面切り替え
// ========================================

function showSettings() {

    clearInterval(timerInterval);
    timerInterval = null;

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


// ========================================
// 時間表示
// ========================================

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


// ========================================
// 設定画面
// ========================================

// プリセットボタン
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


// 手入力した場合はプリセット選択を解除
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


// ========================================
// 対局開始
// ========================================

function startGame() {

    const minutes = Number(
        document.getElementById("minutesInput").value
    );

    const seconds = Number(
        document.getElementById("secondsInput").value
    );

    // 入力チェック
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

    // 音声機能を準備
    initializeAudio();

    // 両プレイヤーの時間を設定
    times = [initialTime, initialTime];

    currentPlayer = -1;

    isRunning = false;
    isPaused = false;

    showClock();

}


// ========================================
// 状態表示
// ========================================

function getStatus(player) {

    if (times[player] <= 0) {
        return "時間切れ";
    }

    if (currentPlayer === -1) {

        if (player === 0) {
            return "タップして開始";
        }

        return "先攻の開始待ち";
    }

    if (isPaused) {
        return "一時停止中";
    }

    if (currentPlayer === player && isRunning) {
        return "あなたの手番";
    }

    return "待機中";

}


// ========================================
// 画面更新
// ========================================

function updateDisplay() {

    document.getElementById("time1").textContent =
        formatTime(times[0]);

    document.getElementById("time2").textContent =
        formatTime(times[1]);

    document.getElementById("status1").textContent =
        getStatus(0);

    document.getElementById("status2").textContent =
        getStatus(1);

    document.getElementById("button1").disabled =
        currentPlayer !== -1 && currentPlayer !== 0;

    document.getElementById("button2").disabled =
        currentPlayer === -1 || currentPlayer !== 1;

    document.getElementById("pauseButton").textContent =
        isPaused ? "再開" : "一時停止";

}


// ========================================
// タイマー開始
// ========================================

function startTimer() {

    if (timerInterval !== null) {
        return;
    }

    lastTime = Date.now();

    timerInterval = setInterval(() => {

        const now = Date.now();

        const elapsed = (now - lastTime) / 1000;

        lastTime = now;

        if (!isRunning || isPaused) {
            return;
        }

        // 現在のプレイヤーの時間を減らす
        times[currentPlayer] -= elapsed;

        // 時間切れ
        if (times[currentPlayer] <= 0) {

            times[currentPlayer] = 0;

            isRunning = false;

            clearInterval(timerInterval);
            timerInterval = null;

            updateDisplay();

            // 時間切れ音
            playTimeoutSound();

            // 音が鳴り終わってから通知
            setTimeout(() => {

                alert(
                    currentPlayer === 0
                        ? "先攻の時間切れです！"
                        : "後攻の時間切れです！"
                );

            }, 1200);

            return;
        }

        updateDisplay();

    }, 50);

}


// ========================================
// 手番交代
// ========================================

function switchTurn(player) {

    if (times[0] <= 0 || times[1] <= 0) {
        return;
    }

    if (isPaused) {
        return;
    }

    // 最初は先攻のみ開始可能
    if (currentPlayer === -1) {

        if (player !== 0) {
            return;
        }

        currentPlayer = 0;

        isRunning = true;

        startTimer();

        updateDisplay();

        return;
    }

    if (currentPlayer !== player) {
        return;
    }

    // 手番交代
    currentPlayer = currentPlayer === 0 ? 1 : 0;

    // 手番切り替え音
    playTurnSound();

    updateDisplay();

}


// ========================================
// 一時停止・再開
// ========================================

function togglePause() {

    if (!isRunning) {
        return;
    }

    isPaused = !isPaused;

    lastTime = Date.now();

    updateDisplay();

}


// ========================================
// リセット
// ========================================

function resetTimer() {

    const confirmed = confirm(
        "対局を終了して設定画面に戻りますか？"
    );

    if (!confirmed) {
        return;
    }

    showSettings();

}


// ========================================
// ボタンの動作設定
// ========================================

document.getElementById("startButton").addEventListener(
    "click",
    startGame
);

document.getElementById("button1").addEventListener(
    "click",
    () => switchTurn(0)
);

document.getElementById("button2").addEventListener(
    "click",
    () => switchTurn(1)
);

document.getElementById("pauseButton").addEventListener(
    "click",
    togglePause
);

document.getElementById("resetButton").addEventListener(
    "click",
    resetTimer
);


// ========================================
// 最初は設定画面を表示
// ========================================

showSettings();
