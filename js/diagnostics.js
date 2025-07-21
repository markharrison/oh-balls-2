// Diagnostic Panel for debugging physics issues
export class DiagnosticPanel {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.panel = null;
        this.collisionEvents = [];
        this.maxCollisionEvents = 50; // Keep last 50 collision events
        this.ballTrackingData = new Map(); // Track ball lifecycle data
        this.velocityClampEvents = []; // Track velocity clamping events
        this.maxVelocityEvents = 20; // Keep last 20 velocity clamp events
        
        this.createPanel();
        this.setupCollisionTracking();
        this.setupVelocityTracking();
        this.setupKeyboardControls();
    }

    createPanel() {
        // Create diagnostic panel HTML
        this.panel = document.createElement('div');
        this.panel.id = 'diagnostic-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 350px;
            height: 500px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border: 2px solid #00ff00;
            border-radius: 5px;
            z-index: 1000;
            overflow-y: auto;
            display: none;
        `;
        
        this.panel.innerHTML = `
            <h3 style="margin-top: 0; color: #00ffff;">🔧 Physics Diagnostics</h3>
            <div id="diagnostic-content"></div>
        `;
        
        document.body.appendChild(this.panel);
    }

    setupCollisionTracking() {
        // Listen for collision events
        Matter.Events.on(this.game.physicsEngine.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                
                // Track ball-to-ball and ball-to-wall collisions
                if (bodyA.label === 'ball' || bodyB.label === 'ball') {
                    const ball = bodyA.label === 'ball' ? bodyA : bodyB;
                    const other = bodyA.label === 'ball' ? bodyB : bodyA;
                    
                    const collisionData = {
                        timestamp: performance.now(),
                        ballPosition: { x: ball.position.x, y: ball.position.y },
                        ballVelocity: { x: ball.velocity.x, y: ball.velocity.y },
                        ballSpeed: Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2),
                        otherType: other.label || 'unknown',
                        impactForce: Math.sqrt(pair.collision.normal.x ** 2 + pair.collision.normal.y ** 2)
                    };
                    
                    this.collisionEvents.unshift(collisionData);
                    if (this.collisionEvents.length > this.maxCollisionEvents) {
                        this.collisionEvents.pop();
                    }
                }
            });
        });
    }

    setupVelocityTracking() {
        // Override console.warn to capture velocity clamping events
        const originalWarn = console.warn;
        console.warn = (...args) => {
            const message = args.join(' ');
            if (message.includes('Ball velocity clamped')) {
                this.velocityClampEvents.unshift({
                    timestamp: performance.now(),
                    message: message
                });
                
                if (this.velocityClampEvents.length > this.maxVelocityEvents) {
                    this.velocityClampEvents.pop();
                }
            }
            
            // Call original warn
            originalWarn.apply(console, args);
        };
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'd') {
                this.toggle();
            }
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        this.panel.style.display = this.enabled ? 'block' : 'none';
        
        if (this.enabled) {
            console.log('Diagnostic panel enabled - tracking physics data');
            this.updateLoop();
        } else {
            console.log('Diagnostic panel disabled');
        }
    }

    updateLoop() {
        if (!this.enabled) return;
        
        this.updateDisplay();
        requestAnimationFrame(() => this.updateLoop());
    }

    updateDisplay() {
        const content = document.getElementById('diagnostic-content');
        if (!content) return;

        const gameState = this.game.getGameState();
        const balls = this.game.ballManager.getAllBalls();
        
        // Collect ball data with velocity tracking
        const ballData = balls.map(ball => {
            const velocity = ball.body.velocity;
            const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
            const position = ball.getPosition();
            const mass = ball.body.mass;
            
            // Track if this ball has extreme velocity
            const isHighVelocity = speed > 15; // Reduced threshold from 20 to 15
            const isOffScreen = position.x < 0 || position.x > 1024 || position.y < 0 || position.y > 800;
            
            return {
                size: ball.size,
                mass,
                position,
                velocity,
                speed,
                isHighVelocity,
                isOffScreen,
                isCurrentBall: ball.isCurrentBall
            };
        });

        // Find balls with concerning properties
        const highVelocityBalls = ballData.filter(b => b.isHighVelocity);
        const offScreenBalls = ballData.filter(b => b.isOffScreen);
        
        // Recent high-impact collisions (extended time window)
        const recentHighImpacts = this.collisionEvents
            .filter(c => performance.now() - c.timestamp < 30000 && c.ballSpeed > 15)
            .slice(0, 10);
            
        // Critical events (very high speed or potential disappearing balls)
        const criticalEvents = this.collisionEvents
            .filter(c => performance.now() - c.timestamp < 60000 && c.ballSpeed > 25)
            .slice(0, 5);
            
        // Recent velocity clamp events
        const recentVelocityClamps = this.velocityClampEvents
            .filter(e => performance.now() - e.timestamp < 30000)
            .slice(0, 10);

        content.innerHTML = `
            <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                <strong>Game State</strong><br>
                Running: ${gameState.running}<br>
                Balls: ${gameState.ballCount}<br>
                Current Ball: ${gameState.currentBall}<br>
                Next Size: ${gameState.nextBallSize}<br>
                Delta Time: ${gameState.deltaTime.toFixed(2)}ms<br>
                FPS: ${(1000 / gameState.deltaTime).toFixed(1)}
            </div>

            <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                <strong>🚨 Alert Status</strong><br>
                <span style="color: ${highVelocityBalls.length > 0 ? '#ff4444' : '#44ff44'}">
                    High Velocity Balls: ${highVelocityBalls.length}
                </span><br>
                <span style="color: ${offScreenBalls.length > 0 ? '#ff4444' : '#44ff44'}">
                    Off-Screen Balls: ${offScreenBalls.length}
                </span><br>
                <span style="color: ${recentHighImpacts.length > 0 ? '#ff8844' : '#44ff44'}">
                    Recent High Impacts: ${recentHighImpacts.length}
                </span><br>
                <span style="color: ${criticalEvents.length > 0 ? '#ff0000' : '#44ff44'}">
                    Critical Events: ${criticalEvents.length}
                </span><br>
                <span style="color: ${recentVelocityClamps.length > 0 ? '#ff8844' : '#44ff44'}">
                    Velocity Clamps: ${recentVelocityClamps.length}
                </span>
            </div>

            <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                <strong>Ball Details</strong><br>
                ${ballData.length === 0 ? 'No balls in scene' : 
                  ballData.map((ball, i) => `
                    <div style="margin-bottom: 5px; ${ball.isHighVelocity ? 'color: #ff4444' : ''}">
                      Ball ${i + 1} ${ball.isCurrentBall ? '(CURRENT)' : ''}<br>
                      • Size: ${ball.size} | Mass: ${ball.mass.toFixed(1)} | Speed: ${ball.speed.toFixed(1)}<br>
                      • Pos: (${ball.position.x.toFixed(0)}, ${ball.position.y.toFixed(0)})<br>
                      • Vel: (${ball.velocity.x.toFixed(3)}, ${ball.velocity.y.toFixed(3)})
                      ${ball.isHighVelocity ? ' ⚠️ HIGH SPEED' : ''}
                      ${ball.isOffScreen ? ' 🔴 OFF-SCREEN' : ''}
                    </div>
                  `).join('')}
            </div>

            <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                <strong>🚨 Critical Events (60s)</strong><br>
                ${criticalEvents.length === 0 ? 'No critical high-speed events' :
                  criticalEvents.map(collision => `
                    <div style="font-size: 11px; margin-bottom: 3px; color: #ff4444;">
                      ${((performance.now() - collision.timestamp) / 1000).toFixed(1)}s ago:<br>
                      CRITICAL Speed: ${collision.ballSpeed.toFixed(3)} | vs ${collision.otherType}<br>
                      Pos: (${collision.ballPosition.x.toFixed(0)}, ${collision.ballPosition.y.toFixed(0)})<br>
                      Vel: (${collision.ballVelocity.x.toFixed(3)}, ${collision.ballVelocity.y.toFixed(3)})
                    </div>
                  `).join('')}
            </div>

            <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                <strong>Recent High-Impact Collisions (30s)</strong><br>
                ${recentHighImpacts.length === 0 ? 'None in last 30 seconds' :
                  recentHighImpacts.map(collision => `
                    <div style="font-size: 11px; margin-bottom: 3px;">
                      ${((performance.now() - collision.timestamp) / 1000).toFixed(1)}s ago:<br>
                      Speed: ${collision.ballSpeed.toFixed(3)} | vs ${collision.otherType}<br>
                      Pos: (${collision.ballPosition.x.toFixed(0)}, ${collision.ballPosition.y.toFixed(0)})<br>
                      Vel: (${collision.ballVelocity.x.toFixed(3)}, ${collision.ballVelocity.y.toFixed(3)})
                    </div>
                  `).join('')}
            </div>

            <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                <strong>⚠️ Velocity Clamp Events (30s)</strong><br>
                ${recentVelocityClamps.length === 0 ? 'No velocity clamping needed' :
                  recentVelocityClamps.map(event => `
                    <div style="font-size: 11px; margin-bottom: 3px; color: #ff8844;">
                      ${((performance.now() - event.timestamp) / 1000).toFixed(1)}s ago:<br>
                      ${event.message}
                    </div>
                  `).join('')}
            </div>

            <div style="font-size: 10px; color: #888888;">
                Press 'D' to toggle this panel<br>
                Critical events (speed >25) kept for 60s | High impacts (speed >15) kept for 30s<br>
                Velocity automatically clamped at 20 to prevent ball disappearance<br>
                Mass scaling: linear (not cubic) to reduce collision imbalance | Restitution: 0.7<br>
                Auto-dampening applied to speeds >15 | 3s grace period for off-screen balls
            </div>
        `;
    }

    // Method to add custom tracking data
    trackBallLifecycle(ballId, event, data = {}) {
        if (!this.ballTrackingData.has(ballId)) {
            this.ballTrackingData.set(ballId, []);
        }
        
        this.ballTrackingData.get(ballId).push({
            timestamp: performance.now(),
            event,
            data
        });
    }

    // Cleanup method
    destroy() {
        if (this.panel) {
            document.body.removeChild(this.panel);
        }
        
        // Remove event listeners
        Matter.Events.off(this.game.physicsEngine.engine, 'collisionStart');
    }
}