import { SaveGameHelper } from '../game/SaveGameHelper.js';

export class SceneScores extends Phaser.Scene {
   
    constructor() {
        super('SceneScores');
    }

    preload() {
        // RexUI plugin est chargé globalement dans Main.js
    }

    create() {
        // Écoute les événements de redimensionnement
        this.scale.on('resize', this.handleResize, this);
        // Référence directe au JSON du cache Phaser
        this.levelsJson = JSON.parse(this.cache.text.get('levels'));
        // Configuration responsive
        // Utilisation de this.scale.gameSize pour le layout responsive
        // Pagination : 50 niveaux par page (calcul sans copie)
        this.currentPage = this.currentPage || 0;
        this.levelsPerPage = 50;
        const totalPlayableLevels = this.levelsJson.levels.reduce((count, level) => parseInt(level.level) > 0 ? count + 1 : count, 0);
        this.totalPages = Math.ceil(totalPlayableLevels / this.levelsPerPage);
        this.startIndex = this.currentPage * this.levelsPerPage;
        this.endIndex = this.startIndex + this.levelsPerPage;
        // Calcul initial du layout responsive
        this.calculateLayout();
        // Création de la grille responsive d'abord (nécessaire pour calculer l'alignement)
        this.createResponsiveGrid();
        // Création du container de navigation aligné à droite de la grille
        this.createNavContainer(this.startIndex, this.endIndex);
        // Bouton retour aligné sur le bord gauche de la grille
        this.createBackButton();
    }

    showLevelDetail(levelData) {
        // Ferme le détail précédent s'il existe
        if (this.detailPanel) {
            this.detailPanel.destroy();
            this.detailPanel = null;
        }
        const gameWidth = this.scale.gameSize.width;
        const gameHeight = this.scale.gameSize.height;
        const panelWidth = Math.min(gameWidth * 0.85, 700);
        const panelHeight = Math.min(gameHeight * 0.7, 520);
        // Panneau de détail
        this.detailPanel = this.add.container(gameWidth / 2, gameHeight / 2);
        // Fond semi-transparent
        const overlay = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x000000, 0.7)
            .setInteractive()
            .on('pointerdown', () => {
                this.detailPanel.destroy();
                this.detailPanel = null;
            });
        // Panneau principal
        const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e)
            .setStrokeStyle(2, 0x4a90e2);
        
        // Titre du niveau - x4 police détail
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
        const infoFontSize = Math.max(Math.round(titleFontSize * 0.22), 36); // divisé par 2

        // Affichage du Target
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
        // Correction : positionne targetText juste sous le titre, à l'intérieur du panel
        if (targetText) {
            targetText.setY(title.y + title.height/2 + targetText.height/2 + 12);
        }

        // Informations du score - format compact sur 2 lignes avec dates à côté
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

        // Offset vertical pour espacer du titre
        let infoYOffset = 95;
        info.y = title.y + titleFontSize/2 + info.height/2 + infoYOffset;

        // Boutons - x4 police
        const btnFontSize = Math.max(Math.round(titleFontSize * 0.8), 32); // divisé par 2
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
        // Barre de navigation responsive - taille minimum garantie
        this.navHeight = Math.max(Math.round(gameHeight * 0.10), 80);
        this.navY = this.navHeight / 2;
        this.centerX = gameWidth / 2;
        this.navFontSize = Math.max(Math.round(this.navHeight * 0.45), 28);
        // 2. Espacement horizontal de base (sera ajusté dynamiquement dans create)
        this.navBtnOffset = Math.max(Math.round(gameWidth * 0.18), 150);
        this.homeBtnFontSize = this.navFontSize;
        this.navBtnFontSize = this.navFontSize;
        // 1. Réduit la taille du titre
        this.titleFontSize = Math.round(this.navFontSize * 0.6);
        // La position exacte sera ajustée dynamiquement dans create()
        this.titleX = this.centerX;
        this.homeBtnX = this.centerX - this.navBtnOffset * 1.5;
        this.prevBtnX = this.centerX - this.navBtnOffset * 0.5;
        this.nextBtnX = this.centerX + this.navBtnOffset * 0.5;
        // Styles centralisés pour les boutons/navigation
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
        
        // Calculs pour la grille vraiment responsive
        this.availableHeight = gameHeight - this.navHeight - 40;
        this.availableWidth = gameWidth - 40;

        // Calcul du nombre d'éléments à afficher pour cette page
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
            this.cellSize = Math.min((bestCellSize ? bestCellSize + 5 : 115), 145); // +5px uniquement sur la case
            this.rows = Math.max(1, Math.ceil(itemsThisPage / this.cols));
        } else {
            // Fallback pour page vide
            this.cols = 1;
            this.rows = 1;
            this.cellSize = 115;
        }

        // Le panel occupe toute la hauteur disponible, la grille scroll si besoin
        this.panelWidth = this.cellSize * this.cols + (this.cols - 1) * 10;
        this.panelHeight = this.availableHeight;
        this.panelY = this.navHeight + 20 + this.panelHeight / 2;
    }

    handleResize() {
        this.calculateLayout();
        this.updateLayout();
    }

    updateLayout() {
        // Mise à jour complète du panel et recréation de la grille
        if (this.panel) {
            this.panel.destroy();
            this.createResponsiveGrid();
            this.updateNavContainerPosition();
            this.updateBackButtonPosition();
        }
    }
    
    createResponsiveGrid() {
        const rexUI = this.rexUI;
        
        // Création du panel avec les nouvelles dimensions
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

        // Remplissage de la grille - génération à la volée sans copies
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

                // Ajout basescore depuis detail
                let baseScore = 0;
                if (level.detail && typeof level.detail.basescore !== 'undefined') {
                    baseScore = Number(level.detail.basescore);
                }

                // Calcul du nombre d'étoiles :
                let stars = 0;
                if (scoreData) {
                    if (bestScore > 0 && bestScore >= baseScore) {
                        stars = 2;
                    } else {
                        stars = 1;
                    }
                }

                // Case avec taille responsive
                const bg = this.add.rectangle(0, 0, this.cellSize, this.cellSize, 0x2a2a3a).setStrokeStyle(1, 0xffffff);
                // Affichage du numéro de niveau (ligne 1)
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

                // Affichage des étoiles (ligne 2, superposée, chaque étoile = objet texte)
                const starFont = Math.round(fontSize * 0.95);
                const yStars = fontSize * 0.85;
                // Étoile 1
                const star1 = this.add.text(-starFont * 0.6, yStars, stars >= 1 ? '★' : '☆', {
                    fontSize: starFont + 'px',
                    fontFamily: 'Arial',
                    color: stars >= 1 ? '#FFD700' : '#FFFFFF',
                    fontStyle: 'bold',
                    align: 'center',
                }).setOrigin(0.5, 0.5);
                // Étoile 2
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
        
        // Cases vides
        const totalCells = this.cols * this.rows;
        for (let i = addedToGrid; i < totalCells; i++) {
            gridSizer.add(this.add.rectangle(0, 0, this.cellSize, this.cellSize, 0x333333, 0));
        }
        
        this.panel.layout();
        this.panel.setChildrenInteractive({ targets: [this.panel.getElement('panel')] });
        // Handler du clic sur une case (dans createResponsiveGrid)
        this.panel.on('child.click', (child, pointer, event) => {
            if (child.levelId !== undefined) {
                this.showLevelDetail(child);
            }
        });
    }

    createBackButton() {
        // Calcul de la position du bord gauche de la grille
        const panelLeft = this.panel.x - this.panelWidth / 2;
        
        // Création du bouton retour avec icône flèche
        this.backBtn = this.add.text(panelLeft, this.navY, '↩', this.homeBtnStyle)
            .setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => this.scene.start('SceneHome'))
            .on('pointerover', () => this.backBtn.setColor('#FFFFFF'))
            .on('pointerout', () => this.backBtn.setColor('#4a90e2'));
    }
    
    createNavContainer(startIndex, endIndex) {
        // Détruit le container existant s'il y en a un
        if (this.navContainer) {
            this.navContainer.destroy();
        }
        
        const scoresLabel = 'Scores';
        const rangeLabel = `${startIndex + 1}-${endIndex}`;
        
        // Création des éléments de navigation
        this.prevBtn = this.add.text(0, 0, '◀', this.navBtnStyle).setOrigin(0.5);
        this.titleScores = this.add.text(0, 0, scoresLabel, this.titleStyle).setOrigin(0, 0.5);
        this.titleRange = this.add.text(0, 0, rangeLabel, this.titleStyle).setOrigin(0, 0.5);
        this.nextBtn = this.add.text(0, 0, '▶', this.navBtnStyle).setOrigin(0.5);
        
        // Positionnement relatif des éléments
        const gap = 18;
        const arrowPad = 12;
        
        this.prevBtn.x = 0;
        this.titleScores.x = this.prevBtn.x + this.prevBtn.width/2 + arrowPad;
        this.titleRange.x = this.titleScores.x + this.titleScores.width + gap;
        this.nextBtn.x = this.titleRange.x + this.titleRange.width + this.nextBtn.width/2 + arrowPad;
        
        // Création du container
        this.navContainer = this.add.container(0, this.navY, [this.prevBtn, this.titleScores, this.titleRange, this.nextBtn]);
        
        // Positionnement du container aligné à droite de la grille
        this.updateNavContainerPosition();
        
        // Gestion des états des boutons
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
        
        // Bouton précédent
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
        
        // Bouton suivant
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
        // Nettoie l'écouteur de redimensionnement
        this.scale.off('resize', this.handleResize, this);
    }
}
