import { SceneBase } from './screenmanager.js';

export class SceneSettings extends SceneBase {
    constructor(canvas, manager) {
        super(manager);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };

        // Sample configuration options
        this.config = {
            soundEnabled: true,
            difficulty: 'Medium',
            graphics: 'High',
        };

        this.selectedOption = 0;
        this.options = ['Sound', 'Difficulty', 'Graphics', 'Back'];
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
            <strong>Scene: Settings</strong><br>
            Sound: ${this.config.soundEnabled ? 'On' : 'Off'}<br>
            Difficulty: ${this.config.difficulty}<br>
            Graphics: ${this.config.graphics}
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    start() {}

    destroy() {}

    renderScene() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Settings';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dark background
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('SETTINGS', this.canvas.width / 2, 120);

        // Configuration options
        const startY = 220;
        const lineHeight = 80;

        this.options.forEach((option, index) => {
            const y = startY + index * lineHeight;
            const isSelected = index === this.selectedOption;

            // Highlight selected option
            if (isSelected) {
                this.ctx.fillStyle = '#444444';
                this.ctx.fillRect(this.canvas.width / 2 - 200, y - 30, 400, 60);
            }

            // Option text
            this.ctx.font = '32px Arial';
            this.ctx.fillStyle = isSelected ? '#00ff00' : '#cccccc';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(option + ':', this.canvas.width / 2 - 180, y);

            // Value text
            this.ctx.textAlign = 'right';
            let value = '';
            switch (option) {
                case 'Sound':
                    value = this.config.soundEnabled ? 'ON' : 'OFF';
                    break;
                case 'Difficulty':
                    value = this.config.difficulty;
                    break;
                case 'Graphics':
                    value = this.config.graphics;
                    break;
                case 'Back':
                    value = '';
                    break;
            }
            if (value) {
                this.ctx.fillText(value, this.canvas.width / 2 + 180, y);
            }
        });

        // Instructions
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#888888';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('↑ ↓ Navigate • ENTER Select • ESC Back', this.canvas.width / 2, this.canvas.height - 60);
    }

    toggleCurrentOption() {
        switch (this.selectedOption) {
            case 0: // Sound
                this.config.soundEnabled = !this.config.soundEnabled;
                break;
            case 1: // Difficulty
                const difficulties = ['Easy', 'Medium', 'Hard'];
                const currentIndex = difficulties.indexOf(this.config.difficulty);
                this.config.difficulty = difficulties[(currentIndex + 1) % difficulties.length];
                break;
            case 2: // Graphics
                const graphics = ['Low', 'Medium', 'High'];
                const currentGraphicsIndex = graphics.indexOf(this.config.graphics);
                this.config.graphics = graphics[(currentGraphicsIndex + 1) % graphics.length];
                break;
            case 3: // Back
                // Return to previous scene - handled by SceneManager
                break;
        }
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
                this.toggleCurrentOption();
                break;
            case 'Escape':
                // Return to previous scene - handled by SceneManager
                break;
            default:
                break;
        }
    }
}