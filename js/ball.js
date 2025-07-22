// Ball Module for creating and managing balls
export class Ball {
    constructor(physicsEngine, x, y, size, isCurrentBall = false) {
        this.physicsEngine = physicsEngine;
        this.size = size;
        this.radius = this.calculateRadius(size);
        this.mass = this.calculateMass(size);
        this.color = this.getColorForSize(size);
        this.isCurrentBall = isCurrentBall;
        
        // Create Matter.js body for the ball
        this.body = Matter.Bodies.circle(x, y, this.radius, {
            density: this.mass / (Math.PI * this.radius * this.radius), // Density = mass/area
            friction: 0.2, // Reduced from 0.4 to 0.2 for better ball-to-ball bouncing
            frictionAir: 0.005,
            restitution: 0.85, // Increased from 0.7 to 0.85 for better ball-to-ball bouncing
            render: {
                fillStyle: this.color,
                strokeStyle: '#ffffff',
                lineWidth: 3,
                visible: true
            },
            label: 'ball'
        });

        // Ensure ball starts with zero angular velocity (no spin)
        Matter.Body.setAngularVelocity(this.body, 0);

        // Store the radius and size directly on the body for accurate rendering and debugging
        this.body.circleRadius = this.radius;
        this.body.ballSize = this.size;

        // If this is the current ball, make it static (not affected by gravity)
        if (this.isCurrentBall) {
            Matter.Body.setStatic(this.body, true);
        }

        // Add to physics world
        this.physicsEngine.addBody(this.body);
    }

    calculateRadius(size) {
        // Size 1 = radius 15, size 15 = radius 60
        return 15 + (size - 1) * 3;
    }

    calculateMass(size) {
        // Use simple integer scaling to avoid floating-point precision issues
        // Size 1: mass 1, Size 2: mass 2, Size 3: mass 3, Size 4: mass 4, Size 5: mass 5
        // This eliminates the complex square root calculations that were causing physics inconsistencies
        return size;
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
            '#c0ff00'  // Yellow-green
        ];
        
        return colors[(size - 1) % colors.length];
    }

    getPosition() {
        return {
            x: this.body.position.x,
            y: this.body.position.y
        };
    }

    setPosition(x, y) {
        Matter.Body.setPosition(this.body, { x, y });
    }

    applyForce(x, y) {
        Matter.Body.applyForce(this.body, this.body.position, { x, y });
    }

    // Release ball from static state (when dropped)
    release() {
        if (this.isCurrentBall) {
            console.log('Releasing ball from static state');
            console.log(`   Pre-release position: (${this.body.position.x.toFixed(3)}, ${this.body.position.y.toFixed(3)})`);
            console.log(`   Pre-release velocity: (${this.body.velocity.x.toFixed(6)}, ${this.body.velocity.y.toFixed(6)})`);
            
            Matter.Body.setStatic(this.body, false);
            // Ensure ball has no angular velocity when released (no spin)
            Matter.Body.setAngularVelocity(this.body, 0);
            
            // CRITICAL: Ensure ball has zero horizontal velocity when released
            Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
            
            this.isCurrentBall = false;
            
            console.log(`   Post-release velocity: (${this.body.velocity.x.toFixed(6)}, ${this.body.velocity.y.toFixed(6)})`);
            console.log('Ball released and should now fall straight down');
        }
    }

    destroy() {
        this.physicsEngine.removeBody(this.body);
    }
}

export class BallManager {
    constructor(physicsEngine) {
        this.physicsEngine = physicsEngine;
        this.balls = [];
        this.currentBall = null; // Ball being controlled by player
        this.nextBallSize = this.generateRandomSize();
        this.lastDropTime = 0; // Track when last ball was dropped
        this.nextSpawnTime = 0; // When next ball should spawn
        this.gameState = 'ready'; // 'ready', 'dropping', 'waiting'
        this.offScreenBalls = new Map(); // Track balls that went off-screen with timestamps
    }

    generateRandomSize() {
        // Random size from 1 to 5 as specified
        return Math.floor(Math.random() * 5) + 1;
    }

    spawnBall() {
        // Don't spawn if we already have a current ball
        if (this.currentBall) {
            console.log('Cannot spawn - current ball already exists');
            return;
        }
        
        // Don't spawn if we're still waiting
        if (this.gameState === 'waiting' && performance.now() < this.nextSpawnTime) {
            console.log('Cannot spawn - still waiting for spawn time');
            return;
        }
        
        console.log(`Spawning new ball with size ${this.nextBallSize}`);
        
        const x = 512; // Center of canvas (1024/2)
        const y = 50;  // Near top
        
        this.currentBall = new Ball(this.physicsEngine, x, y, this.nextBallSize, true);
        this.balls.push(this.currentBall);
        
        // Generate next ball size for UI display
        this.nextBallSize = this.generateRandomSize();
        
        // Set state to ready
        this.gameState = 'ready';
        
        // Update UI
        this.updateUI();
        
        console.log(`Ball spawned successfully. Ready to drop.`);
    }

    dropCurrentBall() {
        if (!this.currentBall) {
            console.log('No current ball to drop');
            return;
        }

        if (this.gameState !== 'ready') {
            console.log('Cannot drop - not in ready state');
            return;
        }

        console.log('Dropping current ball');
        
        // Release the ball from static state so gravity affects it
        this.currentBall.release();
        
        // Track when this ball was dropped
        this.lastDropTime = performance.now();
        this.nextSpawnTime = this.lastDropTime + 2000; // 2 seconds from now
        
        // Release the ball from player control
        this.currentBall = null;
        
        // Set state to waiting
        this.gameState = 'waiting';
        
        // Update UI to show waiting state
        this.updateUI();
        
        console.log('Ball dropped successfully. Next ball in 2 seconds.');
    }

    moveCurrentBall(direction) {
        if (!this.currentBall) return;

        // Only allow movement of the current (static) ball - once dropped, only physics should affect it
        if (this.currentBall.isCurrentBall) {
            const currentPos = this.currentBall.getPosition();
            const moveDistance = 5; // Distance to move per frame
            let newX = currentPos.x + (direction * moveDistance);
            
            // Keep within bounds (accounting for ball radius)
            const ballRadius = this.currentBall.radius;
            const wallThickness = 17; // Updated wall thickness
            const minX = wallThickness + ballRadius;
            const maxX = 1024 - wallThickness - ballRadius;
            
            newX = Math.max(minX, Math.min(maxX, newX));
            
            this.currentBall.setPosition(newX, currentPos.y);
        }
        // No else block - dropped balls should only be affected by gravity and collisions
    }

    updateUI() {
        const ballInfoElement = document.getElementById('currentBallSize');
        if (ballInfoElement) {
            if (this.currentBall) {
                ballInfoElement.textContent = `Current Ball: Size ${this.currentBall.size}`;
            } else if (this.gameState === 'waiting') {
                const timeLeft = Math.max(0, this.nextSpawnTime - performance.now());
                const secondsLeft = Math.ceil(timeLeft / 1000);
                ballInfoElement.textContent = `Waiting ${secondsLeft}s... Next Ball: Size ${this.nextBallSize}`;
            } else {
                ballInfoElement.textContent = `Next Ball: Size ${this.nextBallSize}`;
            }
        }
    }

    // Called every frame to check if we should spawn a new ball
    update() {
        // Check if we should spawn a new ball
        if (this.gameState === 'waiting' && !this.currentBall && performance.now() >= this.nextSpawnTime) {
            this.spawnBall();
        }
    }

    getAllBalls() {
        return this.balls;
    }

    cleanup() {
        const now = performance.now();
        const gracePeriod = 3000; // 3 seconds grace period for off-screen balls
        const canvasWidth = 1024;
        const canvasHeight = 768;
        const maxOffScreenDistance = 200; // Allow balls to go this far off-screen before removal
        
        // Remove balls that have been off-screen too long or are too far away
        this.balls = this.balls.filter(ball => {
            const pos = ball.getPosition();
            const isOffScreen = pos.y > canvasHeight + maxOffScreenDistance || 
                               pos.x < -maxOffScreenDistance || 
                               pos.x > canvasWidth + maxOffScreenDistance ||
                               pos.y < -maxOffScreenDistance;
            
            if (isOffScreen) {
                // Track when this ball first went off-screen
                if (!this.offScreenBalls.has(ball)) {
                    this.offScreenBalls.set(ball, now);
                    console.log(`Ball went off-screen at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}), starting grace period`);
                    return true; // Keep the ball for now
                }
                
                // Check if grace period has expired
                const offScreenTime = now - this.offScreenBalls.get(ball);
                if (offScreenTime > gracePeriod) {
                    console.log(`Ball removed after ${(offScreenTime/1000).toFixed(1)}s off-screen at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
                    this.offScreenBalls.delete(ball);
                    ball.destroy();
                    return false;
                }
                
                return true; // Still within grace period
            } else {
                // Ball is back on screen, remove from off-screen tracking
                if (this.offScreenBalls.has(ball)) {
                    console.log(`Ball returned to screen at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
                    this.offScreenBalls.delete(ball);
                }
                return true;
            }
        });
    }
}