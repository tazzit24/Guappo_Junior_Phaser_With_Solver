'use strict';

import { Level } from '../game/Level.js';
import { GameLogic } from '../game/GameLogic.js';
import { Button } from '../ui/Button.js';
import { Enum } from '../game/Enum.js';
import { Utils } from '../game/Utils.js';
import { Enemy } from '../objects/Enemy.js';
import { Solver } from '../solver/Solver.js';
import { SaveGameHelper } from '../game/SaveGameHelper.js';

export class SceneMain extends Phaser.Scene {

    level;
    gameLogic; // Instance of GameLogic
    text_moves;
    text_level;
    wappo;
    friends = [];
    enemies = [];
    cursors;
    btnUp = null;
    btnDown = null;
    btnLeft = null;
    btnRight = null;
    btnHome = null;
    btnMusic = null;
    btnReload = null;
    btnSolve = null;
    btnPrev = null;
    btnNext = null;

    // UI Containers
    controlsContainer = null; // Container for the control buttons
    uiContainer = null; // Container for the UI elements
    gridContainer = null; // Container for the grid and pieces

    joystick_dir; // Joystick for directional input
    isAnimating = false; // Flag to prevent input during animation
    musicEnabled = true; // Music state
    
    // Responsive layout properties
    gridSize = 6;
    gridOffsetX = 0;
    gridOffsetY = 0;
    cellSize = 0;
    controlsAreaX = 0;
    controlsAreaY = 0;
    uiAreaX = 0;
    uiAreaY = 0;
    isLandscape = false;
    gridCells = [];

    constructor() {
        super('SceneMain');
    }

    init(msg) {
        this.choosenLevel = msg.choosenLevel;
    }

    preload() {
        this.load.text('levels', 'assets/levels/levels.json');
        this.load.image('vine', 'assets/images/vine.png');
        this.load.image('gap', 'assets/images/gap.png');
        this.load.image('trap', 'assets/images/trap.png');
        this.load.image('beehive', 'assets/images/beehive.png');
        this.load.image('wappo', 'assets/images/wappo.png');
        this.load.image('friend_1', 'assets/images/friend1.png');
        this.load.image('friend_2', 'assets/images/friend2.png');
        // Charger les ennemis verticaux comme spritesheet avec 2 frames : 0=monte, 1=descend
        this.load.spritesheet('enemy_V_1', 'assets/images/ev1.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('enemy_V_2', 'assets/images/ev2.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('enemy_H_1', 'assets/images/eh1.png');
        this.load.image('enemy_H_2', 'assets/images/eh2.png');
        this.load.image('enemy_D_1', 'assets/images/ed1.png');
        this.load.image('enemy_D_2', 'assets/images/ed2.png');
    }

    create() {
        // Calculate responsive layout
        this.calculateLayout();
        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);

        var levelsJson = JSON.parse(this.cache.text.get('levels'));
        var lvlJson = levelsJson.levels.find(record => record.level == this.choosenLevel);
        this.level = new Level(lvlJson);
        
        // Create GameLogic instance
        this.gameLogic = new GameLogic(this.level);
        
        // Set up event listeners for game events
        this.setupGameEventListeners();

        // Grid and pieces (needed for grid position)
        this.createGrid();
        this.createMovablePieces();

        // Create UI container
        this.uiContainer = this.add.container(0, 0);
        // Create text objects with minimal initial config
        this.text_level = this.add.text(0, 0, 'Level: ' + this.level.getId(), {
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiContainer.add(this.text_level);
        this.text_moves = this.add.text(0, 0, '', {
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiContainer.add(this.text_moves);
        this.updateMovesCounter();
        this.tooltip = this.add.text(0, 0, '', {
            font: '16px Arial',
            fill: '#fff',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 }
        }).setDepth(1000).setVisible(false);
        // Control buttons
        this.createControlButtons();
        // Input
        this.setupInput();

        // Initial layout update
        this.updateLayout();
    }

    calculateLayout() {
        const gameWidth = this.scale.gameSize.width;
        const gameHeight = this.scale.gameSize.height;
        this.isLandscape = gameWidth > gameHeight;
        // Calculate cell size based on available space
        const topPadding = 20;
        const gridPadding = 10;
        const uiHeaderSpace = this.isLandscape ? 0 : 60; // No header space in landscape
        const controlsSpace = this.isLandscape ? gameWidth * 0.3 : gameHeight * 0.25; // More space for button rows in portrait
        if (this.isLandscape) {
            // Landscape: grid centered, UI on left, controls on right
            const sideAreaWidth = Math.max(gameWidth * 0.18, 120); // Space for UI and controls
            const availableGridWidth = gameWidth - sideAreaWidth * 2 - gridPadding * 2;
            const availableGridHeight = gameHeight - gridPadding * 2;
            this.cellSize = Math.min(availableGridWidth / this.gridSize, availableGridHeight / this.gridSize);
            // Center grid horizontally
            const gridTotalWidth = this.cellSize * this.gridSize;
            this.gridOffsetX = (gameWidth - gridTotalWidth) / 2;
            this.gridOffsetY = (gameHeight - (this.cellSize * this.gridSize)) / 2;
            // UI area in landscape (left of grid)
            this.uiAreaX = this.gridOffsetX - sideAreaWidth + 10; // 10px padding from left edge of UI area
            this.uiAreaY = 20;
            // Controls area in landscape (right of grid)
            this.controlsAreaX = this.gridOffsetX + gridTotalWidth + sideAreaWidth / 2;
            this.controlsAreaY = gameHeight / 2;
        } else {
            // Portrait: controls at the bottom, UI at top
            const availableGridWidth = gameWidth - gridPadding * 2;
            const availableGridHeight = gameHeight - controlsSpace - uiHeaderSpace - gridPadding * 2;
            this.cellSize = Math.min(availableGridWidth / this.gridSize, availableGridHeight / this.gridSize);
            this.gridOffsetX = (gameWidth - (this.cellSize * this.gridSize)) / 2;
            this.gridOffsetY = uiHeaderSpace + topPadding;
            this.controlsAreaX = gameWidth / 2;
            this.controlsAreaY = this.gridOffsetY + (this.cellSize * this.gridSize) + topPadding * 4; // More space for two button rows
            // UI area in portrait (top left)
            this.uiAreaX = 10;
            this.uiAreaY = 10;
        }
    }

    handleResize() {
        this.calculateLayout();
        this.updateLayout();
    }
    
    /**
     * Set up listeners for game events from GameLogic
     */
    setupGameEventListeners() {
        this.gameLogic.on('turnStart', (data) => {
            console.log('Turn started with direction:', data.direction);
        });
        
        this.gameLogic.on('pieceMoved', (data) => {
            // Nothing to do here - movement animations will be handled in animateMoves
        });
        
        this.gameLogic.on('turnEnd', (data) => {
            this.updateMovesCounter();
        });
        
        // Note: gameWon/gameOver n'affichent plus directement l'écran de fin
        // Les événements sont émis mais l'affichage est géré dans fireUserInput
        // après que toutes les animations soient terminées
        
        this.gameLogic.on('gameWon', (data) => {
            console.log('Game won event received, waiting for animations to complete');
            // Les actions sont maintenant gérées après les animations dans fireUserInput
        });
        
        this.gameLogic.on('gameOver', (data) => {
            console.log('Game over event received, waiting for animations to complete');
            // Les actions sont maintenant gérées après les animations dans fireUserInput
        });
    }
    
    updateLayout() {
        const { width, height } = this.scale.gameSize;
        // Responsive font sizes
        const levelFontSize = Math.max(Math.min(Math.round(height * 0.04), 32), 18);
        const movesFontSize = levelFontSize;
        const tooltipFontSize = Math.max(Math.min(Math.round(height * 0.025), 20), 14);
        // Calculate margin_topInfos
        const margin_topInfos = Math.max(Math.round(height * 0.015), 4); // Responsive margin, min 4px
        // Set common label attributes
        if (this.text_level) {
            this.text_level.setFontSize(levelFontSize);
            this.text_level.setStroke('#000000', Math.max(Math.round(levelFontSize * 0.1), 2));
        }
        if (this.text_moves) {
            this.text_moves.setFontSize(movesFontSize);
            this.text_moves.setStroke('#000000', Math.max(Math.round(movesFontSize * 0.1), 2));
        }
        // Set position, alignment, and origin based on orientation
        if (!this.isLandscape) {
            // Portrait mode: labels just above grid corners
            if (this.text_level) {
                const gridTopLeftX = this.gridOffsetX;
                const gridTopLeftY = this.gridOffsetY - margin_topInfos;
                this.text_level.setPosition(gridTopLeftX, gridTopLeftY);
                this.text_level.setOrigin(0, 1);
            }
            if (this.text_moves) {
                const gridTopRightX = this.gridOffsetX + this.cellSize * this.gridSize;
                const gridTopLeftY = this.gridOffsetY - margin_topInfos;
                this.text_moves.setPosition(gridTopRightX, gridTopLeftY);
                this.text_moves.setOrigin(1, 1);
                this.text_moves.setAlign('right');
            }
        } else {
            // Landscape mode: labels positioned on the left of the grid
            if (this.text_level) {
                this.text_level.setPosition(this.uiAreaX, this.uiAreaY);
                this.text_level.setOrigin(0, 0);
            }
            if (this.text_moves) {
                this.text_moves.setPosition(this.uiAreaX, this.uiAreaY + levelFontSize + 5);
                this.text_moves.setOrigin(0, 0);
                this.text_moves.setAlign('left');
            }
        }
        // Update tooltip
        if (this.tooltip) {
            this.tooltip.setFont(tooltipFontSize + 'px Arial');
            this.tooltip.setPadding(Math.round(tooltipFontSize * 0.4), Math.round(tooltipFontSize * 0.2));
        }
        // Update grid container position
        if (this.gridContainer) {
            this.gridContainer.setPosition(this.gridOffsetX, this.gridOffsetY);
        }
        
        // Update grid positions and sizes (relative to container)
        for (let i = 0; i < 36; i++) {
            if (this.gridCells && this.gridCells[i]) {
                let coords = Utils.getCoords(i);
                let x = coords.x * this.cellSize; // Relative to container
                let y = coords.y * this.cellSize; // Relative to container
                this.gridCells[i].setPosition(x, y).setDisplaySize(this.cellSize, this.cellSize);
            }
        }
        // Update movable pieces (relative to container)
        if (this.wappo && this.wappo.getImg()) {
            let coords = Utils.getCoords(this.wappo.getLocation());
                let x = coords.x * this.cellSize + this.cellSize / 2;
                let y = coords.y * this.cellSize + this.cellSize / 2;
                const nativeWappoSize = this.wappo.getImg().width || 64;
                const scaleWappo = 0.85 * this.cellSize / nativeWappoSize;
                this.wappo.getImg().setPosition(x, y).setScale(scaleWappo);
        }
        this.friends.forEach(friend => {
            if (friend && friend.getImg()) {
                let coords = Utils.getCoords(friend.getLocation());
                    let x = coords.x * this.cellSize + this.cellSize / 2;
                    let y = coords.y * this.cellSize + this.cellSize / 2;
                    const nativeFriendSize = friend.getImg().width || 64;
                    const scaleFriend = 0.85 * this.cellSize / nativeFriendSize;
                    friend.getImg().setPosition(x, y).setScale(scaleFriend);
            }
        });
        this.enemies.forEach(enemy => {
            if (enemy && enemy.getImg()) {
                let coords = Utils.getCoords(enemy.getLocation());
                let x = coords.x * this.cellSize + enemy.getImg().originX * this.cellSize;
                let y = coords.y * this.cellSize + enemy.getImg().originY * this.cellSize;
                enemy.getImg().setPosition(x, y).setDisplaySize(this.cellSize, this.cellSize);
            }
        });
        // Update control buttons - just recreate the container with new positions
        this.createControlButtons();
    }

    createUI() {
        const { width, height } = this.scale.gameSize;
        
        // Responsive font sizes based on canvas size
        const levelFontSize = Math.max(Math.min(Math.round(height * 0.04), 32), 18);
        const movesFontSize = Math.max(Math.min(Math.round(height * 0.035), 28), 16);
        const tooltipFontSize = Math.max(Math.min(Math.round(height * 0.025), 20), 14);
        
        // Add level info - responsive positioning and sizing
        this.text_level = this.add.text(this.uiAreaX, this.uiAreaY, 'Level: ' + this.level.getId(), {
            fontSize: levelFontSize + 'px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: Math.max(Math.round(levelFontSize * 0.1), 2)
        });
        
        this.text_moves = this.add.text(this.uiAreaX, this.uiAreaY + levelFontSize + 5, '', {
            fontSize: movesFontSize + 'px', 
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: Math.max(Math.round(movesFontSize * 0.1), 2)
        });
        this.updateMovesCounter();
        
        this.createControlButtons();
        
        // Tooltip setup - responsive
        this.tooltip = this.add.text(0, 0, '', { 
            font: tooltipFontSize + 'px Arial', 
            fill: '#fff', 
            backgroundColor: '#222', 
            padding: { x: Math.round(tooltipFontSize * 0.4), y: Math.round(tooltipFontSize * 0.2) } 
        }).setDepth(1000).setVisible(false);
    }

    createControlButtons() {
        // Destroy existing containers and buttons if present
        if (this.controlsContainer) {
            this.controlsContainer.destroy();
            this.controlsContainer = null;
        }
        
        // Clear button references
        this.btnUp = null;
        this.btnDown = null;
        this.btnLeft = null;
        this.btnRight = null;
        this.btnHome = null;
        this.btnMusic = null;
        this.btnReload = null;
        this.btnSolve = null;
        this.btnPrev = null;
        this.btnNext = null;

        const { width, height } = this.scale.gameSize;
        
        // Create the main controls container
        this.controlsContainer = this.add.container(0, 0);
        
        // Compact navigation buttons
        const navBtnSize = Math.max(Math.min(this.cellSize * 0.5, 50), 30);
        const navBtnSpacing = navBtnSize + 8;
        
        // Regular buttons (Home, Music)
        const regularBtnSize = Math.max(Math.min(this.cellSize * 0.6, 60), 40);

        // Responsive button font size
        const navButtonFontSize = Math.max(Math.min(Math.round(height * 0.04), 40), 20);
        const regularButtonFontSize = Math.max(Math.min(Math.round(height * 0.035), 35), 18);
        
        const navButtonStyle = {
            fontSize: navButtonFontSize + 'px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.max(Math.round(navButtonFontSize * 0.08), 2)
        };
        
        const regularButtonStyle = {
            fontSize: regularButtonFontSize + 'px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.max(Math.round(regularButtonFontSize * 0.08), 2)
        };

        if (this.isLandscape) {
            // Landscape layout - controls on right of grid
            const sideAreaWidth = Math.max(width * 0.18, 120);
            const gridRightX = this.gridOffsetX + (this.cellSize * this.gridSize);
            const containerX = gridRightX + sideAreaWidth / 2;
            const containerY = this.gridOffsetY + (this.cellSize * this.gridSize) / 2;
            this.controlsContainer.setPosition(containerX, containerY);
            // Compact navigation buttons arranged in cross pattern
            this.btnUp = this.createButton(0, -navBtnSpacing * 1.5, '↑', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.NORTH));
            this.btnLeft = this.createButton(-navBtnSpacing * 0.6, -navBtnSpacing * 0.5, '←', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.WEST));
            this.btnRight = this.createButton(navBtnSpacing * 0.6, -navBtnSpacing * 0.5, '→', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.EAST));
            this.btnDown = this.createButton(0, navBtnSpacing * 0.5, '↓', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.SOUTH));
            // Home and Music buttons at grid boundaries
            const gridTopY = this.gridOffsetY;
            const gridBottomY = this.gridOffsetY + (this.cellSize * this.gridSize);
            this.btnHome = this.createButton(0, gridTopY - containerY, 'HOME', regularButtonStyle, () => this.fireGoHome());
            this.btnHome.setOrigin(0.5, 0);
            // Reload button just below Home button
            const reloadY = gridTopY - containerY + regularBtnSize + 10;
            this.btnReload = this.createButton(0, reloadY, 'RELOAD', regularButtonStyle, () => this.reloadLevel());
            this.btnReload.setOrigin(0.5, 0);
            // Solve button just below Reload button
            const solveY = reloadY + regularBtnSize + 10;
            this.btnSolve = this.createButton(0, solveY, 'SOLVE', regularButtonStyle, () => this.runSolver());
            this.btnSolve.setOrigin(0.5, 0);
            this.btnMusic = this.createButton(0, gridBottomY - containerY, this.musicEnabled ? 'MUSIC ON' : 'MUSIC OFF', regularButtonStyle, () => this.toggleMusic());
            this.btnMusic.setOrigin(0.5, 1);
            // Add all buttons to container
            this.controlsContainer.add([
                this.btnUp, this.btnLeft, this.btnRight, this.btnDown,
                this.btnHome, this.btnReload, this.btnSolve, this.btnMusic
            ]);
            // Hidden buttons
            this.btnPrev = this.createHiddenButton('PREV', () => this.fireChangeLevel(-1));
            this.btnNext = this.createHiddenButton('NEXT', () => this.fireChangeLevel(1));
        } else {
            // Portrait layout - create bottom container for controls
            const gridBottomY = this.gridOffsetY + (this.cellSize * this.gridSize);
            const containerMargin = Math.max(this.cellSize * 0.6, 30);
            const containerX = this.gridOffsetX + (this.cellSize * this.gridSize) / 2;
            const containerY = gridBottomY + containerMargin;
            
            this.controlsContainer.setPosition(containerX, containerY);

                 console.log('Container x/y:' + this.gridContainer.x + '/' + this.gridContainer.y);
            console.log('Grid Continer width/Height:' +  this.gridContainer.width + '/' + this.gridContainer.height);
            
            // Navigation button cluster (centered in container)
            const navClusterHeight = navBtnSpacing * 1.6;
            const navClusterCenterY = navClusterHeight / 2;
            
            // Navigation buttons positioned relative to container center
            this.btnUp = this.createButton(0, navClusterCenterY - navBtnSpacing * 0.8, '↑', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.NORTH));
            this.btnLeft = this.createButton(-navBtnSpacing, navClusterCenterY, '←', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.WEST));
            this.btnRight = this.createButton(navBtnSpacing, navClusterCenterY, '→', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.EAST));
            this.btnDown = this.createButton(0, navClusterCenterY + navBtnSpacing * 0.8, '↓', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.SOUTH));
            
            // Home and Music buttons positioned at bottom of container
            const bottomRowSpacing = Math.max(this.cellSize * 0.4, 25);
            const bottomRowY = navClusterHeight + bottomRowSpacing;
            
            // Calculate positions relative to grid boundaries but ensure they stay within screen bounds
            const gridLeftX = this.gridOffsetX;
            const gridRightX = this.gridOffsetX + (this.cellSize * this.gridSize);
            const containerCenterX = containerX; // Container center position
            
            // Calculate ideal positions aligned with grid edges
            const idealHomeX = gridLeftX - containerCenterX; // Offset from container center to grid left
            const idealMusicX = gridRightX - containerCenterX; // Offset from container center to grid right
            
            // Ensure buttons stay within screen bounds with some margin
            const screenMargin = 20; // Minimum margin from screen edge
            const maxLeftX = screenMargin - containerCenterX; // Leftmost position relative to container
            const maxRightX = (width - screenMargin) - containerCenterX; // Rightmost position relative to container
            
            // Clamp positions to screen bounds
            const homeX = Math.max(idealHomeX, maxLeftX);
            const musicX = Math.min(idealMusicX, maxRightX);
            // Reload button centered between Home and Music
            const reloadX = (homeX + musicX) / 2;
            this.btnHome = this.createButton(homeX, bottomRowY, 'HOME', regularButtonStyle, () => this.fireGoHome());
            this.btnHome.setOrigin(0, 0.5);
            this.btnReload = this.createButton(reloadX, bottomRowY, 'RELOAD', regularButtonStyle, () => this.reloadLevel());
            this.btnReload.setOrigin(0.5, 0.5);
            this.btnMusic = this.createButton(musicX, bottomRowY, this.musicEnabled ? 'MUSIC ON' : 'MUSIC OFF', regularButtonStyle, () => this.toggleMusic());
            this.btnMusic.setOrigin(1, 0.5);
            
            // Solve button below Reload button (second row)
            const secondRowY = bottomRowY + regularBtnSize + 10;
            this.btnSolve = this.createButton(reloadX, secondRowY, 'SOLVE', regularButtonStyle, () => this.runSolver());
            this.btnSolve.setOrigin(0.5, 0.5);

            // Add all buttons to container
            this.controlsContainer.add([
                this.btnUp, this.btnLeft, this.btnRight, this.btnDown,
                this.btnHome, this.btnReload, this.btnSolve, this.btnMusic
            ]);
            
            // Hidden buttons
            this.btnPrev = this.createHiddenButton('PREV', () => this.fireChangeLevel(-1));
            this.btnNext = this.createHiddenButton('NEXT', () => this.fireChangeLevel(1));
        }
    }

    createButton(x, y, text, style, callback) {
        const button = new Button(this, x, y, text, style, callback);
        button.setOrigin(0.5, 0.5); // Center the button text
        // Don't add to scene directly - will be added to container
        return button;
    }

    createHiddenButton(text, callback) {
        // Create button but don't add to scene - just keep functionality
        return {
            text: text,
            callback: callback,
            active: true,
            disableButtonInteractive: () => {},
            enableButtonInteractive: () => {},
            destroy: () => { this.active = false; }
        };
    }

    createGrid() {
        // Create grid container
        if (this.gridContainer) {
            this.gridContainer.destroy();
        }
        this.gridContainer = this.add.container(this.gridOffsetX, this.gridOffsetY);
        
        // Draw static grid with interactive tooltips
        this.gridCells = [];
        for (let i = 0; i < 36; i++) {
            let coords = Utils.getCoords(i);
            let x = coords.x * this.cellSize; // Position relative to container
            let y = coords.y * this.cellSize; // Position relative to container
            let cell = this.gameLogic.cells[i];
            let imgKey = cell.isBeeHive() ? 'beehive' : cell.isGap() ? 'gap' : cell.isTrap() ? 'trap' : 'vine';
            let img = this.add.image(x, y, imgKey);
            img.setOrigin(0, 0);
            img.setDisplaySize(this.cellSize, this.cellSize);
            img.setInteractive();
            
            img.on('pointerover', pointer => {
                let props = `Cell #${i}\nType: ${cell.getType()}`;
                if (cell.getMovableObj()) {
                    props += `\nContains: ${cell.getMovableObj().constructor.name}`;
                }
                this.tooltip.setText(props);
                this.tooltip.setPosition(pointer.worldX + 10, pointer.worldY + 10);
                this.tooltip.setVisible(true);
            });
            img.on('pointerout', () => this.tooltip.setVisible(false));
            
            this.gridCells[i] = img;
            this.gridContainer.add(img); // Add to container
           
            // // Effet barrel loupe avec preFX sur beehive (uniforme pour toutes les positions)
            // if (imgKey === 'beehive' && img.preFX) {
            //     const barrel = img.preFX.addBarrel(0.8);
            //     this.tweens.add({
            //         targets: barrel,
            //         amount: 1.2,
            //         duration: 1800,
            //         yoyo: true,
            //         repeat: -1,
            //         repeatDelay: 100,
            //         ease: 'Sine.easeInOut',
            //     });
            // }
        }
    }

    createMovablePieces() {
        // Draw movable pieces and link them to their GameLogic counterparts
        // Link Wappo
        this.wappo = this.gameLogic.wappo;
        var img_wappo = this.add.image(0, 0, 'wappo'); // Position initiale neutre
        img_wappo.setOrigin(0.5, 0.5);
        img_wappo.setInteractive();
        img_wappo.on('pointerover', pointer => {
              let props = `Wappo\nStep: ${this.wappo.getStep()}\nOrder: ${this.wappo.getOrder ? this.wappo.getOrder() : 0}\nLocation: ${this.wappo.getLocation()}`;
            this.tooltip.setText(props);
            this.tooltip.setPosition(pointer.worldX + 10, pointer.worldY + 10);
            this.tooltip.setVisible(true);
        });
        img_wappo.on('pointerout', () => this.tooltip.setVisible(false));
        this.wappo.setImg(img_wappo);
        this.gridContainer.add(img_wappo); // Add to grid container

        // Link Friends
        this.friends = this.gameLogic.friends;
        this.friends.forEach(friend => {
            if (!friend) return;
            var img_friend = this.add.image(0, 0, 'friend_' + friend.getStep()); // Position initiale neutre
            img_friend.setOrigin(0.5, 0.5);
            img_friend.setInteractive();
            img_friend.on('pointerover', pointer => {
                let props = `Friend\nStep: ${friend.getStep()}\nOrder: ${friend.getOrder()}\nLocation: ${friend.getLocation()}`;
                this.tooltip.setText(props);
                this.tooltip.setPosition(pointer.worldX + 10, pointer.worldY + 10);
                this.tooltip.setVisible(true);
            });
        img_friend.on('pointerout', () => this.tooltip.setVisible(false));
        friend.setImg(img_friend);
        this.gridContainer.add(img_friend); // Add to grid container
        }); 
            
        // Link Enemies
        this.enemies = this.gameLogic.enemies;
        this.enemies.forEach(enemy => {
            if (!enemy) return;
            let enemyCoords = Utils.getCoords(enemy.getLocation());
            let enemyX = enemyCoords.x * this.cellSize; // Position relative to grid container
            let enemyY = enemyCoords.y * this.cellSize; // Position relative to grid container
            var img_enemy = this.add.image(enemyX, enemyY, 'enemy_' + enemy.getAxis() + "_" + enemy.getStep());
            img_enemy.setOrigin(0.5, 0.5);
            img_enemy.setDisplaySize(this.cellSize, this.cellSize);
            img_enemy.setInteractive();
            
            img_enemy.on('pointerover', pointer => {
                let props = `Enemy\nAxis: ${enemy.getAxis()}\nDirection: ${enemy.getDirection()}\nStep: ${enemy.getStep()}\nOrder: ${enemy.getOrder()}\nLocation: ${enemy.getLocation()}`;
            this.tooltip.setText(props);
            this.tooltip.setPosition(pointer.worldX + 10, pointer.worldY + 10);
            this.tooltip.setVisible(true);
            });
            img_enemy.on('pointerout', () => this.tooltip.setVisible(false));
            enemy.setImg(img_enemy);
            this.updateEnemyImageDirection(enemy);
            this.gridContainer.add(img_enemy); // Add to grid container
        }); 
    }

    setupInput() {
        this.events.once('destroy', function () {
            console.log("SceneMain destroyed");
        }, this);

        // Register the shutdown handler
        this.events.on('shutdown', this.onSceneShutdown, this);

        // Add keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        this.cursors.up.on('down', () => this.fireUserInput(Enum.DIRECTION.NORTH));
        this.cursors.down.on('down', () => this.fireUserInput(Enum.DIRECTION.SOUTH));
        this.cursors.left.on('down', () => this.fireUserInput(Enum.DIRECTION.WEST));
        this.cursors.right.on('down', () => this.fireUserInput(Enum.DIRECTION.EAST));

        // Hidden solver function - Press 'S' to solve level
        const solverKey = this.input.keyboard.addKey('S');
        solverKey.on('down', () => {
            console.log("Solver hotkey pressed!");
            this.runSolver();
        });

        // Détection du swipe tactile pour mobile
        this.input.on('pointerdown', pointer => {
            this._touchStart = { x: pointer.x, y: pointer.y };
        });
        this.input.on('pointerup', pointer => {
            if (!this._touchStart) return;
            const dx = pointer.x - this._touchStart.x;
            const dy = pointer.y - this._touchStart.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            // Seuil minimal pour considérer un swipe
            const threshold = 50;
            if (absDx < threshold && absDy < threshold) {
                this._touchStart = null;
                return;
            }
            let dir = null;
            if (absDx > absDy) {
                dir = dx > 0 ? Enum.DIRECTION.EAST : Enum.DIRECTION.WEST;
            } else {
                dir = dy > 0 ? Enum.DIRECTION.SOUTH : Enum.DIRECTION.NORTH;
            }
            this.fireUserInput(dir);
            this._touchStart = null;
        });
    }

    repositionElements() {
        // Reposition grid container
        if (this.gridContainer) {
            this.gridContainer.setPosition(this.gridOffsetX, this.gridOffsetY);
        }
        
        // Reposition grid elements (relative to container)
        for (let i = 0; i < 36; i++) {
            if (this.gridCells && this.gridCells[i]) {
                let coords = Utils.getCoords(i);
                let x = coords.x * this.cellSize; // Relative to container
                let y = coords.y * this.cellSize; // Relative to container
                this.gridCells[i].setPosition(x, y).setDisplaySize(this.cellSize, this.cellSize);
            }
        }

        // Reposition UI text elements with updated font sizes
        const { width, height } = this.scale.gameSize;
        const levelFontSize = Math.max(Math.min(Math.round(height * 0.04), 32), 18);
        const movesFontSize = Math.max(Math.min(Math.round(height * 0.035), 28), 16);
        
        if (this.text_level) {
            this.text_level.setPosition(this.uiAreaX, this.uiAreaY);
            this.text_level.setFontSize(levelFontSize);
            this.text_level.setStroke('#000000', Math.max(Math.round(levelFontSize * 0.1), 2));
        }
        if (this.text_moves) {
            this.text_moves.setPosition(this.uiAreaX, this.uiAreaY + levelFontSize + 5);
            this.text_moves.setFontSize(movesFontSize);
            this.text_moves.setStroke('#000000', Math.max(Math.round(movesFontSize * 0.1), 2));
        }

        // Reposition movable pieces (relative to container)
        if (this.wappo && this.wappo.getImg()) {
            let coords = Utils.getCoords(this.wappo.getLocation());
            let x = coords.x * this.cellSize; // Relative to container
            let y = coords.y * this.cellSize; // Relative to container
            this.wappo.getImg().setPosition(x, y).setDisplaySize(this.cellSize, this.cellSize);
        }

        this.friends.forEach(friend => {
            if (friend && friend.getImg()) {
                let coords = Utils.getCoords(friend.getLocation());
                let x = coords.x * this.cellSize; // Relative to container
                let y = coords.y * this.cellSize; // Relative to container
                friend.getImg().setPosition(x, y).setDisplaySize(this.cellSize, this.cellSize);
            }
        });

        this.enemies.forEach(enemy => {
            if (enemy && enemy.getImg()) {
                let coords = Utils.getCoords(enemy.getLocation());
                let x = coords.x * this.cellSize + this.cellSize / 2;
                let y = coords.y * this.cellSize + this.cellSize / 2;
                enemy.getImg().setPosition(x, y).setDisplaySize(this.cellSize, this.cellSize);
            }
        });

        // Recreate buttons with new positions
        this.createControlButtons();
    }

    async fireUserInput(dir) {
        if (this.isAnimating) {
            console.log("Animation in progress, ignoring input.");
            return;
        }

        this.isAnimating = true;
        // Disable all buttons during animation
        [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnHome, this.btnMusic, this.btnReload, this.btnSolve, this.btnPrev, this.btnNext].forEach(btn => {
            if (btn && btn.disableButtonInteractive) btn.disableButtonInteractive();
        });

        // Run game logic and get status
        const gameStatus = this.gameLogic.simulateTurn(dir);
        
        // IMPORTANT: Toujours animer les mouvements avant de terminer le tour
        // Pour que les animations se déroulent correctement avant d'afficher les messages
        await this.animateMoves(this.gameLogic.lastTurnMoves);
        
        // Pour les tours normaux, on active les inputs
        if (!gameStatus.isWon && !gameStatus.isLost) {
            [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnHome, this.btnMusic, this.btnReload, this.btnSolve, this.btnPrev, this.btnNext].forEach(btn => {
                if (btn && btn.enableButtonInteractive) btn.enableButtonInteractive();
            });
            this.isAnimating = false;
        } else {
            // Pour les fins de jeu (victoire/défaite), on lance les événements
            // de fin de jeu APRÈS l'animation
            if (gameStatus.isWon) {
                this.scene.pause();
                this.scene.launch("SceneGameover", {
                    "status": "WON", 
                    "choosenLevel": this.choosenLevel, 
                    "moves": this.gameLogic.moves_counter,
                    "score": SaveGameHelper.getCalculatedScore(this.gameLogic.moves_counter, this.level.basescore)
                });
            } else if (gameStatus.isLost) {
                this.scene.pause();
                this.scene.launch("SceneGameover", {
                    "status": "DIED", 
                    "choosenLevel": this.choosenLevel, 
                    "moves": this.gameLogic.moves_counter
                });
            }
            
            // Assurez-vous que les contrôles sont réactivés après la fin du jeu
            [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnHome, this.btnMusic, this.btnReload, this.btnSolve, this.btnPrev, this.btnNext].forEach(btn => {
                if (btn && btn.enableButtonInteractive) btn.enableButtonInteractive();
            });
            this.isAnimating = false;
        }
    }

    /**
     * Animates all moves collected during a turn simulation
     */
    async animateMoves(moves) {
        for (const moveSet of moves) {
            const animPromises = moveSet.map(move => {
                if (move.piece instanceof Enemy && move.dir) {
                    this.updateEnemyImageDirection(move.piece, move.dir);
                }
                return move.isBlocked ? this.animateStay(move.piece, move.dir) : this.animateMove(move.piece, move.toXY);
            });
            await Promise.all(animPromises);
        }
    }

    /**
     * Animates a piece moving to a new cell.
     */
    animateMove(obj, target_cellXY) {
        // Animate to cell position, taking origin into account
        const img = obj.getImg();
        const x = target_cellXY.x * this.cellSize + img.originX * this.cellSize;
        const y = target_cellXY.y * this.cellSize + img.originY * this.cellSize;
        return new Promise(resolve => {
            this.tweens.add({
                targets: img,
                duration: 500,
                x: x,
                y: y,
                ease: 'Power2',
                onComplete: () => resolve()
            });
        });
    }

    /**
     * Animates a piece staying in place (e.g., a small bounce).
     */
    animateStay(obj, dir) {
        // Directional blocked bounce effect
        return new Promise((resolve) => {
            const img = obj.getImg();
            const originalX = img.x;
            const originalY = img.y;
            const amplitude = this.cellSize * 0.1;
            let prop, target;
            if (dir === Enum.DIRECTION.NORTH) {
                prop = 'y'; target = originalY - amplitude;
            } else if (dir === Enum.DIRECTION.SOUTH) {
                prop = 'y'; target = originalY + amplitude;
            } else if (dir === Enum.DIRECTION.EAST) {
                prop = 'x'; target = originalX + amplitude;
            } else if (dir === Enum.DIRECTION.WEST) {
                prop = 'x'; target = originalX - amplitude;
            }
            if (prop !== undefined) {
                const tweenConfig = {
                    targets: img,
                    duration: 200,
                    yoyo: true,
                    repeat: 0,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        img.x = originalX;
                        img.y = originalY;
                        resolve();
                    }
                };
                tweenConfig[prop] = target;
                this.tweens.add(tweenConfig);
            } else {
                // No direction: do nothing
                resolve();
            }
        });
    }

    /**
     * Updates the visual orientation (flipX, flipY) of an enemy's sprite
     * to match its current direction.
     */
    updateEnemyImageDirection(enemy, forcedDir) {
        const img = enemy.getImg();
        if (!img) return;

        img.flipX = false;
        img.flipY = false;

        const dir = forcedDir || enemy.getDirection();
        const axis = enemy.getAxis();

        if (axis === 'H') {
            if (dir === Enum.DIRECTION.WEST) {
                img.flipX = true;
            }
        } else if (axis === 'V') {
            // Pour les ennemis verticaux, utiliser les frames du spritesheet
            // Frame 0 = monte (NORTH), Frame 1 = descend (SOUTH)
            if (dir === Enum.DIRECTION.SOUTH) {
                img.setFrame(1); // Frame pour descendre
            } else {
                img.setFrame(0); // Frame pour monter
            }
        } else if (axis === 'D') {
            switch (dir) {
                case Enum.DIRECTION.NORTH_EAST:
                    img.flipX = true;
                    break;
                case Enum.DIRECTION.SOUTH_WEST:
                    img.flipY = true;
                    break;
                case Enum.DIRECTION.SOUTH_EAST:
                    img.flipX = true;
                    img.flipY = true;
                    break;
            }
        }
    }

    fireChangeLevel(delta) {
        if (this.isAnimating) return;
        
        let newLevel = this.choosenLevel + delta;
        if (newLevel >= 0 && newLevel <= 200) {
            this.scene.start('SceneMain', { "choosenLevel": newLevel });
        } else {
            console.log(`Level ${newLevel} is out of bounds (0-200).`);
        }
    }

    onSceneShutdown() {
        console.log("SceneMain shutdown initiated.");
        
        // Remove resize listener
        this.scale.off('resize', this.handleResize, this);
        
        // Destroy containers which will destroy all contained elements
        if (this.controlsContainer) {
            this.controlsContainer.destroy();
            this.controlsContainer = null;
        }
        
        if (this.gridContainer) {
            this.gridContainer.destroy();
            this.gridContainer = null;
        }
        
        // Cleanup event listeners when scene shuts down
        if (this.gameLogic) {
            // Remove all event listeners for cleaner shutdown
            if (this.gameLogic.eventEmitter) {
                this.gameLogic.eventEmitter.events = {};
            }
        }
        
        // Clear button references
        this.btnUp = null;
        this.btnDown = null;
        this.btnLeft = null;
        this.btnRight = null;
        this.btnHome = null;
        this.btnMusic = null;
        this.btnReload = null;
        this.btnSolve = null;
        this.btnPrev = null;
        this.btnNext = null;

        if (this.cursors) {
            this.cursors.up.off('down');
            this.cursors.down.off('down');
            this.cursors.left.off('down');
            this.cursors.right.off('down');
        }
        this.cursors = null;
        
        // Clear refs but don't destroy game objects owned by GameLogic
        this.wappo = null;
        this.friends = [];
        this.enemies = [];
        this.gameLogic = null;
        this.level = null;
        this.text_moves = null;
        this.text_level = null;
        this.gridCells = null;
    }

    // Cette méthode n'est plus utilisée car remplacée par les événements du GameLogic
    // Elle est conservée pour compatibilité avec d'autres parties du code
    updateGameStatus(died, won) {
        // Fonction vide car les événements remplacent cette fonctionnalité
        console.log("updateGameStatus called but is now deprecated");
    }

    updateMovesCounter() {
        this.text_moves.setText('Moves: ' + this.gameLogic.moves_counter + "/" + this.level.getBasescore());
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        console.log('Music toggled:', this.musicEnabled ? 'ON' : 'OFF');
        
        // Update button text
        if (this.btnMusic) {
            this.btnMusic.setText(this.musicEnabled ? 'MUSIC ON' : 'MUSIC OFF');
        }
        
        // TODO: Implement actual music control logic here
        // Example: this.sound.mute = !this.musicEnabled;
    }

    showConfirmDialog(callback) {
        var dialog = Utils.CreateDialog(this);
        dialog.setPosition(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2);
        dialog.layout();
        dialog.modalPromise({
            manualClose: true,
            duration: {
                in: 500,
                out: 500
            }
        }).then(callback);
    }

    fireGoHome() {
        this.showConfirmDialog((data) => this.goHome(data));
    }

    goHome(data) {
        console.log(data);
        if (data.text == 'Yes') {
            this.scene.start('SceneHome');
        }
    }

    runSolver() {
        console.log("Attempting to solve level " + this.level.getId() + "...");
        // Disable all buttons during solving
        [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnHome, this.btnMusic, this.btnReload, this.btnSolve, this.btnPrev, this.btnNext].forEach(btn => {
            if (btn && btn.disableButtonInteractive) btn.disableButtonInteractive();
        });

        const solution = Solver.solve(this.level, { algorithm: 'PureBacktracking' });
        console.log("Solver finished.");
        console.log(solution);

        // Re-enable all buttons after solving
        [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnHome, this.btnMusic, this.btnReload, this.btnSolve, this.btnPrev, this.btnNext].forEach(btn => {
            if (btn && btn.enableButtonInteractive) btn.enableButtonInteractive();
        });
    }

    reloadLevel() {
        if (this.isAnimating) return;
        this.showConfirmDialog((data) => {
            if (data.text == 'Yes') {
                this.scene.restart({ "choosenLevel": this.choosenLevel });
            }
        });
    }
}
