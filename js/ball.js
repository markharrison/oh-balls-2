// Ball Module for creating and managing balls
import { PhysicsBodyFactory, PhysicsConstants, pixelsToMeters } from './physics.js';
import { wallThickness } from './constants.js';

export class Ball {
    constructor(sceneManager, x, y) {
        this.sceneManager = sceneManager;
        this.size = this.generateRandomSize();
        this.radius = this.calculateRadius(this.size);
        this.color = this.getColorForSize(this.size);

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
            density: 1,
            friction: 0.1,
            restitution: 0.8,
            linearDamping: 0.1,
            angularDamping: 0.1,
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
        vHtml += 'Mass:' + mass.toFixed(2) + '&nbsp;';
        vHtml += 'Speed:' + this.physicsBody.speed.toFixed(3) + '&nbsp;';
        const pos = this.physicsBody.getPosition();
        vHtml += 'Pos:' + pos.x.toFixed(0) + ',' + pos.y.toFixed(0) + '&nbsp;';
        const vel = this.physicsBody.getVelocity();
        vHtml += 'Vel:' + vel.x.toFixed(3) + ',' + vel.y.toFixed(3) + '&nbsp;';
        vHtml += 'Ang Vel:' + this.physicsBody.getAngularVelocity().toFixed(3) + '&nbsp;';
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

    // Release ball from static state (when dropped)
    release() {
        this.physicsBody.setStatic(false);
        this.physicsBody.setAngularVelocity(0);
        this.physicsBody.setVelocity(0, 0);

        const pos = this.physicsBody.getPosition();
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
        this.lastCurrentBallPosition = this.sceneManager.canvas.width / 2;
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

    keepXWithinBounds(x, ball) {
        const ballRadius = ball.radius;
        const minX = wallThickness + ballRadius;
        const maxX = this.sceneManager.canvas.width - wallThickness - ballRadius;
        let newX = Math.max(minX, Math.min(maxX, x));
        return newX;
    }

    spawnBall() {
        if (this.currentBall !== null) {
            return;
        }

        if (performance.now() - this.lastDropTime < 1000) {
            return;
        }

        const x = 512;
        const y = -100;

        this.currentBall = new Ball(this.sceneManager, x, y);

        let newX = this.keepXWithinBounds(this.lastCurrentBallPosition, this.currentBall);

        this.currentBall.setPosition(newX, 50);
    }

    dropCurrentBall() {
        if (this.currentBall === null) {
            return;
        }

        this.currentBall.release();
        this.lastDropTime = performance.now();

        this.currentBall = null;
    }

    moveCurrentBall(direction) {
        if (this.currentBall === null) {
            return;
        }

        const currentPos = this.currentBall.getPosition();
        const moveDistance = 5; // Distance to move per frame
        let newX = currentPos.x + direction * moveDistance;

        // Use keepXWithinBounds, which now uses WALL_THICKNESS
        newX = this.keepXWithinBounds(newX, this.currentBall);

        this.currentBall.setPosition(newX, currentPos.y);
        this.lastCurrentBallPosition = newX;
    }

    updateFrame() {
        this.spawnBall();
        this.updateBallStates();
    }

    updateBallStates() {
        let ballBodies = this.getBallBodies();

        // this.stopJittering();

        this.cleanup();
    }

    cleanup() {
        let now = performance.now();
        if (now - this.lastCleanupTime < 15000) {
            return;
        }
        this.lastCleanupTime = now;

        console.log('Cleaning up balls... ' + now);

        //      const canvasWidth = this.sceneManager.canvas.width;
        const canvasHeight = this.sceneManager.canvas.height;

        let ballBodies = this.getBallBodies();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball) {
                const pos = ball.getPosition();
                //               const isOffScreen = pos.x < 0 || pos.x > canvasWidth || pos.y < 0 || pos.y > canvasHeight;
                const isOffScreen = pos.y > canvasHeight + 100; // Allow some space below the canvas

                if (isOffScreen) {
                    ball.destroy();
                }
            }
        });
    }

    testBalls() {

        let ballBodies = this.getBallBodies();
        let sizeZap = generateRandomSize();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball && ball.size == sizeZap) {
                const pos = ball.getPosition();
                ball.setPosition(pos.x - 2000, pos.y);
            }
        });
    }
}
