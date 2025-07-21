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
        this.engine.world.gravity.y = 0.8; // Realistic gravity
        this.engine.timing.timeScale = 1; // Normal time scale
        
        // Improve stability for complex stacks with many balls
        this.engine.positionIterations = 10; // Increased for better position resolution
        this.engine.velocityIterations = 8;  // Increased for better velocity resolution
        this.engine.constraintIterations = 4; // Increased for better constraint resolution
        
        // Enable sleeping for better performance and stability
        this.engine.enableSleeping = true;

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



    // Simplified stabilization - only for very settled balls
    stabilizeBodies() {
        const bodies = Matter.Composite.allBodies(this.world);
        bodies.forEach(body => {
            if (!body.isStatic && body.label === 'ball') {
                const velocity = body.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                // Only stabilize balls that are barely moving and have been settled for a while
                if (speed < 0.01 && Math.abs(body.angularVelocity) < 0.01) {
                    // Check if ball is resting on ground or other balls
                    const groundLevel = 768 - 17; // canvas height - wall thickness
                    const ballRadius = body.circleRadius || 20;
                    
                    if (body.position.y > groundLevel - ballRadius - 5) {
                        // Ball is on ground and barely moving - safe to stop
                        Matter.Body.setVelocity(body, { x: 0, y: 0 });
                        Matter.Body.setAngularVelocity(body, 0);
                    }
                }
            }
        });
    }


    update(deltaTime) {
        // Ensure deltaTime is within Matter.js recommended bounds (≤ 16.667ms for 60fps)
        const clampedDelta = Math.min(Math.max(deltaTime, 8), 16.0); // Keep safely under 16.667ms
        
        // Update physics engine with frame-rate independent timing
        Matter.Engine.update(this.engine, clampedDelta);
        
        // Enforce boundary constraints to prevent wall penetration
        this.enforceBoundaries();
        
        // Call simplified stabilization to prevent jittering
        this.stabilizeBodies();
        
        // Render the scene
        this.renderScene();
    }
    

    // Enforce boundaries to prevent balls from escaping through walls
    enforceBoundaries() {
        const wallThickness = 17;
        const width = 1024;
        const height = 768;
        
        const bodies = Matter.Composite.allBodies(this.world);
        bodies.forEach(body => {
            if (!body.isStatic && body.label === 'ball') {
                const pos = body.position;
                const radius = body.circleRadius || 20; // Use actual radius or fallback
                
                let corrected = false;
                let newX = pos.x;
                let newY = pos.y;
                
                // Only correct if significantly outside bounds to avoid micro-corrections
                const tolerance = 2; // Small tolerance to prevent constant corrections
                
                // Left wall boundary
                if (pos.x - radius < wallThickness - tolerance) {
                    newX = wallThickness + radius;
                    corrected = true;
                }
                
                // Right wall boundary  
                if (pos.x + radius > width - wallThickness + tolerance) {
                    newX = width - wallThickness - radius;
                    corrected = true;
                }
                
                // Floor boundary
                if (pos.y + radius > height - wallThickness + tolerance) {
                    newY = height - wallThickness - radius;
                    corrected = true;
                }
                
                // Apply correction if needed, but be gentler
                if (corrected) {
                    Matter.Body.setPosition(body, { x: newX, y: newY });
                    // Reduce velocity more aggressively to prevent energy addition
                    const vel = body.velocity;
                    Matter.Body.setVelocity(body, {
                        x: vel.x * 0.5, // More aggressive velocity reduction
                        y: vel.y * 0.5
                    });
                    
                    // Force the body to sleep if it was corrected
                    if (Math.sqrt(vel.x * vel.x + vel.y * vel.y) < 0.1) {
                        Matter.Sleeping.set(body, true);
                    }
                }
            }
        });
    }
}