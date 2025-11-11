import { Utils } from '../game/Utils.js';

export class SolverDialog {
    constructor(scene, onCancel = null, anchorPosition = null) {
        this.scene = scene;
        this.onCancel = onCancel;
        this.anchorPosition = anchorPosition; // Position de l'élément d'ancrage (icône hint)

        this.padding = 16; // Padding autour de la dialog
        this.dialogAlpha = 0.75; // Transparence du fond de la dialog

        this.overlay = null;
        this.dialogContainer = null;
        this.backgroundGraphics = null;
        this.contentContainer = null;
        this.arrowGraphics = null; // Flèche pointant vers l'ancrage
    }

    show() {
        if (this.dialogContainer || this.isClosed) {
            return;
        }

        this.state = 'loading';
        this.currentText = 'Calculating';
        this.dotCount = 0;
        this.isClosed = false;

        this.createModal();
        this.setLoadingContent();
        this.startAnimation();
    }

    createModal() {
        const { width, height } = this.scene.scale.gameSize;
        const depthBase = 1000;

        // Calculer d'abord la largeur nécessaire pour le contenu
        const estimatedContentWidth = this.calculateContentWidth();
        this.dialogWidth = Math.min(width * 0.95, Math.max(estimatedContentWidth + this.padding * 2, 400));
        this.dialogHeight = 200; // Hauteur fixe compacte
        this.contentWidth = this.dialogWidth - this.padding * 2;

        // Utiliser la position d'ancrage si fournie, sinon centrer
        let anchorPosition = this.anchorPosition || { x: width / 2, y: height / 2 };

        // Positionner la dialog centrée horizontalement, toujours en dessous de l'ancrage
        const arrowHeight = 15;
        const dialogX = width / 2; // Centrer horizontalement sur l'écran
        const dialogY = anchorPosition.y + 40 + this.dialogHeight / 2 + arrowHeight;

        this.arrowDirection = 'up';

        // Dark overlay to block input and gray out the scene
        this.overlay = this.scene.add.graphics();
        this.overlay.setScrollFactor(0);
        this.overlay.setDepth(depthBase);
        this.overlay.fillStyle(0x000000, 1);
        this.overlay.fillRect(0, 0, width, height);
        this.overlay.setAlpha(0); // Start invisible
        this.overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        // Fade in overlay
        this.scene.tweens.add({
            targets: this.overlay,
            alpha: 0.5,
            duration: 200,
            ease: 'Linear'
        });

        // Main dialog container
        this.dialogContainer = this.scene.add.container(dialogX, dialogY);
        this.dialogContainer.setDepth(depthBase + 1);
        this.dialogContainer.setScrollFactor(0);

        // Créer la flèche pointant vers l'ancrage
        this.arrowGraphics = this.scene.add.graphics();
        this.arrowGraphics.setScrollFactor(0);
        this.arrowGraphics.setDepth(depthBase + 2);
        this.drawArrow(anchorPosition);

        // Dialog background with rounded corners
        this.backgroundGraphics = this.scene.add.graphics();
        this.backgroundGraphics.setScrollFactor(0);
        this.dialogContainer.add(this.backgroundGraphics);
        this.redrawBackground();

        // Content container
        this.contentContainer = this.scene.add.container(0, 0);
        this.contentContainer.setScrollFactor(0);
        this.dialogContainer.add(this.contentContainer);

        // Initial layout
        this.layoutDialog();

        // Zoom in animation
        this.dialogContainer.setScale(0);
        this.scene.tweens.add({
            targets: this.dialogContainer,
            scale: 1,
            duration: 250,
            ease: 'Back.easeOut'
        });

        if (typeof this.scene.disableAllControls === 'function') {
            this.scene.disableAllControls();
        }
        if ('inputDisabled' in this.scene) {
            this.scene.inputDisabled = true;
        }

        // Handle resize
        this.scene.scale.on('resize', this.handleResize, this);

        // Fermeture au clic sur l'overlay ou la dialog
        this.overlay.on('pointerdown', () => {
            this.handleCloseAction();
        });
        
        this.backgroundGraphics.setInteractive(
            new Phaser.Geom.Rectangle(-this.dialogWidth / 2, -this.dialogHeight / 2, this.dialogWidth, this.dialogHeight),
            Phaser.Geom.Rectangle.Contains
        );
        this.backgroundGraphics.on('pointerdown', () => {
            this.handleCloseAction();
        });
    }

    redrawBackground() {
        if (!this.backgroundGraphics) {
            return;
        }
        this.backgroundGraphics.clear();
        
        // Fond sombre avec bordure claire pour le contraste
        this.backgroundGraphics.fillStyle(0x1a1a2e, this.dialogAlpha);
        this.backgroundGraphics.fillRoundedRect(-this.dialogWidth / 2, -this.dialogHeight / 2, this.dialogWidth, this.dialogHeight, 12);
        
        // Bordure claire pour améliorer le contraste
        this.backgroundGraphics.lineStyle(2, 0x4a90e2, 0.8);
        this.backgroundGraphics.strokeRoundedRect(-this.dialogWidth / 2, -this.dialogHeight / 2, this.dialogWidth, this.dialogHeight, 12);
    }

    drawArrow(anchorPosition) {
        if (!this.arrowGraphics) {
            return;
        }

        this.arrowGraphics.clear();
        this.arrowGraphics.fillStyle(0x1a1a2e, this.dialogAlpha);

        const arrowWidth = 16;
        const arrowHeight = 15;

        // Calculer directement le bord supérieur du rectangle de la dialog
        const dialogTop = this.dialogContainer.y - this.dialogHeight / 2;

        // Calculer la position X de la flèche (alignée avec l'ancrage)
        const arrowX = anchorPosition.x;

        // Flèche pointant vers le haut, base touchant le bord supérieur de la dialog
        const arrowY = dialogTop - arrowHeight;
        this.arrowGraphics.fillTriangle(
            arrowX - arrowWidth / 2, arrowY + arrowHeight,
            arrowX + arrowWidth / 2, arrowY + arrowHeight,
            arrowX, arrowY
        );
        
        // Bordure de la flèche pour le contraste
        this.arrowGraphics.lineStyle(2, 0x4a90e2, 0.8);
        this.arrowGraphics.beginPath();
        this.arrowGraphics.moveTo(arrowX - arrowWidth / 2, arrowY + arrowHeight);
        this.arrowGraphics.lineTo(arrowX, arrowY);
        this.arrowGraphics.lineTo(arrowX + arrowWidth / 2, arrowY + arrowHeight);
        this.arrowGraphics.strokePath();
    }

    calculateContentWidth() {
        // Estimation de la largeur nécessaire pour le contenu
        // Basé sur les textes les plus longs possibles
        const testText = this.scene.add.text(0, 0, 'Calculating solution...', {
            fontSize: '54px',
            fontStyle: 'bold'
        });
        const loadingWidth = testText.width + 120; // spinner + spacing
        
        testText.setText('✓ 15 moves: →→↑←↓→→↑←↓→→↑←↓→→↑←↓');
        const resultWidth = testText.width + 120; // icône + spacing
        
        testText.destroy();
        
        return Math.max(loadingWidth, resultWidth, 300); // minimum 300px
    }

    layoutDialog() {
        if (!this.dialogContainer) {
            return;
        }

        const { width, height } = this.scene.scale.gameSize;

        // Utiliser la position d'ancrage si fournie, sinon centrer
        let anchorPosition = this.anchorPosition || { x: width / 2, y: height / 2 };

        // Positionner la dialog centrée horizontalement, toujours en dessous de l'ancrage
        const arrowHeight = 15;
        const dialogX = width / 2; // Centrer horizontalement sur l'écran
        const dialogY = anchorPosition.y + 40 + this.dialogHeight / 2 + arrowHeight;

        this.dialogContainer.setPosition(dialogX, dialogY);
        this.contentContainer.setPosition(0, 0);

        // Redessiner la flèche
        this.drawArrow(anchorPosition);
    }

    setLoadingContent() {
        this.contentContainer.removeAll(true);

        const startX = -this.dialogWidth / 2 + this.padding;
        const maxX = this.dialogWidth / 2 - this.padding;

        // Icône de chargement (spinner)
        const spinner = this.scene.add.text(startX + 18, 0, '⟳', {
            fontSize: '72px',
            color: '#FFD700',
            fontStyle: 'bold'
        });
        spinner.setOrigin(0.5);
        spinner.setScrollFactor(0);
        
        // Vérifier si le spinner dépasse la largeur disponible
        const spinnerEndX = startX + 18 + spinner.width / 2;
        if (spinnerEndX > maxX) {
            // Réduire la taille du spinner si nécessaire
            const availableWidth = maxX - (startX + 18);
            const scale = (availableWidth * 2) / spinner.width; // *2 parce que origin 0.5
            if (scale < 1) {
                spinner.setScale(scale);
            }
        }
        
        this.contentContainer.add(spinner);

        // Animation de rotation du spinner
        this.scene.tweens.add({
            targets: spinner,
            angle: 360,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });

        // Texte de chargement
        const text = this.scene.add.text(startX + 90, 0, 'Calculating solution...', {
            fontSize: '54px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        text.setOrigin(0, 0.5);
        text.setScrollFactor(0);
        
        // Vérifier si le texte dépasse la largeur disponible
        const textEndX = startX + 90 + text.width;
        if (textEndX > maxX) {
            // Réduire la taille de la police si nécessaire
            const availableWidth = maxX - (startX + 90);
            const scale = availableWidth / text.width;
            if (scale < 1) {
                text.setScale(scale);
            }
        }
        
        this.contentContainer.add(text);

        this.loadingText = text;
        this.spinner = spinner;
    }

    updateContent(lines) {
        this.contentContainer.removeAll(true);

        const startX = -this.dialogWidth / 2 + this.padding;
        const maxX = this.dialogWidth / 2 - this.padding;
        let xOffset = startX;
        
        // Créer d'abord tous les objets texte pour mesurer la largeur totale
        const textObjects = [];
        let totalWidth = 0;
        const spacings = [];
        
        lines.forEach((line, index) => {
            const textObj = this.scene.add.text(0, 0, line.text, {
                fontSize: line.fontSize + 'px',
                color: line.color,
                fontStyle: line.bold ? 'bold' : 'normal'
            });
            
            textObjects.push(textObj);
            totalWidth += textObj.width;
            spacings.push(line.spacing ?? 10);
        });
        
        // Calculer l'espacement total
        const totalSpacing = spacings.reduce((sum, spacing, index) => {
            return index < spacings.length - 1 ? sum + spacing : sum;
        }, 0);
        
        const totalContentWidth = totalWidth + totalSpacing;
        const availableWidth = maxX - startX;
        
        // Calculer le facteur de scale global si nécessaire
        const globalScale = totalContentWidth > availableWidth ? availableWidth / totalContentWidth : 1;
        
        // Positionner et scaler les textes
        xOffset = startX;
        textObjects.forEach((textObj, index) => {
            textObj.setScale(globalScale);
            textObj.setPosition(xOffset, 0);
            textObj.setOrigin(0, 0.5);
            textObj.setScrollFactor(0);
            this.contentContainer.add(textObj);
            
            xOffset += textObj.width * globalScale + spacings[index];
        });

        this.currentLines = lines.map(line => ({ ...line }));
    }

    startAnimation() {
        // Plus besoin d'animation de points, le spinner suffit
    }

    stopAnimation() {
        if (this.spinner) {
            this.scene.tweens.killTweensOf(this.spinner);
        }
        if (this.dotsTimer) {
            this.dotsTimer.remove();
            this.dotsTimer = null;
        }
    }

    handleCloseAction() {
        if (this.state === 'loading' && this.onCancel) {
            this.onCancel();
        }
        this.close();
    }

    showResult(solution) {
        if (this.isClosed || !this.dialogContainer) {
            return;
        }

        this.state = 'result';
        this.stopAnimation();

        const lines = this.formatSolutionContent(solution);
        this.updateContent(lines);
    }

    formatSolutionContent(solution) {
        if (!solution) {
            return [
                { text: '⚠', color: '#FF6B6B', fontSize: 66, bold: true, spacing: 20 },
                { text: 'Solver offline', color: '#FFFFFF', fontSize: 48, bold: true }
            ];
        }

        if (solution.solved === false) {
            return [
                { text: '✗', color: '#FF6B6B', fontSize: 66, bold: true, spacing: 20 },
                { text: 'No solution', color: '#FFFFFF', fontSize: 48, bold: true }
            ];
        }

        if (solution.solved === true) {
            const movesCount = solution.path ? solution.path.length : 0;
            const suggestedMoves = solution.path ? solution.path.map(dir => Utils.directionToArrow(dir)).join(' ') : '';
            return [
                { text: '✓', color: '#4CAF50', fontSize: 66, bold: true, spacing: 20 },
                { text: `${movesCount} moves:`, color: '#FFFFFF', fontSize: 48, bold: true, spacing: 25 },
                { text: suggestedMoves, color: '#FFD700', fontSize: 60, bold: true }
            ];
        }

        return [
            { text: '⚠', color: '#FFA500', fontSize: 66, bold: true, spacing: 20 },
            { text: 'Solver error', color: '#FFFFFF', fontSize: 48, bold: true }
        ];
    }

    handleResize(gameSize) {
        if (!this.dialogContainer || !this.overlay) {
            return;
        }
        const { width, height } = gameSize;

        // Redraw overlay
        this.overlay.clear();
        this.overlay.fillStyle(0x000000, 1);
        this.overlay.fillRect(0, 0, width, height);
        this.overlay.setAlpha(0.5);

        // Recalculer les dimensions
        const estimatedContentWidth = this.calculateContentWidth();
        this.dialogWidth = Math.min(width * 0.95, Math.max(estimatedContentWidth + this.padding * 2, 400));
        this.dialogHeight = 200;
        this.contentWidth = this.dialogWidth - this.padding * 2;

        this.redrawBackground();
        
        // Réactiver l'interactivité du background
        this.backgroundGraphics.removeInteractive();
        this.backgroundGraphics.setInteractive(
            new Phaser.Geom.Rectangle(-this.dialogWidth / 2, -this.dialogHeight / 2, this.dialogWidth, this.dialogHeight),
            Phaser.Geom.Rectangle.Contains
        );

        if (this.state === 'loading') {
            this.setLoadingContent();
        } else if (this.currentLines) {
            this.updateContent(this.currentLines);
        }

        this.layoutDialog();
    }

    close() {
        if (this.isClosed) {
            return;
        }

        this.isClosed = true;
        this.stopAnimation();
        
        this.scene.scale.off('resize', this.handleResize, this);

        // Zoom out animation before destroying
        this.scene.tweens.add({
            targets: this.dialogContainer,
            scale: 0,
            duration: 150,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.destroyModal();
            }
        });

        // Fade out overlay
        if (this.overlay) {
            this.scene.tweens.add({
                targets: this.overlay,
                alpha: 0,
                duration: 150,
                ease: 'Linear',
                onComplete: () => {
                    if (this.overlay) {
                        this.overlay.destroy();
                        this.overlay = null;
                    }
                }
            });
        }
    }

    destroyModal() {
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }

        if (this.arrowGraphics) {
            this.arrowGraphics.destroy();
            this.arrowGraphics = null;
        }

        this.backgroundGraphics = null;
        this.contentContainer = null;
        this.loadingText = null;
        this.spinner = null;
        
        if (typeof this.scene.enableAllControls === 'function') {
            this.scene.enableAllControls();
        }
        if ('inputDisabled' in this.scene) {
            this.scene.inputDisabled = false;
        }
    }
}
