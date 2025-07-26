// Ball Module for creating and managing balls
export class Ball {
    constructor(sceneManager, x, y) {
        this.sceneManager = sceneManager;
        this.size = this.generateRandomSize();
        this.radius = this.calculateRadius(this.size);
        this.mass = this.calculateMass(this.size);
        this.color = this.getColorForSize(this.size);

        this.body = Matter.Bodies.circle(x, y, this.radius, {
            mass: this.mass,
            friction: 0.2,
            frictionAir: 0.005,
            restitution: 0.95,
            render: {
                fillStyle: this.color,
                strokeStyle: '#ffffff',
                lineWidth: 3,
                visible: true,
            },
            label: 'ball',
        });

        this.body.force.x = 0;
        this.body.force.y = 0;
        this.body.torque = 0;
        this.body.angularVelocity = 0;

        this.body.circleRadius = this.radius;

        this.body.ballInstance = this;

        // Game logic properties belong on the Ball instance, not the physics body
        this.verticalDrop = false;
        this.verticalDropXCoordinate = 512;
        Matter.Body.setStatic(this.body, true);

        // Add to scene
        this.sceneManager.addBody(this.body);
    }

    getBallStateHtml() {
        let vHtml = ``;

        vHtml += this.body.id + ':&nbsp;';
        vHtml +=
            '<svg width="12" height="12" style="vertical-align:middle;"><circle cx="6" cy="6" r="6" fill="' +
            this.color +
            '"/></svg>&nbsp;';

        vHtml += 'Size:' + this.size + '&nbsp;';
        vHtml += 'Mass:' + this.mass.toFixed(1) + '&nbsp;';
        vHtml += 'Speed:' + this.body.speed.toFixed(3) + '&nbsp;';
        vHtml += 'Pos:' + this.body.position.x.toFixed(0) + ',' + this.body.position.y.toFixed(0) + '&nbsp;';
        vHtml += 'Vel:' + this.body.velocity.x.toFixed(3) + ',' + this.body.velocity.y.toFixed(3) + '&nbsp;';
        vHtml += 'Ang Vel:' + this.body.angularVelocity.toFixed(3) + '&nbsp;';
        vHtml += this.verticalDrop ? 'V' : '&nbsp;';

        vHtml += '<br/>';

        return vHtml;
    }

    generateRandomSize() {
        // Random size from 1 to 5 as specified
        return Math.floor(Math.random() * 5) + 1;
    }

    calculateRadius(size) {
        return 25 + (size - 1) * 5;
    }

    calculateMass(size) {
        // Use simple integer scaling to avoid floating-point precision issues
        // Size 1: mass 1, Size 2: mass 2, Size 3: mass 3, Size 4: mass 4, Size 5: mass 5
        // This eliminates the complex square root calculations that were causing physics inconsistencies
        return size;
    }

    getColorForSize(size) {
        // Cyberpunk color palette based on size
        const colors = [
            '#ff0080', // Hot pink
            '#00ff80', // Bright green
            '#8000ff', // Purple
            '#ff8000', // Orange
            '#0080ff', // Blue
            '#ff0040', // Red-pink
            '#40ff00', // Lime
            '#ff4000', // Red-orange
            '#0040ff', // Deep blue
            '#ff00c0', // Magenta
            '#00c0ff', // Cyan
            '#c000ff', // Violet
            '#ffc000', // Gold
            '#00ffc0', // Aqua
            '#c0ff00', // Yellow-green
        ];

        return colors[(size - 1) % colors.length];
    }

    getPosition() {
        return {
            x: this.body.position.x,
            y: this.body.position.y,
        };
    }

    setPosition(x, y) {
        Matter.Body.setPosition(this.body, { x, y });
    }

    keepOnVerticalDrop() {
        // Ensure the ball stays in vertical drop mode
        if (this.verticalDrop) {
            // Keep the ball's x position fixed at the vertical drop x coordinate
            this.setPosition(this.verticalDropXCoordinate, this.body.position.y);
        }
    }

    applyForce(x, y) {
        Matter.Body.applyForce(this.body, this.body.position, { x, y });
    }

    // Release ball from static state (when dropped)
    release() {
        Matter.Body.setStatic(this.body, false);
        Matter.Body.setAngularVelocity(this.body, 0);
        Matter.Body.setVelocity(this.body, { x: 0, y: 0 });

        this.verticalDropXCoordinate = this.body.position.x;
        this.verticalDrop = true;
    }

    destroy() {
        this.sceneManager.removeBody(this.body);
    }
}

export class BallManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.balls = [];
        this.currentBall = null;
        this.nextSpawnTime = performance.now();
        this.jitterTime = 0;
        this.offScreenBalls = new Map();
    }
    start() {
        this.spawnBall();
    }

    getBallsStateHtml() {
        let vHtml = `<strong>Ball Details</strong><br>`;

        this.balls.forEach((ball) => {
            vHtml += `${ball.getBallStateHtml()}`;
        });

        return vHtml;
    }

    spawnBall() {
        if (this.currentBall !== null) {
            return;
        }

        if (performance.now() < this.nextSpawnTime) {
            return;
        }

        const x = 512; // Center of canvas (1024/2)
        const y = 50; // Near top

        this.currentBall = new Ball(this.sceneManager, x, y);
        this.balls.push(this.currentBall);
    }

    dropCurrentBall() {
        if (this.currentBall === null) {
            return;
        }

        this.currentBall.release();

        this.nextSpawnTime = performance.now() + 2000;
        this.jitterTime = performance.now() + 10000;

        // Release the ball from player control
        this.currentBall = null;
    }

    moveCurrentBall(direction) {
        if (this.currentBall === null) {
            return;
        }

        const currentPos = this.currentBall.getPosition();
        const moveDistance = 5; // Distance to move per frame
        let newX = currentPos.x + direction * moveDistance;

        // Keep within bounds (accounting for ball radius)
        const ballRadius = this.currentBall.radius;
        const wallThickness = 16; // Updated wall thickness
        const minX = wallThickness + ballRadius;
        const maxX = 1024 - wallThickness - ballRadius;

        newX = Math.max(minX, Math.min(maxX, newX));

        this.currentBall.setPosition(newX, currentPos.y);
    }

    // Called every frame to check if we should spawn a new ball
    updateFrame() {
        this.spawnBall();
        this.updateBallStates();
    }

    updateBallStates() {
        this.balls.forEach((ball) => {
            ball.keepOnVerticalDrop();
        });

        this.stopJittering();
    }

    stopJittering() {
        if (this.jitterTime == 0 || performance.now() < this.jitterTime) {
            return;
        }

        this.balls.forEach((ball) => {
            const body = ball.body;

            if (body.label === 'ball' && !body.isStatic) {
                const speedSquared = body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y;

                // Stop micro-movements: only stop balls that are moving very slowly
                if (speedSquared < 0.01 && speedSquared > 0) {
                    Matter.Body.setVelocity(body, { x: 0, y: 0 });
                    body.force.x = 0;
                    body.force.y = 0;
                }

                // Check angular velocity separately and stop if it's very small
                if (Math.abs(body.angularVelocity) < 0.01 && Math.abs(body.angularVelocity) > 0) {
                    Matter.Body.setAngularVelocity(body, 0);
                    body.torque = 0;
                }
            }
        });
    }

    cleanup() {
        const now = performance.now();
        const gracePeriod = 3000; // 3 seconds grace period for off-screen balls
        const canvasWidth = 1024;
        const canvasHeight = 768;
        const maxOffScreenDistance = 200; // Allow balls to go this far off-screen before removal

        // Remove balls that have been off-screen too long or are too far away
        this.balls = this.balls.filter((ball) => {
            const pos = ball.getPosition();
            const isOffScreen =
                pos.y > canvasHeight + maxOffScreenDistance ||
                pos.x < -maxOffScreenDistance ||
                pos.x > canvasWidth + maxOffScreenDistance ||
                pos.y < -maxOffScreenDistance;

            if (isOffScreen) {
                // Track when this ball first went off-screen
                if (!this.offScreenBalls.has(ball)) {
                    this.offScreenBalls.set(ball, now);
                    return true; // Keep the ball for now
                }

                // Check if grace period has expired
                const offScreenTime = now - this.offScreenBalls.get(ball);
                if (offScreenTime > gracePeriod) {
                    this.offScreenBalls.delete(ball);
                    ball.destroy();
                    return false;
                }

                return true; // Still within grace period
            } else {
                // Ball is back on screen, remove from off-screen tracking
                if (this.offScreenBalls.has(ball)) {
                    this.offScreenBalls.delete(ball);
                }
                return true;
            }
        });
    }
}
