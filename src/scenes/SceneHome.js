import { SceneMain } from './SceneMain.js';
import { Level } from '../game/Level.js';
import { SpaceSlider } from '../ui/SpaceSlider.js';
import { MyRexUIButton } from '../ui/MyRexUIButton.js';
import { SaveGameHelper } from '../game/SaveGameHelper.js';

export class SceneHome extends Phaser.Scene {
    levelsJson;

    levelSlider;
    button_play;
    button_scores;
    logo;
    
    // Responsive layout properties
    isLandscape = false;

    constructor() {
        super('SceneHome');
    }

    preload() {
        this.load.text('levels', 'assets/levels/levels.json');
        this.load.image('logo', 'assets/images/Guappo_Junior_logo.png');
        this.load.image('wappo', 'assets/images/wappo.png'); // Bear head for slider bullet
        this.load.image('medal_icon', 'assets/images/medal.png');
        this.load.image('play_circle_icon', 'assets/images/play_circle.png');
        this.load.image('settings_icon', 'assets/images/settings.png');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        // Parse levels JSON once and cache
        this.levelsJson = JSON.parse(this.cache.text.get('levels'));
        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);
        // Register the shutdown handler to clean up when the scene is stopped or restarted.
        this.events.on('shutdown', this.onSceneShutdown, this);
        // Setup keyboard input
        this.input.keyboard.on('keydown-ENTER', () => {
            this.launchLevel();
        });

        const { width, height } = this.scale.gameSize;
        const centerX = width / 2;
        const formY = height * 0.5;

        // Logo
        this.logo = this.add.image(centerX, height * 0.15, 'logo').setOrigin(0.5, 0.5);

        // Slider - created with a temporary config, will be configured in updateLayout
        const levelIds = this.levelsJson.levels.map(lvl => Number(lvl.level)).filter(n => !isNaN(n));
        const minLevelId = Math.min(...levelIds);
        const maxLevelId = Math.max(...levelIds);
        let highestSavedLevel = SaveGameHelper.getHighestSavedLevel();
        if (!highestSavedLevel || isNaN(highestSavedLevel) || highestSavedLevel < minLevelId || highestSavedLevel > maxLevelId) {
            highestSavedLevel = 0;
        }
        let preselectLevel = highestSavedLevel < maxLevelId ? highestSavedLevel + 1 : highestSavedLevel;
        const sliderWidth = width * 0.85;

        // Full configuration with default values for initialization
        const sliderConfig = {
            handleTexture: 'wappo',
            textPrefix: 'Level: ',
            sliderHeight: 60,  // Default value
            handleSize: 96,    // Default value
            showProgress: true,
            progressColor: 0x4a90e2,
            progressAlpha: 0.3,
            trackColor: 0x1a1a2e,
            textStyle: {
                fontSize: '32px',  // Default value
                fontFamily: '"Arial Black", Gadget, sans-serif',
                color: '#4a90e2',
                stroke: '#000000',
                strokeThickness: 3  // Default value
            },
            textOffset: -80  // Default value
        };

        this.levelSlider = new SpaceSlider(this, centerX, formY, sliderWidth, minLevelId, maxLevelId, preselectLevel, sliderConfig);

        // Buttons: RexUI encapsulation
        this.button_play = new MyRexUIButton(this, 'Play', 'play_circle_icon', () => this.launchLevel());
        this.button_scores = new MyRexUIButton(this, 'Scores', 'medal_icon', () => this.openScores());
        this.button_settings = new MyRexUIButton(this, 'Settings', 'settings_icon', () => this.openSettings());

        this.updateLayout();
    }
    
    updateLayout() {
        const { width, height } = this.scale.gameSize;
        this.isLandscape = width > height;
        const centerX = width / 2;
        const formY = height / 2;

        // Logo
        this.logo.setPosition(centerX, height * 0.15);
        const logoScale = Math.min(width / 800, height / 600) * 0.75;
        this.logo.setScale(logoScale);

        // Slider - update layout only (sizes/positions)
        const sliderWidth = width * 0.85;
        const sliderFontSize = Math.max(Math.min(Math.round(height * 0.05), 120), 24);
        const sliderLayoutConfig = {
            sliderHeight: Math.max(Math.min(Math.round(height * 0.04), 120), 60),
            handleSize: Math.max(Math.min(Math.round(height * 0.06), 145), 95),
            textStyle: {
                fontSize: sliderFontSize + 'px',
                strokeThickness: Math.max(Math.round(sliderFontSize * 0.1), 2)
            },
            textOffset: -Math.max(Math.min(Math.round(height * 0.08), 120), 80)
        };
        this.levelSlider.resize(centerX, formY, sliderWidth, sliderLayoutConfig);

        // Play & Scores buttons (styling and positioning)
        const buttonFontSize = Math.max(Math.min(Math.round(height * 0.08), 128), 32);
        const buttonWidth = Math.max(Math.min(width * 0.55, 720), 520);
        const buttonHeight = Math.round(buttonFontSize * 1.4);
        const buttonSpacing = Math.max(Math.round(buttonFontSize * 0.3), 24);
        const verticalOffset = Math.max(Math.min(Math.round(height * 0.25), 180), 130);
        const leftX = centerX - buttonWidth / 2;
        const firstButtonCenterY = formY + verticalOffset;

        this.button_play.refreshLayout(buttonFontSize, buttonWidth, buttonHeight);
        this.button_scores.refreshLayout(buttonFontSize, buttonWidth, buttonHeight);
        this.button_settings.refreshLayout(buttonFontSize, buttonWidth, buttonHeight);

        this.button_play.setPosition(leftX, firstButtonCenterY);
        this.button_scores.setPosition(leftX, firstButtonCenterY + buttonHeight + buttonSpacing);
        this.button_settings.setPosition(leftX, firstButtonCenterY + (buttonHeight + buttonSpacing) * 2);
    }
    
    handleResize() {
        this.updateLayout();
    }

    onSceneShutdown() {
        console.log("SceneHome shutdown initiated.");
        
        // Remove resize listener
        this.scale.off('resize', this.handleResize, this);
        
        // Explicitly disable interactivity and destroy buttons from the old scene instance
        // Cleanup explicit button variables
        if (this.button_play) {
            this.button_play.destroy();
            this.button_play = null;
        }
        if (this.btnLevelSlider && this.btnLevelSlider.active) {
            if (this.btnLevelSlider.disableButtonInteractive) this.btnLevelSlider.disableButtonInteractive();
            if (this.btnLevelSlider.destroy) this.btnLevelSlider.destroy();
            this.btnLevelSlider = null;
        }
        // Add any other explicit buttons here as needed
        
        // Clean up slider
        if (this.levelSlider) {
            this.levelSlider.destroy();
            this.levelSlider = null;
        }
        
        // Clean up logo
        if (this.logo) {
            this.logo.destroy();
            this.logo = null;
        }

        // Clean up scores button
        if (this.button_scores) {
            this.button_scores.destroy();
            this.button_scores = null;
        }

        // Clean up settings button
        if (this.button_settings) {
            this.button_settings.destroy();
            this.button_settings = null;
        }
        
        this.input.keyboard.off('keydown-ENTER');
    }

    launchLevel() {
        const choosenLevel = this.levelSlider.getValue(); // Using slider value
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

    runBatchSolver() {
        this.uiButtons.forEach(button => button.disableButtonInteractive());

        const resultsDiv = document.getElementById('solver-results');
        // Clear previous results and add a starting message
        resultsDiv.innerHTML = '';
        const startElement = document.createElement('div');
        startElement.textContent = 'Starting batch solve...';
        resultsDiv.appendChild(startElement);

        const levelsJson = JSON.parse(this.cache.text.get('levels'));
        const totalLevels = 200;
        let currentLevelIndex = 0;

        const solveNext = () => {
            if (currentLevelIndex > totalLevels) {
                const finishedElement = document.createElement('div');
                finishedElement.textContent = 'Batch solve finished.';
                resultsDiv.appendChild(finishedElement);
                resultsDiv.scrollTop = resultsDiv.scrollHeight;
                this.uiButtons.forEach(button => button.enableButtonInteractive());
                return;
            }

            const lvlJson = levelsJson.levels.find(record => record.level == currentLevelIndex);
            if (lvlJson) {
                const level = new Level(lvlJson);
                const solution = Solver.solve(level, { algorithm: 'PureBacktracking' });

                let resultText = `Level ${level.getId()} : basescore ${level.getBasescore()}, solved ${solution.solved}`;
                if (solution.path) {
                    const path = solution.path.map((dir, index) => `${index}:${dir.charAt(0)}`).join(', ');
                    const pathLabel = solution.solved ? 'path' : 'abandoned';
                    resultText += ` (${pathLabel}: ${path})`;
                }
                const lineElement = document.createElement('div');
                lineElement.textContent = resultText;
                resultsDiv.appendChild(lineElement);
                resultsDiv.scrollTop = resultsDiv.scrollHeight; // Auto-scroll to bottom
            }

            currentLevelIndex++;
            // Use a small setTimeout delay to let the browser render the update before the next calculation.
            setTimeout(solveNext, 1);
        };

        // Start the first iteration
        setTimeout(solveNext, 1);
    }

    openScores() {
        this.scene.start('SceneScores');
    }

    openSettings() {
        this.scene.start('SceneSettings');
    }
}