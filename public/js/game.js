/**
 * Game — Main game loop, state management, and lifecycle controls.
 * Handles restart, game over, start screen, and the animation frame loop.
 */

// ---------------------------------------------------------------------------
// Game Restart
// ---------------------------------------------------------------------------

function restartGame() {
    score = 0;
    ballsLeft = 3;
    multiplier = 1;
    isGameOver = false;
    isTilted = false;
    balls = [];
    particles = [];
    floatyScores = [];
    nudgeCount = 0;
    nudgeCooldown = 0;
    targetClearsCount = 0;
    DropTargets.forEach(t => t.hit = false);
    RolloverLanes.forEach(l => l.lit = false);

    QuantumScoop.active = false;
    QuantumScoop.captureTimer = 0;
    QuantumScoop.heldBall = null;

    const tiltOv = document.getElementById('tilt-overlay');
    if (tiltOv) tiltOv.style.opacity = '0';

    const goOverlay = document.getElementById('gameover-overlay');
    if (goOverlay) {
        goOverlay.classList.add('hidden');
        goOverlay.classList.remove('flex');
    }

    const multStat = document.getElementById('stats-multiplier');
    if (multStat) multStat.textContent = 'X1';

    const ballsStat = document.getElementById('stats-balls');
    if (ballsStat) ballsStat.textContent = '3';

    const dmdScore = document.getElementById('dmd-score');
    if (dmdScore) dmdScore.textContent = '000,000';

    checkDropTargetsProgress();
    triggerDMDMessage("READY PLAYER 1");
    spawnBall();
    updateHighscoresUI();
    updateStatsUI();
}

// ---------------------------------------------------------------------------
// Game Over
// ---------------------------------------------------------------------------

function handleGameOver() {
    isGameOver = true;
    triggerDMDMessage("GAME OVER");
    saveHighScore(currentUsername, score);
    updateHighscoresUI();

    const goOverlay = document.getElementById('gameover-overlay');
    const goScore = document.getElementById('go-final-score');
    const goUserLabel = document.getElementById('go-username-label');
    const goHighScoreBadge = document.getElementById('go-highscore-badge');

    if (goScore) {
        goScore.textContent = score.toLocaleString();
    }
    if (goUserLabel) {
        goUserLabel.textContent = `PILOT: ${currentUsername}`;
    }

    // Check if user set a personal high score record
    let highScores = localHighScoresFallback;
    if (isStorageAvailable) {
        try {
            const raw = localStorage.getItem('neon_pinball_highscores');
            if (raw) highScores = JSON.parse(raw);
        } catch (e) {}
    }
    const topScore = highScores.length > 0 ? highScores[0].score : 0;

    if (goHighScoreBadge) {
        if (score >= topScore && score > 0) {
            goHighScoreBadge.classList.remove('hidden');
        } else {
            goHighScoreBadge.classList.add('hidden');
        }
    }

    if (goOverlay) {
        goOverlay.classList.remove('hidden');
        goOverlay.classList.add('flex');
    }
}

// ---------------------------------------------------------------------------
// Main Game Loop
// ---------------------------------------------------------------------------

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;

    const dt = Math.min(elapsed / 1000, 0.1);
    lastTime = timestamp;

    updatePhysics(dt);
    draw();

    requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Button Event Handlers
// ---------------------------------------------------------------------------

document.getElementById('btn-restart').addEventListener('click', () => {
    restartGame();
});

document.getElementById('btn-play-again').addEventListener('click', () => {
    restartGame();
});

document.getElementById('btn-quit').addEventListener('click', () => {
    const goOverlay = document.getElementById('gameover-overlay');
    if (goOverlay) {
        goOverlay.classList.add('hidden');
        goOverlay.classList.remove('flex');
    }

    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) {
        startOverlay.style.display = 'flex';
    }
});

const btnAudio = document.getElementById('btn-audio');
btnAudio.addEventListener('click', () => {
    synth.init();
    synth.muted = !synth.muted;
    document.getElementById('audio-status').textContent = synth.muted ? "Audio: OFF" : "Audio: ON";
    document.getElementById('audio-icon').textContent = synth.muted ? "🔇" : "🔊";
});

// --- Authentication Overlays Logic ---
const startOverlay = document.getElementById('start-overlay');
const authSelectOverlay = document.getElementById('auth-select-overlay');
const signinOverlay = document.getElementById('signin-overlay');
const signupOverlay = document.getElementById('signup-overlay');

function showOverlay(overlay) {
    [startOverlay, authSelectOverlay, signinOverlay, signupOverlay].forEach(o => {
        if(o) o.style.display = 'none';
    });
    if(overlay) overlay.style.display = 'flex';
}

document.getElementById('btn-signin-signup').addEventListener('click', () => {
    synth.init();
    showOverlay(authSelectOverlay);
});

document.getElementById('btn-go-signin').addEventListener('click', () => {
    synth.init();
    showOverlay(signinOverlay);
});

document.getElementById('btn-go-signup').addEventListener('click', () => {
    synth.init();
    showOverlay(signupOverlay);
});

['btn-back-from-auth', 'btn-back-from-signin', 'btn-back-from-signup'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) {
        btn.addEventListener('click', () => {
            synth.init();
            showOverlay(startOverlay);
        });
    }
});

function startGameWithUser(username) {
    currentUsername = username.substring(0, 10).toUpperCase();
    
    const headerUser = document.getElementById('header-user');
    if (headerUser) {
        headerUser.textContent = currentUsername;
    }

    showOverlay(null); // Hide all overlays
    restartGame();
}

document.getElementById('btn-start-game').addEventListener('click', () => {
    synth.init();
    let guestId = localStorage.getItem('guest_device_id');
    if (!guestId) {
        guestId = 'GUEST_' + Math.floor(Math.random() * 1000000).toString(16).toUpperCase();
        localStorage.setItem('guest_device_id', guestId);
    }
    startGameWithUser(guestId);
});

document.getElementById('btn-do-signin').addEventListener('click', () => {
    synth.init();
    const email = document.getElementById('signin-email').value.trim();
    let name = email.split('@')[0];
    if(!name) name = "PILOT";
    startGameWithUser(name);
});

document.getElementById('btn-do-signup').addEventListener('click', () => {
    synth.init();
    const name = document.getElementById('signup-name').value.trim() || "PILOT_X";
    startGameWithUser(name);
});

// ---------------------------------------------------------------------------
// App Initialization
// ---------------------------------------------------------------------------

function initApp() {
    updateHighscoresUI();
    draw();
    if (!loopStarted) {
        loopStarted = true;
        requestAnimationFrame(loop);
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initApp();
} else {
    window.addEventListener('DOMContentLoaded', initApp);
    window.addEventListener('load', initApp);
}
