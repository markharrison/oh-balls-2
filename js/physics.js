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
        
        // Apply velocity clamping to prevent runaway speeds that cause ball disappearance
        this.clampVelocities();
        
        // Render the scene
        this.renderScene();
    }

    clampVelocities() {
        // Maximum velocity to prevent balls from moving so fast they disappear
        const maxVelocity = 30; // Reduced from unlimited to prevent disappearing balls
        const maxVelocitySquared = maxVelocity * maxVelocity;
        
        const bodies = Matter.Composite.allBodies(this.world);
        
        bodies.forEach(body => {
            // Only clamp ball velocities, not static walls
            if (body.label === 'ball' && !body.isStatic) {
                const velocity = body.velocity;
                const velocityMagnitudeSquared = velocity.x * velocity.x + velocity.y * velocity.y;
                
                // If velocity exceeds maximum, scale it down
                if (velocityMagnitudeSquared > maxVelocitySquared) {
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