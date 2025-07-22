// Physics Engine Module using Matter.js
export class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Don't use Matter.js renderer, we'll render manually
        this.render = null;

        // Set up physics properties for stable simulation
        this.engine.world.gravity.y = 0.8;
        this.engine.timing.timeScale = 1;
        
        // Use default engine precision - positionIterations: 6, velocityIterations: 4
        // (Engine precision improvements didn't fix the ball radius-specific bounce issues)

        this.setupBoundaries();
        this.setupCollisionDampening();
    }

    setupCollisionDampening() {
        // Add collision event handling for mass-imbalanced collisions
        Matter.Events.on(this.engine, 'afterUpdate', () => {
            this.handleMassImbalancedCollisions();
        });
        
        // Track ground collisions and fix unwanted angular velocity for straight drops
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                
                // Check for ball-ground collisions
                const ball = bodyA.label === 'ball' ? bodyA : (bodyB.label === 'ball' ? bodyB : null);
                const ground = bodyA.label === 'ground' ? bodyA : (bodyB.label === 'ground' ? bodyB : null);
                
                if (ball && ground) {
                    // VERTICAL COLLISION DETECTION
                    const velocity = ball.velocity;
                    const horizontalSpeed = Math.abs(velocity.x);
                    const verticalSpeed = Math.abs(velocity.y);
                    
                    // Detect if this should be a "vertical" collision based on initial drop conditions
                    // If horizontal speed is much smaller than vertical speed, this should be purely vertical
                    const isVerticalCollision = horizontalSpeed < Math.max(1.0, verticalSpeed * 0.1);
                    
                    if (isVerticalCollision) {
                        console.log(`🔧 VERTICAL COLLISION DETECTED: Zeroing horizontal velocity ${velocity.x.toFixed(6)} (h-speed: ${horizontalSpeed.toFixed(3)}, v-speed: ${verticalSpeed.toFixed(3)})`);
                        Matter.Body.setVelocity(ball, { x: 0, y: velocity.y });
                    }
                    
                    // Capture detailed state before collision
                    const preAngularVel = ball.angularVelocity;
                    const position = ball.position;
                    const ballRadius = ball.circleRadius || ((ball.bounds.max.x - ball.bounds.min.x) / 2);
                    const ballSize = ball.ballSize || 'unknown'; // Track ball size if available
                    const ballMass = ball.mass;
                    
                    // Schedule to check angular velocity and horizontal movement after collision is processed
                    setTimeout(() => {
                        const postAngularVel = ball.angularVelocity;
                        const postVelocity = ball.velocity;
                        const preHorizontalSpeed = Math.abs(velocity.x);
                        const verticalSpeed = Math.abs(velocity.y);
                        const postHorizontalSpeed = Math.abs(postVelocity.x);
                        
                        // VERTICAL COLLISION POST-PROCESSING
                        // If this was identified as a vertical collision, ensure the post-collision velocity is also vertical
                        if (isVerticalCollision) {
                            if (Math.abs(postVelocity.x) > 0.001) {
                                console.log(`🔧 POST-COLLISION VERTICAL CLEANUP: Forcing purely vertical bounce (was ${postVelocity.x.toFixed(6)}, ${postVelocity.y.toFixed(3)})`);
                                Matter.Body.setVelocity(ball, { x: 0, y: postVelocity.y });
                            }
                            
                            // Also ensure no angular velocity for vertical bounces
                            if (Math.abs(postAngularVel) > 0.001) {
                                console.log(`🔧 POST-COLLISION ANGULAR CLEANUP: Zeroing angular velocity for vertical bounce (was ${postAngularVel.toFixed(6)})`);
                                Matter.Body.setAngularVelocity(ball, 0);
                            }
                        }
                        
                        // Always log ground collisions to understand the size bias
                        console.log(`🟡 Ground Collision Analysis:`);
                        console.log(`   Ball: size=${ballSize} mass=${ballMass.toFixed(2)} radius=${ballRadius.toFixed(1)}`);
                        console.log(`   Pre-collision: pos(${position.x.toFixed(1)}, ${position.y.toFixed(1)}) vel(${velocity.x.toFixed(6)}, ${velocity.y.toFixed(3)})`);
                        console.log(`   Post-collision: vel(${postVelocity.x.toFixed(6)}, ${postVelocity.y.toFixed(3)})`);
                        console.log(`   Angular: ${preAngularVel.toFixed(6)} -> ${postAngularVel.toFixed(6)} (${postAngularVel > 0 ? 'CCW' : 'CW'})`);
                        console.log(`   H-Speed: ${preHorizontalSpeed.toFixed(6)} -> ${postHorizontalSpeed.toFixed(6)}`);
                        
                        // SPECIAL FOCUS: Check for leftward bias in larger balls
                        if (preHorizontalSpeed < 0.001 && Math.abs(postVelocity.x) > 0.001) {
                            console.log(`   🔍 LEFTWARD BIAS DETECTED:`);
                            console.log(`      Initial H-velocity: ${velocity.x.toFixed(6)} (essentially zero)`);
                            console.log(`      Post H-velocity: ${postVelocity.x.toFixed(6)} (${postVelocity.x < 0 ? 'LEFT' : 'RIGHT'})`);
                            console.log(`      Ball size: ${ballSize} (${ballSize <= 2 ? 'SMALL' : 'LARGE'})`);
                            console.log(`      Expected: Ball should bounce straight up, not sideways!`);
                        }
                        
                        // Check for unwanted angular velocity generation
                        if (Math.abs(postAngularVel) > 0.001) {
                            let analysis = '';
                            let shouldCancelSpin = false;
                            
                            if (preHorizontalSpeed < 0.001) {
                                analysis = 'ZERO pre-collision horizontal velocity - should not cause spin! (numerical precision issue)';
                                shouldCancelSpin = true;
                            } else if (preHorizontalSpeed < 0.8) {
                                // Small horizontal velocity likely caused by numerical precision errors in straight drops
                                analysis = `Tiny horizontal velocity (${velocity.x.toFixed(6)}) likely from numerical precision - canceling unwanted spin`;
                                shouldCancelSpin = true;
                            } else {
                                analysis = `Horizontal velocity (${velocity.x.toFixed(3)}) causing expected spin`;
                            }
                            
                            console.log(`   Analysis: ${analysis}`);
                            
                            // Cancel unwanted angular velocity for essentially straight drops
                            if (shouldCancelSpin) {
                                Matter.Body.setAngularVelocity(ball, 0);
                                console.log(`   🔧 Action: Angular velocity reset to 0 (was ${postAngularVel.toFixed(6)})`);
                            }
                        }
                        
                        // Check for unwanted horizontal velocity generation
                        if (preHorizontalSpeed < 0.001 && postHorizontalSpeed > 0.1) {
                            console.log(`   ⚠️ ISSUE: Ball went from zero horizontal velocity to ${postHorizontalSpeed.toFixed(3)} - this causes leftward bias!`);
                            console.log(`   🔧 Action: Zeroing unwanted horizontal velocity`);
                            Matter.Body.setVelocity(ball, { x: 0, y: postVelocity.y });
                        }
                    }, 1);
                }
            });
        });
    }

    handleMassImbalancedCollisions() {
        // Apply additional dampening to balls that have extreme velocity due to mass imbalance
        const bodies = Matter.Composite.allBodies(this.world);
        
        bodies.forEach(body => {
            if (body.label === 'ball' && !body.isStatic) {
                const velocity = body.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                // If a ball is moving very fast, apply additional dampening
                // This helps prevent small balls from being launched into orbit by large balls
                // Increased threshold from 15 to 18 to allow more natural bouncing
                if (speed > 18) {
                    const dampeningFactor = 0.9; // Reduce velocity by 10%
                    Matter.Body.setVelocity(body, {
                        x: velocity.x * dampeningFactor,
                        y: velocity.y * dampeningFactor
                    });
                }
            }
        });
    }

    setupBoundaries() {
        const wallThickness = 17; // Reduced from 50 to about 1/3 (50/3 ≈ 17)
        const width = 1024;
        const height = 768;

        // Create walls (floor, left, right) - no ceiling to allow ball dropping
        const ground = Matter.Bodies.rectangle(width / 2, height - wallThickness / 2, width, wallThickness, {
            isStatic: true,
            render: {
                fillStyle: '#00ffff',
                strokeStyle: '#ffffff',
                lineWidth: 3
            },
            friction: 0.3,
            restitution: 0.7, // Reduced from 1.0 to 0.7 to prevent energy accumulation
            label: 'ground'
        });

        const leftWall = Matter.Bodies.rectangle(wallThickness / 2, height / 2, wallThickness, height, {
            isStatic: true,
            render: {
                fillStyle: '#00ffff',
                strokeStyle: '#ffffff',
                lineWidth: 3
            },
            friction: 0.3,
            restitution: 0.7, // Reduced from 1.0 to 0.7 to prevent energy accumulation
            label: 'leftWall'
        });

        const rightWall = Matter.Bodies.rectangle(width - wallThickness / 2, height / 2, wallThickness, height, {
            isStatic: true,
            render: {
                fillStyle: '#00ffff',
                strokeStyle: '#ffffff',
                lineWidth: 3
            },
            friction: 0.3,
            restitution: 0.7, // Reduced from 1.0 to 0.7 to prevent energy accumulation
            label: 'rightWall'
        });

        Matter.World.add(this.world, [ground, leftWall, rightWall]);
    }

    start() {
        console.log('Physics engine started');
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
    renderScene() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill background
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get all bodies and render them
        const bodies = Matter.Composite.allBodies(this.world);
        
        bodies.forEach(body => {
            this.renderBody(body);
        });
    }

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
        if (body.label && body.label.includes('Wall') || body.label === 'ground') {
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

    update(deltaTime) {
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
        }
        
        // Apply velocity clamping to prevent runaway speeds that cause ball disappearance
        this.clampVelocities();
        
        // Render the scene
        this.renderScene();
    }

    clampVelocities() {
        // Maximum velocity to prevent balls from moving so fast they disappear
        const maxVelocity = 20; // Reduced from 30 to 20 to better contain small balls
        const maxVelocitySquared = maxVelocity * maxVelocity;
        
        // Minimum velocity threshold - set very small velocities to zero to prevent oscillation
        const restThreshold = 0.01; // If velocity components are smaller than this, set to zero
        const restThresholdSquared = restThreshold * restThreshold;
        
        const bodies = Matter.Composite.allBodies(this.world);
        
        bodies.forEach(body => {
            // Only clamp ball velocities, not static walls
            if (body.label === 'ball' && !body.isStatic) {
                const velocity = body.velocity;
                const velocityMagnitudeSquared = velocity.x * velocity.x + velocity.y * velocity.y;
                
                // If velocity is very small, set to zero to prevent micro-oscillations
                if (velocityMagnitudeSquared > 0 && velocityMagnitudeSquared < restThresholdSquared) {
                    Matter.Body.setVelocity(body, { x: 0, y: 0 });
                    // Only log this very occasionally to avoid spam (gravity constantly reactivates resting balls)
                    if (Math.random() < 0.001) { // Log ~0.1% of rest dampening events
                        console.log(`Ball velocity set to rest (was ${Math.sqrt(velocityMagnitudeSquared).toFixed(4)}) - Note: Events repeat due to gravity/physics forces`);
                    }
                }
                
                // Only dampen angular velocity if the ball is also at rest (very low linear velocity)
                // This allows natural spinning from ball interactions while eliminating micro-oscillations
                const angularVelocity = body.angularVelocity;
                if (Math.abs(angularVelocity) > 0 && Math.abs(angularVelocity) < restThreshold && velocityMagnitudeSquared < restThresholdSquared) {
                    Matter.Body.setAngularVelocity(body, 0);
                    // Only log this very occasionally to avoid spam
                    if (Math.random() < 0.001) { // Log ~0.1% of angular rest dampening events
                        console.log(`Ball angular velocity set to rest (was ${angularVelocity.toFixed(4)}) - Only when ball is also at linear rest`);
                    }
                }
                // If velocity exceeds maximum, scale it down
                else if (velocityMagnitudeSquared > maxVelocitySquared) {
                    const velocityMagnitude = Math.sqrt(velocityMagnitudeSquared);
                    const scale = maxVelocity / velocityMagnitude;
                    
                    // Scale down velocity to maximum allowed
                    Matter.Body.setVelocity(body, {
                        x: velocity.x * scale,
                        y: velocity.y * scale
                    });
                    
                    console.warn(`Ball velocity clamped from ${velocityMagnitude.toFixed(1)} to ${maxVelocity}`);
                }
            }
        });
    }
}