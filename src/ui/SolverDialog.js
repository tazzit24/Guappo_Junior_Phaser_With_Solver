import { Utils } from '../game/Utils.js';

export class SolverDialog {
    constructor(scene, onCancel = null, anchorPosition = null) {
        this.scene = scene;
        this.onCancel = onCancel;
        this.anchorPosition = anchorPosition; // Position of the anchor element (hint icon)

        this.padding = 16; // Padding around the dialog
        this.dialogAlpha = 0.75; // Dialog background transparency

        this.overlay = null;
        this.dialogContainer = null;
        this.backgroundGraphics = null;
        this.contentContainer = null;
        this.arrowGraphics = null; // Arrow pointing to the anchor
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

        // First, compute the width required for the content
        const estimatedContentWidth = this.calculateContentWidth();
        this.dialogWidth = Math.min(width * 0.95, Math.max(estimatedContentWidth + this.padding * 2, 400));
        this.dialogHeight = 200; // Compact fixed height
        this.contentWidth = this.dialogWidth - this.padding * 2;

        // Use the anchor position if provided, otherwise center
        let anchorPosition = this.anchorPosition || { x: width / 2, y: height / 2 };

        // Position the dialog centered horizontally, always below the anchor
        const arrowHeight = 15;
        const dialogX = width / 2; // Center horizontally on the screen
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

        // Create the arrow pointing to the anchor
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

        // Close on overlay or dialog click
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
        
        // Dark background with a light border for contrast
        this.backgroundGraphics.fillStyle(0x1a1a2e, this.dialogAlpha);
        this.backgroundGraphics.fillRoundedRect(-this.dialogWidth / 2, -this.dialogHeight / 2, this.dialogWidth, this.dialogHeight, 12);
        
        // Light border to improve contrast
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

        // Compute the top edge of the dialog rectangle directly
        const dialogTop = this.dialogContainer.y - this.dialogHeight / 2;

        // Compute the X position of the arrow (aligned with the anchor)
        const arrowX = anchorPosition.x;

        // Arrow pointing up, base touching the top edge of the dialog
        const arrowY = dialogTop - arrowHeight;
        this.arrowGraphics.fillTriangle(
            arrowX - arrowWidth / 2, arrowY + arrowHeight,
            arrowX + arrowWidth / 2, arrowY + arrowHeight,
            arrowX, arrowY
        );
        
        // Arrow border for contrast
        this.arrowGraphics.lineStyle(2, 0x4a90e2, 0.8);
        this.arrowGraphics.beginPath();
        this.arrowGraphics.moveTo(arrowX - arrowWidth / 2, arrowY + arrowHeight);
        this.arrowGraphics.lineTo(arrowX, arrowY);
        this.arrowGraphics.lineTo(arrowX + arrowWidth / 2, arrowY + arrowHeight);
        this.arrowGraphics.strokePath();
    }

    calculateContentWidth() {
        // Estimate of the width needed for content
        // Based on the longest possible texts
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

        // Use the anchor position if provided, otherwise center
        let anchorPosition = this.anchorPosition || { x: width / 2, y: height / 2 };

        // Position the dialog centered horizontally, always below the anchor
        const arrowHeight = 15;
        const dialogX = width / 2; // Center horizontally on the screen
        const dialogY = anchorPosition.y + 40 + this.dialogHeight / 2 + arrowHeight;

        this.dialogContainer.setPosition(dialogX, dialogY);
        this.contentContainer.setPosition(0, 0);

        // Redraw the arrow
        this.drawArrow(anchorPosition);
    }

    setLoadingContent() {
        this.contentContainer.removeAll(true);

        const startX = -this.dialogWidth / 2 + this.padding;
        const maxX = this.dialogWidth / 2 - this.padding;

        // Loading icon (spinner)
        const spinner = this.scene.add.text(startX + 18, 0, '⟳', {
            fontSize: '72px',
            color: '#FFD700',
            fontStyle: 'bold'
        });
        spinner.setOrigin(0.5);
        spinner.setScrollFactor(0);
        
        // Check if the spinner exceeds the available width
        const spinnerEndX = startX + 18 + spinner.width / 2;
        if (spinnerEndX > maxX) {
            // Reduce spinner size if necessary
            const availableWidth = maxX - (startX + 18);
            const scale = (availableWidth * 2) / spinner.width; // *2 parce que origin 0.5
            if (scale < 1) {
                spinner.setScale(scale);
            }
        }
        
        this.contentContainer.add(spinner);

        // Spinner rotation animation
        this.scene.tweens.add({
            targets: spinner,
            angle: 360,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });

        // Loading text
        const text = this.scene.add.text(startX + 90, 0, 'Calculating solution...', {
            fontSize: '54px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        text.setOrigin(0, 0.5);
        text.setScrollFactor(0);
        
        // Check if the text exceeds the available width
        const textEndX = startX + 90 + text.width;
        if (textEndX > maxX) {
            // Reduce font size if necessary
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
        
        // First create all text objects to measure total width
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
        
        // Compute total spacing
        const totalSpacing = spacings.reduce((sum, spacing, index) => {
            return index < spacings.length - 1 ? sum + spacing : sum;
        }, 0);
        
        const totalContentWidth = totalWidth + totalSpacing;
        const availableWidth = maxX - startX;
        
        // Compute global scale factor if needed
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
        // No need for dot animation anymore; the spinner is sufficient
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

        // Recompute dimensions
        const estimatedContentWidth = this.calculateContentWidth();
        this.dialogWidth = Math.min(width * 0.95, Math.max(estimatedContentWidth + this.padding * 2, 400));
        this.dialogHeight = 200;
        this.contentWidth = this.dialogWidth - this.padding * 2;

        this.redrawBackground();
        
        // Re-enable background interactivity
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
