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
        
        // Enhanced physics settings for stability and collision accuracy
        this.engine.velocityIterations = 8; // More iterations for better collision resolution
        this.engine.positionIterations = 6; // Better position solving
        this.engine.enableSleeping = true; // Enable sleeping for better performance
        this.engine.constraintIterations = 4; // Better constraint resolution

        this.setupBoundaries();
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
            restitution: 1.0,
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
            restitution: 1.0,
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
            restitution: 1.0,
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
                ctx.arc(0, 0, renderRadius, 0, 2 * Math.PI);
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
        
        // Update physics engine with frame-rate independent timing
        Matter.Engine.update(this.engine, clampedDelta);
        
        // Apply physics stabilization to prevent tunneling and jittering
        this.stabilizePhysics();
        
        // Render the scene
        this.renderScene();
    }

    stabilizePhysics() {
        const bodies = Matter.Composite.allBodies(this.world);
        const maxVelocity = 15; // Maximum velocity to prevent tunneling
        const sleepThreshold = 0.1; // Velocity threshold for sleep
        const positionThreshold = 0.05; // Position stability threshold
        
        bodies.forEach(body => {
            // Skip static bodies (walls, ground)
            if (body.isStatic) return;
            
            // Prevent tunneling: Limit maximum velocity
            const velocity = body.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            if (speed > maxVelocity) {
                const scale = maxVelocity / speed;
                Matter.Body.setVelocity(body, {
                    x: velocity.x * scale,
                    y: velocity.y * scale
                });
            }
            
            // Enhanced jitter elimination
            const angularSpeed = Math.abs(body.angularVelocity);
            
            // More aggressive sleep conditions
            if (speed < sleepThreshold && angularSpeed < 0.01) {
                // Check for micro-movements by comparing position stability
                if (!body._lastPosition) {
                    body._lastPosition = { x: body.position.x, y: body.position.y };
                    body._positionStableFrames = 0;
                } else {
                    const positionDelta = Math.sqrt(
                        Math.pow(body.position.x - body._lastPosition.x, 2) +
                        Math.pow(body.position.y - body._lastPosition.y, 2)
                    );
                    
                    if (positionDelta < positionThreshold) {
                        body._positionStableFrames++;
                        
                        // If position stable for multiple frames, force sleep
                        if (body._positionStableFrames > 10) {
                            Matter.Sleeping.set(body, true);
                            Matter.Body.setVelocity(body, { x: 0, y: 0 });
                            Matter.Body.setAngularVelocity(body, 0);
                        }
                    } else {
                        body._positionStableFrames = 0;
                    }
                    
                    body._lastPosition = { x: body.position.x, y: body.position.y };
                }
            } else {
                // Reset stability tracking if moving significantly
                body._positionStableFrames = 0;
            }
            
            // Boundary enforcement to catch any tunneling attempts
            this.enforceBoundaries(body);
        });
    }

    enforceBoundaries(body) {
        const wallThickness = 17;
        const width = 1024;
        const height = 768;
        const radius = body.circleRadius || (body.bounds.max.x - body.bounds.min.x) / 2;
        
        let position = body.position;
        let corrected = false;
        
        // Left wall
        if (position.x - radius < wallThickness) {
            position.x = wallThickness + radius;
            corrected = true;
        }
        
        // Right wall  
        if (position.x + radius > width - wallThickness) {
            position.x = width - wallThickness - radius;
            corrected = true;
        }
        
        // Ground
        if (position.y + radius > height - wallThickness) {
            position.y = height - wallThickness - radius;
            corrected = true;
        }
        
        // If position was corrected, update body and dampen velocity
        if (corrected) {
            Matter.Body.setPosition(body, position);
            // Significantly reduce velocity to prevent bouncing back out
            Matter.Body.setVelocity(body, {
                x: body.velocity.x * 0.5,
                y: body.velocity.y * 0.5
            });
        }
    }
}