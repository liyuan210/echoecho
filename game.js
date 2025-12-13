// 3D Shooter Game - Modular Architecture

// ============================================================================
// Input Handler
// ============================================================================
class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0
        };
        
        this.setupKeyboardListeners();
        this.setupMouseListeners();
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setupMouseListeners() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.deltaX = e.movementX;
            this.mouse.deltaY = e.movementY;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }
    
    getMovementDirection() {
        const direction = { x: 0, y: 0, z: 0 };
        
        if (this.isKeyPressed('w') || this.isKeyPressed('arrowup')) {
            direction.z -= 1;
        }
        if (this.isKeyPressed('s') || this.isKeyPressed('arrowdown')) {
            direction.z += 1;
        }
        if (this.isKeyPressed('a') || this.isKeyPressed('arrowleft')) {
            direction.x -= 1;
        }
        if (this.isKeyPressed('d') || this.isKeyPressed('arrowright')) {
            direction.x += 1;
        }
        
        return direction;
    }
    
    isJumping() {
        return this.isKeyPressed(' ');
    }
}

// ============================================================================
// Player
// ============================================================================
class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = this.createPlayerMesh();
        this.velocity = { x: 0, y: 0, z: 0 };
        this.speed = 0.3;
        this.jumpForce = 0.8;
        this.isJumping = false;
        this.gravity = 0.015;
        this.maxVelocityY = -2;
    }
    
    createPlayerMesh() {
        const group = new THREE.Group();
        
        // Main body (rounded ship)
        const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF6B6B,
            shininess: 30,
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1, 0.7, 1.5);
        group.add(body);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.15, 12, 12);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFEB3B,
            shininess: 60,
            flatShading: true
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.15, 0.4);
        group.add(cockpit);
        
        // Left wing
        const wingGeometry = new THREE.ConeGeometry(0.15, 0.6, 8);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF9800,
            shininess: 20,
            flatShading: true
        });
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.4, 0, -0.1);
        leftWing.rotation.z = Math.PI / 4;
        group.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.4, 0, -0.1);
        rightWing.rotation.z = -Math.PI / 4;
        group.add(rightWing);
        
        // Tail thruster
        const thrusterGeometry = new THREE.ConeGeometry(0.1, 0.4, 6);
        const thrusterMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF4081,
            shininess: 40,
            flatShading: true
        });
        const thruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        thruster.position.set(0, -0.1, -0.6);
        thruster.rotation.z = Math.PI / 2;
        group.add(thruster);
        
        this.scene.add(group);
        return group;
    }
    
    update(inputHandler) {
        const moveDir = inputHandler.getMovementDirection();
        
        // Calculate move magnitude
        const magnitude = Math.sqrt(moveDir.x * moveDir.x + moveDir.z * moveDir.z);
        if (magnitude > 0) {
            this.velocity.x = (moveDir.x / magnitude) * this.speed;
            this.velocity.z = (moveDir.z / magnitude) * this.speed;
        } else {
            this.velocity.x *= 0.95;
            this.velocity.z *= 0.95;
        }
        
        // Jump
        if (inputHandler.isJumping() && !this.isJumping) {
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
        }
        
        // Apply gravity
        this.velocity.y -= this.gravity;
        if (this.velocity.y < this.maxVelocityY) {
            this.velocity.y = this.maxVelocityY;
        }
        
        // Update position
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.y += this.velocity.y;
        this.mesh.position.z += this.velocity.z;
        
        // Ground collision
        if (this.mesh.position.y <= 0) {
            this.mesh.position.y = 0;
            this.velocity.y = 0;
            this.isJumping = false;
        }
        
        // Boundary collision
        const boundary = 15;
        if (this.mesh.position.x > boundary) this.mesh.position.x = boundary;
        if (this.mesh.position.x < -boundary) this.mesh.position.x = -boundary;
        if (this.mesh.position.z > boundary) this.mesh.position.z = boundary;
        if (this.mesh.position.z < -boundary) this.mesh.position.z = -boundary;
        
        // Rotation based on velocity
        if (magnitude > 0.01) {
            const targetRotationY = Math.atan2(moveDir.x, moveDir.z);
            this.mesh.rotation.y += (targetRotationY - this.mesh.rotation.y) * 0.1;
        }
    }
}

// ============================================================================
// Game Scene
// ============================================================================
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        // Check WebGL availability
        if (!this.isWebGLAvailable()) {
            this.showWebGLError();
            return;
        }
        
        this.initScene();
        this.setupLighting();
        this.setupEnvironment();
        
        this.inputHandler = new InputHandler();
        this.player = new Player(this.scene);
        
        this.setupCamera();
        this.setupRenderer();
        this.setupResizeHandler();
        
        this.animate();
    }
    
    isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(
                window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
            );
        } catch (e) {
            return false;
        }
    }
    
    showWebGLError() {
        this.canvas.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; font-size:18px; color:#FF6B6B;">WebGL is not available on your browser. Please use a modern browser.</div>';
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 150);
    }
    
    setupCamera() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        this.scene.add(directionalLight);
        
        // Point light (accent)
        const pointLight = new THREE.PointLight(0xFF6B9D, 0.4);
        pointLight.position.set(-10, 8, -10);
        this.scene.add(pointLight);
    }
    
    setupEnvironment() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x90EE90,
            shininess: 10,
            flatShading: true
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some floating decorative cubes
        this.addDecorativeElements();
    }
    
    addDecorativeElements() {
        const positions = [
            { x: -8, y: 1, z: -8 },
            { x: 10, y: 1.5, z: -5 },
            { x: 5, y: 0.8, z: 8 },
            { x: -10, y: 1.2, z: 5 }
        ];
        
        positions.forEach((pos, idx) => {
            const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            const colors = [0xFF6B9D, 0x4ECDC4, 0xFFEB3B, 0x95E1D3];
            const material = new THREE.MeshPhongMaterial({
                color: colors[idx % colors.length],
                shininess: 25,
                flatShading: true
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(pos.x, pos.y, pos.z);
            cube.castShadow = true;
            cube.receiveShadow = true;
            this.scene.add(cube);
        });
    }
    
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            const width = this.canvas.clientWidth;
            const height = this.canvas.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
    
    updateCamera() {
        // Camera follows player from behind and above
        const targetX = this.player.mesh.position.x;
        const targetY = this.player.mesh.position.y + 2;
        const targetZ = this.player.mesh.position.z + 5;
        
        // Smooth camera movement
        this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
        
        this.camera.lookAt(
            this.player.mesh.position.x,
            this.player.mesh.position.y + 0.5,
            this.player.mesh.position.z
        );
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.scene) return;
        
        this.player.update(this.inputHandler);
        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================================================
// Initialize Game on Window Load
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
        new Game('game-canvas');
    }
});
