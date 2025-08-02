import { BallManager } from './ball.js';
import { PhysicsEngine, PhysicsBodyFactory, PhysicsUtils, metersToPixels } from './physics.js';
import { wallThickness } from './constants.js';
import { fixedTimeStep } from './constants.js';

export class SceneBallsX {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;
        this.diagnosticsPanel = null;

        this.ballManager = new BallManager(this);

        this.physics = new PhysicsEngine().create();
        this.physics.setGravity(0, 300); // Gentler gravity for relaxed gameplay
        this.physics.setTimeScale(1);

        // Set world reference in factory
        PhysicsBodyFactory.setWorld(this.physics.world);

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
            lastStatsUpdate: 0,
            cachedDeltaTime: 0,
            cachedFPS: 0,
            stepCount: 0,
            cachedStepCount: 0,
        };

        this.setupBoundaries();
        this.setupEventHandlers();

        // Initialize accumulator for fixed timestep physics
        this._physicsAccumulator = 0;
    }

    registerDiagnosticsPanel(diagnosticsPanel) {
        this.diagnosticsPanel = diagnosticsPanel;
    }

    registerInputHandler(inputHandler) {
        this.inputHandler = inputHandler;
        this.inputHandler.registerSceneManager(this);
    }

    getSceneStateHtml() {
        const now = performance.now();
        const timeDiff = now - this.clock.lastStatsUpdate;
        if (timeDiff > 500) {
            this.clock.cachedDeltaTime = this.clock.deltaTime.toFixed(2);
            this.clock.cachedFPS = (1000 / this.clock.deltaTime).toFixed(1);
            this.clock.cachedStepCount = ((this.clock.stepCount * 1000) / timeDiff).toFixed(1);
            this.clock.stepCount = 0;
            this.clock.lastStatsUpdate = now;
        }
        const vHtml = `
            <strong>Scene: BallsX</strong><br>
            Delta Time: ${this.clock.cachedDeltaTime}ms,&nbsp;
            FPS: ${this.clock.cachedFPS},&nbsp;
            StepsPS: ${this.clock.cachedStepCount}<br>
        `;
        return vHtml;
    }

    setupEventHandlers() {
        this.physics.on('collisionStart', (event) => {
            // const collisionPairs = PhysicsUtils.getCollisionPairs(event);
            // collisionPairs.forEach(({ bodyA, bodyB }) => {
            //     // Check for ball-ball collisions
            //     const ballBodyA = bodyA.label === 'ball' ? bodyA : null;
            //     const ballBodyB = bodyB.label === 'ball' ? bodyB : null;
            //     // if (ballBodyA && ballBodyB) {
            //     //     const ballA = ballBodyA.getUserData().ball;
            //     //     const ballB = ballBodyB.getUserData().ball;
            //     // }
            // });
        });

        this.physics.on('collisionEnd', (event) => {
            // const ballGroundCollisions = PhysicsUtils.findCollisionByLabels(event, 'ball', 'ground');
            // ballGroundCollisions.forEach(({ bodyA, bodyB }) => {
            //     const ball = bodyA.label === 'ball' ? bodyA : bodyB;
            // });
        });
    }

    setupBoundaries() {
        // Use shared wallThickness constant
        const width = this.canvas.width;
        const height = this.canvas.height;
        const restitution = 0.7;
        const friction = 0.5;

        const renderGround = {
            fillStyle: '#00ffff',
            strokeStyle: '#ffffff',
            lineWidth: 3,
            width: width,
            height: wallThickness,
        };

        const ground = PhysicsBodyFactory.createRectangle(width / 2, height - wallThickness / 2, width, wallThickness, {
            isStatic: true,
            friction: friction,
            restitution: restitution,
            userData: {
                label: 'ground',
                render: renderGround,
            },
        });

        const renderWall = {
            fillStyle: '#00ffff',
            strokeStyle: '#ffffff',
            lineWidth: 3,
            width: wallThickness,
            height: height,
        };

        const leftWall = PhysicsBodyFactory.createRectangle(wallThickness / 2, height / 2, wallThickness, height, {
            isStatic: true,
            friction: friction,
            restitution: restitution,
            userData: {
                label: 'leftwall',
                render: renderWall,
            },
        });

        const rightWall = PhysicsBodyFactory.createRectangle(width - wallThickness / 2, height / 2, wallThickness, height, {
            isStatic: true,
            friction: friction,
            restitution: restitution,
            userData: {
                label: 'rightwall',
                render: renderWall,
            },
        });

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

    renderWallOrFloor(body) {
        const ctx = this.ctx;

        // Convert position from meters to pixels for rendering
        const meterPosition = body.getPosition();
        const position = {
            x: metersToPixels(meterPosition.x),
            y: metersToPixels(meterPosition.y),
        };
        const angle = body.getAngle();

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        let render = body.getUserData().render;

        ctx.fillStyle = render.fillStyle;
        ctx.strokeStyle = render.strokeStyle;
        ctx.lineWidth = render.lineWidth;

        const width = render.width;
        const height = render.height;

        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.strokeRect(-width / 2, -height / 2, width, height);

        ctx.restore();
    }

    renderBall(body) {
        const ctx = this.ctx;

        // Convert position from meters to pixels for rendering
        const meterPosition = body.getPosition();
        const position = {
            x: metersToPixels(meterPosition.x),
            y: metersToPixels(meterPosition.y),
        };
        const angle = body.getAngle();

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        let render = body.getUserData().render;

        ctx.fillStyle = render.fillStyle;
        ctx.strokeStyle = render.strokeStyle;
        ctx.lineWidth = render.lineWidth;

        let physicsRadius = render.radius;

        // Adjust rendering radius so stroke doesn't extend beyond physics boundary
        const strokeWidth = ctx.lineWidth || 0;
        const renderRadius = physicsRadius - strokeWidth / 2;

        if (renderRadius > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, renderRadius, 0, 6.28);
            ctx.fill();

            if (ctx.strokeStyle && strokeWidth > 0) {
                ctx.stroke();
            }

            if (render.showNumber) {
                ctx.save();

                const fontSize = Math.max(24, renderRadius * 0.8);
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeText(render.size.toString(), 0, 0);

                ctx.fillText(render.size.toString(), 0, 0);

                ctx.restore();
            }
        }

        ctx.restore();
    }

    updatePhysics(deltaTime) {
        // Fixed timestep accumulator pattern
        this._physicsAccumulator += deltaTime;

        while (this._physicsAccumulator >= fixedTimeStep) {
            this.physics.update(fixedTimeStep);
            this._physicsAccumulator -= fixedTimeStep;
            this.clock.stepCount++;
        }

        this.clock.stepTime = fixedTimeStep;
    }

    renderScene() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Get all bodies and render them
        const bodies = this.physics.getAllBodies();

        bodies.forEach((body) => {
            switch (body.getUserData().label) {
                case 'leftwall':
                case 'rightwall':
                case 'ground':
                    this.renderWallOrFloor(body);
                    break;
                default:
                    this.renderBall(body);
                    break;
            }
        });
    }

    inputKeyPressed(code) {
        switch (code) {
            case 'ArrowLeft':
                this.ballManager.moveCurrentBall(-1);
                break;
            case 'ArrowRight':
                this.ballManager.moveCurrentBall(1);
                break;
            case 'ArrowDown':
            case 'Space':
                this.ballManager.dropCurrentBall();
                break;
            case 'KeyT':
                if (this.diagnosticsPanel.enabled) {
                    this.ballManager.testBalls();
                }
                break;
            default:
                break;
        }
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

        this.diagnosticsPanel.renderPanel();
    }
}
