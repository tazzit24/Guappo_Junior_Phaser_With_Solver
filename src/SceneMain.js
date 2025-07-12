'use strict';

const CELL_SIZE = 100; // Define cell size as a constant for this scene

class SceneMain extends Phaser.Scene {
    level;
    game; // Instance de GameLogic
    text_moves;
    wappo;
    friends = [];
    enemies = [];
    uiButtons = [];
    cursors;

    joystick_dir;
    isAnimating = false; // Flag to prevent input during animation

    constructor() {
        super('SceneMain');
    }

    init(msg) {
        this.choosenLevel = msg.choosenLevel;
    }

    preload() {
        this.load.text('levels', 'assets/levels.json');
        this.load.image('vine', 'assets/vine.png');
        this.load.image('gap', 'assets/gap.png');
        this.load.image('trap', 'assets/trap.png');
        this.load.image('beehive', 'assets/beehive.png');
        this.load.image('wappo', 'assets/wappo.png');
        this.load.image('friend_1', 'assets/friend1.png');
        this.load.image('friend_2', 'assets/friend2.png');
        this.load.image('enemy_V_1', 'assets/ev1.png');
        this.load.image('enemy_V_2', 'assets/ev2.png');
        this.load.image('enemy_H_1', 'assets/eh1.png');
        this.load.image('enemy_H_2', 'assets/eh2.png');
        this.load.image('enemy_D_1', 'assets/ed1.png');
        this.load.image('enemy_D_2', 'assets/ed2.png');
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'lib/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
    }

    create() {
        //this.cameras.main.setBackgroundColor('#000000');

        var levelsJson = JSON.parse(this.cache.text.get('levels'));
        var lvlJson = levelsJson.levels.find(record => record.level == this.choosenLevel);
        console.log(lvlJson);
        this.level = new Level(lvlJson);
        
        // Create GameLogic instance
        this.game = new GameLogic(this.level);

        // Add level info
        this.add.text(0, 630, 'Level: ' + this.level.getId());
        this.text_moves = this.add.text(0, 660, '');
        this.updateMovesCounter();
        
        // Add gamepad buttons
        var button_up = new Button(this, 310, 620, 'UP', {} , () => this.fireUserInput(Enum.DIRECTION.NORTH));
        this.add.existing(button_up);
        this.uiButtons.push(button_up);
        var button_down = new Button(this, 300, 670, 'DOWN', {} , () => this.fireUserInput(Enum.DIRECTION.SOUTH));
        this.add.existing(button_down);
        this.uiButtons.push(button_down);
        var button_left = new Button(this, 250, 650, 'LEFT', {} , () => this.fireUserInput(Enum.DIRECTION.WEST));
        this.add.existing(button_left);
        this.uiButtons.push(button_left);
        var button_right = new Button(this, 350, 650, 'RIGHT', {} , () => this.fireUserInput(Enum.DIRECTION.EAST));
        this.add.existing(button_right);
        this.uiButtons.push(button_right);
    
        // Add Menu button
        var button_go_home = new Button(this, 450, 650, 'HOME', {} , () => this.fireGoHome());
        this.add.existing(button_go_home);
        this.uiButtons.push(button_go_home);

        // Add a Solver button
        var button_solve = new Button(this, 520, 650, 'SOLVE', {color: '#FFFFFF'} , () => this.runSolver());
        this.add.existing(button_solve);
        this.uiButtons.push(button_solve);

        // Add Previous/Next Level buttons for debugging
        var button_prev = new Button(this, 100, 645, 'PREV', {}, () => this.fireChangeLevel(-1));
        this.add.existing(button_prev);
        this.uiButtons.push(button_prev);

        var button_next = new Button(this, 180, 645, 'NEXT', {}, () => this.fireChangeLevel(1));
        this.add.existing(button_next);
        this.uiButtons.push(button_next);

        // Tooltip setup
        this.tooltip = this.add.text(0, 0, '', { font: '16px Arial', fill: '#fff', backgroundColor: '#222', padding: { x: 8, y: 4 } })
            .setDepth(1000).setVisible(false);

        // Draw static grid with interactive tooltips
        for (let i = 0; i < 36; i++) {
            let coords = getCoords(i);
            let x = coords.x * CELL_SIZE;
            let y = coords.y * CELL_SIZE;
            let cell = this.game.cells[i];
            let imgKey = cell.isBeeHive() ? 'beehive' : cell.isGap() ? 'gap' : cell.isTrap() ? 'trap' : 'vine';
            let img = this.add.image(x, y, imgKey).setOrigin(0,0).setInteractive();
            img.on('pointerover', pointer => {
                let props = `Cell #${i}\nType: ${cell.getType()}`;
                if (cell.getMovableObj()) {
                    props += `\nContains: ${cell.getMovableObj().constructor.name}`;
                }
                this.tooltip.setText(props).setPosition(pointer.worldX + 10, pointer.worldY + 10).setVisible(true);
            });
            img.on('pointerout', () => this.tooltip.setVisible(false));
        }

        // Draw movable pieces and link them to their GameLogic counterparts
        // Link Wappo
        this.wappo = this.game.wappo;
        let coords = getCoords(this.wappo.getLocation());
        let x = coords.x * CELL_SIZE;
        let y = coords.y * CELL_SIZE;
        var img_wappo = this.add.image(x, y, 'wappo').setOrigin(0,0).setInteractive();
        img_wappo.on('pointerover', pointer => {
            let props = `Wappo\nStep: ${this.wappo.getStep()}\nOrder: ${this.wappo.getOrder ? this.wappo.getOrder() : 0}\nLocation: ${this.wappo.getLocation()}`;
            this.tooltip.setText(props).setPosition(pointer.worldX + 10, pointer.worldY + 10).setVisible(true);
        });
        img_wappo.on('pointerout', () => this.tooltip.setVisible(false));
        this.wappo.setImg(img_wappo);

        // Link Friends
        this.friends = this.game.friends;
        this.friends.forEach(friend => {
            if (!friend) return;
            let coords = getCoords(friend.getLocation());
            let x = coords.x * CELL_SIZE;
            let y = coords.y * CELL_SIZE;
            var img_friend = this.add.image(x, y, 'friend_' + friend.getStep()).setOrigin(0,0).setInteractive();
            img_friend.on('pointerover', pointer => {
                let props = `Friend\nStep: ${friend.getStep()}\nOrder: ${friend.getOrder()}\nLocation: ${friend.getLocation()}`;
                this.tooltip.setText(props).setPosition(pointer.worldX + 10, pointer.worldY + 10).setVisible(true);
            });
            img_friend.on('pointerout', () => this.tooltip.setVisible(false));
            friend.setImg(img_friend);
        }); 
            
        // Link Enemies
        this.enemies = this.game.enemies;
        this.enemies.forEach(enemy => {
            if (!enemy) return;
            let coords = getCoords(enemy.getLocation());
            let x = coords.x * CELL_SIZE;
            let y = coords.y * CELL_SIZE;
            var img_enemy = this.add.image(x, y, 'enemy_' + enemy.getAxis() + "_" + enemy.getStep()).setOrigin(0,0).setInteractive();
            img_enemy.on('pointerover', pointer => {
                let props = `Enemy\nAxis: ${enemy.getAxis()}\nDirection: ${enemy.getDirection()}\nStep: ${enemy.getStep()}\nOrder: ${enemy.getOrder()}\nLocation: ${enemy.getLocation()}`;
                this.tooltip.setText(props).setPosition(pointer.worldX + 10, pointer.worldY + 10).setVisible(true);
            });
            img_enemy.on('pointerout', () => this.tooltip.setVisible(false));
            enemy.setImg(img_enemy);
            this.updateEnemyImageDirection(enemy);
        }); 
            
        this.events.once('destroy', function () {
            console.log("SceneMain destroyed");
        }, this);

        // Register the shutdown handler
        this.events.on('shutdown', this.onSceneShutdown, this);

        // Add keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        this.cursors.up.on('down', () => this.fireUserInput(Enum.DIRECTION.NORTH));
        this.cursors.down.on('down', () => this.fireUserInput(Enum.DIRECTION.SOUTH));
        this.cursors.left.on('down', () => this.fireUserInput(Enum.DIRECTION.WEST));
        this.cursors.right.on('down', () => this.fireUserInput(Enum.DIRECTION.EAST));

        // TODO : Remove for production
        this.runSolver();
    }

    async fireUserInput(dir) {
        if (this.isAnimating) {
            console.log("Animation in progress, ignoring input.");
            return;
        }

        this.isAnimating = true;
        this.uiButtons.forEach(button => button.disableButtonInteractive());

        const gameStatus = this.game.simulateTurn(dir);
        this.updateMovesCounter();

        // Animate all moves that occurred during the turn
        await this.animateMoves(this.game.lastTurnMoves);

        // Update game status after animations
        this.updateGameStatus(gameStatus.isLost, gameStatus.isWon);

        // Re-enable input
        this.uiButtons.forEach(button => button.enableButtonInteractive());
        this.isAnimating = false;
    }

    /**
     * Animates all moves collected during a turn simulation
     */
    async animateMoves(moves) {
        for (const moveSet of moves) {
            const animPromises = moveSet.map(move => {
                if (move.piece instanceof Enemy && move.dir) {
                    this.updateEnemyImageDirection(move.piece, move.dir);
                }
                return move.isBlocked ? this.animateStay(move.piece) : this.animateMove(move.piece, move.toXY);
            });
            await Promise.all(animPromises);
        }
    }

    /**
     * Animates a piece moving to a new cell.
     */
    animateMove(obj, target_cellXY) {
        return new Promise(resolve => {
            this.tweens.add({
                targets: obj.getImg(),
                duration: 500,
                x: target_cellXY.x * CELL_SIZE,
                y: target_cellXY.y * CELL_SIZE,
                ease: 'Power2',
                onComplete: () => resolve()
            });
        });
    }

    /**
     * Animates a piece staying in place (e.g., a small bounce).
     */
    animateStay(obj) {
        return new Promise(resolve => {
            this.tweens.add({
                targets: obj.getImg(),
                duration: 250,
                scaleX: 0.9,
                scaleY: 0.9,
                yoyo: true,
                ease: 'Power1',
                onComplete: () => resolve()
            });
        });
    }

    /**
     * Updates the visual orientation (flipX, flipY) of an enemy's sprite
     * to match its current direction.
     */
    updateEnemyImageDirection(enemy, forcedDir) {
        const img = enemy.getImg();
        if (!img) return;

        img.flipX = false;
        img.flipY = false;

        const dir = forcedDir || enemy.getDirection();
        const axis = enemy.getAxis();

        if (axis === 'H') {
            if (dir === Enum.DIRECTION.WEST) {
                img.flipX = true;
            }
        } else if (axis === 'V') {
            if (dir === Enum.DIRECTION.SOUTH) {
                img.flipY = true;
            }
        } else if (axis === 'D') {
            switch (dir) {
                case Enum.DIRECTION.NORTH_EAST:
                    img.flipX = true;
                    break;
                case Enum.DIRECTION.SOUTH_WEST:
                    img.flipY = true;
                    break;
                case Enum.DIRECTION.SOUTH_EAST:
                    img.flipX = true;
                    img.flipY = true;
                    break;
            }
        }
    }

    fireChangeLevel(delta) {
        if (this.isAnimating) return;
        
        let newLevel = this.choosenLevel + delta;
        if (newLevel >= 0 && newLevel <= 200) {
            this.scene.start('SceneMain', { "choosenLevel": newLevel });
        } else {
            console.log(`Level ${newLevel} is out of bounds (0-200).`);
        }
    }

    onSceneShutdown() {
        console.log("SceneMain shutdown initiated.");
        this.uiButtons.forEach(button => {
            if (button && button.active) {
                button.disableButtonInteractive();
                button.destroy();
            }
        });
        this.uiButtons = [];

        if (this.cursors) {
            this.cursors.up.off('down');
            this.cursors.down.off('down');
            this.cursors.left.off('down');
            this.cursors.right.off('down');
        }
        this.cursors = null;
        
        // Clear refs but don't destroy game objects owned by GameLogic
        this.wappo = null;
        this.friends = [];
        this.enemies = [];
        this.game = null;
        this.level = null;
        this.text_moves = null;
    }

    updateGameStatus(died, won) {
        if (died) {
            console.log("GAME OVER");
            this.scene.pause();
            this.scene.launch("SceneGameover", {"status": "DIED", "choosenLevel": this.choosenLevel, "moves": this.game.moves_counter});
        } else if (won) {
            console.log("GAME WON");
            this.scene.pause();
            this.scene.launch("SceneGameover", {"status": "WON", "choosenLevel": this.choosenLevel, "moves": this.game.moves_counter});
        }
    }

    updateMovesCounter() {
        this.text_moves.setText('Moves: ' + this.game.moves_counter + "/" + this.level.getBasescore());
    }

    fireGoHome() {
        var dialog = CreateDialog(this);
        dialog.setPosition(300, 300);
        dialog.layout();
        dialog.modalPromise({
                manualClose: true,
                duration: {
                    in: 500,
                    out: 500
                }
            })
        .then((data) => this.goHome(data));
    }

    goHome(data) {
        console.log(data);
        if (data.text == 'Yes') {
            this.scene.start('SceneHome');
        }
    }

    runSolver() {
        console.log("Attempting to solve level " + this.level.getId() + "...");
        this.uiButtons.forEach(button => button.disableButtonInteractive());

        const solution = Solver.solve(this.level, { algorithm: 'PureBacktracking' });
        console.log("Solver finished.");
        console.log(solution);

        this.uiButtons.forEach(button => button.enableButtonInteractive());
    }
}