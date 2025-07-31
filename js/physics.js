// Physics Engine Abstraction Layer
// This module provides a generic physics interface that wraps Plank.js
// Making it easy to swap physics engines in the future

// Scaling constants for converting between pixels and meters
const SCALE = 80; // pixels per meter

export function pixelsToMeters(pixels) {
    return pixels / SCALE;
}

export function metersToPixels(meters) {
    return meters * SCALE;
}

// Physics world dimensions in meters (16m x 9m)
export const PhysicsWorldDimensions = {
    width: 16, // meters
    height: 9, // meters
};

// Physics engine specific constants
export const PhysicsConstants = {
    // Velocity thresholds for stopping jitter - adjusted for meter-based physics
    // Linear: 1.0 px²/s² ≈ 1 px/s ≈ 0.0125 m/s (12.5mm/s) - more realistic threshold
    slowLinearVelocityThreshold: 1.0, // speedSquared threshold
    // Angular: 0.1 rad/s ≈ 5.7°/s - more realistic for nearly stopped rotation
    slowAngularVelocityThreshold: 0.1, // absolute angular velocity threshold
};

export class PhysicsEngine {
    constructor() {
        this.world = null;
        this.eventHandlers = new Map();
        this.contactListeners = [];
    }

    // Initialize the physics engine
    create() {
        // Physics world operates in meters, conversion handled by PhysicsBody wrapper
        this.world = new planck.World({
            allowSleep: false, // Disable sleeping completely for now
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
                pairs: [
                    {
                        bodyA: contact.getFixtureA().getBody(),
                        bodyB: contact.getFixtureB().getBody(),
                    },
                ],
            };

            handlers.forEach((handler) => {
                handler(event);
            });
        }
    }

    // Set gravity - convert pixel gravity to meter gravity
    setGravity(pixelGravityX, pixelGravityY) {
        if (this.world) {
            const meterGravityX = pixelsToMeters(pixelGravityX);
            const meterGravityY = pixelsToMeters(pixelGravityY);
            this.world.setGravity({ x: meterGravityX, y: meterGravityY });
        }
    }

    // Set time scale (not directly supported in Plank, we'll handle this in update)
    setTimeScale(scale) {
        this.timeScale = scale || 1;
    }

    // Update physics simulation
    update(stepTime) {
        if (this.world) {
            // Use a fixed timestep for stability - stepTime parameter is ignored
            // Scene.js will call this multiple times per frame for sub-stepping
            const fixedTimeStep = 1 / 60; // 60 FPS fixed timestep (0.0167 seconds)
            this.world.step(fixedTimeStep, 6, 3); // Reduced iterations back to original values
        }
    }

    // Add body to world
    addBody(body) {
        if (this.world && body) {
            // If it's our PhysicsBody wrapper, get the actual body
            const actualBody = body.body || body;
            // Bodies are created directly in the world through factory methods
            // This method exists for compatibility but bodies are already in the world
            // No additional action needed since bodies are created in the world
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
        return allBodies.filter((body) => body.getUserData()?.label === label);
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

    // Position methods - convert between meters (physics) and pixels (rendering)
    getPosition() {
        const pos = this.body.getPosition();
        return {
            x: metersToPixels(pos.x),
            y: metersToPixels(pos.y),
        };
    }

    setPosition(pixelX, pixelY) {
        const meterX = pixelsToMeters(pixelX);
        const meterY = pixelsToMeters(pixelY);
        this.body.setTransform({ x: meterX, y: meterY }, this.body.getAngle());
    }

    // Velocity methods - convert between meters/sec (physics) and pixels/sec (rendering)
    getVelocity() {
        const vel = this.body.getLinearVelocity();
        return {
            x: metersToPixels(vel.x),
            y: metersToPixels(vel.y),
        };
    }

    setVelocity(pixelVelX, pixelVelY) {
        const meterVelX = pixelsToMeters(pixelVelX);
        const meterVelY = pixelsToMeters(pixelVelY);
        this.body.setLinearVelocity({ x: meterVelX, y: meterVelY });
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

    // Force application - convert pixel forces to meter forces
    applyForce(pixelForceX, pixelForceY) {
        const pos = this.body.getPosition(); // Already in meters
        const meterForceX = pixelsToMeters(pixelForceX);
        const meterForceY = pixelsToMeters(pixelForceY);
        this.body.applyForce(pos, { x: meterForceX, y: meterForceY });
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
        const vel = this.getVelocity(); // Already converted to pixels
        return Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    }

    get bounds() {
        // Get AABB from fixtures and convert to pixels
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
            min: { x: metersToPixels(aabb.lowerBound.x), y: metersToPixels(aabb.lowerBound.y) },
            max: { x: metersToPixels(aabb.upperBound.x), y: metersToPixels(aabb.upperBound.y) },
        };
    }

    get circleRadius() {
        // Get radius from first circle fixture and convert to pixels
        for (let fixture = this.body.getFixtureList(); fixture; fixture = fixture.getNext()) {
            const shape = fixture.getShape();
            if (shape.getType() === planck.Circle.TYPE) {
                return metersToPixels(shape.getRadius());
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

    // Create rectangle body - accepts pixel coordinates and dimensions
    static createRectangle(pixelX, pixelY, pixelWidth, pixelHeight, options = {}) {
        if (!PhysicsBodyFactory.world) {
            throw new Error('World not set. Call PhysicsBodyFactory.setWorld(world) first.');
        }

        // Convert pixel coordinates to meters for physics world
        const meterX = pixelsToMeters(pixelX);
        const meterY = pixelsToMeters(pixelY);
        const meterWidth = pixelsToMeters(pixelWidth);
        const meterHeight = pixelsToMeters(pixelHeight);

        // Create body definition
        const bodyDef = {
            type: options.isStatic ? 'static' : 'dynamic',
            position: { x: meterX, y: meterY },
            linearDamping: 0, // Ensure no linear damping for proper bouncing
            angularDamping: 0, // Ensure no angular damping for proper bouncing
        };

        if (options.angle !== undefined) {
            bodyDef.angle = options.angle;
        }

        const body = PhysicsBodyFactory.world.createBody(bodyDef);

        // Create fixture definition with meter dimensions
        const fixtureDef = {
            shape: new planck.Box(meterWidth / 2, meterHeight / 2),
            density: options.density || 1,
            friction: options.friction || 0.3,
            restitution: options.restitution || 0.1,
        };

        body.createFixture(fixtureDef);

        const userData = {
            id: PhysicsBodyFactory.generateId(),
            ...options.userData,
        };

        body.setUserData(userData);

        return new PhysicsBody(body);
    }

    // Create circle body - accepts pixel coordinates and radius
    static createCircle(pixelX, pixelY, pixelRadius, options = {}) {
        if (!PhysicsBodyFactory.world) {
            throw new Error('World not set. Call PhysicsBodyFactory.setWorld(world) first.');
        }

        // Convert pixel coordinates to meters for physics world
        const meterX = pixelsToMeters(pixelX);
        const meterY = pixelsToMeters(pixelY);
        const meterRadius = pixelsToMeters(pixelRadius);

        // Create body definition
        const bodyDef = {
            type: options.isStatic ? 'static' : 'dynamic',
            position: { x: meterX, y: meterY },
            linearDamping: 0,
            angularDamping: 0,
        };

        if (options.angle !== undefined) {
            bodyDef.angle = options.angle;
        }

        const body = PhysicsBodyFactory.world.createBody(bodyDef);

        const fixtureDef = {
            shape: new planck.Circle(meterRadius),
            density: options.density || 1,
            friction: options.friction || 0.3,
            restitution: options.restitution || 0.1,
        };

        body.createFixture(fixtureDef);

        // Calculate density from mass if provided (let Planck handle mass calculations)
        // if (options.mass !== undefined) {
        //     // Calculate density needed to achieve desired mass
        //     // Mass = density * area, so density = mass / area
        //     const area = Math.PI * meterRadius * meterRadius;
        //     const desiredDensity = options.mass / area;

        //     // Update the fixture's density
        //     const fixture = body.getFixtureList();
        //     if (fixture) {
        //         fixture.setDensity(desiredDensity);
        //         body.resetMassData(); // Recalculate mass based on new density
        //     }
        // }

        const userData = {
            id: PhysicsBodyFactory.generateId(),
            ...options.userData,
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
        return event.pairs.map((pair) => ({
            bodyA: new PhysicsBody(pair.bodyA),
            bodyB: new PhysicsBody(pair.bodyB),
        }));
    }

    // Find collision pairs with specific labels
    static findCollisionByLabels(event, labelA, labelB) {
        const results = [];
        event.pairs.forEach((pair) => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            const labelAData = bodyA.getUserData()?.label || '';
            const labelBData = bodyB.getUserData()?.label || '';

            if ((labelAData === labelA && labelBData === labelB) || (labelAData === labelB && labelBData === labelA)) {
                results.push({
                    bodyA: new PhysicsBody(bodyA),
                    bodyB: new PhysicsBody(bodyB),
                });
            }
        });
        return results;
    }
}
