class SceneHome extends Phaser.Scene {
    levelsJson;

    levelSlider;
    button_go;
    logo;
    
    // Responsive layout properties
    isLandscape = false;

    constructor() {
        super('SceneHome');
    }

    preload() {
        //this.load.html('levelform', './assets/level_form.html');
        this.load.plugin('rexinputtextplugin', 'lib/rexinputtextplugin.min.js', true);
        this.load.text('levels', 'assets/levels/levels.json');
        this.load.image('logo', 'assets/images/Guappo_Junior_logo.png');
        this.load.image('wappo', 'assets/images/wappo.png'); // Bear head for slider bullet
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

        // Slider
        const levelIds = this.levelsJson.levels.map(lvl => Number(lvl.level)).filter(n => !isNaN(n));
        const minLevelId = Math.min(...levelIds);
        const maxLevelId = Math.max(...levelIds);
        let highestSavedLevel = SaveGameHelper.getHighestSavedLevel();
        if (!highestSavedLevel || isNaN(highestSavedLevel) || highestSavedLevel < minLevelId || highestSavedLevel > maxLevelId) {
            highestSavedLevel = 0;
        }
        let preselectLevel = highestSavedLevel < maxLevelId ? highestSavedLevel + 1 : highestSavedLevel;
        const sliderWidth = width * 0.85;
        const sliderFontSize = Math.max(Math.min(Math.round(height * 0.05), 32), 16);
        const sliderConfig = {
            handleTexture: 'wappo',
            textPrefix: 'Level: ',
            sliderHeight: Math.max(Math.min(Math.round(height * 0.04), 40), 20),
            handleSize: Math.max(Math.min(Math.round(height * 0.08), 60), 40),
            showProgress: true,
            progressColor: 0x4a90e2,
            progressAlpha: 0.3,
            trackColor: 0x1a1a2e,
            textStyle: {
                fontSize: sliderFontSize + 'px',
                fontFamily: '"Arial Black", Gadget, sans-serif',
                color: '#4a90e2',
                stroke: '#000000',
                strokeThickness: Math.max(Math.round(sliderFontSize * 0.1), 2)
            },
            textOffset: -Math.max(Math.min(Math.round(height * 0.08), 60), 40)
        };
        this.levelSlider = new SpaceSlider(this, centerX, formY, sliderWidth, minLevelId, maxLevelId, preselectLevel, sliderConfig);

        // Continue Button
        const buttonFontSize = Math.max(Math.min(Math.round(height * 0.08), 120), 32);
        const buttonY = formY + Math.max(Math.min(Math.round(height * 0.15), 120), 80);
        this.button_go = new Button(this, centerX, buttonY, 'Continue', {
            color: '#FFFFFF',
            fontSize: buttonFontSize + 'px',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: Math.max(Math.round(buttonFontSize * 0.05), 2)
        }, () => this.launchLevel());
        this.button_go.setOrigin(0.5);
        this.add.existing(this.button_go);

        this.updateLayout();
    }
    
    updateLayout() {
        const { width, height } = this.scale.gameSize;
        this.isLandscape = width > height;
        const centerX = width / 2;
        const formY = height * 0.5;

        // Logo
        this.logo.setPosition(centerX, height * 0.15);
        const logoScale = Math.min(width / 800, height / 600) * 0.75;
        this.logo.setScale(logoScale);

        // Slider
        const sliderWidth = width * 0.85;
        const sliderFontSize = Math.max(Math.min(Math.round(height * 0.05), 32), 16);
        const sliderConfig = {
            handleTexture: 'wappo',
            textPrefix: 'Level: ',
            sliderHeight: Math.max(Math.min(Math.round(height * 0.04), 40), 20),
            handleSize: Math.max(Math.min(Math.round(height * 0.08), 60), 40),
            showProgress: true,
            progressColor: 0x4a90e2,
            progressAlpha: 0.3,
            trackColor: 0x1a1a2e,
            textStyle: {
                fontSize: sliderFontSize + 'px',
                fontFamily: '"Arial Black", Gadget, sans-serif',
                color: '#4a90e2',
                stroke: '#000000',
                strokeThickness: Math.max(Math.round(sliderFontSize * 0.1), 2)
            },
            textOffset: -Math.max(Math.min(Math.round(height * 0.08), 60), 40)
        };
        this.levelSlider.resize(centerX, formY, sliderWidth, sliderConfig);

        // Continue Button
        const buttonFontSize = Math.max(Math.min(Math.round(height * 0.08), 120), 32);
        const buttonY = formY + Math.max(Math.min(Math.round(height * 0.15), 120), 80);
        this.button_go.setPosition(centerX, buttonY);
        this.button_go.setFontSize(buttonFontSize + 'px');
        this.button_go.setStyle({
            fontSize: buttonFontSize + 'px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: Math.max(Math.round(buttonFontSize * 0.05), 2)
        });
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
        if (this.btnContinue && this.btnContinue.active) {
            if (this.btnContinue.disableButtonInteractive) this.btnContinue.disableButtonInteractive();
            if (this.btnContinue.destroy) this.btnContinue.destroy();
            this.btnContinue = null;
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
}