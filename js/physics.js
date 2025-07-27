// Physics Engine Abstraction Layer
// This module provides a generic physics interface that wraps MatterJS
// Making it easy to swap physics engines in the future

export class PhysicsEngine {
    constructor() {
        this.engine = null;
        this.world = null;
        this.eventHandlers = new Map();
    }

    // Initialize the physics engine
    create() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        return this;
    }

    // Set gravity
    setGravity(x, y) {
        this.engine.world.gravity.x = x;
        this.engine.world.gravity.y = y;
    }

    // Set time scale
    setTimeScale(scale) {
        this.engine.timing.timeScale = scale;
    }

    // Update physics simulation
    update(deltaTime) {
        Matter.Engine.update(this.engine, deltaTime);
    }

    // Add body to world
    addBody(body) {
        Matter.World.add(this.world, body.body || body);
    }

    // Remove body from world
    removeBody(body) {
        Matter.World.remove(this.world, body.body || body);
    }

    // Get all bodies from world
    getAllBodies() {
        return Matter.Composite.allBodies(this.world);
    }

    // Get bodies by label
    getBodiesByLabel(label) {
        return this.world.bodies.filter(body => body.label === label);
    }

    // Event handling
    on(eventType, callback) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(callback);
        
        // Set up MatterJS event listener
        Matter.Events.on(this.engine, eventType, callback);
    }

    // Remove event handler
    off(eventType, callback) {
        if (this.eventHandlers.has(eventType)) {
            const handlers = this.eventHandlers.get(eventType);
            const index = handlers.indexOf(callback);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
        Matter.Events.off(this.engine, eventType, callback);
    }

    // Cleanup
    destroy() {
        if (this.engine) {
            // Remove all event handlers
            this.eventHandlers.forEach((handlers, eventType) => {
                handlers.forEach(handler => {
                    Matter.Events.off(this.engine, eventType, handler);
                });
            });
            this.eventHandlers.clear();
            
            this.engine = null;
            this.world = null;
        }
    }
}

export class PhysicsBody {
    constructor(body) {
        this.body = body;
    }

    // Position methods
    getPosition() {
        return {
            x: this.body.position.x,
            y: this.body.position.y
        };
    }

    setPosition(x, y) {
        Matter.Body.setPosition(this.body, { x, y });
    }

    // Velocity methods
    getVelocity() {
        return {
            x: this.body.velocity.x,
            y: this.body.velocity.y
        };
    }

    setVelocity(x, y) {
        Matter.Body.setVelocity(this.body, { x, y });
    }

    // Angular velocity methods
    getAngularVelocity() {
        return this.body.angularVelocity;
    }

    setAngularVelocity(velocity) {
        Matter.Body.setAngularVelocity(this.body, velocity);
    }

    // Static state methods
    setStatic(isStatic) {
        Matter.Body.setStatic(this.body, isStatic);
    }

    isStatic() {
        return this.body.isStatic;
    }

    // Force application
    applyForce(x, y) {
        Matter.Body.applyForce(this.body, this.body.position, { x, y });
    }

    // Sleep methods
    setSleeping(sleeping) {
        Matter.Sleeping.set(this.body, sleeping);
    }

    isSleeping() {
        return this.body.isSleeping;
    }

    // Properties
    get id() {
        return this.body.id;
    }

    get label() {
        return this.body.label;
    }

    get angle() {
        return this.body.angle;
    }

    get speed() {
        return this.body.speed;
    }

    get bounds() {
        return this.body.bounds;
    }

    get circleRadius() {
        return this.body.circleRadius;
    }

    get force() {
        return this.body.force;
    }

    set force(value) {
        this.body.force = value;
    }

    get torque() {
        return this.body.torque;
    }

    set torque(value) {
        this.body.torque = value;
    }

    // Custom properties access (for backward compatibility with raw body access)
    get customProperties() {
        return this.body;
    }

    // Direct MatterJS body access for complex operations
    get matterBody() {
        return this.body;
    }
}

export class PhysicsBodyFactory {
    // Create rectangle body
    static createRectangle(x, y, width, height, options = {}) {
        const body = Matter.Bodies.rectangle(x, y, width, height, options);
        return new PhysicsBody(body);
    }

    // Create circle body
    static createCircle(x, y, radius, options = {}) {
        const body = Matter.Bodies.circle(x, y, radius, options);
        return new PhysicsBody(body);
    }
}

// Utility class for physics-related helpers
export class PhysicsUtils {
    // Check collision between bodies in an event
    static getCollisionPairs(event) {
        return event.pairs.map(pair => ({
            bodyA: new PhysicsBody(pair.bodyA),
            bodyB: new PhysicsBody(pair.bodyB)
        }));
    }

    // Find collision pairs with specific labels
    static findCollisionByLabels(event, labelA, labelB) {
        const results = [];
        event.pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            
            if ((bodyA.label === labelA && bodyB.label === labelB) ||
                (bodyA.label === labelB && bodyB.label === labelA)) {
                results.push({
                    bodyA: new PhysicsBody(bodyA),
                    bodyB: new PhysicsBody(bodyB)
                });
            }
        });
        return results;
    }
}