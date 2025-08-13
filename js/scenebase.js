export class SceneBase {
    constructor(manager) {
        this.manager = manager; // Optional: reference to SceneManager if needed
    }

    enter() {
        // Called when the scene becomes active
    }

    exit() {
        // Called when the scene is deactivated
    }

    update(dt) {
        // Called every tick; return string (scene key) to request transition
        // Return null/undefined to stay in this scene
        return null;
    }

    render(ctx) {
        // Render to canvas/context/etc.
    }
}