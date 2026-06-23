/**
 * Renderer — All canvas drawing logic for the pinball table.
 * Renders walls, bumpers, slingshots, flippers, balls, particles,
 * drop targets, rollover lanes, plunger, and the Quantum Scoop.
 */

function draw() {
    ctx.save();
    ctx.translate(cameraShake.x, cameraShake.y);

    // Clear Screen
    ctx.fillStyle = '#0a0914';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid background lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < GAME_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
    }

    // Visual Outlane zone
    ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
    ctx.beginPath();
    ctx.moveTo(100, 800);
    ctx.lineTo(310, 800);
    ctx.lineTo(310, 850);
    ctx.lineTo(100, 850);
    ctx.closePath();
    ctx.fill();

    // Rollover Lanes
    RolloverLanes.forEach(lane => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = lane.lit ? '#fbbf24' : '#1e293b';
        ctx.fillStyle = lane.lit ? '#fbbf24' : '#334155';
        ctx.beginPath();
        ctx.arc(lane.x, lane.y, lane.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    });

    // Static Walls
    ctx.save();
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    Walls.forEach(w => {
        ctx.beginPath();
        ctx.moveTo(w.p1.x, w.p1.y);
        ctx.lineTo(w.p2.x, w.p2.y);
        ctx.stroke();
    });
    ctx.restore();

    // Quantum Scoop (only if active or capturing)
    if (QuantumScoop.active || QuantumScoop.captureTimer > 0) {
        ctx.save();
        ctx.shadowBlur = QuantumScoop.active ? 18 : 6;
        ctx.shadowColor = QuantumScoop.active ? '#f97316' : '#94a3b8';

        ctx.strokeStyle = QuantumScoop.active ? '#f97316' : '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(QuantumScoop.x, QuantumScoop.y, QuantumScoop.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (QuantumScoop.active) {
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 12]);
            ctx.save();
            ctx.translate(QuantumScoop.x, QuantumScoop.y);
            ctx.rotate(QuantumScoop.pulseTimer * 0.4);
            ctx.beginPath();
            ctx.arc(0, 0, QuantumScoop.radius - 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(QuantumScoop.x, QuantumScoop.y, QuantumScoop.radius - 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = QuantumScoop.active ? '#f97316' : '#1e293b';
        ctx.beginPath();
        ctx.arc(QuantumScoop.x, QuantumScoop.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Drop Targets
    DropTargets.forEach(t => {
        if (t.hit) return;
        ctx.save();
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 6;
        ctx.shadowBlur = 8;
        ctx.shadowColor = t.color;
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
        ctx.restore();
    });

    // Circular Bumpers
    Bumpers.forEach(b => {
        ctx.save();
        const glow = b.hitFlash > 0 ? 25 : 8;
        ctx.shadowBlur = glow;
        ctx.shadowColor = b.color;

        ctx.strokeStyle = b.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = b.hitFlash > 0 ? '#ffffff' : b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    });

    // Slingshot Triangles
    Slingshots.forEach(s => {
        ctx.save();
        ctx.shadowBlur = s.flash > 0 ? 20 : 5;
        ctx.shadowColor = '#38bdf8';

        ctx.fillStyle = s.flash > 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.05)';
        ctx.beginPath();
        ctx.moveTo(s.p1.x, s.p1.y);
        ctx.lineTo(s.p2.x, s.p2.y);
        ctx.lineTo(s.p3.x, s.p3.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.p1.x, s.p1.y);
        ctx.lineTo(s.p2.x, s.p2.y);
        ctx.stroke();

        ctx.restore();
    });

    // Plunger
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(412, plunger.y, 36, 10);

    ctx.fillStyle = '#475569';
    ctx.fillRect(415, plunger.y + 10, 30, 6);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    const segments = 8;
    const startY = 845;
    const endY = plunger.y + 12;
    const stepY = (endY - startY) / segments;
    ctx.beginPath();
    ctx.moveTo(430, startY);
    for (let i = 0; i <= segments; i++) {
        const coilX = 430 + (i % 2 === 0 ? 9 : -9);
        const coilY = startY + i * stepY;
        ctx.lineTo(coilX, coilY);
    }
    ctx.stroke();
    ctx.restore();

    // Flippers
    [LeftFlipper, RightFlipper].forEach(flip => {
        ctx.save();
        ctx.translate(flip.pivotX, flip.pivotY);
        ctx.rotate(flip.currentAngle);

        ctx.shadowBlur = 12;
        ctx.shadowColor = flip.color;

        ctx.fillStyle = flip.color;
        ctx.beginPath();
        ctx.arc(0, 0, flip.thickness, Math.PI / 2, Math.PI * 1.5);
        ctx.lineTo(flip.length, -flip.thickness * 0.5);
        ctx.arc(flip.length, 0, flip.thickness * 0.5, Math.PI * 1.5, Math.PI / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, flip.thickness * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // Balls
    balls.forEach(b => {
        b.trail.forEach((t, index) => {
            ctx.fillStyle = `rgba(255, 255, 255, ${t.life * 0.15})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, b.radius * (index / b.trail.length), 0, Math.PI * 2);
            ctx.fill();
            t.life -= 0.04;
        });
        b.trail = b.trail.filter(t => t.life > 0);

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';

        const grad = ctx.createRadialGradient(b.x - 3, b.y - 3, 2, b.x, b.y, b.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#cbd5e1');
        grad.addColorStop(1, '#475569');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Floating score popups
    floatyScores.forEach(fs => {
        ctx.save();
        ctx.font = `bold ${fs.size}px 'Press Start 2P', monospace`;
        ctx.fillStyle = fs.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = fs.color;
        ctx.globalAlpha = fs.life;
        ctx.fillText(fs.text, fs.x - 20, fs.y);
        ctx.restore();
    });
    ctx.globalAlpha = 1.0;

    ctx.restore();
}
