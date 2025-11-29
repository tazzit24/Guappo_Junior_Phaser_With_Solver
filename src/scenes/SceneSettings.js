import { GlobalSettings } from '../game/GlobalSettings.js';
import { MyRexUIButton } from '../ui/MyRexUIButton.js';

export class SceneSettings extends Phaser.Scene {
    constructor() {
        super('SceneSettings');
    }

    preload() {
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

        // Toggles
        this.musicToggle = this.createToggle('Music', GlobalSettings.musicEnabled, () => {
            GlobalSettings.toggleMusic();
            return GlobalSettings.musicEnabled;
        });

        this.updatesToggle = this.createToggle('Show Updates', GlobalSettings.updatesEnabled, () => {
            GlobalSettings.toggleUpdates();
            return GlobalSettings.updatesEnabled;
        });

        // Back Button
        this.backBtn = new MyRexUIButton(this, 'Back', 'home', () => this.scene.start('SceneHome'));

        // Setup resize
        this.scale.on('resize', this.handleResize, this);
        this.events.on('shutdown', this.onSceneShutdown, this);

        this.updateLayout();
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

        // Back Button
        const buttonHeight = Math.round(minDim * 0.1);
        const buttonWidth = Math.min(width * 0.6, 400);
        const buttonFontSize = Math.round(buttonHeight * 0.5);
        
        this.backBtn.refreshLayout(buttonFontSize, buttonWidth, buttonHeight);
        this.backBtn.setPosition(centerX - buttonWidth/2, height - buttonHeight - (isLandscape ? 10 : 30));
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
        if (this.backBtn) {
            this.backBtn.destroy();
            this.backBtn = null;
        }
    }
}
