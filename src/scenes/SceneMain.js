'use strict';

import { Level } from '../game/Level.js';
import { GameLogic } from '../game/GameLogic.js';
import { Button } from '../ui/Button.js';
import { DragFeedback } from '../ui/DragFeedback.js';
import { Enum } from '../game/Enum.js';
import { Utils } from '../game/Utils.js';
import { Enemy } from '../objects/Enemy.js';
import { Solver } from '../solver/Solver.js';
import { SaveGameHelper } from '../game/SaveGameHelper.js';
import { IconButton } from '../ui/IconButton.js';
import { SolverDialog } from '../ui/SolverDialog.js';
import { GlobalSettings } from '../game/GlobalSettings.js';

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
    btnPrev = null;
    btnNext = null;

    // UI Containers
    controlsContainer = null; // Container for the control buttons
    uiContainer = null; // Container for the UI elements
    gridContainer = null; // Container for the grid and pieces
    headerBackground = null; // Background for the header area in portrait mode
    homeIcon = null; // Home icon button
    reloadIcon = null; // Reload icon button
    musicIcon = null; // Music icon button
    hintIcon = null; // Hint icon button

    joystick_dir; // Joystick for directional input
    isAnimating = false; // Flag to prevent input during animation
    // musicEnabled = true; // Music state - Now using GlobalSettings
    inputDisabled = false; // Flag to prevent all input during solver calculation

    // Utility methods to centralize control management
    disableAllControls() {
        [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnHome, this.btnMusic, this.btnReload, this.btnPrev, this.btnNext].forEach(btn => {
            if (btn && btn.disableButtonInteractive) btn.disableButtonInteractive();
        });
        if (this.homeIcon) this.homeIcon.setEnabled(false);
        if (this.reloadIcon) this.reloadIcon.setEnabled(false);
        if (this.musicIcon) this.musicIcon.setEnabled(false);
        if (this.hintIcon) this.hintIcon.setEnabled(false);
        this.dragFeedbackEnabled = false;
    }

    enableAllControls() {
        [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnHome, this.btnMusic, this.btnReload, this.btnPrev, this.btnNext].forEach(btn => {
            if (btn && btn.enableButtonInteractive) btn.enableButtonInteractive();
        });
        if (this.homeIcon) this.homeIcon.setEnabled(true);
        if (this.reloadIcon) this.reloadIcon.setEnabled(true);
        if (this.musicIcon) this.musicIcon.setEnabled(true);
        if (this.hintIcon) this.hintIcon.setEnabled(true);
        this.dragFeedbackEnabled = true;
    }

    /**
     * Helper method to show a modal dialog and automatically manage input blocking.
     * Disables all controls before showing the modal and re-enables them after it closes.
     * @param {Function} dialogCreator - Function that creates and returns the dialog
     * @returns {Promise} - Promise that resolves when the modal closes
     */
    showModalDialog(dialogCreator) {
        // Disable ALL input during modal
        this.inputDisabled = true;
        this.disableAllControls();
        
        const dialog = dialogCreator();
        
        return dialog.modalPromise({
            manualClose: true,
            duration: {
                in: 500,
                out: 500
            }
        }).then((data) => {
            // Re-enable ALL input after modal closes
            this.inputDisabled = false;
            this.enableAllControls();
            return data;
        });
    }
    
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
    dragFeedback = null;
    dragFeedbackEnabled = true;

    constructor() {
        super('SceneMain');
    }

    init(msg) {
        this.choosenLevel = msg.choosenLevel;
    }

    preload() {
        this.load.text('levels', 'assets/levels/levels.json');
        this.load.image('boardBackground', 'assets/images/BoardBackground.png');
        this.load.image('vine', 'assets/images/vine.png');
        this.load.image('gap', 'assets/images/gap.png');
        this.load.image('trap', 'assets/images/trap.png');
        this.load.image('beehive', 'assets/images/beehive.png');
        this.load.image('wappo', 'assets/images/wappo.png');
        this.load.image('friend_1', 'assets/images/friend1.png');
        this.load.image('friend_2', 'assets/images/friend2.png');
        // Load vertical enemies as spritesheet with 2 frames: 0=up, 1=down
        this.load.spritesheet('enemy_V_1', 'assets/images/ev1.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('enemy_V_2', 'assets/images/ev2.png', { frameWidth: 200, frameHeight: 200 });
        // Load horizontal enemy 1 as spritesheet with 2 frames: 0=right, 1=left
        this.load.spritesheet('enemy_H_1', 'assets/images/eh1.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('enemy_H_2', 'assets/images/eh2.png', { frameWidth: 200, frameHeight: 200 });
        // Load diagonal enemies as spritesheet with 4 frames: 0=NW, 1=NE, 2=SE, 3=SW
        this.load.spritesheet('enemy_D_1', 'assets/images/ed1.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('enemy_D_2', 'assets/images/ed2.png', { frameWidth: 200, frameHeight: 200 });
        // Load icon images for header buttons
        this.load.image('home', 'assets/images/home.png');
        this.load.image('replay', 'assets/images/replay.png');
        this.load.image('volume_on', 'assets/images/volume_on.png');
        this.load.image('volume_off', 'assets/images/volume_off.png');
        this.load.image('hint', 'assets/images/hint.png');
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

    this.dragFeedback = new DragFeedback(this, 950);
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
        const offsetY = this.isLandscape ? 0 : gameHeight * 0.05; // Shift elements down by 5% of height only in portrait mode
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
            this.gridOffsetY = (gameHeight - (this.cellSize * this.gridSize)) / 2 + offsetY;
            // UI area in landscape (left of grid)
            this.uiAreaX = this.gridOffsetX - sideAreaWidth + 10; // 10px padding from left edge of UI area
            this.uiAreaY = 20 + offsetY;
            // Controls area in landscape (right of grid)
            this.controlsAreaX = this.gridOffsetX + gridTotalWidth + sideAreaWidth / 2;
            this.controlsAreaY = gameHeight / 2 + offsetY;
        } else {
            // Portrait: controls at the bottom, UI at top
            const availableGridWidth = gameWidth - gridPadding * 2;
            const availableGridHeight = gameHeight - controlsSpace - uiHeaderSpace - gridPadding * 2;
            this.cellSize = Math.min(availableGridWidth / this.gridSize, availableGridHeight / this.gridSize);
            this.gridOffsetX = (gameWidth - (this.cellSize * this.gridSize)) / 2;
            this.gridOffsetY = uiHeaderSpace + topPadding + offsetY;
            this.controlsAreaX = gameWidth / 2;
            this.controlsAreaY = this.gridOffsetY + (this.cellSize * this.gridSize) + topPadding * 4; // More space for two button rows
            // UI area in portrait (top left)
            this.uiAreaX = 10;
            this.uiAreaY = 10 + offsetY;
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
        
        // Note: 'gameWon'/'gameOver' no longer directly display the end screen
        // Events are emitted, but the UI display is handled in fireUserInput
        // after all movement animations have completed
        
        this.gameLogic.on('gameWon', (data) => {
            console.log('Game won event received, waiting for animations to complete');
            // Actions are now handled after animations complete in fireUserInput
        });
        
        this.gameLogic.on('gameOver', (data) => {
            console.log('Game over event received, waiting for animations to complete');
            // Actions are now handled after animations in fireUserInput
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
            // Portrait mode: labels in the header area (top left)
            if (this.text_level) {
                const headerHeight = height * 0.05;
                const leftMargin = 10;
                // Position level text at top of header
                this.text_level.setPosition(leftMargin, headerHeight * 0.25);
                this.text_level.setOrigin(0, 0.5);
            }
            if (this.text_moves) {
                const headerHeight = height * 0.05;
                const leftMargin = 10;
                // Position moves text at bottom of header
                this.text_moves.setPosition(leftMargin, headerHeight * 0.75);
                this.text_moves.setOrigin(0, 0.5);
                this.text_moves.setAlign('left');
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
            
            // Update background image size (should be the first child of the container)
            const backgroundImg = this.gridContainer.first;
            if (backgroundImg) {
                backgroundImg.setDisplaySize(this.cellSize * this.gridSize, this.cellSize * this.gridSize);
            }
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
                enemy.getImg().setPosition(x, y).setDisplaySize(this.cellSize * 0.5, this.cellSize * 0.5);
            }
        });
        // Update control buttons - just recreate the container with new positions
        this.createControlButtons();

        // Update header background in portrait mode
        if (!this.isLandscape) {
            const offsetY = height * 0.05;
            if (!this.headerBackground) {
                this.headerBackground = this.add.graphics();
                this.headerBackground.setDepth(-1); // Behind other elements
            }
            this.headerBackground.clear();
            this.headerBackground.fillStyle(0x0b1c2b, 0.8); // Dark blue with some transparency
            this.headerBackground.fillRoundedRect(0, 0, width, offsetY, 15); // Rounded rectangle covering the top area
        } else {
            // Destroy header background in landscape mode
            if (this.headerBackground) {
                this.headerBackground.destroy();
                this.headerBackground = null;
            }
        }
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
        
        // Always destroy existing header buttons (they are added directly to scene)
        if (this.btnHome && this.btnHome.scene) {
            this.btnHome.destroy();
            this.btnHome = null;
        }
        if (this.btnReload && this.btnReload.scene) {
            this.btnReload.destroy();
            this.btnReload = null;
        }
        if (this.btnMusic && this.btnMusic.scene) {
            this.btnMusic.destroy();
            this.btnMusic = null;
        }
        
        // Destroy icon buttons
        if (this.homeIcon) {
            this.homeIcon.destroy();
            this.homeIcon = null;
        }
        if (this.reloadIcon) {
            this.reloadIcon.destroy();
            this.reloadIcon = null;
        }
        if (this.musicIcon) {
            this.musicIcon.destroy();
            this.musicIcon = null;
        }
        if (this.hintIcon) {
            this.hintIcon.destroy();
            this.hintIcon = null;
        }
        
        // Clear button references
        this.btnUp = null;
        this.btnDown = null;
        this.btnLeft = null;
        this.btnRight = null;
        this.btnHome = null;
        this.btnMusic = null;
        this.btnReload = null;
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

        // Create icon buttons (always, before orientation-specific code)
        this.homeIcon = new IconButton(this, ['home'], 0, 0, 1.0, () => this.fireGoHome());
        this.reloadIcon = new IconButton(this, ['replay'], 0, 0, 1.0, () => this.reloadLevel());
        this.musicIcon = new IconButton(this, ['volume_on', 'volume_off'], 0, 0, 1.0, () => this.toggleMusic());
        // Sync music icon state with GlobalSettings
        if (this.musicIcon) {
            this.musicIcon.updateTexture(GlobalSettings.musicEnabled ? 0 : 1);
        }
        this.hintIcon = new IconButton(this, ['hint'], 0, 0, 1.0, () => this.runSolver());

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
            
            // Solve button just below navigation
            const solveY = navBtnSpacing * 0.5 + regularBtnSize + 10;
            // this.btnSolve = this.createButton(0, solveY, 'SOLVE', regularButtonStyle, () => this.runSolver());
            // this.btnSolve.setOrigin(0.5, 0);
            
            // Add navigation buttons to container
            this.controlsContainer.add([
                this.btnUp, this.btnLeft, this.btnRight, this.btnDown
                // this.btnSolve
            ]);
            // Hidden buttons
            this.btnPrev = this.createHiddenButton('PREV', () => this.fireChangeLevel(-1));
            this.btnNext = this.createHiddenButton('NEXT', () => this.fireChangeLevel(1));
            
            // Position icons for landscape
            const gridTopY = this.gridOffsetY;
            const displayedIconHeight = this.homeIcon.img.height * this.homeIcon.img.scaleY;
            const iconSpacing = 10;
            let currentY = gridTopY;

            // Position icons vertically in the same column
            this.homeIcon.img.setPosition(containerX, currentY);
            currentY += displayedIconHeight + iconSpacing;

            this.reloadIcon.img.setPosition(containerX, currentY);
            currentY += displayedIconHeight + iconSpacing;

            this.musicIcon.img.setPosition(containerX, currentY);
            currentY += displayedIconHeight + iconSpacing;

            this.hintIcon.img.setPosition(containerX, currentY);
        } else {
            // Portrait layout - create bottom container for controls
            const gridBottomY = this.gridOffsetY + (this.cellSize * this.gridSize);
            const containerMargin = Math.max(this.cellSize * 0.6, 30);
            const containerX = this.gridOffsetX + (this.cellSize * this.gridSize) / 2;
            const containerY = gridBottomY + containerMargin;
            
            this.controlsContainer.setPosition(containerX, containerY);

            // Navigation button cluster (centered in container)
            const navClusterHeight = navBtnSpacing * 1.6;
            const navClusterCenterY = navClusterHeight / 2;
            
            // Navigation buttons positioned relative to container center
            this.btnUp = this.createButton(0, navClusterCenterY - navBtnSpacing * 0.8, '↑', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.NORTH));
            this.btnLeft = this.createButton(-navBtnSpacing, navClusterCenterY, '←', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.WEST));
            this.btnRight = this.createButton(navBtnSpacing, navClusterCenterY, '→', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.EAST));
            this.btnDown = this.createButton(0, navClusterCenterY + navBtnSpacing * 0.8, '↓', navButtonStyle, () => this.fireUserInput(Enum.DIRECTION.SOUTH));
            
            // Solve button remains in the bottom controls
            const bottomRowSpacing = Math.max(this.cellSize * 0.4, 25);
            const bottomRowY = navClusterHeight + bottomRowSpacing;
            const gridLeftX = this.gridOffsetX;
            const gridRightX = this.gridOffsetX + (this.cellSize * this.gridSize);
            const containerCenterX = containerX; // Container center position
            const reloadX = (gridLeftX - containerCenterX + gridRightX - containerCenterX) / 2;
            const secondRowY = bottomRowY + regularBtnSize + 10;
            // this.btnSolve = this.createButton(reloadX, secondRowY, 'SOLVE', regularButtonStyle, () => this.runSolver());
            // this.btnSolve.setOrigin(0.5, 0.5);

            // Add navigation buttons to container
            this.controlsContainer.add([
                this.btnUp, this.btnLeft, this.btnRight, this.btnDown
                // this.btnSolve
            ]);
            
            // Hidden buttons
            this.btnPrev = this.createHiddenButton('PREV', () => this.fireChangeLevel(-1));
            this.btnNext = this.createHiddenButton('NEXT', () => this.fireChangeLevel(1));
            
            // Position icons for portrait
            const headerHeight = height * 0.05;
            const headerButtonY = headerHeight / 2;
            const displayedIconWidth = this.homeIcon.img.width * this.homeIcon.img.scaleX;
            
            // Position music icon at right edge with margin
            this.musicIcon.img.setPosition(width - displayedIconWidth / 2, headerButtonY);
            
            // Align reload icon to the left of music with spacing
            Phaser.Display.Align.To.LeftCenter(this.reloadIcon.img, this.musicIcon.img, displayedIconWidth);
            
            // Align home icon to the left of reload with spacing
            Phaser.Display.Align.To.LeftCenter(this.homeIcon.img, this.reloadIcon.img, displayedIconWidth);
            
            // Align hint icon to the left of home with spacing
            Phaser.Display.Align.To.LeftCenter(this.hintIcon.img, this.homeIcon.img, displayedIconWidth);
        }
    }

    createButton(x, y, text, style, callback) {
        const button = new Button(this, x, y, text, style, callback);
        button.setOrigin(0.5, 0.5); // Center the button text
        // Don't add to scene directly - will be added to container
        return button;
    }

    createHeaderButton(x, y, text, style, callback) {
        const button = new Button(this, x, y, text, style, callback);
        button.setOrigin(0.5, 0.5); // Center the button text
        this.add.existing(button); // Add directly to scene
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
        
        // Add background image to the grid container
        const backgroundImg = this.add.image(0, 0, 'boardBackground');
        backgroundImg.setOrigin(0, 0);
        // Size will be set by updateLayout() which is called right after createGrid()
        this.gridContainer.add(backgroundImg);
        
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
            var img_enemy = this.add.sprite(enemyX, enemyY, 'enemy_' + enemy.getAxis() + "_" + enemy.getStep());
            img_enemy.setOrigin(0.5, 0.5);
            img_enemy.setDisplaySize(this.cellSize * 0.5, this.cellSize * 0.5);
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

        // Detect touch swipe gestures for mobile
        const cancelDragFeedback = pointer => {
            if (!this.dragFeedbackEnabled) return;
            if (this.dragFeedback) {
                this.dragFeedback.end(pointer);
            }
            this._touchStart = null;
        };

        this.input.on('pointerdown', pointer => {
            if (!this.dragFeedbackEnabled) return;
            // Prevent drag feedback from starting in the header area (portrait mode)
            if (!this.isLandscape && pointer.y <= this.scale.gameSize.height * 0.05) return;
            this._touchStart = { x: pointer.x, y: pointer.y };
            if (this.dragFeedback) {
                this.dragFeedback.begin(pointer);
            }
        });
        this.input.on('pointermove', pointer => {
            if (!this.dragFeedbackEnabled) return;
            if (this._touchStart && this.dragFeedback) {
                this.dragFeedback.update(pointer);
            }
        });
        this.input.on('pointerup', pointer => {
            if (!this.dragFeedbackEnabled) return;
            if (this.dragFeedback) {
                this.dragFeedback.end(pointer);
            }
            if (!this._touchStart) {
                return;
            }
            const dx = pointer.x - this._touchStart.x;
            const dy = pointer.y - this._touchStart.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            // Minimum threshold to consider a swipe
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
        this.input.on('pointerupoutside', cancelDragFeedback);
        this.input.on('pointercancel', cancelDragFeedback);
        this.input.on('gameout', cancelDragFeedback);
    }

    async fireUserInput(dir) {
        if (this.isAnimating || this.inputDisabled) {
            console.log("Input disabled, ignoring input.");
            return;
        }

        this.isAnimating = true;
        // Disable all buttons during animation
        this.disableAllControls();

        // Run game logic and get status
        // Always save score for actual player moves (not solver simulations)
        const gameStatus = this.gameLogic.simulateTurn(dir, true);
        
        // IMPORTANT: Always animate moves before ending the turn
        // This ensures animations complete before showing end-of-turn messages
        await this.animateMoves(this.gameLogic.lastTurnMoves);
        
            // For normal turns, re-enable inputs
        if (!gameStatus.isWon && !gameStatus.isLost) {
            this.enableAllControls();
            this.isAnimating = false;
        } else {
            // For end-of-game (win/lose), trigger end-of-game flow
            // AFTER animations have completed
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
            
            // Ensure controls are re-enabled after end of game
            this.enableAllControls();
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
     * Updates the visual orientation of an enemy's sprite
     * to match its current direction using sprite frames.
     */
    updateEnemyImageDirection(enemy, forcedDir) {
        const img = enemy.getImg();
        if (!img) return;

        const dir = forcedDir || enemy.getDirection();
        const axis = enemy.getAxis();

        if (axis === 'H') {
            // Frame 0 = droite (EAST), Frame 1 = gauche (WEST)
            if (dir === Enum.DIRECTION.WEST) {
                img.setFrame(1);
            } else {
                img.setFrame(0);
            }
        } else if (axis === 'V') {
            // Frame 0 = monte (NORTH), Frame 1 = descend (SOUTH)
            if (dir === Enum.DIRECTION.SOUTH) {
                img.setFrame(1);
            } else {
                img.setFrame(0);
            }
        } else if (axis === 'D') {
            // Frame 0 = NO, Frame 1 = NE, Frame 2 = SE, Frame 3 = SO
            switch (dir) {
                case Enum.DIRECTION.NORTH_WEST:
                    img.setFrame(0);
                    break;
                case Enum.DIRECTION.NORTH_EAST:
                    img.setFrame(1);
                    break;
                case Enum.DIRECTION.SOUTH_EAST:
                    img.setFrame(2);
                    break;
                case Enum.DIRECTION.SOUTH_WEST:
                    img.setFrame(3);
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

        // Destroy header background
        if (this.headerBackground) {
            this.headerBackground.destroy();
            this.headerBackground = null;
        }
        
        // Destroy icon buttons
        if (this.homeIcon) {
            this.homeIcon.destroy();
            this.homeIcon = null;
        }
        if (this.reloadIcon) {
            this.reloadIcon.destroy();
            this.reloadIcon = null;
        }
        if (this.musicIcon) {
            this.musicIcon.destroy();
            this.musicIcon = null;
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
        this.btnPrev = null;
        this.btnNext = null;

        if (this.cursors) {
            this.cursors.up.off('down');
            this.cursors.down.off('down');
            this.cursors.left.off('down');
            this.cursors.right.off('down');
        }
        this.cursors = null;

        if (this.dragFeedback) {
            this.dragFeedback.destroy();
            this.dragFeedback = null;
        }
        this._touchStart = null;
        
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

    // This method is no longer used because GameLogic events replace it
    // It is kept for compatibility with other parts of the code
    updateGameStatus(died, won) {
        // No-op because events now provide this functionality
        console.log("updateGameStatus called but is now deprecated");
    }

    updateMovesCounter() {
        this.text_moves.setText('Moves: ' + this.gameLogic.moves_counter + "/" + this.level.getBasescore());
    }

    toggleMusic() {
        GlobalSettings.toggleMusic();
        console.log('Music toggled:', GlobalSettings.musicEnabled ? 'ON' : 'OFF');
        
        // Update icon texture
        if (this.musicIcon) {
            this.musicIcon.updateTexture(GlobalSettings.musicEnabled ? 0 : 1);
        }
        
        // TODO: Implement actual music control logic here
        // Example: this.sound.mute = !GlobalSettings.musicEnabled;
    }

    showConfirmDialog(callback) {
        this.showModalDialog(() => {
            var dialog = Utils.CreateDialog(this);
            dialog.setPosition(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2);
            dialog.layout();
            return dialog;
        }).then(callback);
    }

    showSolverResultDialog(solution) {
        // Disable ALL input during modal
        this.inputDisabled = true;
        this.disableAllControls();

        // Format the solution data for display
        const formatSolution = (sol) => {
            if (!sol) return "Guappo’s quantum satellites are buzzing but not answering... must be the honey interference!";

            if (sol.solved === false) {
                return "No safe route in under 20 moves — Guappo smells honey, but also danger!";
            } else if (sol.solved === true) {
                const movesCount = sol.path ? sol.path.length : 0;
                const suggestedMoves = sol.path ? sol.path.join(' → ') : 'none';
                return `Guappo’s got it! ${movesCount} moves to cosmic sweetness.\nNext suggested moves: ${suggestedMoves}.`;
            } else {
                return "Solver result unclear — Guappo’s thinking circuits are overheating.";
            }
        };

        const { width, height } = this.scale.gameSize;
        const dialogScale = Math.min(width / 400, height / 300);
        
        var dialog = this.rexUI.add.dialog({
            background: this.rexUI.add.roundRectangle(0, 0, 400 * dialogScale, 300 * dialogScale, 20, 0x1a1a2e),

            title: this.rexUI.add.label({
                background: this.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x4a90e2),
                text: this.add.text(0, 0, 'Tactical Buzz', {
                    fontSize: Math.max(18 * dialogScale, 16) + 'px',
                    color: '#FFFFFF'
                }),
                space: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }),

            content: this.add.text(0, 0, formatSolution(solution), {
                fontSize: Math.max(16 * dialogScale, 12) + 'px',
                color: '#FFFFFF',
                wordWrap: { width: 350 * dialogScale }
            }),

            actions: [
                Utils.CreateLabel(this, 'OK', dialogScale)
            ],

            space: {
                title: 25,
                content: 25,
                action: 15,
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },

            align: {
                actions: 'center',
            },

            expand: {
                content: false,
            }
        })
            .on('button.over', function (button, groupName, index, pointer, event) {
                button.getElement('background').setStrokeStyle(1, 0xffffff);
            })
            .on('button.out', function (button, groupName, index, pointer, event) {
                button.getElement('background').setStrokeStyle();
            });

        dialog.setPosition(width / 2, height / 2);
        dialog.layout();
        this.showModalDialog(() => dialog);
    }

    fireGoHome() {
        if (this.isAnimating || this.inputDisabled) return;
        this.showConfirmDialog((data) => this.goHome(data));
    }

    goHome(data) {
        console.log(data);
        if (data.text == 'Yes') {
            this.scene.start('SceneHome');
        }
    }

    async runSolver() {
        console.log("Attempting to solve level " + this.level.getId() + "...");

        // Obtenir la position de l'icône hint pour ancrer la dialog
        let hintIconPosition = null;
        if (this.hintIcon && this.hintIcon.img) {
            const hintBounds = this.hintIcon.img.getBounds();
            hintIconPosition = { x: hintBounds.centerX, y: hintBounds.centerY };
        }

        // Show loading dialog with cancel button
        let cancelled = false;
        const dialog = new SolverDialog(this, () => {
            cancelled = true;
        }, hintIconPosition);
        dialog.show();

        // Start timer for minimum 3 seconds display
        const startTime = Date.now();
        const minDisplayTime = 3000;

        let solution;

        // Check if player has already made moves
        if (this.gameLogic.moves_counter === 0) {
            // No moves yet - solve from initial state with PureBacktracking and basescore limit
            console.log("Solving from initial state with PureBacktracking, max depth:", this.level.getBasescore());
            solution = Solver.solve(this.level, { algorithm: 'PureBacktracking' });
        } else {
            // Player has made moves - solve from current state with BFS and 20 moves limit
            console.log("Solving from current state with BFS, max depth: 20");
            const currentState = this.gameLogic.getStateSnapshot();
            solution = Solver.solve(this.level, {
                algorithm: 'BFS',
                initialState: currentState,
                maxDepth: 20
            });
        }

        console.log("Solver finished.");
        console.log(solution);

        // Wait for minimum display time if needed
        const elapsed = Date.now() - startTime;
        if (elapsed < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
        }

        // Check if cancelled
        if (cancelled) {
            console.log("Solver was cancelled, not showing results");
            dialog.close();
            return;
        }

        // Show solver result in the same dialog
        dialog.showResult(solution);
    }

    reloadLevel() {
        if (this.isAnimating || this.inputDisabled) return;
        this.showConfirmDialog((data) => {
            if (data.text == 'Yes') {
                this.scene.restart({ "choosenLevel": this.choosenLevel });
            }
        });
    }
}
