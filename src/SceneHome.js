class SceneHome extends Phaser.Scene {

    inputText;

    constructor() {
        super('SceneHome');
    }

    preload() {
        //this.load.html('levelform', './assets/level_form.html');
        this.load.plugin('rexinputtextplugin', './lib//rexinputtextplugin.min.js', true);
        this.load.image('logo', './assets/Guappo_Junior_logo.png');
    }

    create() {
        this.cameras.main.setBackgroundColor('#FFA500');
        
        var logo = this.add.image(0, 0, 'logo').setOrigin(0,0);
        logo.scale = 0.75;
        this.add.text(50, 200, 'Level', {color: '#000000'});

        //this.add.dom(50, 50).createFromCache('levelform').setOrigin(0, 0);
        this.inputText = this.add.rexInputText(60, 240, 50, 20, {
            type: 'number',
            text: '1',
            fontSize: '12px',
            color: '#000000'
        });
        this.inputText.setOrigin(0, 0);

        var button_go = new Button(this, 80, 280, 'GO', {color: '#000000'} , () => this.launchLevel());
        this.add.existing(button_go);
    }

    launchLevel() {
        var choosenLevel = this.inputText.text;
        var scene_main = this.scene.get('SceneMain');
        if (scene_main == null) {
            this.scene.add('SceneMain', SceneMain);
        }
        if(choosenLevel >= 0 && choosenLevel < 201) {
            this.scene.start("SceneMain", { 
                "choosenLevel": choosenLevel
            });
        } else {
            alert("Chose between 1 and 200 (or 0 for the demo level");
        }
    }
}