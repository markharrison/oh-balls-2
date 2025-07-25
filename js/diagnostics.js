// Diagnostic Panel for debugging physics issues
export class DiagnosticPanel {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.panel = null;

        this.createPanel();
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
            width: 675px;
            height: calc(100vh - 20px);
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
    }

    // Called by main game loop when enabled
    updateFrame() {
        if (this.enabled) {
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const content = document.getElementById('diagnostic-content');
        if (!content) return;

        const gameState = this.game.getGameState();
        const balls = this.game.ballManager.balls;

        // Collect ball data
        const ballData = balls.map((ball) => {
            const velocity = ball.body.velocity;
            const angularVelocity = ball.body.angularVelocity;
            const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
            const position = ball.getPosition();
            const mass = ball.body.mass;
            const verticalDrop = ball.verticalDrop;

            return {
                size: ball.size,
                mass,
                position,
                velocity,
                angularVelocity,
                speed,
                verticalDrop,
            };
        });

        content.innerHTML = `
            <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                <strong>Game State</strong><br>
                Running: ${gameState.running}<br>
                Balls: ${gameState.ballCount}<br>
                Current Ball: ${gameState.currentBall}<br>
                Delta Time: ${gameState.deltaTime.toFixed(2)}ms<br>
                FPS: ${(1000 / gameState.deltaTime).toFixed(1)}
            </div>

            <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                <strong>Ball Details</strong><br>
                ${
                    ballData.length === 0
                        ? 'No balls in scene'
                        : ballData
                              .map(
                                  (ball, i) => `
                    <div style="margin-bottom: 2px; font-size: 11px;">
                      Ball ${i + 1}: Size ${
                                      ball.size
                                  } | Mass ${ball.mass.toFixed(
                                      1
                                  )} | Speed ${ball.speed.toFixed(8)} 
                                  | ${
                                      ball.verticalDrop ? 'V' : ' '
                                  } | Pos (${ball.position.x.toFixed(
                                      0
                                  )},${ball.position.y.toFixed(
                                      0
                                  )}) | Vel (${ball.velocity.x.toFixed(
                                      3
                                  )},${ball.velocity.y.toFixed(
                                      3
                                  )}) ${ball.angularVelocity.toFixed(6)} |
                    </div>
                  `
                              )
                              .join('')
                }
            </div>
        `;
    }

    // Cleanup method
    destroy() {
        if (this.panel) {
            document.body.removeChild(this.panel);
        }
    }
}
