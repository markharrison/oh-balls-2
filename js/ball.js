// Ball Module for creating and managing balls
export class Ball {
    constructor(physicsEngine, x, y, size) {
        this.physicsEngine = physicsEngine;
        this.size = size;
        this.radius = this.calculateRadius(size);
        this.mass = this.calculateMass(size);
        this.color = this.getColorForSize(size);
        
        // Create Matter.js body for the ball
        this.body = Matter.Bodies.circle(x, y, this.radius, {
            density: this.mass / (Math.PI * this.radius * this.radius), // Density = mass/area
            friction: 0.3,
            frictionAir: 0.01, // Air resistance to help with stability
            restitution: 0.7, // Bounciness with energy loss
            render: {
                fillStyle: this.color,
                strokeStyle: '#ffffff',
                lineWidth: 3,
                visible: true
            },
            label: 'ball'
        });

        // Add to physics world
        this.physicsEngine.addBody(this.body);
    }

    calculateRadius(size) {
        // Size 1 = radius 15, size 15 = radius 60
        return 15 + (size - 1) * 3;
    }

    calculateMass(size) {
        // Mass proportional to size - cubic relationship for realistic physics
        return size * size * size * 0.1;
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

    setVelocity(x, y) {
        Matter.Body.setVelocity(this.body, { x, y });
    }

    applyForce(x, y) {
        Matter.Body.applyForce(this.body, this.body.position, { x, y });
    }

    destroy() {
        this.physicsEngine.removeBody(this.body);
    }

    // Check if ball is at rest (for determining when to spawn next ball)
    isAtRest() {
        const velocity = this.body.velocity;
        const angularVelocity = this.body.angularVelocity;
        
        return Math.abs(velocity.x) < 0.1 && 
               Math.abs(velocity.y) < 0.1 && 
               Math.abs(angularVelocity) < 0.1;
    }
}

export class BallManager {
    constructor(physicsEngine) {
        this.physicsEngine = physicsEngine;
        this.balls = [];
        this.currentBall = null; // Ball being controlled by player
        this.nextBallSize = this.generateRandomSize();
    }

    generateRandomSize() {
        // Random size from 1 to 5 as specified
        return Math.floor(Math.random() * 5) + 1;
    }

    spawnBall() {
        if (this.currentBall) {
            return; // Already have a ball being controlled
        }

        const x = 512; // Center of canvas (1024/2)
        const y = 50;  // Near top
        
        this.currentBall = new Ball(this.physicsEngine, x, y, this.nextBallSize);
        this.balls.push(this.currentBall);
        
        // Generate next ball size
        this.nextBallSize = this.generateRandomSize();
        
        // Update UI
        this.updateUI();
    }

    dropCurrentBall() {
        if (this.currentBall) {
            // Release the ball from player control
            this.currentBall = null;
            
            // Schedule next ball spawn after current ball settles
            setTimeout(() => {
                this.checkForNextSpawn();
            }, 2000);
        }
    }

    checkForNextSpawn() {
        // Check if all balls are at rest
        let allAtRest = true;
        for (let ball of this.balls) {
            if (!ball.isAtRest()) {
                allAtRest = false;
                break;
            }
        }

        if (allAtRest && !this.currentBall) {
            this.spawnBall();
        } else {
            // Check again in a bit
            setTimeout(() => {
                this.checkForNextSpawn();
            }, 500);
        }
    }

    moveCurrentBall(direction) {
        if (!this.currentBall) return;

        const moveForce = 0.002;
        const maxSpeed = 5;
        
        // Apply horizontal force
        let forceX = direction * moveForce;
        
        // Limit horizontal speed
        if (Math.abs(this.currentBall.body.velocity.x) < maxSpeed) {
            this.currentBall.applyForce(forceX, 0);
        }
    }

    updateUI() {
        const ballInfoElement = document.getElementById('currentBallSize');
        if (ballInfoElement) {
            ballInfoElement.textContent = `Next Ball: Size ${this.nextBallSize}`;
        }
    }

    getAllBalls() {
        return this.balls;
    }

    cleanup() {
        // Remove balls that have fallen off screen or other cleanup
        this.balls = this.balls.filter(ball => {
            if (ball.getPosition().y > 800) { // Below canvas
                ball.destroy();
                return false;
            }
            return true;
        });
    }
}