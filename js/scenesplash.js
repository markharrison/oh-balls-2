export class SceneSplash {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };

        this.startTime = performance.now();
        this.displayDuration = 5000; // 5 seconds
        this.hasTransitioned = false;
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Splash</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    start() {}

    destroy() {}

    renderScene() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Splash Screen';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dark blue gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Main title
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('OH BALLS', this.canvas.width / 2, this.canvas.height / 2 - 100);

        // Subtitle
        this.ctx.font = '32px Arial';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText('Physics Game', this.canvas.width / 2, this.canvas.height / 2 - 40);

        // Loading message
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#999999';
        this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    inputKeyPressed(code, debug) {
        // No manual input handling - auto-transition after 5 seconds
    }

    shouldTransition() {
        return performance.now() - this.startTime >= this.displayDuration && !this.hasTransitioned;
    }

    markTransitioned() {
        this.hasTransitioned = true;
    }

    updateFrame() {
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.renderScene();
    }
}