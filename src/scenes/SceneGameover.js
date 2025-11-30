'use strict';

import { Button } from '../ui/Button.js';
import { Utils } from '../game/Utils.js';

export class SceneGameover extends Phaser.Scene {  

    level_status;
    choosenLevel;
    btn_tryagain;
    btn_home;
    btn_nextLevel;
    gameOverImage;
    backgroundGraphics;

    constructor() {
        super('SceneGameover');
    }

    init(data) {
        this.level_status = data.status;
        this.choosenLevel = data.choosenLevel;
    }

    preload() {
        const progress = Utils.createLoadingProgressBar(this, { text: 'Loading game over...', backgroundColor: '#000000' });
        this.load.on('progress', progress.updateProgress);
        this.load.on('complete', progress.destroyProgress);

        this.load.image('gameover', 'assets/images/gameover.png');
        this.load.image('gamewon', 'assets/images/gamewon.png');
        this.load.image('home_icon', 'assets/images/home.png');
        this.load.image('replay_icon', 'assets/images/replay.png');
        this.load.image('play_circle_icon', 'assets/images/play_circle.png');
    }

    create() {
        const { width, height } = this.scale.gameSize;
        const centerX = width / 2;
        const centerY = height / 2;
        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);

        // Background
        this.drawBackground();

        // Buttons
        const buttonY = centerY + height * 0.15;
        const buttonSpacing = Math.min(width / 5, 120);
        const buttonFontSize = Math.max(Math.min(Math.round(height * 0.12), 120), 48);
        const iconScale = buttonFontSize / 100;
        this.btn_tryagain = this.add.image(centerX - buttonSpacing, buttonY, 'replay_icon');
        this.btn_tryagain.setScale(iconScale);
        this.btn_tryagain.setInteractive({ useHandCursor: true });
        this.btn_tryagain.on('pointerover', () => this.btn_tryagain.setScale(iconScale * 1.1));
        this.btn_tryagain.on('pointerout', () => this.btn_tryagain.setScale(iconScale));
        this.btn_tryagain.on('pointerup', () => this.tryAgain());
        this.btn_home = this.add.image(centerX, buttonY, 'home_icon');
        this.btn_home.setScale(iconScale);
        this.btn_home.setInteractive({ useHandCursor: true });
        this.btn_home.on('pointerover', () => this.btn_home.setScale(iconScale * 1.1));
        this.btn_home.on('pointerout', () => this.btn_home.setScale(iconScale));
        this.btn_home.on('pointerup', () => this.goHome());
        this.btn_nextLevel = this.add.image(centerX + buttonSpacing, buttonY, 'play_circle_icon');
        this.btn_nextLevel.setScale(iconScale);
        this.btn_nextLevel.setInteractive({ useHandCursor: true });
        this.btn_nextLevel.on('pointerover', () => this.btn_nextLevel.setScale(iconScale * 1.1));
        this.btn_nextLevel.on('pointerout', () => this.btn_nextLevel.setScale(iconScale));
        this.btn_nextLevel.on('pointerup', () => this.nextLevel());

        // Game Over / Won Image
        const imgKey = this.level_status == "WON" ? 'gamewon' : 'gameover';
        this.gameOverImage = this.add.image(centerX, centerY - height * 0.05, imgKey);
        const imgScale = Math.max(Math.min(width / 600, height / 400) * 0.8, 0.5);
        this.gameOverImage.setScale(imgScale);
        this.btn_nextLevel.setVisible(this.level_status == "WON");

        this.updateLayout();
    }
    
    updateLayout() {
        const { width, height } = this.scale.gameSize;
        const centerX = width / 2;
        const centerY = height / 2;
        // Background
        this.drawBackground();
        // Buttons
        const buttonY = centerY + height * 0.15;
        const buttonSpacing = Math.min(width / 5, 120);
        const buttonFontSize = Math.max(Math.min(Math.round(height * 0.12), 120), 48);
        const iconScale = buttonFontSize / 100;
        this.btn_tryagain.setPosition(centerX - buttonSpacing, buttonY);
        this.btn_tryagain.setScale(iconScale);
        this.btn_home.setPosition(centerX, buttonY);
        this.btn_home.setScale(iconScale);
        this.btn_nextLevel.setPosition(centerX + buttonSpacing, buttonY);
        this.btn_nextLevel.setScale(iconScale);
        // Game Over / Won Image
        this.gameOverImage.setPosition(centerX, centerY - height * 0.05);
        const imgScale = Math.max(Math.min(width / 600, height / 400) * 0.8, 0.5);
        this.gameOverImage.setScale(imgScale);
        this.btn_nextLevel.setVisible(this.level_status == "WON");
    }
    
    handleResize() {
        this.updateLayout();
    }

    drawBackground() {
        if (!this.backgroundGraphics) {
            this.backgroundGraphics = this.add.graphics();
        } else {
            this.backgroundGraphics.clear();
        }
        this.backgroundGraphics.fillStyle(0x000000, 0.7);
        this.backgroundGraphics.fillRect(0, 0, this.scale.gameSize.width, this.scale.gameSize.height);
    }

    cleanupObjects() {
        this.scale.off('resize', this.handleResize, this);
        [this.btn_tryagain, this.btn_home, this.btn_nextLevel].forEach(btn => {
            if (btn && btn.active) btn.destroy();
        });
        this.btn_tryagain = null;
        this.btn_home = null;
        this.btn_nextLevel = null;
        if (this.buttonBand) {
            this.buttonBand.destroy();
            this.buttonBand = null;
        }
        if (this.backgroundGraphics) {
            this.backgroundGraphics.destroy();
            this.backgroundGraphics = null;
        }
        if (this.gameOverImage) {
            this.gameOverImage.destroy();
            this.gameOverImage = null;
        }
    }

    tryAgain() {
        this.cleanupObjects();

        // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
        this.scene.stop('SceneMain');
        this.scene.start('SceneMain', { "choosenLevel": this.choosenLevel });
    }

    goHome() {
        this.cleanupObjects();

        // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
        this.scene.stop('SceneMain');
        this.scene.start('SceneHome');
    }

    nextLevel() {
        var next_level = Number(this.choosenLevel) + 1
        if (next_level <= 200){
            this.cleanupObjects();

            // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
            this.scene.stop('SceneMain');
            this.scene.start('SceneMain', { 
                "choosenLevel": next_level
            });
        } else {
            // If there are no more levels, go back to the home screen.
            this.goHome();
        }
    }
}