export class ScenePreload extends Phaser.Scene {
    constructor() {
        super('ScenePreload');
    }

    preload() {
        // Create progress bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '20px Arial',
            fill: '#ffffff'
        });
        loadingText.setOrigin(0.5, 0.5);
        
        const percentText = this.add.text(width / 2, height / 2, '0%', {
            font: '18px Arial',
            fill: '#ffffff'
        });
        percentText.setOrigin(0.5, 0.5);
        
        const assetText = this.add.text(width / 2, height / 2 + 50, '', {
            font: '18px Arial',
            fill: '#ffffff'
        });
        assetText.setOrigin(0.5, 0.5);

        // Register load events
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x4a90e2, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        this.load.on('fileprogress', function (file) {
            assetText.setText('Loading asset: ' + file.key);
        });
        
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });

        // Load assets used in SceneHome and common UI
        this.load.text('levels', 'assets/levels/levels.json');
        this.load.image('logo', 'assets/images/Guappo_Junior_logo.png');
        this.load.image('wappo', 'assets/images/wappo.png');
        this.load.image('medal_icon', 'assets/images/medal.png');
        this.load.image('play_circle_icon', 'assets/images/play_circle.png');
        this.load.image('settings_icon', 'assets/images/settings.png');
        this.load.image('home', 'assets/images/home.png'); // Used in Settings
        
        // Preload some heavy assets from SceneMain to smooth transition
        this.load.image('boardBackground', 'assets/images/BoardBackground.png');
        this.load.spritesheet('enemy_V_1', 'assets/images/ev1.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('enemy_V_2', 'assets/images/ev2.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('enemy_H_1', 'assets/images/eh1.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('enemy_H_2', 'assets/images/eh2.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('enemy_D_1', 'assets/images/ed1.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('enemy_D_2', 'assets/images/ed2.png', { frameWidth: 200, frameHeight: 200 });
    }

    create() {
        this.scene.start('SceneHome');
    }
}
