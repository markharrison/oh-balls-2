import { SceneBase } from './SceneBase.js';

export class SceneMenu extends SceneBase {
    constructor(canvas, manager) {
        super(manager);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };

        this.selectedOption = 0;
        this.options = ['Start Game', 'Settings'];
    }

    enter() {
        // Called when the scene becomes active
    }

    exit() {
        // Called when the scene is deactivated
    }

    update(dt) {
        // Update timing
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        return null; // No automatic transitions - handled by input
    }

    render(ctx) {
        this.renderScene();
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Menu</strong><br>
            Selected: ${this.options[this.selectedOption]}
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    start() {}

    destroy() {}

    renderScene() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Main Menu';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dark background
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('OH BALLS', this.canvas.width / 2, 200);

        // Menu options
        const startY = 350;
        const lineHeight = 80;

        this.options.forEach((option, index) => {
            const y = startY + index * lineHeight;
            const isSelected = index === this.selectedOption;

            // Highlight selected option
            if (isSelected) {
                this.ctx.fillStyle = '#444444';
                this.ctx.fillRect(this.canvas.width / 2 - 150, y - 30, 300, 60);
            }

            // Option text
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = isSelected ? '#00ff00' : '#cccccc';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(option, this.canvas.width / 2, y);
        });

        // Instructions
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#888888';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('↑ ↓ Navigate • ENTER Select', this.canvas.width / 2, this.canvas.height - 60);
    }

    inputKeyPressed(code, debug) {
        switch (code) {
            case 'ArrowUp':
                this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
                break;
            case 'ArrowDown':
                this.selectedOption = (this.selectedOption + 1) % this.options.length;
                break;
            case 'Enter':
                // Selection is handled by SceneManager
                break;
            default:
                break;
        }
    }
}