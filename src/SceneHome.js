class SceneHome extends Phaser.Scene {

    inputText;
    uiButtons = [];

    constructor() {
        super('SceneHome');
    }

    preload() {
        //this.load.html('levelform', './assets/level_form.html');
        this.load.plugin('rexinputtextplugin', './lib/rexinputtextplugin.min.js', true);
        this.load.text('levels', 'assets/levels.json');
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

        this.add.text(centerX - 180, formY, 'Level', {
            fontSize: '32px',
            fontFamily: '"Arial Black", Gadget, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.inputText = this.add.rexInputText(centerX - 60, formY, 120, 40, {
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

        var button_go = new Button(this, centerX + 60, formY, 'GO', {color: '#FFFFFF'} , () => this.launchLevel());
        this.add.existing(button_go);
        this.uiButtons.push(button_go);

        var button_solve_all = new Button(this, centerX + 180, formY, 'SOLVE ALL', {color: '#FFFFFF'} , () => this.runBatchSolver());
        this.add.existing(button_solve_all);
        this.uiButtons.push(button_solve_all);

        // Register the shutdown handler to clean up when the scene is stopped or restarted.
        this.events.on('shutdown', this.onSceneShutdown, this);
    }

    onSceneShutdown() {
        console.log("SceneHome shutdown initiated.");
        // Explicitly disable interactivity and destroy buttons from the old scene instance
        this.uiButtons.forEach(button => {
            if (button && button.active) {
                button.disableButtonInteractive();
                button.destroy();
            }
        });
        this.uiButtons = [];
        this.input.keyboard.off('keydown-ENTER');
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