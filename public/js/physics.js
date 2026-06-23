/**
 * Physics — Collision detection, resolution, and physics simulation.
 * Handles all ball-to-entity interactions and the main physics loop.
 */

// ---------------------------------------------------------------------------
// Mathematical Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the shortest distance from point p to line segment v–w.
 */
function distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return { distSq: (p.x - v.x) ** 2 + (p.y - v.y) ** 2, closest: v };
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const closest = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    return {
        distSq: (p.x - closest.x) ** 2 + (p.y - closest.y) ** 2,
        closest: closest,
        t: t
    };
}

// ---------------------------------------------------------------------------
// Flipper Collision
// ---------------------------------------------------------------------------

function collideBallWithFlipper(ball, flipper, dt) {
    // Treat the Pivot Point as a solid physical cylinder first
    const dxPivot = ball.x - flipper.pivotX;
    const dyPivot = ball.y - flipper.pivotY;
    const distPivot = Math.sqrt(dxPivot * dxPivot + dyPivot * dyPivot);
    const pivotColDist = ball.radius + flipper.thickness;

    if (distPivot < pivotColDist) {
        const nx = dxPivot / (distPivot || 1);
        const ny = dyPivot / (distPivot || 1);

        ball.x = flipper.pivotX + nx * pivotColDist;
        ball.y = flipper.pivotY + ny * pivotColDist;

        const velAlongNormal = ball.vx * nx + ball.vy * ny;
        if (velAlongNormal < 0) {
            ball.vx = ball.vx - 1.5 * velAlongNormal * nx;
            ball.vy = ball.vy - 1.5 * velAlongNormal * ny;
        }
        return; // Pivot collision resolved
    }

    const tipX = flipper.pivotX + flipper.length * Math.cos(flipper.currentAngle);
    const tipY = flipper.pivotY + flipper.length * Math.sin(flipper.currentAngle);

    const res = distToSegment(ball, { x: flipper.pivotX, y: flipper.pivotY }, { x: tipX, y: tipY });
    const colDist = ball.radius + flipper.thickness;

    if (res.distSq < colDist * colDist) {
        const actualDist = Math.sqrt(res.distSq);

        let nx = (ball.x - res.closest.x) / (actualDist || 1);
        let ny = (ball.y - res.closest.y) / (actualDist || 1);

        const pen = colDist - actualDist;
        ball.x += nx * pen;
        ball.y += ny * pen;

        const rx = res.closest.x - flipper.pivotX;
        const ry = res.closest.y - flipper.pivotY;
        const distFromPivot = Math.sqrt(rx * rx + ry * ry);

        const px = -Math.sin(flipper.currentAngle);
        const py = Math.cos(flipper.currentAngle);

        const fvx = flipper.angularVelocity * distFromPivot * px;
        const fvy = flipper.angularVelocity * distFromPivot * py;

        const rvx = ball.vx - fvx;
        const rvy = ball.vy - fvy;

        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
            const restitution = 0.55;
            const impulseScalar = -(1 + restitution) * velAlongNormal;

            ball.vx = fvx + rvx + impulseScalar * nx;
            ball.vy = fvy + rvy + impulseScalar * ny;

            if (Math.abs(flipper.angularVelocity) > 0.5) {
                synth.playBumper();
                createExplosion(res.closest.x, res.closest.y, flipper.color, 6);
                triggerScore(10, res.closest.x, res.closest.y, 10);
                cameraShake.duration = 4;
            }
        }

        // Slope gravity slide-off logic
        const dx = tipX - flipper.pivotX;
        const dy = tipY - flipper.pivotY;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / len;
        const dirY = dy / len;

        const slideForce = 320;
        ball.vx += dirX * slideForce * dt;
        ball.vy += dirY * slideForce * dt;
    }
}

// ---------------------------------------------------------------------------
// Plunger Launch
// ---------------------------------------------------------------------------

function triggerFullLaunch() {
    if (plunger.isCharging) return;
    plunger.isCharging = true;
    plunger.y = plunger.maxY;
    setTimeout(() => {
        plunger.isCharging = false;
    }, 120);
}

// ---------------------------------------------------------------------------
// Drop Target & Rollover Progress
// ---------------------------------------------------------------------------

function checkDropTargetsProgress() {
    const hitCount = DropTargets.filter(t => t.hit).length;

    if (hitCount === 3) {
        targetClearsCount++;

        triggerScore(1500, GAME_WIDTH / 2, 400, 16);

        setTimeout(() => {
            DropTargets.forEach(t => t.hit = false);
            updateStatsUI();
        }, 1000);

        if (targetClearsCount >= 3) {
            targetClearsCount = 0;
            QuantumScoop.active = true;
            randomizeScoopPosition();
            triggerDMDMessage("★ QUANTUM SCOOP ACTIVATED ★");
            synth.playJackpot();
        } else {
            triggerDMDMessage(`SET COMPLETE: ${targetClearsCount}/3`);
            synth.playJackpot();
        }
        updateStatsUI();
    }
}

function checkRolloverLanesProgress() {
    const allLit = RolloverLanes.every(l => l.lit);
    if (allLit) {
        multiplier++;
        triggerDMDMessage("X" + multiplier + " MULTIPLIER LOCKED!");
        setTimeout(() => {
            RolloverLanes.forEach(l => l.lit = false);
        }, 1200);
    }
}

// ---------------------------------------------------------------------------
// Physics Sub-Step
// ---------------------------------------------------------------------------

function updatePhysicsSubStep(dt) {
    const gravity = 450;
    const friction = 0.9995;

    [LeftFlipper, RightFlipper].forEach((flip, index) => {
        const target = flip.isPressed ? flip.activeAngle : flip.restAngle;
        const prevAngle = flip.currentAngle;
        const maxSpeed = 16.0;

        if (isTilted) {
            flip.isPressed = false;
        }

        const diff = target - flip.currentAngle;
        flip.angularVelocity = diff * 12.0;

        flip.angularVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, flip.angularVelocity));
        flip.currentAngle += flip.angularVelocity * dt;

        if (flip.isPressed && Math.abs(prevAngle - flip.restAngle) < 0.05 && Math.abs(flip.angularVelocity) > 1) {
            synth.playFlipper();
        }
    });

    // Update Plunger physics
    if (plunger.isCharging) {
        plunger.y = Math.min(plunger.maxY, plunger.y + 180 * dt);
        plunger.chargeValue = (plunger.y - plunger.minY) / (plunger.maxY - plunger.minY || 1);
        plunger.vy = 0;
    } else {
        if (plunger.y > plunger.minY) {
            plunger.vy = -1200 * (plunger.y - plunger.minY) / (plunger.maxY - plunger.minY || 1) - 200;
            plunger.y += plunger.vy * dt;
            if (plunger.y <= plunger.minY) {
                plunger.y = plunger.minY;
                plunger.vy = 0;
            }
        }
    }

    // Loop through active balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];

        b.vy += gravity * dt;
        b.vx *= friction;
        b.vy *= friction;

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (Math.random() < 0.25) {
            b.trail.push({ x: b.x, y: b.y, life: 1.0 });
        }

        // Collide with Quantum Scoop
        if (QuantumScoop.active || QuantumScoop.captureTimer > 0) {
            const dxScoop = b.x - QuantumScoop.x;
            const dyScoop = b.y - QuantumScoop.y;
            const distScoop = Math.sqrt(dxScoop * dxScoop + dyScoop * dyScoop);
            const colScoopDist = b.radius + QuantumScoop.radius;

            if (distScoop < colScoopDist) {
                if (QuantumScoop.active && QuantumScoop.captureTimer === 0) {
                    QuantumScoop.captureTimer = 1.8;
                    QuantumScoop.heldBall = { ...b };
                    balls.splice(i, 1);
                    QuantumScoop.active = false;

                    synth.playScoopCharge();
                    triggerScore(5000, QuantumScoop.x, QuantumScoop.y, 18);
                    triggerDMDMessage("LOCK CHUTE ACTIVE!");
                    createExplosion(QuantumScoop.x, QuantumScoop.y, '#f97316', 25);
                    cameraShake.duration = 20;
                    updateStatsUI();
                    continue;
                }
            }
        }

        // Collide with Table Plunger
        if (b.x > 410 && b.y + b.radius >= plunger.y) {
            b.y = plunger.y - b.radius;
            if (plunger.vy < -50) {
                b.vy = plunger.vy * 1.6;
                synth.playLaunch();
                triggerDMDMessage("BALL LAUNCHED!");
                createExplosion(b.x, b.y, '#eab308', 15);
            } else {
                b.vy = Math.min(0, b.vy);
            }
        }

        // Collide against Static Segment Walls
        Walls.forEach(w => {
            const res = distToSegment(b, w.p1, w.p2);
            if (res.distSq < b.radius * b.radius) {
                const dist = Math.sqrt(res.distSq);
                const nx = (b.x - res.closest.x) / (dist || 1);
                const ny = (b.y - res.closest.y) / (dist || 1);

                b.x = res.closest.x + nx * b.radius;
                b.y = res.closest.y + ny * b.radius;

                const velAlongNormal = b.vx * nx + b.vy * ny;
                if (velAlongNormal < 0) {
                    b.vx = b.vx - (1 + w.bounce) * velAlongNormal * nx;
                    b.vy = b.vy - (1 + w.bounce) * velAlongNormal * ny;
                }
            }
        });

        // Collide with Round Neon Bumpers
        Bumpers.forEach(bump => {
            const dx = b.x - bump.x;
            const dy = b.y - bump.y;
            const distSq = dx * dx + dy * dy;
            const minDist = b.radius + bump.radius;

            if (distSq < minDist * minDist) {
                const dist = Math.sqrt(distSq);
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                b.x = bump.x + nx * minDist;
                b.y = bump.y + ny * minDist;

                const bounceFactor = 1.7;
                const velAlongNormal = b.vx * nx + b.vy * ny;

                b.vx = b.vx - (1 + bounceFactor) * velAlongNormal * nx;
                b.vy = b.vy - (1 + bounceFactor) * velAlongNormal * ny;

                bump.hitFlash = 1.0;
                createExplosion(bump.x, bump.y, bump.color, 15);
                synth.playBumper();
                triggerScore(bump.score, bump.x, bump.y, 14);
                cameraShake.duration = 6;
            }
        });

        // Slingshot Collisions
        Slingshots.forEach(s => {
            const res = distToSegment(b, s.p1, s.p2);
            if (res.distSq < b.radius * b.radius) {
                const dist = Math.sqrt(res.distSq);

                b.x = res.closest.x + s.normal.x * b.radius;
                b.y = res.closest.y + s.normal.y * b.radius;

                const kickPower = 550;
                b.vx = s.normal.x * kickPower;
                b.vy = s.normal.y * kickPower;

                s.flash = 1.0;
                createExplosion(res.closest.x, res.closest.y, '#38bdf8', 12);
                synth.playSlingshot();
                triggerScore(s.score, res.closest.x, res.closest.y, 12);
                cameraShake.duration = 8;
            }
        });

        // Check Drop Targets collisions
        DropTargets.forEach(target => {
            if (target.hit) return;
            const res = distToSegment(b, { x: target.x1, y: target.y1 }, { x: target.x2, y: target.y2 });
            if (res.distSq < b.radius * b.radius) {
                target.hit = true;

                const dist = Math.sqrt(res.distSq);
                const nx = (b.x - res.closest.x) / (dist || 1);
                const ny = (b.y - res.closest.y) / (dist || 1);
                b.x = res.closest.x + nx * b.radius;
                b.y = res.closest.y + ny * b.radius;
                b.vx = -b.vx * 0.6;

                createExplosion(res.closest.x, res.closest.y, target.color, 12);
                synth.playBumper();
                triggerScore(500, res.closest.x, res.closest.y, 15);
                triggerDMDMessage("TARGET DOWN!");

                checkDropTargetsProgress();
            }
        });

        // Check Rollover Lanes collisions
        RolloverLanes.forEach(lane => {
            const dx = b.x - lane.x;
            const dy = b.y - lane.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.radius + lane.r && !lane.lit) {
                lane.lit = true;
                synth.playJackpot();
                triggerScore(1000, lane.x, lane.y, 16);
                createExplosion(lane.x, lane.y, '#fbbf24', 16);
                triggerDMDMessage("ROLLOVER LIT!");
                checkRolloverLanesProgress();
            }
        });

        // Flippers Collisions
        collideBallWithFlipper(b, LeftFlipper, dt);
        collideBallWithFlipper(b, RightFlipper, dt);

        // DRAIN CHECK
        if (b.y > GAME_HEIGHT + 30) {
            balls.splice(i, 1);
            createExplosion(b.x, b.y - 30, '#ef4444', 20);

            if (balls.length === 0 && !QuantumScoop.heldBall) {
                synth.playDrain();
                ballsLeft--;
                updateStatsUI();

                if (ballsLeft > 0) {
                    triggerDMDMessage("BALL DRAINED!");
                    setTimeout(() => {
                        spawnBall();
                    }, 1000);
                } else {
                    handleGameOver();
                }
            } else {
                triggerDMDMessage("BALL LOST!");
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Main Physics Update (with sub-stepping & Quantum Scoop state engine)
// ---------------------------------------------------------------------------

function updatePhysics(dt) {
    if (isGameOver || isPaused) return;

    if (cameraShake.duration > 0) {
        cameraShake.x = (Math.random() - 0.5) * cameraShake.duration * 1.5;
        cameraShake.y = (Math.random() - 0.5) * cameraShake.duration * 1.5;
        cameraShake.duration--;
    } else {
        cameraShake.x = 0;
        cameraShake.y = 0;
    }

    if (nudgeCooldown > 0) {
        nudgeCooldown -= dt;
    } else if (nudgeCount > 0) {
        nudgeCount = Math.max(0, nudgeCount - dt * 0.4);
    }

    // Quantum Scoop Capture Sequence
    if (QuantumScoop.captureTimer > 0) {
        QuantumScoop.captureTimer -= dt;

        createExplosion(QuantumScoop.x, QuantumScoop.y, '#f97316', 1);

        if (QuantumScoop.captureTimer > 1.2) {
            triggerDMDMessage("3... INITIATING CORES");
        } else if (QuantumScoop.captureTimer > 0.6) {
            triggerDMDMessage("2... COMPRESSING SINGULARITY");
        } else if (QuantumScoop.captureTimer > 0.0) {
            triggerDMDMessage("1... MULTIBALL RELEASE!");
        }

        if (QuantumScoop.captureTimer <= 0) {
            QuantumScoop.captureTimer = 0;

            // Release original ball
            if (QuantumScoop.heldBall) {
                balls.push({
                    ...QuantumScoop.heldBall,
                    vx: -80,
                    vy: -480
                });
                QuantumScoop.heldBall = null;
            }

            // Release 2 extra multiball
            balls.push({
                id: Math.random(),
                x: QuantumScoop.x,
                y: QuantumScoop.y,
                vx: -240,
                vy: -350,
                radius: 10,
                mass: 1,
                trail: []
            });

            balls.push({
                id: Math.random(),
                x: QuantumScoop.x,
                y: QuantumScoop.y,
                vx: 180,
                vy: -400,
                radius: 10,
                mass: 1,
                trail: []
            });

            multiplier++;
            synth.playJackpot();
            triggerDMDMessage("★ NEBULA MULTIBALL ACTIVE ★");
            createExplosion(QuantumScoop.x, QuantumScoop.y, '#a855f7', 35);
            cameraShake.duration = 30;
            updateStatsUI();
        }
    }

    // Sub-stepping for stable collisions
    const subSteps = 6;
    const subDt = dt / subSteps;
    for (let step = 0; step < subSteps; step++) {
        updatePhysicsSubStep(subDt);
    }

    Bumpers.forEach(b => {
        if (b.hitFlash > 0) b.hitFlash -= dt * 6;
    });
    Slingshots.forEach(s => {
        if (s.flash > 0) s.flash -= dt * 6;
    });

    // Update scoop visual pulses
    QuantumScoop.pulseTimer += dt * 5;

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = floatyScores.length - 1; i >= 0; i--) {
        const fs = floatyScores[i];
        fs.y += fs.vy;
        fs.life -= dt * 1.5;
        if (fs.life <= 0) floatyScores.splice(i, 1);
    }
}
