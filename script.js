const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

const shootButton = document.getElementById('shoot');

// Player
const playerWidth = 30;
const playerHeight = 20;
let playerX = (canvas.width - playerWidth) / 2;
const playerY = canvas.height - playerHeight - 10;
const playerSpeed = 3;

// Keyboard state
const keys = {
    ArrowLeft: false,
    KeyA: false,
    ArrowRight: false,
    KeyD: false,
    Space: false,
    KeyW: false
};

// Bullets
const bullets = [];
const bulletWidth = 3;
const bulletHeight = 10;
const bulletSpeed = 7;

// Enemies
const enemies = [];
const enemyWidth = 30;
const enemyHeight = 30;
const enemySpeed = 0.5;
let enemySpawnInterval = 1000; // milliseconds
let lastEnemySpawnTime = 0;

// Power-ups
const powerUps = [];
const powerUpWidth = 20;
const powerUpHeight = 20;
const powerUpSpeed = 1;
const killsForPowerUp = 5;
let enemyKills = 0;

// Game state
let gameRunning = true;
let score = 0;
let coins = localStorage.getItem('gameCoins') ? parseInt(localStorage.getItem('gameCoins')) : 0; // Add coins variable and load from localStorage
let playerHealth = 100; // Add player health
let isPaused = false; // Add pause state
let lastShotTime = 0; // To control shooting speed
let shootInterval = 200; // milliseconds (0.2 seconds) - make it let to change
const initialShootInterval = 400; // Store initial value

// Shop Items Data (Example)
const shopItems = [
    { id: 'skin1', name: 'Blue Ship Skin', type: 'skin', cost: 100 },
    { id: 'powerup1', name: 'Rapid Fire (5s)', type: 'power-up', cost: 50 },
    { id: 'effect1', name: 'Explosive Shots', type: 'throwing-effect', cost: 150 }
];

// Draw player
function drawPlayer() {
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
}

// Draw bullets
function drawBullets() {
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
    });
}

// Draw enemies
function drawEnemies() {
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemyWidth, enemyHeight);
    });
}

// Draw power-ups
function drawPowerUps() {
    ctx.fillStyle = '#00ffff'; // Cyan color for power-ups
    powerUps.forEach(powerUp => {
        ctx.fillRect(powerUp.x, powerUp.y, powerUpWidth, powerUpHeight);
    });
}

// Move player
function movePlayer(direction) {
    if (direction === 'left') {
        playerX -= playerSpeed;
    } else if (direction === 'right') {
        playerX += playerSpeed;
    }
    // Keep player within canvas bounds
    playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));
}

// Shoot bullet
function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime > shootInterval) {
        bullets.push({
            x: playerX + playerWidth / 2 - bulletWidth / 2,
            y: playerY - bulletHeight
        });
        lastShotTime = currentTime;
    }
}

// Update game state
function update() {
    if (!gameRunning || isPaused) return; // Check if game is running and not paused

    // Calculate movement delta based on held keys
    let moveDelta = 0;
    if (keys.ArrowLeft || keys.KeyA) {
        moveDelta -= playerSpeed;
    }
    if (keys.ArrowRight || keys.KeyD) {
        moveDelta += playerSpeed;
    }

    playerX += moveDelta;

    // Keep player within canvas bounds
    playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));

    // Handle shooting (keyboard/button)
    if (keys.Space || keys.KeyW) { // Keyboard/button shoot
        shoot();
    }


    // Move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        if (bullets[i].y + bulletHeight < 0) {
            bullets.splice(i, 1);
        }
    }

    // Spawn enemies
    const currentTime = Date.now();
    if (currentTime - lastEnemySpawnTime > enemySpawnInterval) {
        enemies.push({
            x: Math.random() * (canvas.width - enemyWidth),
            y: 0,
            health: Math.floor(Math.random() * 16) + 10, // Random health between 10 and 25
            speed: Math.random() * 0.5 + 0.2, // Random speed between 0.2 and 0.7
            maxHealth: Math.floor(Math.random() * 16) + 10 // Store max health for coin calculation
        });
        lastEnemySpawnTime = currentTime;
    }

    // Move enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            // Enemy reached bottom, remove it but don't end the game
        }
        // Check for collision with player
        if (enemies[i].x < playerX + playerWidth &&
            enemies[i].x + enemyWidth > playerX &&
            enemies[i].y < playerY + playerHeight &&
            enemies[i].y + enemyHeight > playerY) {
            // Collision with player
            enemies.splice(i, 1);
            playerHealth -= 20; // Decrease health on collision
            if (playerHealth <= 0) {
                gameRunning = false; // Game over
                alert('Game Over! Your score: ' + score);
                document.location.reload(); // Simple restart for now
            }
        }
    }

    // Collision detection (bullets and enemies)
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i].x < enemies[j].x + enemyWidth &&
                bullets[i].x + bulletWidth > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemyHeight &&
                bullets[i].y + bulletHeight > enemies[j].y) {
                // Collision
                bullets.splice(i, 1);
                enemies[j].health -= 10; // Decrease enemy health by bullet damage (assuming 10 damage per bullet)
               if (enemies[j].health <= 0) {
                   const killedEnemyHealth = enemies[j].maxHealth;
                   enemies.splice(j, 1);
                   score += 10;
                   // Calculate coins based on enemy health (5 to 15 coins)
                   // Scale coins linearly with health: min_coins + (health - min_health) / (max_health - min_health) * (max_coins - min_coins)
                   const minHealth = 10;
                   const maxHealth = 25;
                   const minCoins = 5;
                   const maxCoins = 15;
                   const awardedCoins = Math.round(minCoins + (killedEnemyHealth - minHealth) / (maxHealth - minHealth) * (maxCoins - minCoins));
                   coins += awardedCoins; // Add awarded coins
                   localStorage.setItem('gameCoins', coins); // Save coins to localStorage
                   enemyKills++; // Increment kill counter
                   // Adjust interval for difficulty
                   enemySpawnInterval = Math.max(200, enemySpawnInterval - 10);

                   // Check if it's time to spawn a power-up
                   if (enemyKills >= killsForPowerUp) {
                       powerUps.push({
                           x: canvas.width / 2 - powerUpWidth / 2, // Middle lane
                           y: 0
                       });
                       enemyKills = 0; // Reset kill counter
                   }
               }
               break; // Bullet hit one enemy, move to next bullet
           }
       }
   }

   // Move power-ups
   for (let i = powerUps.length - 1; i >= 0; i--) {
       powerUps[i].y += powerUpSpeed;
       if (powerUps[i].y > canvas.height) {
           powerUps.splice(i, 1);
       }
       // Check for collision with player
       if (powerUps[i].x < playerX + playerWidth &&
           powerUps[i].x + powerUpWidth > playerX &&
           powerUps[i].y < playerY + playerHeight &&
           powerUps[i].y + powerUpHeight > playerY) {
           // Collision with player
           powerUps.splice(i, 1);
           playerHealth = Math.min(100, playerHealth + 30); // Increase health, max 100
           shootInterval = Math.max(50, shootInterval - 60); // Decrease shoot interval (increase fire rate)
       }
   }
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update(); // Update game state before drawing

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawPowerUps(); // Draw power-ups

    // Display score
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 25);
    ctx.fillText('Coins: ' + coins, 10, 50); // Display coins

    // Update health bar display
    document.getElementById('healthBar').innerText = 'Health: ' + playerHealth;

    requestAnimationFrame(gameLoop);
}

// Event listeners for buttons
shootButton.addEventListener('click', shoot); // Button click also respects interval

// Event listeners for keyboard controls
document.addEventListener('keydown', (event) => {
    if (gameRunning && !isPaused) { // Only process input if game is running and not paused
        if (keys.hasOwnProperty(event.code)) {
            if (event.code === 'Space' || event.code === 'KeyW') {
                 // Only set shoot key state to true on keydown
                keys[event.code] = true;
            } else {
                keys[event.code] = true;
            }
        }
    }
    if (event.code === 'KeyP') { // Toggle pause with 'P' key
        isPaused = !isPaused;
        if (isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left'; // Reset text alignment
        } else {
             // Resume game loop if needed (requestAnimationFrame handles this)
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (gameRunning && !isPaused) { // Only process input if game is running and not paused
        if (keys.hasOwnProperty(event.code)) {
            keys[event.code] = false;
        }
    }
});

// Event listener for mouse click on canvas (for shooting)
canvas.addEventListener('mousedown', (event) => {
    if (gameRunning && !isPaused) { // Only shoot if game is running and not paused
        shoot();
    }
});


// Add event listener for pause button
const pauseButton = document.getElementById('pauseButton');
pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left'; // Reset text alignment
    } else {
        // Resume game loop if needed (requestAnimationFrame handles this)
    }
});
// Add event listener for in-game menu button
const inGameMenuButton = document.getElementById('inGameMenuButton');
inGameMenuButton.addEventListener('click', () => {
    showMenu(); // Go back to the main menu
});

// Start the game
// Menu and game screen elements
const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const shopScreen = document.getElementById('shopScreen'); // Get shop screen element
const playButton = document.getElementById('playButton');
const shopButton = document.getElementById('shopButton'); // Get shop button
const backButton = document.getElementById('backButton'); // Get back button

// Function to show the menu
function showMenu() {
    menuScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    gameRunning = false; // Stop the game loop
}

// Function to show the shop
function showShop() {
    console.log('Showing shop screen');
    menuScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    shopScreen.classList.remove('hidden');
    gameRunning = false; // Stop the game loop
    populateShop(); // Populate shop items when showing the shop
}

// Function to populate the shop display
function populateShop() {
    const shopItemsContainer = document.getElementById('shopItems');
    shopItemsContainer.innerHTML = ''; // Clear previous items

    shopItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('shop-item');
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>Cost: ${item.cost} coins</p>
            <button class="buy-button" data-item-id="${item.id}">Buy</button>
        `;
        shopItemsContainer.appendChild(itemElement);
    });
}

// Function to start the game
function startGame() {
    menuScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameRunning = true; // Start the game loop
    setTimeout(gameLoop, 50); // Add a small delay before starting the game loop
}

// Event listener for the Play button
playButton.addEventListener('click', startGame);

// Event listener for the Shop button
shopButton.addEventListener('click', showShop);

// Event listener for the Back button in the shop
backButton.addEventListener('click', showMenu);

// Initially show the menu
showMenu();