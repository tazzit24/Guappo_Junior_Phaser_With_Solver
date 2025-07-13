'use strict';

class SceneGameover extends Phaser.Scene {  

    level_status;
    choosenLevel;

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
        // Transparent background
        var graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, 0, this.game.config.width, this.game.config.height);

        // Navigation buttons
        var btn_tryagain = new Button(this, 150, 500, 'Try Again', {} , () => this.tryAgain());
        this.add.existing(btn_tryagain);
        var btn_home = new Button(this, 300, 500, 'Home', {} , () => this.goHome());
        this.add.existing(btn_home);
        var btn_nextLevel = new Button(this, 400, 500, 'Next Level', {} , () => this.nextLevel());
        this.add.existing(btn_nextLevel);

        // Display won / lost image and appropriate nav buttons
        btn_tryagain.setVisible(true);
        btn_home.setVisible(true);
        var img;
        if (this.level_status == "WON") {
            img = this.add.image(300, 300, 'gamewon');
            btn_nextLevel.setVisible(true);
        } else {
            img = this.add.image(300, 300, 'gameover');
            btn_nextLevel.setVisible(false);
        }
       
    }

    tryAgain() {
        // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
        this.scene.stop('SceneMain');
        this.scene.start('SceneMain', { "choosenLevel": this.choosenLevel });
    }

    goHome() {
        // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
        this.scene.stop('SceneMain');
        this.scene.start('SceneHome');
    }

    nextLevel() {
        var next_level = Number(this.choosenLevel) + 1
        if (next_level <= 200){
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