/**
 * UI — DOM interaction, HUD updates, high score management.
 * Handles the DMD message display, stats panel, and localStorage persistence.
 */

// ---------------------------------------------------------------------------
// Score Triggering
// ---------------------------------------------------------------------------

function triggerScore(amount, x, y, size = 12) {
    const actualScore = amount * multiplier;
    score += actualScore;

    floatyScores.push({
        x, y,
        text: `+${actualScore}`,
        color: '#f59e0b',
        size,
        life: 1.0,
        vy: -1
    });

    const dmdScore = document.getElementById('dmd-score');
    if (dmdScore) dmdScore.textContent = String(score).padStart(6, '0');

    updateStatsUI();
}

// ---------------------------------------------------------------------------
// DMD Message Display
// ---------------------------------------------------------------------------

function triggerDMDMessage(msg) {
    const label = document.getElementById('dmd-message');
    if (label) {
        label.textContent = msg;
        label.classList.add('animate-pulse');
        setTimeout(() => {
            label.classList.remove('animate-pulse');
        }, 600);
    }
}

// ---------------------------------------------------------------------------
// Stats Panel Updates
// ---------------------------------------------------------------------------

function updateStatsUI() {
    const multStat = document.getElementById('stats-multiplier');
    if (multStat) multStat.textContent = 'X' + multiplier;

    const ballsStat = document.getElementById('stats-balls');
    if (ballsStat) ballsStat.textContent = ballsLeft;

    const hitCount = DropTargets.filter(t => t.hit).length;
    const pBar = document.getElementById('target-bar');
    const pTxt = document.getElementById('target-progress');
    if (pBar) pBar.style.width = `${(targetClearsCount / 3) * 100}%`;
    if (pTxt) pTxt.textContent = `${targetClearsCount}/3`;

    const scoopStatusEl = document.getElementById('scoop-status-text');
    const scoopHintEl = document.getElementById('scoop-hint');
    if (scoopStatusEl && scoopHintEl) {
        if (QuantumScoop.captureTimer > 0) {
            scoopStatusEl.textContent = "LOCKING";
            scoopStatusEl.className = "text-yellow-500 font-bold uppercase orbitron animate-pulse";
            scoopHintEl.textContent = "Initiating cores...";
        } else if (QuantumScoop.active) {
            scoopStatusEl.textContent = "READY";
            scoopStatusEl.className = "text-orange-500 font-black uppercase orbitron neon-text-orange animate-bounce";
            scoopHintEl.textContent = "SHOOT RANDOM PORTAL!";
        } else {
            scoopStatusEl.textContent = "LOCKED";
            scoopStatusEl.className = "text-slate-500 font-bold uppercase orbitron";
            scoopHintEl.textContent = "Complete 3 target sets!";
        }
    }
}

// ---------------------------------------------------------------------------
// High Score Management
// ---------------------------------------------------------------------------

function saveHighScore(user, newScore) {
    if (newScore <= 0) return;
    const dateObj = new Date();
    const record = {
        username: user.substring(0, 10).toUpperCase(),
        score: newScore,
        date: `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`
    };

    let list = [];
    if (isStorageAvailable) {
        try {
            const raw = localStorage.getItem('neon_pinball_highscores');
            list = raw ? JSON.parse(raw) : [];
        } catch (e) {
            list = localHighScoresFallback;
        }
    } else {
        list = localHighScoresFallback;
    }

    list.push(record);
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 5);

    if (isStorageAvailable) {
        try {
            localStorage.setItem('neon_pinball_highscores', JSON.stringify(list));
        } catch (e) {
            localHighScoresFallback = list;
        }
    } else {
        localHighScoresFallback = list;
    }
}

function updateHighscoresUI() {
    let list = [];
    if (isStorageAvailable) {
        try {
            const raw = localStorage.getItem('neon_pinball_highscores');
            list = raw ? JSON.parse(raw) : localHighScoresFallback;
        } catch (e) {
            list = localHighScoresFallback;
        }
    } else {
        list = localHighScoresFallback;
    }

    list = list.map(item => ({
        username: item.username || 'ANON',
        score: item.score,
        date: item.date
    }));

    const container = document.getElementById('highscores-container');
    if (!container) return;
    container.innerHTML = '';

    list.forEach((entry, idx) => {
        const color = idx === 0 ? 'text-yellow-400 font-extrabold' : 'text-slate-300';
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👾';

        const item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs';
        item.innerHTML = `
            <div class="flex items-center gap-2 overflow-hidden">
                <span class="text-xs shrink-0">${medal}</span>
                <div class="flex flex-col min-w-0">
                    <span class="text-[9px] text-slate-500 truncate font-semibold uppercase">${entry.username}</span>
                    <span class="${color} orbitron font-bold">${entry.score.toLocaleString()}</span>
                </div>
            </div>
            <span class="text-[9px] text-slate-600 uppercase shrink-0">${entry.date}</span>
        `;
        container.appendChild(item);
    });
}
