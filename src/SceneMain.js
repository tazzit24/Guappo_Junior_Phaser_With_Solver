'use strict';

class SceneMain extends Phaser.Scene {

    level;
    cells = [];
    text_moves;
    wappo;
    friends = [];
    enemies = [];
    uiButtons = [];
    cursors;

    joystick_dir;
    moves_counter;
    isAnimating = false; // Flag to prevent input during animation
    allFriendsMoved = false;
        

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

    // Add level info
        this.add.text(0, 630, 'Level: ' + this.level.getId());
        this.text_moves = this.add.text(0, 660, '');
        this.moves_counter = 0;
        this.updateMovesCounter();
        
    // Add gamepad buttons
        // Note: Buttons are added to uiButtons array for easy management
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

    // Create and fill cells array with static objects
        this.level.getBeehives().forEach(element => {this.cells[element] = new Cell(element, Cell.STATIC_CELL_TYPE.BEEHIVE);});
        this.level.getGaps().forEach(element => {this.cells[element] = new Cell(element, Cell.STATIC_CELL_TYPE.GAP);});
        this.level.getTraps().forEach(element => {this.cells[element] = new Cell(element, Cell.STATIC_CELL_TYPE.TRAP);});
        // Fill remaining cells with VINE
        for (let i = 0; i < 36; i++) {
            if(this.cells[i] == null) {
                this.cells[i] = new Cell(i, Cell.STATIC_CELL_TYPE.VINE);
            }
        }

    // Create movable objects (heroes and enemies) and assign them to a cell
        this.wappo = new Hero("Wappo", 1, this.level.getWappo(), 0);
        this.cells[this.wappo.getLocation()].setMovableObj(this.wappo);

        this.level.getFriends().forEach(element => {
            let friend = this.friends[element.order] = new Hero("F"+element.order, element.step, element.cell, element.order);
            this.cells[friend.getLocation()].setMovableObj(friend);
        });

        this.level.getEnemies().forEach(element => {
            let enemy = this.enemies[element.order] = new Enemy("E"+element.order, element.axis, element.dir, element.step, element.cell, element.order);
            this.cells[enemy.getLocation()].setMovableObj(enemy);
        });


    // Draw static grid
        for (let i = 0; i < 36; i++) {
            let coords = getCoords(i);
            let x = coords.x * cell_size;
            let y = coords.y * cell_size;
            if (this.cells[i].isBeeHive()) {
                this.add.image(x, y, 'beehive').setOrigin(0,0);
            } else if (this.cells[i].isGap()) {
                this.add.image(x, y, 'gap').setOrigin(0,0);
            } else if (this.cells[i].isTrap()) {
                this.add.image(x, y, 'trap').setOrigin(0,0);
            } else {
                this.add.image(x, y, 'vine').setOrigin(0,0);
            }
        }
        

    // Draw movable pieces on grid and set Image to each object
        
        // Draw Wappo
        let coords = getCoords(this.wappo.getLocation());
        let x = coords.x * cell_size;
        let y = coords.y * cell_size;
        var img_wappo = this.add.image(x, y, 'wappo');
        img_wappo.setOrigin(0,0);
        this.wappo.setImg(img_wappo);

        // Draw Friends
        this.friends.forEach(friend => {
            let coords = getCoords(friend.getLocation());
            let x = coords.x * cell_size;
            let y = coords.y * cell_size;
            var img_friend = this.add.image(x, y, 'friend_' + friend.getStep());
            img_friend.setOrigin(0,0);
            friend.setImg(img_friend);
        }); 
            
        // Draw Enemies
        this.enemies.forEach(enemy => {
            let coords = getCoords(enemy.getLocation());
            let x = coords.x * cell_size;
            let y = coords.y * cell_size;
            var img_enemy = this.add.image(x, y, 'enemy_' + enemy.getAxis() + "_" + enemy.getStep());
            img_enemy.setOrigin(0,0);
            // Flip default images based on enemy default direction
            if(enemy.getDirection() == Enum.DIRECTION.WEST) {
                img_enemy.flipX = true;
            } else if(enemy.getDirection() == Enum.DIRECTION.SOUTH) {
                img_enemy.flipY = true;
            } else if(enemy.getDirection() == Enum.DIRECTION.SOUTH_WEST) {
                img_enemy.flipY = true;
            } else if(enemy.getDirection() == Enum.DIRECTION.NORTH_EAST) {
                img_enemy.flipX = true;
            } else if(enemy.getDirection() == Enum.DIRECTION.SOUTH_EAST) {
                img_enemy.flipX = true;
                img_enemy.flipY = true;
            }
            enemy.setImg(img_enemy);
            
        }); 
            
        this.events.once('destroy', function () {
            console.log("SceneMain destroyed");
            // This 'destroy' event is for the scene object itself. Use 'shutdown' for cleanup.
            //this.scene.add('SceneMain');
          }, this);

        // Register the shutdown handler to clean up when the scene is stopped or restarted.
        this.events.on('shutdown', this.onSceneShutdown, this);

        // Add keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        this.cursors.up.on('down', () => this.fireUserInput(Enum.DIRECTION.NORTH));
        this.cursors.down.on('down', () => this.fireUserInput(Enum.DIRECTION.SOUTH));
        this.cursors.left.on('down', () => this.fireUserInput(Enum.DIRECTION.WEST));
        this.cursors.right.on('down', () => this.fireUserInput(Enum.DIRECTION.EAST));
    }

    //update() {}

    fireUserInput(dir) {
        if (this.isAnimating) {
            console.log("Animation in progress, ignoring input.");
            return;
        }

        this.isAnimating = true;
        this.uiButtons.forEach(button => button.disableButtonInteractive()); // Use new method

        this.moves_counter++;
        this.updateMovesCounter();

        this.executeTurnSequence(dir)
            .then(gameStatus => {
                // After all animations for the turn are complete, update game status
                this.updateGameStatus(gameStatus.isLost, gameStatus.isWon);
            })
            .catch(error => {
                console.error("Error during turn sequence:", error);
                // Handle unexpected errors, maybe show an error screen
            })
            .finally(() => {
                // Always re-enable input and reset piece counters after a turn, regardless of outcome
                this.wappo.resetMoves();
                this.friends.forEach(f => f && f.resetMoves());
                this.enemies.forEach(e => e && e.resetMoves());
                this.uiButtons.forEach(button => button.enableButtonInteractive()); // Use new method
                this.isAnimating = false;
            });
    }

    /**
     * Orchestrates the entire turn sequence using chained tweens.
     * @param {string} playerDirection - The direction chosen by the player.
     * @returns {Promise<{isWon: boolean, isLost: boolean}>} A promise that resolves with the final game status for the turn.
     */
    async executeTurnSequence(playerDirection) {
        let currentStatus = { isWon: false, isLost: false };

        // --- Wappo's Move ---
        // Wappo always has 1 step.
        const wappoMoveResult = await this.movePieceAnimated(this.wappo, playerDirection);
        if (wappoMoveResult.isLost) {
            return { isWon: false, isLost: true };
        }
        if (this.checkIfWon()) {
            return { isWon: true, isLost: false };
        }

        // --- Friends' Moves ---
        const friendSteps = this.friends.filter(f => f).map(f => f.getStep());
        const maxFriendSteps = friendSteps.length > 0 ? Math.max(...friendSteps) : 0;

        for (let i = 0; i < maxFriendSteps; i++) {
            const friendMovePromises = [];
            for (const friend of this.friends) {
                if (friend && !friend.finishedMoving()) {
                    friendMovePromises.push(this.movePieceAnimated(friend, playerDirection));
                }
            }
            // Wait for all friends to complete their current step's animation
            const results = await Promise.all(friendMovePromises);
            for (const result of results) {
                if (result.isLost) {
                    return { isWon: false, isLost: true };
                }
                if (this.checkIfWon()) {
                    return { isWon: true, isLost: false };
                }
            }
        }

        // --- Enemies' Moves ---
        const enemySteps = this.enemies.filter(e => e).map(e => e.getStep());
        const maxEnemySteps = enemySteps.length > 0 ? Math.max(...enemySteps) : 0;

        for (let i = 0; i < maxEnemySteps; i++) {
            const enemyMovePromises = [];
            for (const enemy of this.enemies) {
                if (enemy && !enemy.finishedMoving()) {
                    enemyMovePromises.push(this.movePieceAnimated(enemy, enemy.getDirection()));
                }
            }
            // Wait for all enemies to complete their current step's animation
            const results = await Promise.all(enemyMovePromises);
            for (const result of results) {
                if (result.isLost) {
                    return { isWon: false, isLost: true };
                }
                // Enemy moves cannot cause a win condition, so no checkIfWon here.
            }
        }

        // Final check after all pieces have moved
        currentStatus.isWon = this.checkIfWon();
        return currentStatus;
    }

    /**
     * Handles the movement logic and animation for a single piece.
     * @param {MovablePiece} piece - The piece to move (Wappo, Friend, or Enemy).
     * @param {string} direction - The direction to move.
     * @returns {Promise<{isLost: boolean}>} A promise that resolves with whether the move resulted in a loss.
     */
    async movePieceAnimated(piece, direction) {
        const isEnemy = piece instanceof Enemy;
        const isFriend = !isEnemy && piece !== this.wappo;

        let target_cellXY = this.getTargetCell(piece, direction);
        let dest_cell_type = this.getStaticCellType(target_cellXY);

        // Enemy-specific logic: turn around at walls
        if (isEnemy && dest_cell_type === Cell.STATIC_CELL_TYPE.WALL) {
            piece.turnAround();
            // Recalculate target after turning
            target_cellXY = this.getTargetCell(piece, piece.getDirection());
            dest_cell_type = this.getStaticCellType(target_cellXY);
        }

        const target_cellNum = getCellnum(target_cellXY.x, target_cellXY.y);
        const dest_cell = this.cells[target_cellNum];

        let canMove = false;
        if (isEnemy) {
            canMove = this.canMoveEnemy(piece, target_cellXY);
        } else { // Hero (Wappo or Friend)
            canMove = this.canMoveHero(piece, target_cellXY);
        }

        let died = false;
        if (canMove) {
            // A move is only consumed if it is successful.
            // This applies to all piece types now.
            piece.incrementMoves();

            // Check for fatal interaction BEFORE the move is performed in the state
            died = this.heroIsDead(piece, dest_cell);

            // Perform the move in the game state
            const old_loc = piece.getLocation();
            piece.setLocation(dest_cell.getCellNumber());
            this.cells[old_loc].removePiece();
            dest_cell.setMovableObj(piece);

            // Animate the move
            await this.animateMove(piece, dest_cell);
        } else { // Blocked
            if (!isFriend) {
                // Wappo and Enemies consume their move even if blocked.
                piece.incrementMoves();
            }
             // Friends do NOT consume a move if blocked. They will try again on the next tick.
            await this.animateStay(piece);
        }

        return { isLost: died };
    }

    /**
     * Animates a piece moving to a new cell.
     * @param {MovablePiece} obj - The piece to animate.
     * @param {Cell} cell - The destination cell.
     * @returns {Promise<void>} A promise that resolves when the animation completes.
     */
    animateMove(obj, cell) {
        const coords = getCoords(cell.getCellNumber());
        return new Promise(resolve => {
            this.tweens.add({
                targets: obj.getImg(),
                duration: 500, // Adjust animation speed as needed
                x: coords.x * cell_size,
                y: coords.y * cell_size,
                ease: 'Power2',
                onComplete: () => resolve()
            });
        });
    }

    /**
     * Animates a piece staying in place (e.g., a small bounce).
     * @param {MovablePiece} obj - The piece to animate.
     * @returns {Promise<void>} A promise that resolves when the animation completes.
     */
    animateStay(obj) {
        return new Promise(resolve => {
            this.tweens.add({
                targets: obj.getImg(),
                duration: 250, // Shorter duration for staying animation
                scaleX: 0.9,
                scaleY: 0.9,
                yoyo: true,
                ease: 'Power1',
                onComplete: () => resolve()
            });
        });
    }

    // Removed old moveObjTo and stayHere as their logic is now integrated into movePieceAnimated
    // and their animation parts are in animateMove/animateStay.
    // moveObjTo(obj, cell) { ... }
    // stayHere(obj) { ... }

    // Removed old moveAllFriends and moveAllEnemies as their logic is now integrated into executeTurnSequence.
    // moveAllFriends() { ... }
    // moveAllEnemies() { ... }

    // Removed getMaxStep and allMoved as they are no longer directly used in the new animation flow.
    // getMaxStep(movableObjCollection) { ... }
    // allMoved(movableObjCollection) { ... }

    // The following methods remain largely the same, but are now called from movePieceAnimated
    canMoveEnemy(enemyObj, target_cellXY) {
        var target_cellNum = getCellnum(target_cellXY.x, target_cellXY.y);
        var dest_cell_type = this.getStaticCellType(target_cellXY);
        if (dest_cell_type == Cell.STATIC_CELL_TYPE.WALL) {
            return false;
        }
        // According to the original Java logic, enemies block each other.
        if (this.cells[target_cellNum].containsEnemy()) {
            return false;
        }
        return true;
    }

    checkIfWon() {
        // The game is won if Wappo AND all active friends are on a beehive.
        // This logic mirrors GameLogic.js to ensure consistency.
        if (!this.cells[this.wappo.getLocation()].isBeeHive()) {
            return false;
        }
        // Filter out empty slots in the sparse array before checking.
        for (const friend of this.friends.filter(f => f)) {
            if (!this.cells[friend.getLocation()].isBeeHive()) {
                return false;
            }
        }
        return true;
    }

    // --- Scene Lifecycle Callbacks ---
    // This method is called when the scene is shut down (e.g., stopped or restarted).
    // It's crucial for cleaning up GameObjects and preventing memory leaks/ghost events.
    onSceneShutdown() {
        console.log("SceneMain shutdown initiated.");
        // Explicitly disable interactivity and destroy buttons from the old scene instance
        this.uiButtons.forEach(button => {
            if (button && button.active) { // Check if button still exists and is active
                button.disableButtonInteractive(); // Ensure listeners are off
                button.destroy(); // Destroy the GameObject
            }
        });
        this.uiButtons = []; // Clear the array
        // Clear other references to aid garbage collection
        this.cells = [];
        this.friends = [];
        this.enemies = [];
        this.wappo = null;
        this.level = null;
        this.text_moves = null;

        // Also clean up keyboard listeners to prevent ghost inputs on scene restart
        if (this.cursors) {
            this.cursors.up.off('down');
            this.cursors.down.off('down');
            this.cursors.left.off('down');
            this.cursors.right.off('down');
        }
        this.cursors = null;
    }

    updateGameStatus(died, won) { // This function is now called AFTER all animations for a turn
        if (died) {
            console.log("GAME OVER");
            this.scene.pause();
            this.scene.launch("SceneGameover", {"status": "DIED", "choosenLevel": this.choosenLevel, "moves": this.moves_counter});
            
        } else if (won) {
            console.log("GAME WON");
            this.scene.pause();
            this.scene.launch("SceneGameover", {"status": "WON", "choosenLevel": this.choosenLevel, "moves": this.moves_counter});
        }
    }

    heroIsDead(obj_from, cell_to) {
        // Check collision with enemies and traps -> die
        if (obj_from instanceof Hero && (cell_to.containsEnemy() || cell_to.isTrap()) || obj_from instanceof Enemy && cell_to.containsHero()) {
            return true;
        } else {
            return false;
        }
    }

    canMoveHero(heroObj, target_cellXY) {
        var target_cellNum = getCellnum(target_cellXY.x, target_cellXY.y);
        var dest_cell_type = this.getStaticCellType(target_cellXY);
        if (dest_cell_type == Cell.STATIC_CELL_TYPE.WALL || dest_cell_type == Cell.STATIC_CELL_TYPE.GAP) {
            return false;
        } else { // is VINE or BEEHIVE
            // Check if cell is already occupied by another Hero
            if (this.cells[target_cellNum].containsHero()) {
                return false;
            } else {
                return true;
            }
        }
    }

    updateMovesCounter() {
        this.text_moves.setText('Moves: ' + this.moves_counter + "/" + this.level.getBasescore());
    }

    // Get the static cell type at XY
    getStaticCellType(cellXY) {
        var cell_type;
        // If out of boundaries -> it's a wall
        if (cellXY.x < 0 || cellXY.x > 5 || cellXY.y < 0 || cellXY.y > 5) {
            cell_type = Cell.STATIC_CELL_TYPE.WALL;
        } else {
            let cell = this.cells[getCellnum(cellXY.x, cellXY.y)]
            cell_type = cell.getType();
        }
        return cell_type;
    }

    getTargetCell(obj, dir) {
        var move_x = 0;
        var move_y = 0;
        switch (dir) {
            case Enum.DIRECTION.NORTH:
                move_y = -1;
                break;
            case Enum.DIRECTION.SOUTH:
                move_y = 1;
                break;
            case Enum.DIRECTION.WEST:
                move_x = -1;
                break;
            case Enum.DIRECTION.EAST:
                move_x = 1;
                break;
            case Enum.DIRECTION.NORTH_WEST:
                move_y = -1;
                move_x = -1;
                break;
            case Enum.DIRECTION.NORTH_EAST:
                move_y = -1;
                move_x = 1;
                break;
            case Enum.DIRECTION.SOUTH_WEST:
                move_y = 1;
                move_x = -1;
                break;
            case Enum.DIRECTION.SOUTH_EAST:
                move_y = 1;
                move_x = 1;
                break;
        }
        var obj_coords = obj.getLocationXY();
        console.log(obj_coords);
        return {
            x: obj_coords.x + move_x,
            y: obj_coords.y + move_y
        };
    }

    // UI and navigation

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
            this.scene.start('SceneHome'); // Let Phaser handle shutting down this scene.
        }
    }

    runSolver() {
        console.log("Attempting to solve level " + this.level.getId() + "...");
        // Disable all UI buttons to prevent interaction while the solver is running.
        this.uiButtons.forEach(button => button.disableButtonInteractive()); // Use new method

        const solution = Solver.solve(this.level);
        console.log("Solver finished.");
        console.log(solution);

        // Re-enable the buttons once the solver is done.
        this.uiButtons.forEach(button => button.enableButtonInteractive()); // Use new method
    }
}