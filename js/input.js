// Input Handling Module
export class InputHandler {
    constructor(ballManager) {
        this.ballManager = ballManager;
        this.keys = {
            left: false,
            right: false,
            drop: false
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });

        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });

        // Prevent default behavior for arrow keys to avoid page scrolling
        document.addEventListener('keydown', (event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space'].includes(event.code)) {
                event.preventDefault();
            }
        });
    }

    handleKeyDown(event) {
        switch (event.code) {
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'ArrowDown':
            case 'Space':
                this.keys.drop = true;
                this.dropBall();
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.code) {
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'ArrowDown':
            case 'Space':
                this.keys.drop = false;
                break;
        }
    }

    dropBall() {
        // Drop the current ball
        this.ballManager.dropCurrentBall();
    }

    update() {
        // Process continuous input (called every frame)
        if (this.keys.left) {
            this.ballManager.moveCurrentBall(-1); // Move left
        }
        
        if (this.keys.right) {
            this.ballManager.moveCurrentBall(1); // Move right
        }
    }

    // Method to get current input state
    getInputState() {
        return {
            left: this.keys.left,
            right: this.keys.right,
            drop: this.keys.drop
        };
    }

    // Cleanup method
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}