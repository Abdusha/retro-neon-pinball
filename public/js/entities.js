/**
 * Entities — All pinball table objects and their builders.
 * Defines bumpers, slingshots, drop targets, rollover lanes, walls,
 * flippers, plunger, and the Quantum Scoop feature.
 */

// ---------------------------------------------------------------------------
// Canvas Setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('pinball-canvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 450;
const GAME_HEIGHT = 850;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ---------------------------------------------------------------------------
// Storage Availability Check
// ---------------------------------------------------------------------------
let isStorageAvailable = false;
try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    isStorageAvailable = true;
} catch (e) {
    isStorageAvailable = false;
    console.warn("Storage restricted by sandbox environments. Resorting to memory-based fallback storage.");
}

// ---------------------------------------------------------------------------
// Game State (Global)
// ---------------------------------------------------------------------------
let currentUsername = "PILOT_X";
let score = 0;
let ballsLeft = 3;
let multiplier = 1;
let isGameOver = false;
let isPaused = false;
let isTilted = false;
let lastTime = 0;
let cameraShake = { x: 0, y: 0, duration: 0 };
let nudgeCount = 0;
let nudgeCooldown = 0;

let targetClearsCount = 0; // Tracks sets of cleared drop targets (0 to 3 required)

let localHighScoresFallback = [
    { username: 'NEON_RIDER', score: 120000, date: 'Classic' },
    { username: 'GRID_RUNNER', score: 85000, date: 'Classic' },
    { username: 'PILOT_A', score: 40000, date: 'Classic' }
];

let balls = [];
let particles = [];
let floatyScores = [];
let loopStarted = false;

// ---------------------------------------------------------------------------
// Quantum Scoop — Interactive reward target
// ---------------------------------------------------------------------------
const QuantumScoop = {
    x: 70,
    y: 260,
    radius: 22,
    active: false,
    pulseTimer: 0,
    captureTimer: 0,
    heldBall: null
};

// ---------------------------------------------------------------------------
// Plunger State
// ---------------------------------------------------------------------------
let plunger = {
    y: 810,
    maxY: 840,
    minY: 810,
    springK: 0.12,
    damping: 0.85,
    vy: 0,
    isCharging: false,
    chargeValue: 0
};

// ---------------------------------------------------------------------------
// Bumpers
// ---------------------------------------------------------------------------
const Bumpers = [
    { id: 'b1', x: 160, y: 220, radius: 26, color: '#f43f5e', score: 150, hitFlash: 0 },
    { id: 'b2', x: 290, y: 220, radius: 26, color: '#06b6d4', score: 150, hitFlash: 0 },
    { id: 'b3', x: 225, y: 310, radius: 26, color: '#a855f7', score: 250, hitFlash: 0 }
];

// ---------------------------------------------------------------------------
// Slingshots
// ---------------------------------------------------------------------------
const Slingshots = [
    {
        id: 's_left',
        p1: { x: 90, y: 640 },
        p2: { x: 125, y: 700 },
        p3: { x: 90, y: 710 },
        normal: { x: 0.866, y: -0.5 },
        flash: 0,
        score: 50
    },
    {
        id: 's_right',
        p1: { x: 360, y: 640 },
        p2: { x: 325, y: 700 },
        p3: { x: 360, y: 710 },
        normal: { x: -0.866, y: -0.5 },
        flash: 0,
        score: 50
    }
];

// ---------------------------------------------------------------------------
// Drop Targets
// ---------------------------------------------------------------------------
const DropTargets = [
    { id: 0, x1: 20, y1: 340, x2: 20, y2: 380, hit: false, color: '#eab308' },
    { id: 1, x1: 20, y1: 395, x2: 20, y2: 435, hit: false, color: '#eab308' },
    { id: 2, x1: 20, y1: 450, x2: 20, y2: 490, hit: false, color: '#eab308' }
];

// ---------------------------------------------------------------------------
// Rollover Lanes
// ---------------------------------------------------------------------------
const RolloverLanes = [
    { id: 'L1', x: 100, y: 100, r: 10, lit: false },
    { id: 'L2', x: 225, y: 80, r: 10, lit: false },
    { id: 'L3', x: 350, y: 100, r: 10, lit: false }
];

// ---------------------------------------------------------------------------
// Walls
// ---------------------------------------------------------------------------
const Walls = [];

function buildTableWalls() {
    Walls.length = 0;

    // Left outer vertical wall
    Walls.push({ p1: { x: 0, y: 150 }, p2: { x: 0, y: 720 }, type: 'wall', bounce: 0.5 });

    // Plunger lane dividing wall
    Walls.push({ p1: { x: 410, y: 220 }, p2: { x: 410, y: 845 }, type: 'wall', bounce: 0.5 });

    // Plunger outer right wall
    Walls.push({ p1: { x: 450, y: 150 }, p2: { x: 450, y: 845 }, type: 'wall', bounce: 0.5 });

    // Bottom base floor for plunger lane
    Walls.push({ p1: { x: 410, y: 845 }, p2: { x: 450, y: 845 }, type: 'wall', bounce: 0.1 });

    // Upper Arc / Dome segments
    const numDomeSegments = 16;
    const centerX = 225;
    const centerY = 150;
    const radius = 225;

    let prevX = 0;
    let prevY = 150;

    for (let i = 1; i <= numDomeSegments; i++) {
        const angle = Math.PI + (Math.PI * i / numDomeSegments);
        const nextX = centerX + radius * Math.cos(angle);
        const nextY = centerY + radius * Math.sin(angle);
        Walls.push({ p1: { x: prevX, y: prevY }, p2: { x: nextX, y: nextY }, type: 'wall', bounce: 0.7 });
        prevX = nextX;
        prevY = nextY;
    }

    // Left Inlane / Outlane guides
    Walls.push({ p1: { x: 0, y: 550 }, p2: { x: 50, y: 610 }, type: 'wall', bounce: 0.4 });
    Walls.push({ p1: { x: 50, y: 610 }, p2: { x: 50, y: 710 }, type: 'wall', bounce: 0.4 });
    Walls.push({ p1: { x: 90, y: 560 }, p2: { x: 90, y: 640 }, type: 'wall', bounce: 0.4 });

    // Right Inlane / Outlane guides
    Walls.push({ p1: { x: 410, y: 550 }, p2: { x: 360, y: 610 }, type: 'wall', bounce: 0.4 });
    Walls.push({ p1: { x: 360, y: 610 }, p2: { x: 360, y: 710 }, type: 'wall', bounce: 0.4 });
    Walls.push({ p1: { x: 320, y: 560 }, p2: { x: 320, y: 640 }, type: 'wall', bounce: 0.4 });

    // Drain guides
    Walls.push({ p1: { x: 0, y: 720 }, p2: { x: 95, y: 745 }, type: 'wall', bounce: 0.3 });
    Walls.push({ p1: { x: 410, y: 720 }, p2: { x: 315, y: 745 }, type: 'wall', bounce: 0.3 });
}

buildTableWalls();

// ---------------------------------------------------------------------------
// Flippers
// ---------------------------------------------------------------------------
const LeftFlipper = {
    pivotX: 100,
    pivotY: 755,
    length: 75,
    restAngle: 0.55,
    activeAngle: -0.5,
    currentAngle: 0.55,
    angularVelocity: 0,
    isPressed: false,
    thickness: 8,
    color: '#06b6d4'
};

const RightFlipper = {
    pivotX: 310,
    pivotY: 755,
    length: 75,
    restAngle: Math.PI - 0.55,
    activeAngle: Math.PI + 0.5,
    currentAngle: Math.PI - 0.55,
    angularVelocity: 0,
    isPressed: false,
    thickness: 8,
    color: '#f43f5e'
};

// ---------------------------------------------------------------------------
// Entity Helper Functions
// ---------------------------------------------------------------------------

/**
 * Spawn a new ball — either in the plunger lane or on the upper playfield (multiball).
 */
function spawnBall(isMultiball = false) {
    const ballInPlay = balls.some(b => b.y < 800);

    if (isMultiball || ballInPlay) {
        balls.push({
            id: Math.random(),
            x: 225 + (Math.random() - 0.5) * 60,
            y: 130,
            vx: (Math.random() - 0.5) * 150,
            vy: 100 + Math.random() * 100,
            radius: 10,
            mass: 1,
            trail: []
        });
        createExplosion(225, 130, '#fbbf24', 15);
        triggerDMDMessage("EXTRA BALL IN PLAY!");
    } else {
        const ballInPlunger = balls.some(b => b.x > 410 && b.y > 700);
        if (!ballInPlunger) {
            balls.push({
                id: Math.random(),
                x: 430,
                y: 780,
                vx: 0,
                vy: 0,
                radius: 10,
                mass: 1,
                trail: []
            });
        }
    }
    updateStatsUI();
}

/**
 * Randomize Quantum Scoop position safely in upper playfield.
 */
function randomizeScoopPosition() {
    let safe = false;
    let rx, ry;
    let attempts = 0;

    while (!safe && attempts < 100) {
        rx = 60 + Math.random() * 290;
        ry = 180 + Math.random() * 220;

        safe = true;

        for (let b of Bumpers) {
            let dx = rx - b.x;
            let dy = ry - b.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.radius + QuantumScoop.radius + 30) {
                safe = false;
                break;
            }
        }
        attempts++;
    }

    QuantumScoop.x = rx;
    QuantumScoop.y = ry;
}

/**
 * Create particle explosion burst at given coordinates.
 */
function createExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 2,
            color,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03
        });
    }
}
