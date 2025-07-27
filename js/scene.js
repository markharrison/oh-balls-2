import { BallManager } from './ball.js';
import { InputHandler } from './input.js';
import { DiagnosticPanel } from './diagnostics.js';
import { PhysicsEngine, PhysicsBodyFactory, PhysicsUtils } from './physics.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Initialize physics engine
        this.physics = new PhysicsEngine().create();
        this.physics.setGravity(0, 0.8);
        this.physics.setTimeScale(1);

        this.clock = {
            deltaTime: 0,
            stepTime: 0,
            steps: 0,
            currentTime: 0,
            lastStatsUpdate: 0,
            cachedStepTime: 0,
            cachedSteps: 0,
            cachedDeltaTime: 0,
            cachedFPS: 0,
        };

        this.ballManager = new BallManager(this);
        this.inputHandler = new InputHandler(this.ballManager);
        this.diagnostics = new DiagnosticPanel(this);

        this.setupBoundaries();
        this.setupEventHandlers();
    }

    getSceneStateHtml() {
        const now = performance.now();
        if (now - this.clock.lastStatsUpdate > 500) {
            this.clock.cachedDeltaTime = this.clock.deltaTime;
            this.clock.cachedFPS = 1000 / this.clock.deltaTime;
            this.clock.cachedStepTime = this.clock.stepTime;
            this.clock.cachedSteps = this.clock.steps;
            this.clock.lastStatsUpdate = now;
        }
        const vHtml = `
            <strong>Scene State</strong><br>
            Balls: ${this.ballManager.getBallBodies().length}<br>
            Delta Time: ${this.clock.cachedDeltaTime.toFixed(2)}ms,&nbsp;
            Step Time: ${this.clock.cachedStepTime.toFixed(2)}ms x ${this.clock.cachedSteps},&nbsp;
            FPS: ${this.clock.cachedFPS.toFixed(1)}<br>
        `;
        return vHtml;
    }

    setupEventHandlers() {
        this.physics.on('collisionStart', (event) => {
            const collisionPairs = PhysicsUtils.getCollisionPairs(event);
            
            collisionPairs.forEach(({ bodyA, bodyB }) => {
                // Check for ball-ball collisions
                const ballA = bodyA.label === 'ball' ? bodyA : null;
                const ballB = bodyB.label === 'ball' ? bodyB : null;

                if (ballA && ballB) {
                    ballA.customProperties.ballInstance.verticalDrop = false;
                    ballB.customProperties.ballInstance.verticalDrop = false;
                }
            });
        });

        this.physics.on('collisionEnd', (event) => {
            const ballGroundCollisions = PhysicsUtils.findCollisionByLabels(event, 'ball', 'ground');
            
            ballGroundCollisions.forEach(({ bodyA, bodyB }) => {
                const ball = bodyA.label === 'ball' ? bodyA : bodyB;
                // ball.customProperties.ballInstance.keepOnVerticalDrop();
            });
        });
    }

    setupBoundaries() {
        const wallThickness = 16;
        const width = 1024;
        const height = 768;

        // Create walls (floor, left, right) - no ceiling to allow ball dropping
        const ground = PhysicsBodyFactory.createRectangle(
            width / 2, 
            height - wallThickness / 2, 
            width, 
            wallThickness, 
            {
                isStatic: true,
                render: {
                    fillStyle: '#00ffff',
                    strokeStyle: '#ffffff',
                    lineWidth: 3,
                },
                friction: 0.3,
                restitution: 1.3, // Significantly increased for more bouncy floor collisions
                label: 'ground',
            }
        );

        const leftWall = PhysicsBodyFactory.createRectangle(
            wallThickness / 2, 
            height / 2, 
            wallThickness, 
            height, 
            {
                isStatic: true,
                render: {
                    fillStyle: '#00ffff',
                    strokeStyle: '#ffffff',
                    lineWidth: 3,
                },
                friction: 0.3,
                restitution: 1.1, // Increased for more bouncy wall collisions
                label: 'leftWall',
            }
        );

        const rightWall = PhysicsBodyFactory.createRectangle(
            width - wallThickness / 2, 
            height / 2, 
            wallThickness, 
            height, 
            {
                isStatic: true,
                render: {
                    fillStyle: '#00ffff',
                    strokeStyle: '#ffffff',
                    lineWidth: 3,
                },
                friction: 0.3,
                restitution: 1.1, // Increased for more bouncy wall collisions
                label: 'rightWall',
            }
        );

        this.physics.addBody(ground);
        this.physics.addBody(leftWall);
        this.physics.addBody(rightWall);
    }

    start() {
        this.ballManager.start();
    }

    stop() {}

    destroy() {
        this.ballManager = null;
        this.inputHandler = null;
        this.diagnostics = null;
        if (this.physics) {
            this.physics.destroy();
            this.physics = null;
        }
    }

    addBody(body) {
        this.physics.addBody(body);
    }

    removeBody(body) {
        this.physics.removeBody(body);
    }

    // Custom rendering method

    renderBody(body) {
        const ctx = this.ctx;
        // Handle both PhysicsBody wrapper and raw MatterJS body
        const physicsBody = body.body ? body.body : body;
        const position = physicsBody.position;
        const angle = physicsBody.angle;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        if (physicsBody.render.fillStyle) {
            ctx.fillStyle = physicsBody.render.fillStyle;
        }

        if (physicsBody.render.strokeStyle) {
            ctx.strokeStyle = physicsBody.render.strokeStyle;
            ctx.lineWidth = physicsBody.render.lineWidth || 1;
        }

        // Render based on body type
        if ((physicsBody.label && physicsBody.label.includes('Wall')) || physicsBody.label === 'ground') {
            // Render rectangle
            const width = physicsBody.bounds.max.x - physicsBody.bounds.min.x;
            const height = physicsBody.bounds.max.y - physicsBody.bounds.min.y;

            ctx.fillRect(-width / 2, -height / 2, width, height);
            if (ctx.strokeStyle) {
                ctx.strokeRect(-width / 2, -height / 2, width, height);
            }
        } else {
            // Render circle (ball)
            // Use the actual physics body radius from the circle shape
            let physicsRadius;
            if (physicsBody.circleRadius !== undefined) {
                physicsRadius = physicsBody.circleRadius;
            } else {
                // Fallback to bounding box calculation
                physicsRadius = (physicsBody.bounds.max.x - physicsBody.bounds.min.x) / 2;
            }

            // Adjust rendering radius so stroke doesn't extend beyond physics boundary
            const strokeWidth = ctx.lineWidth || 0;
            const renderRadius = physicsRadius - strokeWidth / 2;

            if (renderRadius > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, renderRadius, 0, 6.28); // Use 6.28 instead of 2 * Math.PI for simplicity
                ctx.fill();

                if (ctx.strokeStyle && strokeWidth > 0) {
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }

    updatePhysics(deltaTime) {
        const targetStepSize = 8.0;
        const steps = Math.ceil(deltaTime / targetStepSize);
        const stepTime = Math.min(deltaTime / steps, 16.667);

        this.clock.stepTime = stepTime;
        this.clock.steps = steps;

        for (let i = 0; i < steps; i++) {
            this.physics.update(stepTime);
        }
    }

    renderScene() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = `Current Ball: Size xxx`;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Fill background
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Get all bodies and render them
        const bodies = this.physics.getAllBodies();

        bodies.forEach((body) => {
            this.renderBody(body);
        });
    }

    updateFrame() {
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.inputHandler.getInput();

        this.updatePhysics(this.clock.deltaTime);

        this.ballManager.updateFrame();

        this.renderScene();

        this.diagnostics.updateFrame();
    }
}
