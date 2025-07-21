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
        
        // Improve stability
        this.engine.positionIterations = 6;
        this.engine.velocityIterations = 4;
        this.engine.constraintIterations = 2;

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
            let radius;
            if (body.circleRadius !== undefined) {
                radius = body.circleRadius;
            } else {
                // Fallback to bounding box calculation
                radius = (body.bounds.max.x - body.bounds.min.x) / 2;
            }
            
            // Check if this ball is touching other balls to adjust stroke
            const isTouchingOthers = this.isBallTouchingOthers(body);
            
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.fill();
            
            if (ctx.strokeStyle) {
                // Reduce stroke width when touching other balls to minimize visual overlap
                const originalLineWidth = ctx.lineWidth;
                if (isTouchingOthers) {
                    ctx.lineWidth = Math.max(1, originalLineWidth * 0.5);
                }
                ctx.stroke();
                ctx.lineWidth = originalLineWidth;
            }
        }
        
        ctx.restore();
    }

    // Check if a ball is touching other balls
    isBallTouchingOthers(ball) {
        if (ball.isStatic || ball.label !== 'ball') return false;
        
        const bodies = Matter.Composite.allBodies(this.world);
        const ballRadius = ball.circleRadius || ((ball.bounds.max.x - ball.bounds.min.x) / 2);
        
        for (let other of bodies) {
            if (other === ball || other.isStatic || other.label !== 'ball') continue;
            
            const otherRadius = other.circleRadius || ((other.bounds.max.x - other.bounds.min.x) / 2);
            const distance = Math.sqrt(
                Math.pow(ball.position.x - other.position.x, 2) +
                Math.pow(ball.position.y - other.position.y, 2)
            );
            
            // Check if balls are very close (touching + small margin)
            if (distance <= ballRadius + otherRadius + 2) {
                return true;
            }
        }
        
        return false;
    }

    // Method to ensure bodies come to rest (prevent jittering)
    stabilizeBodies() {
        const bodies = Matter.Composite.allBodies(this.world);
        bodies.forEach(body => {
            if (!body.isStatic) {
                const velocity = body.velocity;
                const angularVelocity = body.angularVelocity;
                
                // More aggressive stabilization for jitter reduction
                // Reduce micro-movements that cause visual jittering
                if (Math.abs(velocity.x) < 0.05 && Math.abs(velocity.y) < 0.05 && 
                    Math.abs(angularVelocity) < 0.05) {
                    Matter.Body.setVelocity(body, { x: 0, y: 0 });
                    Matter.Body.setAngularVelocity(body, 0);
                }
                
                // Additional micro-velocity damping for stability
                if (Math.abs(velocity.x) < 0.2 && Math.abs(velocity.y) < 0.2) {
                    Matter.Body.setVelocity(body, {
                        x: velocity.x * 0.95,
                        y: velocity.y * 0.95
                    });
                }
                
                // Micro angular velocity damping
                if (Math.abs(angularVelocity) < 0.1) {
                    Matter.Body.setAngularVelocity(body, angularVelocity * 0.9);
                }
            }
        });
    }

    update(deltaTime) {
        // Update physics engine with frame-rate independent timing
        Matter.Engine.update(this.engine, deltaTime);
        
        // Enforce boundary constraints to prevent wall penetration
        this.enforceBoundaries();
        
        // Call stabilization on each frame
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
                
                // Left wall boundary
                if (pos.x - radius < wallThickness) {
                    newX = wallThickness + radius;
                    corrected = true;
                }
                
                // Right wall boundary  
                if (pos.x + radius > width - wallThickness) {
                    newX = width - wallThickness - radius;
                    corrected = true;
                }
                
                // Floor boundary
                if (pos.y + radius > height - wallThickness) {
                    newY = height - wallThickness - radius;
                    corrected = true;
                }
                
                // Apply correction if needed
                if (corrected) {
                    Matter.Body.setPosition(body, { x: newX, y: newY });
                    // Reduce velocity to prevent bouncing through walls
                    const vel = body.velocity;
                    Matter.Body.setVelocity(body, {
                        x: vel.x * 0.8,
                        y: vel.y * 0.8
                    });
                }
            }
        });
    }
}