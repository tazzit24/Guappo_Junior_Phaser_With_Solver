class SceneScores extends Phaser.Scene {
    constructor() {
        super('SceneScores');
    }

    preload() {
        // RexUI plugin est chargé globalement dans Main.js
    }

    create() {
    // Initialisation du tableau pour la gestion des clics sur la grille
    this.levelData = [];
        // Récupère les niveaux depuis le JSON (excluant le niveau 0)
        const levelsJson = JSON.parse(this.cache.text.get('levels'));
        const allLevels = levelsJson.levels.filter(level => parseInt(level.level) > 0);

        // Configuration responsive
        const cam = this.cameras.main;
        const panelWidth = cam.width * 0.9;
        const panelHeight = cam.height * 0.8;
        
        // Pagination : 50 niveaux par page
        this.currentPage = this.currentPage || 0;
        this.levelsPerPage = 50;
        this.totalPages = Math.ceil(allLevels.length / this.levelsPerPage);
        const startIndex = this.currentPage * this.levelsPerPage;
        const endIndex = Math.min(startIndex + this.levelsPerPage, allLevels.length);
        const levels = allLevels.slice(startIndex, endIndex);
        
        // Titre responsive - x2 police
        const titleY = cam.height * 0.08;
        const titleFontSize = Math.max(Math.min(Math.round(cam.height * 0.08), 64), 36); // x2 taille
        this.add.text(cam.centerX, titleY, `Scores (${startIndex + 1}-${endIndex} / ${allLevels.length})`, {
            fontSize: titleFontSize + 'px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Barre de navigation avec bouton Home à gauche
        const navY = titleY + titleFontSize + 25;
        const navFontSize = Math.max(Math.round(titleFontSize * 0.6), 24);
        
        // Bouton Home (icône à gauche)
        const homeBtn = this.add.text(cam.width * 0.05, navY, '◀', {
            fontSize: Math.round(navFontSize * 1.2) + 'px',
            fontFamily: 'Arial',
            color: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0, 0.5)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerdown', () => {
            this.scene.start('SceneHome');
        })
        .on('pointerover', () => homeBtn.setColor('#FFFFFF'))
        .on('pointerout', () => homeBtn.setColor('#4a90e2'));
        
        // Bouton Précédent (centré gauche)
        if (this.currentPage > 0) {
            const prevBtn = this.add.text(cam.centerX - 100, navY, '◀ Previous', {
                fontSize: navFontSize + 'px',
                fontFamily: 'Arial',
                color: '#4a90e2',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => {
                this.currentPage--;
                this.scene.restart();
            })
            .on('pointerover', () => prevBtn.setColor('#FFFFFF'))
            .on('pointerout', () => prevBtn.setColor('#4a90e2'));
        }
        
        // Bouton Suivant (centré droite)
        if (this.currentPage < this.totalPages - 1) {
            const nextBtn = this.add.text(cam.centerX + 100, navY, 'Next ▶', {
                fontSize: navFontSize + 'px',
                fontFamily: 'Arial',
                color: '#4a90e2',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => {
                this.currentPage++;
                this.scene.restart();
            })
            .on('pointerover', () => nextBtn.setColor('#FFFFFF'))
            .on('pointerout', () => nextBtn.setColor('#4a90e2'));
        }

        // Configuration de la grille - cases légèrement réduites
        const cols = 5; // Moins de colonnes pour plus d'espace
        const rows = Math.ceil(levels.length / cols);
        const cellSize = Math.max(Math.floor((panelWidth - 60) / cols), 100); // Légèrement réduit (120 -> 100)
        
        // ScrollablePanel RexUI - position correcte
        const rexUI = this.rexUI;
        const panelStartY = navY + navFontSize + 30;
        const availableHeight = cam.height * 0.9 - panelStartY;
        const panel = rexUI.add.scrollablePanel({
            x: cam.centerX,
            y: panelStartY + availableHeight / 2,
            width: panelWidth,
            height: availableHeight,
            scrollMode: 0, // vertical
            background: this.add.rectangle(0, 0, panelWidth, availableHeight, 0x1a1a2e),
            panel: {
                child: rexUI.add.gridSizer({
                    column: cols,
                    row: rows,
                    columnProportions: 0, // taille fixe des colonnes
                    rowProportions: 0, // taille fixe des lignes
                    space: { column: 0, row: 0 } // Aucun espace entre les cases
                }),
            },
            slider: {
                track: this.add.rectangle(0, 0, 15, 40, 0x666666),
                thumb: this.add.rectangle(0, 0, 15, 40, 0x4a90e2),
            },
            mouseWheelScroller: {
                focus: false,
                speed: 0.1
            },
            clamperEnable: true,
            header: false,
            footer: false,
            space: { left: 15, right: 15, top: 15, bottom: 15 },
        })
        .layout();

        // Remplit la grille avec les niveaux
        const gridSizer = panel.getElement('panel');
        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            const levelId = parseInt(level.level);
            
            // Récupère le score sauvegardé via SaveGameHelper
            let scoreData = null;
            let bestScore = 0;
            if (SaveGameHelper) {
                scoreData = SaveGameHelper.getLevelScore(levelId);
                if (scoreData && typeof scoreData.bestScore !== 'undefined') {
                    bestScore = scoreData.bestScore;
                }
            }
            
            // Détermine le nombre d'étoiles selon le score
            let stars = 0;
            if (bestScore > 0) {
                if (bestScore >= 100) {
                    stars = 2; // parfait = 2 étoiles
                } else {
                    stars = 1; // partiel = 1 étoile
                }
            }
            // 0 étoile = pas joué
            
            // Crée le conteneur pour n° + étoiles
            // Rectangle de fond neutre (gris foncé)
            const bg = this.add.rectangle(0, 0, cellSize, cellSize, 0x2a2a3a)
                .setStrokeStyle(1, 0xffffff);
            // Un seul objet text multi-ligne centré (numéro + étoiles)
            const starSize = Math.max(Math.round(cellSize * 0.22), 18);
            const numFontSize = Math.max(Math.round(cellSize * 0.25), 18);
            const starsStr = (stars >= 1 ? '★' : '☆') + ' ' + (stars >= 2 ? '★' : '☆');
            const labelText = `${levelId}\n${starsStr}`;
            // Crée le texte centré dans un container
            const label = this.add.text(0, 0, labelText, {
                fontSize: numFontSize + 'px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                fontStyle: 'bold',
                align: 'center',
                lineSpacing: Math.round(numFontSize * 0.3),
                wordWrap: { width: cellSize, useAdvancedWrap: true }
            }).setOrigin(0.5, 0.5);
            if (stars === 2) label.setColor('#FFD700');
            const iconContainer = this.add.container(0, 0, [label]);
            iconContainer.setSize(cellSize, cellSize);
            // Crée la case RexUI avec le container centré
            const levelBox = rexUI.add.label({
                width: cellSize,
                height: cellSize,
                background: bg,
                icon: iconContainer,
                space: { left: 0, right: 0, top: 0, bottom: 0 },
            });
            // Stocke les infos du niveau directement sur l'objet
            levelBox.levelId = levelId;
            levelBox.bestScore = bestScore;
            levelBox.scoreData = scoreData;
            
            // Stocke les données pour le clic global (sans interactivité individuelle)
            this.levelData[i] = { levelId, bestScore, scoreData, levelBox, bg };
            
            gridSizer.add(levelBox);
        }
        
        // Remplit les cases vides si nécessaire
        const totalCells = cols * rows;
        for (let i = levels.length; i < totalCells; i++) {
            gridSizer.add(this.add.rectangle(cellSize/2, cellSize/2, cellSize, cellSize, 0x333333, 0));
        }
        
        panel.layout();

        // Active le scroll tactile sur le panel
        panel.setChildrenInteractive({
            targets: [panel.getElement('panel')]
        });

        // Logs pour diagnostiquer le scroll
        console.log('ScrollablePanel créé:', panel);
        console.log('Panel scrollMode:', panel.scrollMode);
        console.log('Panel bounds:', panel.getBounds());
        
        // Écoute les événements de scroll
        panel.on('scroll', () => {
            console.log('Scroll détecté, scrollY:', panel.scrollY);
        });

        // Utilise l'événement RexUI natif 'child.click' qui gère tap vs scroll
        panel.on('child.click', (child, pointer, event) => {
            console.log('RexUI child.click détecté sur:', child);
            if (child.levelId !== undefined) {
                console.log('Ouverture détail niveau (RexUI):', child.levelId);
                this.showLevelDetail(child.levelId, child.bestScore, child.scoreData);
            }
        });

        // Plus besoin du bouton retour en bas (déplacé en haut)
    }

    showLevelDetail(levelId, bestScore, scoreData) {
        // Ferme le détail précédent s'il existe
        if (this.detailPanel) {
            this.detailPanel.destroy();
            this.detailPanel = null;
        }

        const cam = this.cameras.main;
            const panelWidth = Math.min(cam.width * 0.98, 900);
            const panelHeight = Math.min(cam.height * 0.88, 750);

        // Panneau de détail
        this.detailPanel = this.add.container(cam.centerX, cam.centerY);
        
        // Fond semi-transparent
        const overlay = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.7)
            .setInteractive()
            .on('pointerdown', () => {
                this.detailPanel.destroy();
                this.detailPanel = null;
            });
        
        // Panneau principal
        const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e)
            .setStrokeStyle(2, 0x4a90e2);
        
        // Titre du niveau - x4 police détail
    const titleFontSize = Math.max(Math.round(panelHeight * 0.12), 36); // divisé par 2
        const title = this.add.text(0, -panelHeight/2 + 80, `Level ${levelId}`, {
            fontSize: titleFontSize + 'px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth * 0.9, useAdvancedWrap: true }
        }).setOrigin(0.5);

        // Informations du score - x4 police, wordWrap, lineSpacing
        let infoText = '';
        if (bestScore > 0) {
            infoText = `Best Score: ${bestScore}`;
            if (scoreData) {
                if (scoreData.lastScore !== undefined) infoText += `\nLast Score: ${scoreData.lastScore}`;
                if (scoreData.dateBest) infoText += `\nBest achieved: ${new Date(scoreData.dateBest).toLocaleDateString()}`;
            }
        } else {
            infoText = 'Not played yet';
        }

        const infoFontSize = Math.max(Math.round(titleFontSize * 0.22), 36); // divisé par 2
            const info = this.add.text(0, 0, infoText, {
                fontSize: infoFontSize + 'px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center',
                wordWrap: { width: panelWidth * 0.95, useAdvancedWrap: true },
                lineSpacing: Math.round(infoFontSize * 0.38)
            }).setOrigin(0.5);

            // Placement vertical adapté au nouveau cadre
            info.y = title.y + titleFontSize/2 + info.height/2 + 40;

        // Boutons - x4 police
    const btnFontSize = Math.max(Math.round(titleFontSize * 0.8), 32); // divisé par 2
            const btnY = panelHeight/2 - 80;
        const playBtn = this.add.text(-panelWidth/4, btnY, bestScore > 0 ? 'Replay' : 'Play', {
            fontSize: btnFontSize + 'px',
            fontFamily: 'Arial',
            color: '#00cc44',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5)
        .setInteractive({ cursor: 'pointer' })
        .on('pointerdown', () => {
            this.detailPanel.destroy();
            this.detailPanel = null;
            this.scene.start('SceneMain', { choosenLevel: levelId });
        })
        .on('pointerover', () => playBtn.setColor('#FFFFFF'))
        .on('pointerout', () => playBtn.setColor('#00cc44'));

        const closeBtn = this.add.text(panelWidth/4, btnY, 'Close', {
            fontSize: btnFontSize + 'px',
            fontFamily: 'Arial',
            color: '#ff4444',
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
        .on('pointerout', () => closeBtn.setColor('#ff4444'));

        this.detailPanel.add([overlay, bg, title, info, playBtn, closeBtn]);
    }
}
