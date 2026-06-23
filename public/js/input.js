/**
 * Input — Keyboard, touch, and mouse event handlers for the pinball table.
 * Handles flipper controls, plunger charging, nudge mechanics, and mobile touch deck.
 */

// ---------------------------------------------------------------------------
// Nudge Mechanic
// ---------------------------------------------------------------------------

function triggerNudge() {
    if (isGameOver || isTilted) return;

    nudgeCount++;
    nudgeCooldown = 2.0;
    cameraShake.duration = 10;

    balls.forEach(b => {
        b.vx += (Math.random() - 0.5) * 85;
        b.vy += (Math.random() - 0.5) * 85;
    });

    if (nudgeCount >= 3) {
        isTilted = true;
        synth.playTilt();
        const tiltOv = document.getElementById('tilt-overlay');
        if (tiltOv) tiltOv.style.opacity = '1.0';
        triggerDMDMessage("!!! TILT TRIGGERED !!!");

        LeftFlipper.isPressed = false;
        RightFlipper.isPressed = false;

        setTimeout(() => {
            if (isTilted) {
                isTilted = false;
                const tiltOv2 = document.getElementById('tilt-overlay');
                if (tiltOv2) tiltOv2.style.opacity = '0';
                nudgeCount = 0;
                triggerDMDMessage("SYSTEM RESTORED");
            }
        }, 4000);
    } else {
        synth.playSlingshot();
        triggerDMDMessage("NUDGE WARNING: " + nudgeCount + "/3");
    }
}

// ---------------------------------------------------------------------------
// Keyboard Controls
// ---------------------------------------------------------------------------

window.addEventListener('keydown', (e) => {
    if (isTilted) return;

    if (e.key === 'z' || e.key === 'ArrowLeft') {
        LeftFlipper.isPressed = true;
    }
    if (e.key === '/' || e.key === 'ArrowRight') {
        RightFlipper.isPressed = true;
    }
    if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        plunger.isCharging = true;
    }
    if (e.key === 'x') {
        triggerNudge();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'z' || e.key === 'ArrowLeft') {
        LeftFlipper.isPressed = false;
    }
    if (e.key === '/' || e.key === 'ArrowRight') {
        RightFlipper.isPressed = false;
    }
    if (e.key === 'ArrowDown' || e.key === ' ') {
        plunger.isCharging = false;
    }
});

// ---------------------------------------------------------------------------
// Touch Zone Controls (Canvas overlay zones)
// ---------------------------------------------------------------------------

const touchLeft = document.getElementById('touch-left');
const touchRight = document.getElementById('touch-right');

if (touchLeft) {
    touchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); LeftFlipper.isPressed = true; });
    touchLeft.addEventListener('touchend', (e) => { e.preventDefault(); LeftFlipper.isPressed = false; });
}
if (touchRight) {
    touchRight.addEventListener('touchstart', (e) => { e.preventDefault(); RightFlipper.isPressed = true; });
    touchRight.addEventListener('touchend', (e) => { e.preventDefault(); RightFlipper.isPressed = false; });
}

// ---------------------------------------------------------------------------
// Mobile Touch Deck Controls
// ---------------------------------------------------------------------------

const mLeftFlipper = document.getElementById('mobile-left-flipper');
const mRightFlipper = document.getElementById('mobile-right-flipper');
const mLaunchPlunger = document.getElementById('mobile-launch-flipper');
const mNudgeBtn = document.getElementById('mobile-nudge-btn');

if (mLeftFlipper) {
    mLeftFlipper.addEventListener('touchstart', (e) => { e.preventDefault(); LeftFlipper.isPressed = true; });
    mLeftFlipper.addEventListener('touchend', (e) => { e.preventDefault(); LeftFlipper.isPressed = false; });
    mLeftFlipper.addEventListener('mousedown', (e) => { e.preventDefault(); LeftFlipper.isPressed = true; });
    mLeftFlipper.addEventListener('mouseup', (e) => { e.preventDefault(); LeftFlipper.isPressed = false; });
}

if (mRightFlipper) {
    mRightFlipper.addEventListener('touchstart', (e) => { e.preventDefault(); RightFlipper.isPressed = true; });
    mRightFlipper.addEventListener('touchend', (e) => { e.preventDefault(); RightFlipper.isPressed = false; });
    mRightFlipper.addEventListener('mousedown', (e) => { e.preventDefault(); RightFlipper.isPressed = true; });
    mRightFlipper.addEventListener('mouseup', (e) => { e.preventDefault(); RightFlipper.isPressed = false; });
}

if (mLaunchPlunger) {
    mLaunchPlunger.addEventListener('touchstart', (e) => { e.preventDefault(); plunger.isCharging = true; });
    mLaunchPlunger.addEventListener('touchend', (e) => { e.preventDefault(); plunger.isCharging = false; });
    mLaunchPlunger.addEventListener('mousedown', (e) => { e.preventDefault(); plunger.isCharging = true; });
    mLaunchPlunger.addEventListener('mouseup', (e) => { e.preventDefault(); plunger.isCharging = false; });
    mLaunchPlunger.addEventListener('click', (e) => { e.preventDefault(); triggerFullLaunch(); });
}

if (mNudgeBtn) {
    mNudgeBtn.addEventListener('click', (e) => { e.preventDefault(); triggerNudge(); });
}

// ---------------------------------------------------------------------------
// Side Panel Button Controls
// ---------------------------------------------------------------------------

document.getElementById('btn-nudge').addEventListener('click', triggerNudge);

const btnPlunger = document.getElementById('btn-plunger');
btnPlunger.addEventListener('mousedown', () => { plunger.isCharging = true; });
btnPlunger.addEventListener('mouseup', () => { plunger.isCharging = false; });
btnPlunger.addEventListener('touchstart', (e) => { e.preventDefault(); plunger.isCharging = true; });
btnPlunger.addEventListener('touchend', (e) => { e.preventDefault(); plunger.isCharging = false; });
btnPlunger.addEventListener('click', (e) => {
    e.preventDefault();
    triggerFullLaunch();
});
