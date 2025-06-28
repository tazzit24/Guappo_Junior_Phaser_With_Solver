class SceneHome extends Phaser.Scene {

    inputText;

    constructor() {
        super('SceneHome');
    }

    preload() {
        //this.load.html('levelform', './assets/level_form.html');
        this.load.plugin('rexinputtextplugin', './lib/rexinputtextplugin.min.js', true);
        this.load.image('logo', './assets/Guappo_Junior_logo.png');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000'); // Keeping the black background as requested.
        
        // The logo is left exactly as it was in your code.
        var logo = this.add.image(0, 0, 'logo').setOrigin(0,0);
        logo.scale = 0.75;

        // --- Centered Level Selection ---
        // Only the form elements are centered for a cleaner layout.
        const { width, height } = this.sys.game.config;
        const centerX = width / 2;
        const formY = 350;

        this.add.text(centerX - 120, formY, 'Level', {
            fontSize: '32px',
            fontFamily: '"Arial Black", Gadget, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.inputText = this.add.rexInputText(centerX, formY, 120, 40, {
            type: 'number',
            text: '1',
            fontSize: '24px',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        // Add key listener for the Enter key as a convenience
        this.input.keyboard.on('keydown-ENTER', () => {
            this.launchLevel();
        });

        var button_go = new Button(this, centerX + 120, formY, 'GO', {color: '#FFFFFF'} , () => this.launchLevel());
        this.add.existing(button_go);
    }

    launchLevel() {
        const choosenLevel = parseInt(this.inputText.text, 10); // Using parseInt for robustness
        var scene_main = this.scene.get('SceneMain');
        if (scene_main == null) {
            this.scene.add('SceneMain', SceneMain);
        }
        if(choosenLevel >= 0 && choosenLevel < 201) {
            this.scene.start("SceneMain", {
                "choosenLevel": choosenLevel
            });
        } else {
            // Corrected the typo in the alert message.
            alert("Choose between 1 and 200 (or 0 for the demo level)");
        }
    }
}