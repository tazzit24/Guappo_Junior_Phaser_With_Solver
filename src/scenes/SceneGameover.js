'use strict';

import { Button } from '../ui/Button.js';

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
        this.load.image('gameover', 'assets/images/gameover.png');
        this.load.image('gamewon', 'assets/images/gamewon.png');
    }

    create() {
        const { width, height } = this.scale.gameSize;
        const centerX = width / 2;
        const centerY = height / 2;
        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);

        // Background
        this.backgroundGraphics = this.add.graphics();
        this.backgroundGraphics.fillStyle(0x000000, 0.5);
        this.backgroundGraphics.fillRect(0, 0, width, height);

        // Buttons
        const buttonY = centerY + height * 0.15;
        const buttonSpacing = Math.min(width / 5, 120);
        const buttonFontSize = Math.max(Math.min(Math.round(height * 0.06), 60), 24);
        const buttonStyle = {
            fontSize: buttonFontSize + 'px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.max(Math.round(buttonFontSize * 0.08), 2)
        };
        this.btn_tryagain = new Button(this, centerX - buttonSpacing, buttonY, 'Try Again', buttonStyle, () => this.tryAgain());
        this.add.existing(this.btn_tryagain);
        this.btn_home = new Button(this, centerX, buttonY, 'Home', buttonStyle, () => this.goHome());
        this.add.existing(this.btn_home);
        this.btn_nextLevel = new Button(this, centerX + buttonSpacing, buttonY, 'Next Level', buttonStyle, () => this.nextLevel());
        this.add.existing(this.btn_nextLevel);

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
        this.backgroundGraphics.clear();
        this.backgroundGraphics.fillStyle(0x000000, 0.5);
        this.backgroundGraphics.fillRect(0, 0, width, height);
        // Buttons
        const buttonY = centerY + height * 0.15;
        const buttonSpacing = Math.min(width / 5, 120);
        const buttonFontSize = Math.max(Math.min(Math.round(height * 0.06), 60), 24);
        const buttonStyle = {
            fontSize: buttonFontSize + 'px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.max(Math.round(buttonFontSize * 0.08), 2)
        };
        this.btn_tryagain.setPosition(centerX - buttonSpacing, buttonY);
        this.btn_tryagain.setStyle(buttonStyle);
        this.btn_home.setPosition(centerX, buttonY);
        this.btn_home.setStyle(buttonStyle);
        this.btn_nextLevel.setPosition(centerX + buttonSpacing, buttonY);
        this.btn_nextLevel.setStyle(buttonStyle);
        // Game Over / Won Image
        this.gameOverImage.setPosition(centerX, centerY - height * 0.05);
        const imgScale = Math.max(Math.min(width / 600, height / 400) * 0.8, 0.5);
        this.gameOverImage.setScale(imgScale);
        this.btn_nextLevel.setVisible(this.level_status == "WON");
    }
    
    handleResize() {
        this.updateLayout();
    }

    tryAgain() {
        // Cleanup
        this.scale.off('resize', this.handleResize, this);
        [this.btn_tryagain, this.btn_home, this.btn_nextLevel].forEach(btn => {
            if (btn && btn.active) btn.destroy();
        });
        this.btn_tryagain = null;
        this.btn_home = null;
        this.btn_nextLevel = null;

        // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
        this.scene.stop('SceneMain');
        this.scene.start('SceneMain', { "choosenLevel": this.choosenLevel });
    }

    goHome() {
        // Cleanup
        this.scale.off('resize', this.handleResize, this);
        [this.btn_tryagain, this.btn_home, this.btn_nextLevel].forEach(btn => {
            if (btn && btn.active) btn.destroy();
        });
        this.btn_tryagain = null;
        this.btn_home = null;
        this.btn_nextLevel = null;

        // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
        this.scene.stop('SceneMain');
        this.scene.start('SceneHome');
    }

    nextLevel() {
        var next_level = Number(this.choosenLevel) + 1
        if (next_level <= 200){
            // Cleanup
            this.scale.off('resize', this.handleResize, this);
            [this.btn_tryagain, this.btn_home, this.btn_nextLevel].forEach(btn => {
                if (btn && btn.active) btn.destroy();
            });
            this.btn_tryagain = null;
            this.btn_home = null;
            this.btn_nextLevel = null;

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