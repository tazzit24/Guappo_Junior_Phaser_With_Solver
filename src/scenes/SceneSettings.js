import { GlobalSettings } from '../game/GlobalSettings.js';
import { MyRexUIButton } from '../ui/MyRexUIButton.js';
import { SaveGameHelper } from '../game/SaveGameHelper.js';
import { Utils } from '../game/Utils.js';

export class SceneSettings extends Phaser.Scene {
    constructor() {
        super('SceneSettings');
    }

    preload() {
        const progress = Utils.createLoadingProgressBar(this, { text: 'Loading settings...', backgroundColor: '#000000' });
        this.load.on('progress', progress.updateProgress);
        this.load.on('complete', progress.destroyProgress);

        // Load assets if not already loaded
        // We reuse assets from SceneHome/Main
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        
        // Create objects once
        this.titleText = this.add.text(0, 0, GlobalSettings.gameName, { 
            fontFamily: '"Arial Black", Gadget, sans-serif', 
            color: '#4a90e2', 
            stroke: '#000000', 
            strokeThickness: 4 
        }).setOrigin(0.5);

        this.subtitleText = this.add.text(0, 0, 'Settings', { 
            fontFamily: 'Arial', 
            color: '#ffffff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);

        this.versionText = this.add.text(0, 0, `v${GlobalSettings.version}`, { 
            fontFamily: 'Arial', 
            color: '#888888' 
        }).setOrigin(0.5);

        // Back button at top (same style as SceneScores)
        this.backBtn = this.add.text(0, 0, '↩', {
            fontFamily: 'Arial',
            color: '#4a90e2',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => this.scene.start('SceneHome'))
            .on('pointerover', () => this.backBtn.setColor('#FFFFFF'))
            .on('pointerout', () => this.backBtn.setColor('#4a90e2'));

        // Toggles
        this.musicToggle = this.createToggle('Music', GlobalSettings.musicEnabled, () => {
            GlobalSettings.toggleMusic();
            return GlobalSettings.musicEnabled;
        });

        this.updatesToggle = this.createToggle('Show Updates', GlobalSettings.updatesEnabled, () => {
            GlobalSettings.toggleUpdates();
            return GlobalSettings.updatesEnabled;
        });

        // Save management section - container with L-shaped border (left + top)
        this.saveContainer = this.add.container(0, 0);

        // L-shaped border graphics (left + top lines)
        this.saveBorder = this.add.graphics();
        this.saveContainer.add(this.saveBorder);

        this.saveSectionTitle = this.add.text(0, 0, 'Save Management', {
            fontFamily: 'Arial',
            color: '#b1c9ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.saveContainer.add(this.saveSectionTitle);

        this.saveSectionDescription = this.add.text(0, 0, 'Export a backup file or import one to restore your progress. Importing will overwrite current scores.', {
            fontFamily: 'Arial',
            color: '#d0d8ff',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.saveContainer.add(this.saveSectionDescription);

        // Export/Import Buttons
        this.exportBtn = new MyRexUIButton(this, 'Export Scores', 'settings', () => this.handleExport());
        this.importBtn = new MyRexUIButton(this, 'Import Scores', 'settings', () => this.handleImport());

        // Setup resize
        this.scale.on('resize', this.handleResize, this);
        this.events.on('shutdown', this.onSceneShutdown, this);

        this.updateLayout();
    }

    handleExport() {
        SaveGameHelper.downloadScores();
        this.showToast('Saves exported!');
    }

    async handleImport() {
        const selection = await SaveGameHelper.selectScoresFile();
        if (!selection.success) {
            this.showToast(selection.message || 'Import cancelled');
            return;
        }

        const confirmed = await this.confirmImportOverwrite(selection);
        if (!confirmed) {
            this.showToast('Import cancelled');
            return;
        }

        const result = SaveGameHelper.importScores(selection.data);
        this.showToast(result.message);
        if (result.success) {
            this.updateLayout();
        }
    }

    async confirmImportOverwrite(selection) {
        const { width, height } = this.scale.gameSize;
        const contentText = this.buildImportSummary(selection);
        const dialog = Utils.CreateCustomDialog(this, {
            titleText: 'Overwrite local scores?',
            contentText,
            confirmText: 'Overwrite',
            cancelText: 'Cancel'
        });
        dialog.setPosition(width / 2, height / 2);
        dialog.layout();
        const response = await dialog.modalPromise({
            manualClose: true,
            duration: { in: 150, out: 150 }
        });
        return response && response.text === 'Overwrite';
    }

    buildImportSummary(selection) {
        const lines = [];
        if (selection.fileName) {
            lines.push(`File: ${selection.fileName}`);
        }
        const formattedDate = this.formatExportDate(selection.exportDate);
        if (formattedDate) {
            lines.push(`Exported: ${formattedDate}`);
        }
        if (typeof selection.levelCount === 'number') {
            lines.push(`Levels: ${selection.levelCount}`);
        }
        lines.push('This will overwrite the current local save.');
        return lines.join('\n');
    }

    formatExportDate(isoString) {
        if (!isoString) {
            return null;
        }
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        const pad = (val) => String(val).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    showToast(message) {
        const { width, height } = this.scale.gameSize;
        const toast = this.add.text(width / 2, height * 0.05, message, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(1000);

        this.time.delayedCall(3000, () => {
            toast.destroy();
        });
    }

    createToggle(labelText, initialState, callback) {
        // Create elements
        const label = this.add.text(0, 0, labelText, { fontFamily: 'Arial', color: '#ffffff' }).setOrigin(1, 0.5);
        const checkboxBg = this.add.rectangle(0, 0, 10, 10, 0x333333).setStrokeStyle(2, 0xffffff);
        const checkmark = this.add.text(0, 0, '✓', { color: '#4a90e2', fontStyle: 'bold' }).setOrigin(0.5).setVisible(initialState);
        const hitArea = this.add.rectangle(0, 0, 10, 10, 0x000000, 0).setInteractive({ cursor: 'pointer' });

        hitArea.on('pointerdown', () => {
            const newState = callback();
            checkmark.setVisible(newState);
        });

        return { label, checkboxBg, checkmark, hitArea };
    }

    updateLayout() {
        const { width, height } = this.scale.gameSize;
        const centerX = width / 2;
        const minDim = Math.min(width, height);
        const isLandscape = width > height;

        // Dynamic font sizes based on smaller dimension to fit all screens
        const titleSize = Math.max(Math.round(minDim * 0.08), 24);
        const subtitleSize = Math.max(Math.round(minDim * 0.05), 16);
        const versionSize = Math.max(Math.round(minDim * 0.03), 12);
        const toggleFontSize = Math.max(Math.round(minDim * 0.05), 16);

        // Vertical positions (compact for landscape)
        const titleY = height * (isLandscape ? 0.1 : 0.15);
        const subtitleY = titleY + titleSize + (isLandscape ? 5 : 10);
        const versionY = subtitleY + subtitleSize + (isLandscape ? 5 : 10);

        this.titleText.setFontSize(titleSize).setPosition(centerX, titleY);
        this.subtitleText.setFontSize(subtitleSize).setPosition(centerX, subtitleY);
        this.versionText.setFontSize(versionSize).setPosition(centerX, versionY);

        // Toggles
        const startY = versionY + versionSize + (isLandscape ? 20 : 40);
        const spacing = toggleFontSize * 2.5;
        const gap = Math.round(minDim * 0.02) + 5; // Small gap to keep things centered

        this.updateToggleLayout(this.musicToggle, centerX, startY, gap, toggleFontSize);
        this.updateToggleLayout(this.updatesToggle, centerX, startY + spacing, gap, toggleFontSize);

        // Save management section layout
        const saveTitleSize = Math.max(Math.round(minDim * 0.045), 18);
        const saveDescSize = Math.max(Math.round(minDim * 0.03), 14);
        const sectionOffset = spacing * 1.5;
        const containerPadding = Math.max(minDim * 0.03, 15);

        const saveSectionY = startY + spacing * 2 + sectionOffset;
        const wrapWidth = Math.min(width * 0.8, 520);
        const containerWidth = wrapWidth + containerPadding * 2;

        // Position container
        this.saveContainer.setPosition(centerX, saveSectionY);

        // Layout elements inside container (relative to container origin)
        const titleLocalY = containerPadding;
        this.saveSectionTitle.setFontSize(saveTitleSize).setPosition(0, titleLocalY);

        const descLocalY = titleLocalY + this.saveSectionTitle.displayHeight / 2 + Math.max(minDim * 0.02, 12);
        this.saveSectionDescription.setFontSize(saveDescSize)
            .setWordWrapWidth(wrapWidth)
            .setPosition(0, descLocalY);

        // Buttons (Export, Import)
        const buttonHeight = Math.round(minDim * 0.085);
        const buttonWidth = Math.min(width * 0.65, 420);
        const buttonFontSize = Math.round(buttonHeight * 0.45);
        const descHeight = this.saveSectionDescription.displayHeight;
        const buttonsLocalY = descLocalY + descHeight + Math.max(minDim * 0.04, 20);
        const buttonSpacing = buttonHeight + Math.max(minDim * 0.025, isLandscape ? 12 : 18);

        // Note: MyRexUIButton uses scene coords, not container-relative
        const containerWorldY = saveSectionY;
        this.exportBtn.refreshLayout(buttonFontSize, buttonWidth, buttonHeight);
        this.exportBtn.setPosition(centerX - buttonWidth / 2, containerWorldY + buttonsLocalY);

        this.importBtn.refreshLayout(buttonFontSize, buttonWidth, buttonHeight);
        this.importBtn.setPosition(centerX - buttonWidth / 2, containerWorldY + buttonsLocalY + buttonSpacing);

        // Calculate container bounds for L-shaped border
        const containerTop = 0;
        const containerBottom = buttonsLocalY + buttonSpacing + buttonHeight + containerPadding;
        const containerLeft = -containerWidth / 2;
        const containerRight = containerWidth / 2;

        // Draw L-shaped border (top line + left line)
        this.saveBorder.clear();
        this.saveBorder.lineStyle(2, 0x4a90e2, 0.8);
        // Top line
        this.saveBorder.beginPath();
        this.saveBorder.moveTo(containerLeft, containerTop);
        this.saveBorder.lineTo(containerRight, containerTop);
        this.saveBorder.strokePath();
        // Left line
        this.saveBorder.beginPath();
        this.saveBorder.moveTo(containerLeft, containerTop);
        this.saveBorder.lineTo(containerLeft, containerBottom);
        this.saveBorder.strokePath();

        // Back button at top-left (same style as SceneScores)
        const navHeight = Math.max(Math.round(height * 0.10), 80);
        const navY = navHeight / 2;
        const backBtnFontSize = Math.max(Math.round(navHeight * 0.45), 28);
        this.backBtn.setFontSize(backBtnFontSize).setPosition(20 + backBtnFontSize / 2, navY);
    }

    updateToggleLayout(toggle, x, y, gap, fontSize) {
        const { width } = this.scale.gameSize;
        const boxSize = Math.round(fontSize * 1.2);

        toggle.label.setFontSize(fontSize);
        // Label ends at x - gap
        toggle.label.setPosition(x - gap, y);

        // Checkbox centered at x + gap + half_box
        const boxX = x + gap + (boxSize / 2);

        toggle.checkboxBg.setSize(boxSize, boxSize);
        toggle.checkboxBg.setPosition(boxX, y);

        toggle.checkmark.setFontSize(fontSize);
        toggle.checkmark.setPosition(boxX, y);

        toggle.hitArea.setSize(width * 0.9, boxSize * 2);
        toggle.hitArea.setPosition(x, y);
    }

    handleResize() {
        this.updateLayout();
    }

    onSceneShutdown() {
        this.scale.off('resize', this.handleResize, this);
        if (this.exportBtn) {
            this.exportBtn.destroy();
            this.exportBtn = null;
        }
        if (this.importBtn) {
            this.importBtn.destroy();
            this.importBtn = null;
        }
        if (this.saveContainer) {
            this.saveContainer.destroy();
            this.saveContainer = null;
            this.saveBorder = null;
            this.saveSectionTitle = null;
            this.saveSectionDescription = null;
        }
    }
}
