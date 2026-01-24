document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('garden-canvas');
    const ctx = canvas.getContext('2d');
    const toolbar = document.getElementById('toolbar');

    let currentTool = 'rake';
    const gardenObjects = []; // To store rocks, plants, etc.

    // --- Sound ---
    const soundEffects = {
        rock: new Audio('sounds/rock.wav'),
        plant: new Audio('sounds/plant.wav'),
        rake: new Audio('sounds/rake.wav'),
        clear: new Audio('sounds/clear.wav'),
        water: new Audio('sounds/water.wav')
    };

    function playSound(soundName) {
        // Stop the browser from complaining about user not interacting with the page first
        const bgMusic = document.getElementById('bg-music');
        if (bgMusic.paused) {
            bgMusic.play().catch(() => {});
        }

        if (soundEffects[soundName]) {
            soundEffects[soundName].currentTime = 0; // Rewind to start
            soundEffects[soundName].play().catch(() => {});
        }
    }

    // --- Setup & Drawing ---

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function drawGarden() {
        // Clear canvas with sand color
        ctx.fillStyle = '#EAE7DC';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw all garden objects
        gardenObjects.forEach(obj => {
            if (obj.type === 'path') {
                switch(obj.tool) {
                    case 'rake':
                        drawRakePattern(obj);
                        break;
                    case 'water':
                        drawRiver(obj);
                        break;
                }
            } else if (obj.type === 'rock') {
                drawRock(obj);
            } else if (obj.type === 'plant') {
                drawPlant(obj);
            }
        });
    }

    window.addEventListener('resize', resizeCanvas);
    

    // --- Tool Logic ---

    function updateCursor() {
        switch (currentTool) {
            case 'rake':
                canvas.style.cursor = 'crosshair';
                break;
            case 'rock':
                canvas.style.cursor = 'grab';
                break;
            case 'plant':
                canvas.style.cursor = 'grab';
                break;
            case 'water':
                canvas.style.cursor = 'crosshair';
                break;
            default:
                canvas.style.cursor = 'default';
        }
    }

    toolbar.addEventListener('click', (e) => {
        if (e.target.classList.contains('tool')) {
            currentTool = e.target.dataset.tool;
            document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            updateCursor(); // Update cursor after tool change
        }
    });

    // Set initial active tool
    document.querySelector('.tool[data-tool="rake"]').classList.add('active');
    updateCursor(); // Set initial cursor

    const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', () => {
        if (confirm('您确定要清除整个花园吗？此操作无法撤销。')) {
            gardenObjects.length = 0; // More efficient than gardenObjects = []
            playSound('clear');
        }
    });


    // --- Object Drawing Functions ---

    function drawRiver(river) {
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 25;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (river.points.length > 0) {
            ctx.moveTo(river.points[0].x, river.points[0].y);
            for (let i = 1; i < river.points.length; i++) {
                ctx.lineTo(river.points[i].x, river.points[i].y);
            }
        }
        ctx.stroke();
    }

    function drawRakePattern(rakePath) {
        ctx.save();
        for (const point of rakePath.points) {
            const particleCount = 20; // More particles for a denser look
            for (let i = 0; i < particleCount; i++) {
                const scatter = 20;
                const offsetX = (Math.random() - 0.5) * scatter;
                const offsetY = (Math.random() - 0.5) * scatter;

                // Coarse and fine: random size for the rectangle
                const size = 1 + Math.random() * 2; // size from 1px to 3px

                // Varying color/opacity for texture and depth
                const opacity = 0.3 + Math.random() * 0.4;
                // A color slightly darker than the main sand color for contrast
                ctx.fillStyle = `rgba(212, 207, 191, ${opacity})`; // #D4CFBF is 212,207,191

                ctx.fillRect(point.x + offsetX, point.y + offsetY, size, size);
            }
        }
        ctx.restore();
    }

    function drawRock(rock) {
        // Create a gradient from a light gray to a darker gray
        const gradient = ctx.createLinearGradient(rock.x, rock.y - rock.radius, rock.x, rock.y + rock.radius);
        gradient.addColorStop(0, rock.color1);
        gradient.addColorStop(1, rock.color2);

        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#8A8585';
        ctx.lineWidth = 1;

        ctx.beginPath();
        // The shape is already defined in the rock object
        ctx.moveTo(rock.x + rock.shape[0].x, rock.y + rock.shape[0].y);
        rock.shape.forEach(p => ctx.lineTo(rock.x + p.x, rock.y + p.y));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    function drawPlant(plant) {
        switch (plant.subType) {
            case 'tree':
                drawTree(plant);
                break;
            case 'bamboo':
                drawBamboo(plant);
                break;
            case 'shrub':
                drawShrub(plant);
                break;
            default:
                drawTree(plant);
        }
    }

    function drawTree(plant) {
        // Trunk
        ctx.fillStyle = '#8B5A2B'; // Brown
        ctx.fillRect(plant.x - plant.trunkWidth / 2, plant.y - plant.trunkHeight, plant.trunkWidth, plant.trunkHeight);

        // Foliage
        ctx.fillStyle = plant.color1;
        ctx.beginPath();
        ctx.arc(plant.x, plant.y - plant.trunkHeight, plant.foliageRadius, 0, Math.PI * 2);
        ctx.fill();
        // Add another layer for texture
        ctx.fillStyle = plant.color2;
        ctx.beginPath();
        ctx.arc(plant.x + 5, plant.y - plant.trunkHeight - 10, plant.foliageRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBamboo(plant) {
        const startY = plant.y;
        plant.stalks.forEach(stalk => {
            // Stalk
            ctx.strokeStyle = stalk.color;
            ctx.lineWidth = stalk.width;
            ctx.beginPath();
            ctx.moveTo(plant.x + stalk.xOffset, startY);
            ctx.lineTo(plant.x + stalk.xOffset, startY - stalk.height);
            ctx.stroke();

            // Segments
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(0,0,0,0.3)`;
            for (let y = startY; y > startY - stalk.height; y -= 15) {
                ctx.beginPath();
                ctx.moveTo(plant.x + stalk.xOffset - 5, y);
                ctx.lineTo(plant.x + stalk.xOffset + 5, y);
                ctx.stroke();
            }
        });
    }

    function drawShrub(plant) {
        plant.bushes.forEach(bush => {
            ctx.fillStyle = bush.color;
            ctx.beginPath();
            ctx.arc(plant.x + bush.xOffset, plant.y + bush.yOffset, bush.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // --- Mouse Interaction ---

    let isDrawing = false;
    let currentPath = null;
    let lastRakeSoundTime = 0;

    canvas.addEventListener('mousedown', (e) => {
        const pos = { x: e.clientX, y: e.clientY };

        if (currentTool === 'rake' || currentTool === 'water') {
            isDrawing = true;
            const newPath = {
                type: 'path',
                tool: currentTool,
                points: [pos]
            };
            if (currentTool === 'water') {
                newPath.particles = [];
                newPath.particleSpawnCooldown = 0;
            }
            currentPath = newPath;
            gardenObjects.push(currentPath);
        } else if (currentTool === 'rock') {
            const rock = { type: 'rock', x: pos.x, y: pos.y, ...createRock() };
            gardenObjects.push(rock);
            playSound('rock');
        } else if (currentTool === 'plant') {
            const plantTypes = ['tree', 'bamboo', 'shrub'];
            const subType = plantTypes[Math.floor(Math.random() * plantTypes.length)];
            const plant = {
                type: 'plant',
                subType: subType,
                x: pos.x,
                y: pos.y
            };
            
            // Pre-calculate and store all random properties
            if (subType === 'tree') {
                plant.trunkHeight = 40 + Math.random() * 20;
                plant.trunkWidth = 8 + Math.random() * 4;
                plant.foliageRadius = 20 + Math.random() * 10;
                plant.color1 = `rgb(30, ${100 + Math.random() * 30}, 40)`;
                plant.color2 = `rgb(40, ${120 + Math.random() * 40}, 50)`;
            } else if (subType === 'bamboo') {
                plant.stalks = [];
                const bambooStalks = 3 + Math.floor(Math.random() * 3);
                for (let i = 0; i < bambooStalks; i++) {
                    plant.stalks.push({
                        xOffset: (i - Math.floor(bambooStalks / 2)) * 12 + (Math.random() * 8 - 4),
                        height: 60 + Math.random() * 40,
                        color: `rgb(50, ${150 + Math.random() * 50}, 80)`,
                        width: 6 + Math.random() * 3
                    });
                }
            } else if (subType === 'shrub') {
                plant.bushes = [];
                const numBushes = 5 + Math.floor(Math.random() * 5);
                for (let i = 0; i < numBushes; i++) {
                    plant.bushes.push({
                        xOffset: Math.random() * 40 - 20,
                        yOffset: Math.random() * 20 - 10,
                        radius: 10 + Math.random() * 10,
                        color: `rgb(30, ${80 + Math.random() * 50}, 40)`
                    });
                }
            }

            gardenObjects.push(plant);
            playSound('plant');
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing || !currentPath) return;

        currentPath.points.push({ x: e.clientX, y: e.clientY });

        const now = Date.now();
        if (currentPath.tool === 'rake' && now - lastRakeSoundTime > 200) {
            playSound('rake');
            lastRakeSoundTime = now;
        } else if (currentPath.tool === 'water' && now - lastRakeSoundTime > 300) {
            playSound('water');
            lastRakeSoundTime = now;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
        currentPath = null;
    });

    function createRock() {
        const radius = 15 + Math.random() * 25; // Vary size
        const sides = 5 + Math.floor(Math.random() * 5);
        const shape = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const r = radius * (0.7 + Math.random() * 0.3);
            shape.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }
        const baseGray = 160 + Math.random() * 20;
        const color1 = `rgb(${baseGray-10}, ${baseGray-10}, ${baseGray-15})`;
        const color2 = `rgb(${baseGray-30}, ${baseGray-30}, ${baseGray-35})`;
        return { shape, radius, color1, color2 };
    }

    function updateAndDrawWater() {
        ctx.save();
        for (const obj of gardenObjects) {
            if (obj.tool === 'water' && obj.points.length > 1) {
                // Spawn new particles
                obj.particleSpawnCooldown--;
                if (obj.particleSpawnCooldown <= 0) {
                    obj.particleSpawnCooldown = 3; // Lower for more particles
                    const newParticle = {
                        pathIndex: 0,
                        progress: 0,
                        speed: 0.002 + Math.random() * 0.003,
                        size: 1 + Math.random() * 1.5,
                        opacity: 0.5 + Math.random() * 0.5
                    };
                    obj.particles.push(newParticle);
                }

                // Update and draw particles
                for (let i = obj.particles.length - 1; i >= 0; i--) {
                    const p = obj.particles[i];
                    p.progress += p.speed;

                    if (p.progress >= 1) {
                        p.progress = 0;
                        p.pathIndex++;
                        if (p.pathIndex >= obj.points.length - 1) {
                            p.pathIndex = 0; // Loop particle
                        }
                    }
                    
                    const startPoint = obj.points[p.pathIndex];
                    const endPoint = obj.points[p.pathIndex + 1];
                    const x = startPoint.x + (endPoint.x - startPoint.x) * p.progress;
                    const y = startPoint.y + (endPoint.y - startPoint.y) * p.progress;
                    
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                    ctx.beginPath();
                    ctx.arc(x, y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    }

    // --- Game Loop ---
    function gameLoop() {
        drawGarden();
        updateAndDrawWater();
        requestAnimationFrame(gameLoop);
    }

    resizeCanvas();
    gameLoop();
});