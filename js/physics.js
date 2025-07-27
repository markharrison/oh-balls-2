// Physics Engine Abstraction Layer
// This module provides a generic physics interface that wraps Plank.js
// Making it easy to swap physics engines in the future

export class PhysicsEngine {
    constructor() {
        this.world = null;
        this.eventHandlers = new Map();
        this.contactListeners = [];
    }

    // Initialize the physics engine
    create() {
        this.world = new planck.World({
            gravity: { x: 0, y: -10 }
        });

        // Set up contact listener for event handling
        this.world.on('begin-contact', (contact) => {
            this.handleContactEvent('collisionStart', contact);
        });

        this.world.on('end-contact', (contact) => {
            this.handleContactEvent('collisionEnd', contact);
        });

        return this;
    }

    // Handle contact events and convert to MatterJS-style events
    handleContactEvent(eventType, contact) {
        if (this.eventHandlers.has(eventType)) {
            const handlers = this.eventHandlers.get(eventType);
            
            // Create MatterJS-style event object
            const event = {
                pairs: [{
                    bodyA: contact.getFixtureA().getBody(),
                    bodyB: contact.getFixtureB().getBody()
                }]
            };

            handlers.forEach(handler => {
                handler(event);
            });
        }
    }

    // Set gravity
    setGravity(x, y) {
        if (this.world) {
            this.world.setGravity({ x, y });
        }
    }

    // Set time scale (not directly supported in Plank, we'll handle this in update)
    setTimeScale(scale) {
        this.timeScale = scale || 1;
    }

    // Update physics simulation
    update(deltaTime) {
        if (this.world) {
            // Use a more consistent timestep for Plank JS
            const fixedTimeStep = 1/60; // 60 FPS fixed timestep
            this.world.step(fixedTimeStep, 8, 3); // timestep, velocityIterations, positionIterations
        }
    }

    // Add body to world
    addBody(body) {
        if (this.world && body) {
            // If it's our PhysicsBody wrapper, get the actual body
            const actualBody = body.body || body;
            // Body is already created in the world through our factory methods
            // This method is mainly for compatibility
        }
    }

    // Remove body from world
    removeBody(body) {
        if (this.world && body) {
            const actualBody = body.body || body;
            this.world.destroyBody(actualBody);
        }
    }

    // Get all bodies from world
    getAllBodies() {
        if (!this.world) return [];
        
        const bodies = [];
        for (let body = this.world.getBodyList(); body; body = body.getNext()) {
            bodies.push(body);
        }
        return bodies;
    }

    // Get bodies by label
    getBodiesByLabel(label) {
        const allBodies = this.getAllBodies();
        return allBodies.filter(body => body.getUserData()?.label === label);
    }

    // Event handling
    on(eventType, callback) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(callback);
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
    }

    // Cleanup
    destroy() {
        if (this.world) {
            this.eventHandlers.clear();
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
        const pos = this.body.getPosition();
        return {
            x: pos.x,
            y: pos.y
        };
    }

    setPosition(x, y) {
        this.body.setTransform({ x, y }, this.body.getAngle());
    }

    // Velocity methods
    getVelocity() {
        const vel = this.body.getLinearVelocity();
        return {
            x: vel.x,
            y: vel.y
        };
    }

    setVelocity(x, y) {
        this.body.setLinearVelocity({ x, y });
    }

    // Angular velocity methods
    getAngularVelocity() {
        return this.body.getAngularVelocity();
    }

    setAngularVelocity(velocity) {
        this.body.setAngularVelocity(velocity);
    }

    // Static state methods
    setStatic(isStatic) {
        if (isStatic) {
            this.body.setType('static');
        } else {
            this.body.setType('dynamic');
        }
    }

    isStatic() {
        return this.body.getType() === 'static';
    }

    // Force application
    applyForce(x, y) {
        const pos = this.body.getPosition();
        this.body.applyForce(pos, { x, y });
    }

    // Sleep methods
    setSleeping(sleeping) {
        this.body.setAwake(!sleeping);
    }

    isSleeping() {
        return !this.body.isAwake();
    }

    // Properties
    get id() {
        return this.body.getUserData()?.id || 0;
    }

    get label() {
        return this.body.getUserData()?.label || '';
    }

    get angle() {
        return this.body.getAngle();
    }

    get speed() {
        const vel = this.getVelocity();
        return Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    }

    get bounds() {
        // Get AABB from fixtures
        const aabb = new planck.AABB();
        let first = true;
        
        for (let fixture = this.body.getFixtureList(); fixture; fixture = fixture.getNext()) {
            const shape = fixture.getShape();
            const transform = this.body.getTransform();
            const childAABB = new planck.AABB();
            shape.computeAABB(childAABB, transform, 0);
            
            if (first) {
                aabb.lowerBound.set(childAABB.lowerBound);
                aabb.upperBound.set(childAABB.upperBound);
                first = false;
            } else {
                aabb.combine(childAABB);
            }
        }

        return {
            min: { x: aabb.lowerBound.x, y: aabb.lowerBound.y },
            max: { x: aabb.upperBound.x, y: aabb.upperBound.y }
        };
    }

    get circleRadius() {
        // Get radius from first circle fixture
        for (let fixture = this.body.getFixtureList(); fixture; fixture = fixture.getNext()) {
            const shape = fixture.getShape();
            if (shape.getType() === planck.Circle.TYPE) {
                return shape.getRadius();
            }
        }
        return 0;
    }

    get force() {
        // Plank doesn't expose accumulated force directly
        return { x: 0, y: 0 };
    }

    set force(value) {
        // Force is applied through applyForce method in Plank
    }

    get torque() {
        // Plank doesn't expose accumulated torque directly
        return 0;
    }

    set torque(value) {
        // Torque is applied through applyTorque method in Plank
        if (value !== 0) {
            this.body.applyTorque(value);
        }
    }

    // Custom properties access (for backward compatibility with raw body access)
    get customProperties() {
        return this.body.getUserData() || {};
    }

    // Direct Plank body access for complex operations
    get plankBody() {
        return this.body;
    }

    // Compatibility property for MatterJS code
    get matterBody() {
        return this.body;
    }
}

export class PhysicsBodyFactory {
    // Store reference to the world so we can create bodies
    static world = null;
    
    static setWorld(world) {
        PhysicsBodyFactory.world = world;
    }

    // Create rectangle body
    static createRectangle(x, y, width, height, options = {}) {
        if (!PhysicsBodyFactory.world) {
            throw new Error('World not set. Call PhysicsBodyFactory.setWorld(world) first.');
        }

        // Create body definition
        const bodyDef = {
            type: options.isStatic ? 'static' : 'dynamic',
            position: { x, y }
        };

        if (options.angle !== undefined) {
            bodyDef.angle = options.angle;
        }

        const body = PhysicsBodyFactory.world.createBody(bodyDef);

        // Create fixture definition
        const fixtureDef = {
            shape: new planck.Box(width / 2, height / 2),
            density: options.density || 1,
            friction: options.friction || 0.3,
            restitution: options.restitution || 0.1
        };

        body.createFixture(fixtureDef);

        // Set user data for compatibility
        const userData = {
            id: PhysicsBodyFactory.generateId(),
            label: options.label || 'rectangle',
            render: options.render || {},
            ballInstance: options.ballInstance || null
        };

        body.setUserData(userData);

        return new PhysicsBody(body);
    }

    // Create circle body
    static createCircle(x, y, radius, options = {}) {
        if (!PhysicsBodyFactory.world) {
            throw new Error('World not set. Call PhysicsBodyFactory.setWorld(world) first.');
        }

        // Create body definition
        const bodyDef = {
            type: options.isStatic ? 'static' : 'dynamic',
            position: { x, y }
        };

        if (options.angle !== undefined) {
            bodyDef.angle = options.angle;
        }

        const body = PhysicsBodyFactory.world.createBody(bodyDef);

        // Create fixture definition
        const fixtureDef = {
            shape: new planck.Circle(radius),
            density: options.density || 1,
            friction: options.friction || 0.3,
            restitution: options.restitution || 0.1
        };

        body.createFixture(fixtureDef);

        // Set mass if provided
        if (options.mass !== undefined) {
            const massData = {
                mass: options.mass,
                center: { x: 0, y: 0 },
                I: options.mass * radius * radius / 2 // Moment of inertia for circle
            };
            body.setMassData(massData);
        }

        // Set user data for compatibility
        const userData = {
            id: PhysicsBodyFactory.generateId(),
            label: options.label || 'circle',
            render: options.render || {},
            ballInstance: options.ballInstance || null,
            circleRadius: radius
        };

        body.setUserData(userData);

        return new PhysicsBody(body);
    }

    // Generate unique ID for bodies
    static idCounter = 1;
    static generateId() {
        return PhysicsBodyFactory.idCounter++;
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
            
            const labelAData = bodyA.getUserData()?.label || '';
            const labelBData = bodyB.getUserData()?.label || '';
            
            if ((labelAData === labelA && labelBData === labelB) ||
                (labelAData === labelB && labelBData === labelA)) {
                results.push({
                    bodyA: new PhysicsBody(bodyA),
                    bodyB: new PhysicsBody(bodyB)
                });
            }
        });
        return results;
    }
}