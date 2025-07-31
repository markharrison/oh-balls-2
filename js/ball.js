// Ball Module for creating and managing balls
import { PhysicsBodyFactory, PhysicsConstants, pixelsToMeters } from './physics.js';

export class Ball {
    constructor(sceneManager, x, y) {
        this.sceneManager = sceneManager;
        this.size = this.generateRandomSize();
        this.radius = this.calculateRadius(this.size);
        this.color = this.getColorForSize(this.size);
        this.verticalDrop = false;
        this.verticalDropXCoordinate = 512;

        const render = {
            radius: this.radius,
            fillStyle: this.color,
            strokeStyle: '#ffffff',
            lineWidth: 3,
            visible: true,
            showNumber: true,
            size: this.size,
        };

        const userData = {
            label: 'ball',
            ball: this,
            render: render,
        };

        this.physicsBody = PhysicsBodyFactory.createCircle(x, y, this.radius, {
            label: 'ball',
            desnity: 1,
            friction: 0.5,
            frictionAir: 0.005,
            restitution: 0.7, // Reduced from 0.95 for more realistic bouncing
            userData: userData,
        });

        this.physicsBody.setStatic(true);

        // Add to scene
        this.sceneManager.addBody(this.physicsBody);
    }

    getBallStateHtml() {
        let vHtml = ``;

        // Calculate mass using meter radius for realistic physics mass
        const meterRadius = pixelsToMeters(this.radius);
        const density = 1.0; // Default density from physics body factory
        let mass = meterRadius * meterRadius * Math.PI * density;

        vHtml += this.physicsBody.id + ':&nbsp;';
        vHtml +=
            '<svg width="12" height="12" style="vertical-align:middle;"><circle cx="6" cy="6" r="6" fill="' +
            this.color +
            '"/></svg>&nbsp;';

        vHtml += 'Size:' + this.size + '&nbsp;';
        vHtml += 'Mass:' + mass.toFixed(1) + '&nbsp;';
        vHtml += 'Speed:' + this.physicsBody.speed.toFixed(3) + '&nbsp;';
        const pos = this.physicsBody.getPosition();
        vHtml += 'Pos:' + pos.x.toFixed(0) + ',' + pos.y.toFixed(0) + '&nbsp;';
        const vel = this.physicsBody.getVelocity();
        vHtml += 'Vel:' + vel.x.toFixed(3) + ',' + vel.y.toFixed(3) + '&nbsp;';
        vHtml += 'Ang Vel:' + this.physicsBody.getAngularVelocity().toFixed(3) + '&nbsp;';
        vHtml += this.verticalDrop ? 'V' : '';
        vHtml += this.physicsBody.isSleeping() ? 'S' : '';

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
        return this.physicsBody.getPosition();
    }

    setPosition(x, y) {
        this.physicsBody.setPosition(x, y);
    }

    keepOnVerticalDrop() {
        // Ensure the ball stays in vertical drop mode
        if (this.verticalDrop) {
            // Keep the ball's x position fixed at the vertical drop x coordinate
            const pos = this.physicsBody.getPosition();
            this.setPosition(this.verticalDropXCoordinate, pos.y);
        }
    }

    applyForce(x, y) {
        this.physicsBody.applyForce(x, y);
    }

    // Release ball from static state (when dropped)
    release() {
        this.physicsBody.setStatic(false);
        this.physicsBody.setAngularVelocity(0);
        this.physicsBody.setVelocity(0, 0);

        const pos = this.physicsBody.getPosition();
        this.verticalDropXCoordinate = pos.x;
        this.verticalDrop = true;
    }

    destroy() {
        this.sceneManager.removeBody(this.physicsBody);
    }
}

export class BallManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.currentBall = null;
        this.lastCleanupTime = 0;
        this.lastDropTime = 0;
    }
    start() {
        this.spawnBall();
    }

    getBallBodies() {
        return this.sceneManager.physics.getBodiesByLabel('ball');
    }

    getBallsStateHtml() {
        let vHtml = `<strong>Ball Details</strong><br>`;

        let ballBodies = this.getBallBodies();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball) {
                vHtml += `${ball.getBallStateHtml()}`;
            }
        });

        return vHtml;
    }

    spawnBall() {
        if (this.currentBall !== null) {
            return;
        }

        if (performance.now() - this.lastDropTime < 1000) {
            return;
        }

        const x = this.sceneManager.canvas.width / 2;
        const y = 50;

        this.currentBall = new Ball(this.sceneManager, x, y);
    }

    dropCurrentBall() {
        if (this.currentBall === null) {
            return;
        }

        let ballBodies = this.getBallBodies();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball) {
                ball.physicsBody.setSleeping(false);
            }
        });

        this.currentBall.release();
        this.lastDropTime = performance.now();

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
        const maxX = this.sceneManager.canvas.width - wallThickness - ballRadius;

        newX = Math.max(minX, Math.min(maxX, newX));

        this.currentBall.setPosition(newX, currentPos.y);
    }

    updateFrame() {
        this.spawnBall();
        this.updateBallStates();
    }

    updateBallStates() {
        let ballBodies = this.getBallBodies();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball) {
                ball.keepOnVerticalDrop();
            }
        });

        this.stopJittering();

        this.cleanup();
    }

    stopJittering() {
        let now = performance.now();
        if (now - this.lastDropTime < 10000) {
            return;
        }

        let ballBodies = this.getBallBodies();
        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball && !ball.physicsBody.isStatic()) {
                const velocity = ball.physicsBody.getVelocity();
                const speedSquared = velocity.x * velocity.x + velocity.y * velocity.y;
                const isMovingSlowly = speedSquared < PhysicsConstants.slowLinearVelocityThreshold;
                const angularVelocity = ball.physicsBody.getAngularVelocity();
                const isRotatingSlowly = Math.abs(angularVelocity) < PhysicsConstants.slowAngularVelocityThreshold;

                // Stop micro-movements: only stop balls that are moving very slowly
                if (isMovingSlowly) {
                    ball.physicsBody.setVelocity(0, 0);
                }

                // Check angular velocity separately and stop if it's very small
                if (isRotatingSlowly) {
                    ball.physicsBody.setAngularVelocity(0);
                }

                if (isMovingSlowly && isRotatingSlowly && now - this.lastDropTime > 15000) {
                    ball.physicsBody.setSleeping(true);
                }
            }
        });
    }

    cleanup() {
        let now = performance.now();
        if (now - this.lastCleanupTime < 15000) {
            return;
        }
        this.lastCleanupTime = now;

        console.log('Cleaning up balls... ' + now);

        const canvasWidth = this.sceneManager.canvas.width;
        const canvasHeight = this.sceneManager.canvas.height;

        let ballBodies = this.getBallBodies();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball) {
                const pos = ball.getPosition();
                const isOffScreen = pos.x < 0 || pos.x > canvasWidth || pos.y < 0 || pos.y > canvasHeight;

                if (isOffScreen) {
                    ball.destroy();
                }
            }
        });
    }

    testBalls() {
        console.log('Testing balls...');

        let ballBodies = this.getBallBodies();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball && ball.size == 5) {
                const pos = ball.getPosition();
                ball.setPosition(pos.x - 2000, pos.y);
            }
        });
    }
}
