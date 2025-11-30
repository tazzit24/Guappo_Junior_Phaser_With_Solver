import { SaveGameHelper } from '../game/SaveGameHelper.js';
import { Utils } from '../game/Utils.js';

export class SceneScores extends Phaser.Scene {
   
    constructor() {
        super('SceneScores');
    }

    preload() {
        const progress = Utils.createLoadingProgressBar(this, { text: 'Loading scores...', backgroundColor: '#000000' });
        this.load.on('progress', progress.updateProgress);
        this.load.on('complete', progress.destroyProgress);

        // RexUI plugin is loaded globally in Main.js
    }

    create() {
        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);
        // Direct reference to the Phaser cache JSON
        this.levelsJson = JSON.parse(this.cache.text.get('levels'));
        // Responsive configuration
        // Using this.scale.gameSize for responsive layout
        // Pagination: 50 levels per page (calculated without copying)
        this.currentPage = this.currentPage || 0;
        this.levelsPerPage = 50;
        const totalPlayableLevels = this.levelsJson.levels.reduce((count, level) => parseInt(level.level) > 0 ? count + 1 : count, 0);
        this.totalPages = Math.ceil(totalPlayableLevels / this.levelsPerPage);
        this.startIndex = this.currentPage * this.levelsPerPage;
        this.endIndex = this.startIndex + this.levelsPerPage;
        // Initial responsive layout calculation
        this.calculateLayout();
        // Create responsive grid first (needed to compute alignment)
        this.createResponsiveGrid();
        // Create navigation container aligned to the right of the grid
        this.createNavContainer(this.startIndex, this.endIndex);
        // Back button aligned on the left edge of the grid
        this.createBackButton();
    }

    showLevelDetail(levelData) {
        // Close previous detail panel if it exists
        if (this.detailPanel) {
            this.detailPanel.destroy();
            this.detailPanel = null;
        }
        const gameWidth = this.scale.gameSize.width;
        const gameHeight = this.scale.gameSize.height;
        const panelWidth = Math.min(gameWidth * 0.85, 700);
        const panelHeight = Math.min(gameHeight * 0.7, 520);
        // Detail panel
        this.detailPanel = this.add.container(gameWidth / 2, gameHeight / 2);
        // Semi-transparent background
        const overlay = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x000000, 0.7)
            .setInteractive()
            .on('pointerdown', () => {
                this.detailPanel.destroy();
                this.detailPanel = null;
            });
        // Main panel
        const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e)
            .setStrokeStyle(2, 0x4a90e2);
        
        // Level title - large font
        const titleFontSize = Math.max(Math.round(panelHeight * 0.12), 36);
        const title = this.add.text(0, -panelHeight/2 + 80, `Level ${levelData.levelId}`, {
            fontSize: titleFontSize + 'px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth * 0.9, useAdvancedWrap: true }
        }).setOrigin(0.5);

        // Info font size must be defined before use
        const infoFontSize = Math.max(Math.round(titleFontSize * 0.22), 36); // divided by 2

        // Display the target
        let targetText = null;
        if (levelData && typeof levelData.baseScore !== 'undefined' && levelData.baseScore !== '') {
            targetText = this.add.text(0, 0, `Target: ${levelData.baseScore}`, {
                fontSize: infoFontSize + 'px',
                fontFamily: 'Arial',
                color: '#FFD700',
                fontStyle: 'bold',
                align: 'center',
            }).setOrigin(0.5);
        }
        // Fix: position targetText just below the title, inside the panel
        if (targetText) {
            targetText.setY(title.y + title.height/2 + targetText.height/2 + 12);
        }

        // Score information - compact format on 2 lines with dates
        let infoText = '';
        if (levelData && (levelData.scoreData && (levelData.scoreData.lastScore !== undefined || typeof levelData.scoreData.bestScore !== 'undefined'))) {
            let bestLine = '- Best: ';
            bestLine += (typeof levelData.scoreData.bestScore !== 'undefined' ? SaveGameHelper.getDisplayScore(levelData.scoreData.bestScore) : '');
            if (levelData.scoreData.dateBest) bestLine += ` (${new Date(levelData.scoreData.dateBest).toLocaleDateString()})`;
            let lastLine = '- Last: ';
            if (levelData.scoreData.lastScore !== undefined) lastLine += SaveGameHelper.getDisplayScore(levelData.scoreData.lastScore);
            if (levelData.scoreData.dateLast) lastLine += ` (${new Date(levelData.scoreData.dateLast).toLocaleDateString()})`;
            infoText = `${bestLine}\n${lastLine}`;
        } else {
            infoText = 'Not played yet';
        }


        const info = this.add.text(0, 0, infoText, {
            fontSize: infoFontSize + 'px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            align: 'center',
            wordWrap: { width: panelWidth * 0.95, useAdvancedWrap: true },
            lineSpacing: Math.round(infoFontSize * 0.38)
        }).setOrigin(0.5);

        // Vertical offset to separate from the title
        let infoYOffset = 95;
        info.y = title.y + titleFontSize/2 + info.height/2 + infoYOffset;

        // Buttons - large font
        const btnFontSize = Math.max(Math.round(titleFontSize * 0.8), 32); // divided by 2
        const btnY = panelHeight/2 - 80;
        const playBtn = this.add.text(-panelWidth/4, btnY, (!levelData.scoreData) ? 'Play' : 'Replay', {
            fontSize: btnFontSize + 'px',
            fontFamily: 'Arial',
            color: '#2196f3',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerdown', () => {
            this.detailPanel.destroy();
            this.detailPanel = null;
            this.scene.start('SceneMain', { choosenLevel: levelData.levelId });
        })
        .on('pointerover', () => playBtn.setColor('#FFFFFF'))
        .on('pointerout', () => playBtn.setColor('#2196f3'));

        const closeBtn = this.add.text(panelWidth/4, btnY, 'Close', {
            fontSize: btnFontSize + 'px',
            fontFamily: 'Arial',
            color: '#e53935',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerdown', () => {
            this.detailPanel.destroy();
            this.detailPanel = null;
        })
        .on('pointerover', () => closeBtn.setColor('#FFFFFF'))
        .on('pointerout', () => closeBtn.setColor('#e53935'));

        const detailChildren = [overlay, bg, title];
        if (targetText) detailChildren.push(targetText);
        detailChildren.push(info, playBtn, closeBtn);
        this.detailPanel.add(detailChildren);
    }

    calculateLayout() {
        const gameWidth = this.scale.gameSize.width;
        const gameHeight = this.scale.gameSize.height;
        // Responsive navigation bar - minimum height guaranteed
        this.navHeight = Math.max(Math.round(gameHeight * 0.10), 80);
        this.navY = this.navHeight / 2;
        this.centerX = gameWidth / 2;
        this.navFontSize = Math.max(Math.round(this.navHeight * 0.45), 28);
        // 2. Base horizontal spacing (will be adjusted dynamically in create)
        this.navBtnOffset = Math.max(Math.round(gameWidth * 0.18), 150);
        this.homeBtnFontSize = this.navFontSize;
        this.navBtnFontSize = this.navFontSize;
        // 1. Reduce the title size
        this.titleFontSize = Math.round(this.navFontSize * 0.6);
        // Exact position will be adjusted dynamically in create()
        this.titleX = this.centerX;
        this.homeBtnX = this.centerX - this.navBtnOffset * 1.5;
        this.prevBtnX = this.centerX - this.navBtnOffset * 0.5;
        this.nextBtnX = this.centerX + this.navBtnOffset * 0.5;
        // Centralized styles for buttons/navigation
        this.homeBtnStyle = {
            fontSize: this.homeBtnFontSize + 'px',
            fontFamily: 'Arial',
            color: '#4a90e2',
            stroke: '#000',
            strokeThickness: 2
        };
        this.navBtnStyle = {
            fontSize: this.navBtnFontSize + 'px',
            fontFamily: 'Arial',
            color: '#4a90e2',
            stroke: '#000',
            strokeThickness: 2
        };
        this.titleStyle = {
            fontSize: this.titleFontSize + 'px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000',
            strokeThickness: 3
        };
        
        // Calculations for a truly responsive grid
        this.availableHeight = gameHeight - this.navHeight - 40;
        this.availableWidth = gameWidth - 40;

        // Compute the number of items to display on this page
        const itemsThisPage = Math.min(this.levelsPerPage, Math.max(0, 
            this.levelsJson.levels.reduce((count, level) => 
                parseInt(level.level) > 0 ? count + 1 : count, 0) - this.startIndex));
        
        if (itemsThisPage > 0) {
            // On cherche le plus grand nombre de colonnes possible avec des cases >= 110px
            let bestCols = 5;
            let bestCellSize = 0;
            for (let c = 5; c >= 1; c--) {
                const size = Math.floor((this.availableWidth - (c - 1) * 10) / c);
                if (size >= 110) {
                    bestCols = c;
                    bestCellSize = size;
                    break;
                }
            }
            this.cols = bestCols;
            this.cellSize = Math.min((bestCellSize ? bestCellSize + 5 : 115), 145); // +5px only on the cell
            this.rows = Math.max(1, Math.ceil(itemsThisPage / this.cols));
        } else {
            // Fallback for empty page
            this.cols = 1;
            this.rows = 1;
            this.cellSize = 115;
        }

        // Panel occupies the available height; the grid will scroll if needed
        this.panelWidth = this.cellSize * this.cols + (this.cols - 1) * 10;
        this.panelHeight = this.availableHeight;
        this.panelY = this.navHeight + 20 + this.panelHeight / 2;
    }

    handleResize() {
        this.calculateLayout();
        this.updateLayout();
    }

    updateLayout() {
        // Full panel update and grid recreation
        if (this.panel) {
            this.panel.destroy();
            this.createResponsiveGrid();
            this.updateNavContainerPosition();
            this.updateBackButtonPosition();
        }
    }
    
    createResponsiveGrid() {
        const rexUI = this.rexUI;
        
        // Create the panel with the new dimensions
        this.panel = rexUI.add.scrollablePanel({
            x: this.centerX,
            y: this.panelY,
            width: this.panelWidth,
            height: this.panelHeight,
            scrollMode: 0,
            background: this.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0x1a1a2e),
            panel: {
                child: rexUI.add.gridSizer({
                    column: this.cols,
                    row: this.rows,
                    columnProportions: 0,
                    rowProportions: 0,
                    space: { column: 10, row: 10 }
                }),
            },
            slider: {
                track: this.add.rectangle(0, 0, 15, 40, 0x666666),
                thumb: this.add.rectangle(0, 0, 15, 40, 0x4a90e2),
            },
            mouseWheelScroller: { focus: false, speed: 0.1 },
            clamperEnable: true,
            header: false,
            footer: false,
            space: { left: 10, right: 10, top: 10, bottom: 10 },
        }).layout();

        // Fill the grid - generate items on the fly without copying
        const gridSizer = this.panel.getElement('panel');
        let validLevelCount = 0;
        let addedToGrid = 0;
        
        for (let i = 0; i < this.levelsJson.levels.length && addedToGrid < this.levelsPerPage; i++) {
            const level = this.levelsJson.levels[i];
            if (parseInt(level.level) <= 0) continue;

            if (validLevelCount >= this.startIndex) {
                const levelId = parseInt(level.level);

                let scoreData = null;
                let bestScore = 0;
                scoreData = SaveGameHelper.getLevelScore(levelId);
                if (scoreData && typeof scoreData.bestScore !== 'undefined') {
                    bestScore = scoreData.bestScore;
                }

                    // Add baseScore from level detail
                let baseScore = 0;
                if (level.detail && typeof level.detail.basescore !== 'undefined') {
                    baseScore = Number(level.detail.basescore);
                }

                // Compute number of stars:
                let stars = 0;
                if (scoreData) {
                    if (bestScore > 0 && bestScore >= baseScore) {
                        stars = 2;
                    } else {
                        stars = 1;
                    }
                }

                // Cell with responsive size
                const bg = this.add.rectangle(0, 0, this.cellSize, this.cellSize, 0x2a2a3a).setStrokeStyle(1, 0xffffff);
                // Display level number (line 1)
                const fontSize = Math.max(Math.round(this.cellSize * 0.27), 18);
                const lineSpacing = Math.max(Math.round(this.cellSize * 0.12), 6);
                const labelNum = this.add.text(0, -fontSize * 0.7, `${levelId}`, {
                    fontSize: fontSize + 'px',
                    fontFamily: 'Arial',
                    color: '#FFFFFF',
                    fontStyle: 'bold',
                    align: 'center',
                    wordWrap: { width: this.cellSize - 4, useAdvancedWrap: true }
                }).setOrigin(0.5, 0.5);

                // Display stars (line 2, overlaid, each star is a text object)
                const starFont = Math.round(fontSize * 0.95);
                const yStars = fontSize * 0.85;
                // Star 1
                const star1 = this.add.text(-starFont * 0.6, yStars, stars >= 1 ? '★' : '☆', {
                    fontSize: starFont + 'px',
                    fontFamily: 'Arial',
                    color: stars >= 1 ? '#FFD700' : '#FFFFFF',
                    fontStyle: 'bold',
                    align: 'center',
                }).setOrigin(0.5, 0.5);
                // Star 2
                const star2 = this.add.text(starFont * 0.6, yStars, stars >= 2 ? '★' : '☆', {
                    fontSize: starFont + 'px',
                    fontFamily: 'Arial',
                    color: stars >= 2 ? '#FFD700' : '#FFFFFF',
                    fontStyle: 'bold',
                    align: 'center',
                }).setOrigin(0.5, 0.5);

                const iconContainer = this.add.container(0, 0, [labelNum, star1, star2]);
                iconContainer.setSize(this.cellSize, this.cellSize);
                const levelBox = rexUI.add.label({
                    width: this.cellSize,
                    height: this.cellSize,
                    background: bg,
                    icon: iconContainer,
                    space: { left: 0, right: 0, top: 0, bottom: 0 },
                });

                levelBox.levelId = levelId;
                levelBox.bestScore = bestScore;
                levelBox.scoreData = scoreData;
                levelBox.baseScore = baseScore;
                gridSizer.add(levelBox);
                addedToGrid++;
            }
            validLevelCount++;
        }
        
        // Empty cells
        const totalCells = this.cols * this.rows;
        for (let i = addedToGrid; i < totalCells; i++) {
            gridSizer.add(this.add.rectangle(0, 0, this.cellSize, this.cellSize, 0x333333, 0));
        }
        
        this.panel.layout();
        this.panel.setChildrenInteractive({ targets: [this.panel.getElement('panel')] });
        // Click handler for a cell (in createResponsiveGrid)
        this.panel.on('child.click', (child, pointer, event) => {
            if (child.levelId !== undefined) {
                this.showLevelDetail(child);
            }
        });
    }

    createBackButton() {
        // Compute the left edge position of the grid
        const panelLeft = this.panel.x - this.panelWidth / 2;
        
        // Create back button with arrow icon
        this.backBtn = this.add.text(panelLeft, this.navY, '↩', this.homeBtnStyle)
            .setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => this.scene.start('SceneHome'))
            .on('pointerover', () => this.backBtn.setColor('#FFFFFF'))
            .on('pointerout', () => this.backBtn.setColor('#4a90e2'));
    }
    
    createNavContainer(startIndex, endIndex) {
        // Destroy existing container if any
        if (this.navContainer) {
            this.navContainer.destroy();
        }
        
        const scoresLabel = 'Scores';
        const rangeLabel = `${startIndex + 1}-${endIndex}`;
        
        // Create navigation elements
        this.prevBtn = this.add.text(0, 0, '◀', this.navBtnStyle).setOrigin(0.5);
        this.titleScores = this.add.text(0, 0, scoresLabel, this.titleStyle).setOrigin(0, 0.5);
        this.titleRange = this.add.text(0, 0, rangeLabel, this.titleStyle).setOrigin(0, 0.5);
        this.nextBtn = this.add.text(0, 0, '▶', this.navBtnStyle).setOrigin(0.5);
        
        // Relative positioning of elements
        const gap = 18;
        const arrowPad = 12;
        
        this.prevBtn.x = 0;
        this.titleScores.x = this.prevBtn.x + this.prevBtn.width/2 + arrowPad;
        this.titleRange.x = this.titleScores.x + this.titleScores.width + gap;
        this.nextBtn.x = this.titleRange.x + this.titleRange.width + this.nextBtn.width/2 + arrowPad;
        
        // Create the container
        this.navContainer = this.add.container(0, this.navY, [this.prevBtn, this.titleScores, this.titleRange, this.nextBtn]);
        
        // Position the container aligned to the right of the grid
        this.updateNavContainerPosition();
        
        // Manage button states
        this.updateNavButtonStates();
    }
    
    updateNavContainerPosition() {
        if (this.navContainer && this.panel) {
            const gridRight = this.panel.x + this.panelWidth / 2;
            const containerWidth = this.nextBtn.x + this.nextBtn.width/2;
            this.navContainer.x = gridRight - containerWidth;
        }
    }
    
    updateNavButtonStates() {
        if (!this.prevBtn || !this.nextBtn) return;
        
        // Previous button
        if (this.currentPage > 0) {
            this.prevBtn.setColor('#4a90e2')
                .setInteractive({ cursor: 'pointer' })
                .setAlpha(1)
                .removeAllListeners()
                .on('pointerdown', () => { this.currentPage--; this.scene.restart(); })
                .on('pointerover', () => this.prevBtn.setColor('#FFFFFF'))
                .on('pointerout', () => this.prevBtn.setColor('#4a90e2'));
        } else {
            this.prevBtn.setColor('#888888')
                .disableInteractive()
                .setAlpha(0.5)
                .removeAllListeners();
        }
        
        // Next button
        if (this.currentPage < this.totalPages - 1) {
            this.nextBtn.setColor('#4a90e2')
                .setInteractive({ cursor: 'pointer' })
                .setAlpha(1)
                .removeAllListeners()
                .on('pointerdown', () => { this.currentPage++; this.scene.restart(); })
                .on('pointerover', () => this.nextBtn.setColor('#FFFFFF'))
                .on('pointerout', () => this.nextBtn.setColor('#4a90e2'));
        } else {
            this.nextBtn.setColor('#888888')
                .disableInteractive()
                .setAlpha(0.5)
                .removeAllListeners();
        }
    }

    updateBackButtonPosition() {
        if (this.backBtn) {
            const panelLeft = this.panel.x - this.panelWidth / 2;
            this.backBtn.setPosition(panelLeft, this.navY);
        }
    }

    onSceneShutdown() {
        // Clean up resize listener
        this.scale.off('resize', this.handleResize, this);
    }
}
