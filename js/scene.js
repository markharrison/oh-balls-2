// Scene Manager Module using Matter.js
export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        this.render = null;

        this.engine.world.gravity.y = 0.8;
        this.engine.timing.timeScale = 1;

        this.setupBoundaries();

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Ball-ground collision events
        this.setupEventsBallGroundCollision();

        // Ball-ball collision events to track vertical drop state
        this.setupEventsBallBallCollision();
    }

    setupEventsBallBallCollision() {
        // Handle ball-ball collisions to set verticalDrop to false
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
    }

    setupEventsBallGroundCollision() {
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
                    ball.ballInstance.keepOnVerticalDrop();
                }
            });
        });
    }

    // Event handlers for ball-ground collisions
    // onBallGroundCollisionStart(ball, ground, pair) {
    //     // Calculate speed manually to compare with Matter.js speed property
    //     const manualSpeed = Math.sqrt(
    //         ball.velocity.x * ball.velocity.x +
    //             ball.velocity.y * ball.velocity.y
    //     );

    //     console.log('Ball-Ground Collision START:', {
    //         ballId: ball.id,
    //         ballPosition: { x: ball.position.x, y: ball.position.y },
    //         ballVelocity: { x: ball.velocity.x, y: ball.velocity.y },
    //         ballSpeed_Matter: ball.speed,
    //         ballSpeed_Manual: manualSpeed,
    //         ballSpeed_PreCollision: ball.preCollisionSpeed || 'N/A',
    //         ballSpeed_Difference: Math.abs(ball.speed - manualSpeed),
    //         ballAngularVelocity: ball.angularVelocity,
    //         // Additional debugging info
    //         collisionNormal: pair.collision ? pair.collision.normal : 'N/A',
    //         separationDistance: pair.separation || 'N/A',
    //         // Collision timing analysis
    //         restitution: ground.restitution,
    //         friction: ground.friction,
    //         ballMass: ball.mass,
    //         // Check previous velocity using positionPrev if available
    //         previousPosition: ball.positionPrev
    //             ? { x: ball.positionPrev.x, y: ball.positionPrev.y }
    //             : 'N/A',
    //     });

    //     // Test: Check speed again after a tiny delay to see if it updates
    //     setTimeout(() => {
    //         const delayedManualSpeed = Math.sqrt(
    //             ball.velocity.x * ball.velocity.x +
    //                 ball.velocity.y * ball.velocity.y
    //         );
    //         console.log('  -> POST-COLLISION (1ms later):', {
    //             ballSpeed_Matter: ball.speed,
    //             ballSpeed_Manual: delayedManualSpeed,
    //             ballVelocity: { x: ball.velocity.x, y: ball.velocity.y },
    //         });
    //     }, 1);

    // You can add custom logic here for when collision begins
    // For example: play sound, create particles, apply special forces, etc.
    //}

    //nBallGroundCollisionActive(ball, ground, pair) {
    // This fires continuously while the ball is touching the ground
    // Useful for ongoing effects like friction modifications or continuous forces
    // Uncomment to see continuous collision data (warning: lots of console output)
    // console.log('Ball-Ground Collision ACTIVE:', {
    //     ballId: ball.id,
    //     ballSpeed: ball.speed,
    //     penetration: pair.separation // How much the objects are overlapping
    // });
    //}

    // onBallGroundCollisionEnd(ball, ground, pair) {
    //     console.log('Ball-Ground Collision END:', {
    //         ballId: ball.id,
    //         ballPosition: { x: ball.position.x, y: ball.position.y },
    //         ballVelocity: { x: ball.velocity.x, y: ball.velocity.y },
    //         ballSpeed: ball.speed,
    //         ballAngularVelocity: ball.angularVelocity,
    //     });

    // You can add custom logic here for when collision ends
    // For example: stop sound effects, clean up particles, record bounce count, etc.
    //}

    // handleMassImbalancedCollisions() {
    //     // Apply additional dampening to balls that have extreme velocity due to mass imbalance
    //     // const bodies = Matter.Composite.allBodies(this.world);
    //     // bodies.forEach(body => {
    //     //     if (body.label === 'ball' && !body.isStatic) {
    //     //         const velocity = body.velocity;
    //     //         const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    //     //         // If a ball is moving very fast, apply additional dampening
    //     //         // This helps prevent small balls from being launched into orbit by large balls
    //     //         // Increased threshold from 15 to 18 to allow more natural bouncing
    //     //         if (speed > 18) {
    //     //             const dampeningFactor = 0.9; // Reduce velocity by 10%
    //     //             Matter.Body.setVelocity(body, {
    //     //                 x: velocity.x * dampeningFactor,
    //     //                 y: velocity.y * dampeningFactor
    //     //             });
    //     //         }
    //     //     }
    //     // });
    // }

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
        // Physics engine started
    }

    stop() {
        // No runner to stop since we're using manual engine updates
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

    renderScene() {
        // Clear canvas
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

    updateFrame(deltaTime) {
        // Ensure deltaTime is within Matter.js recommended bounds (≤ 16.667ms for 60fps)
        const clampedDelta = Math.min(Math.max(deltaTime, 8), 16.0); // Keep safely under 16.667ms

        // Use smaller time steps for higher precision physics simulation
        // Instead of one large step, use multiple smaller steps
        const targetStepSize = 8.0; // Smaller steps for better precision
        const steps = Math.ceil(clampedDelta / targetStepSize);
        const actualStepSize = clampedDelta / steps;

        // Update physics engine with multiple smaller steps
        for (let i = 0; i < steps; i++) {
            Matter.Engine.update(this.engine, actualStepSize);
            // Apply jittering fix after each physics step to be more aggressive

        }

        //this.clampVelocities();

        this.renderScene();
    }



    // clampVelocities() {
    //     // Maximum velocity to prevent balls from moving so fast they disappear
    //     const maxVelocity = 20; // Reduced from 30 to 20 to better contain small balls
    //     const maxVelocitySquared = maxVelocity * maxVelocity;

    //     // Minimum velocity threshold - set very small velocities to zero to prevent oscillation
    //     const restThreshold = 0.01; // If velocity components are smaller than this, set to zero
    //     const restThresholdSquared = restThreshold * restThreshold;

    //     const bodies = Matter.Composite.allBodies(this.world);

    //     bodies.forEach((body) => {
    //         // Only clamp ball velocities, not static walls
    //         if (body.label === 'ball' && !body.isStatic) {
    //             const velocity = body.velocity;
    //             const velocityMagnitudeSquared =
    //                 velocity.x * velocity.x + velocity.y * velocity.y;

    //             // If velocity is very small, set to zero to prevent micro-oscillations
    //             if (
    //                 velocityMagnitudeSquared > 0 &&
    //                 velocityMagnitudeSquared < restThresholdSquared
    //             ) {
    //                 Matter.Body.setVelocity(body, { x: 0, y: 0 });
    //             }

    //             // Only dampen angular velocity if the ball is also at rest (very low linear velocity)
    //             // This allows natural spinning from ball interactions while eliminating micro-oscillations
    //             const angularVelocity = body.angularVelocity;
    //             if (
    //                 Math.abs(angularVelocity) > 0 &&
    //                 Math.abs(angularVelocity) < restThreshold &&
    //                 velocityMagnitudeSquared < restThresholdSquared
    //             ) {
    //                 Matter.Body.setAngularVelocity(body, 0);
    //             }
    //             // If velocity exceeds maximum, scale it down
    //             else if (velocityMagnitudeSquared > maxVelocitySquared) {
    //                 const velocityMagnitude = Math.sqrt(
    //                     velocityMagnitudeSquared
    //                 );
    //                 const scale = maxVelocity / velocityMagnitude;

    //                 // Scale down velocity to maximum allowed
    //                 Matter.Body.setVelocity(body, {
    //                     x: velocity.x * scale,
    //                     y: velocity.y * scale,
    //                 });
    //             }
    //         }
    //     });
    // }
}
