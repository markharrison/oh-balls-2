import { BallManager } from './ball.js';
import { InputHandler } from './input.js';
import { DiagnosticPanel } from './diagnostics.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        this.render = null;

        this.engine.world.gravity.y = 0.8;
        this.engine.timing.timeScale = 1;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };

        this.ballManager = new BallManager(this);
        this.inputHandler = new InputHandler(this.ballManager);
        this.diagnostics = new DiagnosticPanel(this);

        this.setupBoundaries();

        this.setupEventHandlers();
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene State</strong><br>
            Balls: ${this.ballManager.balls.length}<br>
            Delta Time: ${this.clock.deltaTime.toFixed(2)}ms<br>
            FPS: ${(1000 / this.clock.deltaTime).toFixed(1)}<br>
        `;
        return vHtml;
    }

    setupEventHandlers() {
        // Ball-ground collision events
        // this.setupEventsBallGroundCollision();

        // // Ball-ball collision events to track vertical drop state
        // this.setupEventsBallBallCollision();

        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check for ball-ball collisions
                const ballA = bodyA.label === 'ball' ? bodyA : null;
                const ballB = bodyB.label === 'ball' ? bodyB : null;

                if (ballA && ballB) {
                    ballA.ballInstance.verticalDrop = false;
                    ballB.ballInstance.verticalDrop = false;
                }
            });
        });

        Matter.Events.on(this.engine, 'collisionEnd', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check for ball-ground collisions
                const ball =
                    bodyA.label === 'ball'
                        ? bodyA
                        : bodyB.label === 'ball'
                        ? bodyB
                        : null;
                const ground =
                    bodyA.label === 'ground'
                        ? bodyA
                        : bodyB.label === 'ground'
                        ? bodyB
                        : null;

                if (ball && ground) {
                    //                   ball.ballInstance.keepOnVerticalDrop();
                }
            });
        });
    }

    setupBoundaries() {
        const wallThickness = 16;
        const width = 1024;
        const height = 768;

        // Create walls (floor, left, right) - no ceiling to allow ball dropping
        const ground = Matter.Bodies.rectangle(
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

        const leftWall = Matter.Bodies.rectangle(
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

        const rightWall = Matter.Bodies.rectangle(
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

        Matter.World.add(this.world, [ground, leftWall, rightWall]);
    }

    start() {
        this.ballManager.start();
    }

    stop() {}

    destroy() {
        this.ballManager = null;
        this.inputHandler = null;
        this.diagnostics = null;
    }

    addBody(body) {
        Matter.World.add(this.world, body);
    }

    removeBody(body) {
        Matter.World.remove(this.world, body);
    }

    // Custom rendering method

    renderBody(body) {
        const ctx = this.ctx;
        const position = body.position;
        const angle = body.angle;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        if (body.render.fillStyle) {
            ctx.fillStyle = body.render.fillStyle;
        }

        if (body.render.strokeStyle) {
            ctx.strokeStyle = body.render.strokeStyle;
            ctx.lineWidth = body.render.lineWidth || 1;
        }

        // Render based on body type
        if (
            (body.label && body.label.includes('Wall')) ||
            body.label === 'ground'
        ) {
            // Render rectangle
            const width = body.bounds.max.x - body.bounds.min.x;
            const height = body.bounds.max.y - body.bounds.min.y;

            ctx.fillRect(-width / 2, -height / 2, width, height);
            if (ctx.strokeStyle) {
                ctx.strokeRect(-width / 2, -height / 2, width, height);
            }
        } else {
            // Render circle (ball)
            // Use the actual physics body radius from the circle shape
            let physicsRadius;
            if (body.circleRadius !== undefined) {
                physicsRadius = body.circleRadius;
            } else {
                // Fallback to bounding box calculation
                physicsRadius = (body.bounds.max.x - body.bounds.min.x) / 2;
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

        for (let i = 0; i < steps; i++) {
            Matter.Engine.update(this.engine, stepTime);
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
        const bodies = Matter.Composite.allBodies(this.world);

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
