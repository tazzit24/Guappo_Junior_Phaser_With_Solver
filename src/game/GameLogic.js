'use strict';

/**
 * This class represents a "headless" version of the game.
 * It knows the rules and can simulate moves without any graphics.
 */

class GameLogic {
    /**
     * Enregistre le score dans localStorage pour le niveau donné.
     * Met à jour bestscore/datebest et lastscore/datelast.
     */
    saveScore(levelId, score) {
        SaveGameHelper.saveScore(levelId, score);
    }
    level;
    cells = [];
    friends = [];
    enemies = [];
    wappo;
    moves_counter = 0;
    lastTurnMoves = []; // Array of move sets to be animated

    constructor(level) {
        this.level = level;
        this.reset();
    }

    /**
     * Sets up the initial state of the level from the level data.
     */
    reset() {
        this.cells = [];
        this.friends = [];
        this.enemies = [];
        this.moves_counter = 0;
        this.lastTurnMoves = [];

        // Create and fill cells array with static objects
        this.level.getBeehives().forEach(element => { this.cells[element] = new Cell(element, Cell.STATIC_CELL_TYPE.BEEHIVE); });
        this.level.getGaps().forEach(element => { this.cells[element] = new Cell(element, Cell.STATIC_CELL_TYPE.GAP); });
        this.level.getTraps().forEach(element => { this.cells[element] = new Cell(element, Cell.STATIC_CELL_TYPE.TRAP); });
        for (let i = 0; i < 36; i++) {
            if (this.cells[i] == null) {
                this.cells[i] = new Cell(i, Cell.STATIC_CELL_TYPE.VINE);
            }
        }

        // Create movable objects
        this.wappo = new Hero("Wappo", 1, this.level.getWappo(), 0);
        this.cells[this.wappo.getLocation()].setMovableObj(this.wappo);

        this.level.getFriends().forEach(element => {
            let friend = this.friends[element.order] = new Hero("F" + element.order, element.step, element.cell, element.order);
            this.cells[friend.getLocation()].setMovableObj(friend);
        });

        this.level.getEnemies().forEach(element => {
            let enemy = this.enemies[element.order] = new Enemy("E" + element.order, element.axis, element.dir, element.step, element.cell, element.order);
            this.cells[enemy.getLocation()].setMovableObj(enemy);
        });
    }

    /**
     * Simulates a full turn based on a player's input direction.
     * @param {string} direction - One of Enum.DIRECTION
     * @returns {object} An object containing the status: { isWon: boolean, isLost: boolean }
     */
    simulateTurn(direction) {
        this.moves_counter++;
        this.lastTurnMoves = []; // Clear moves from previous turn

        // --- Wappo's Move ---
        // The game checks for a loss/win condition after every single piece moves.
        // The simulation must replicate this behavior.
        const wappoMove = this.movePiece(this.wappo, direction);
        if (wappoMove.died) {
            // Add the fatal move to the animation queue
            if (wappoMove.move) {
                this.lastTurnMoves.push([wappoMove.move]);
            }
            return { isWon: false, isLost: true }; // Wappo died
        }
        // Add Wappo's move to the first set of animations if it happened
        if (wappoMove.move) {
            this.lastTurnMoves.push([wappoMove.move]);
        }

        // --- Friends' Moves (nouvelle logique alignée sur les ennemis) ---
        // On calcule le maxStep des amis
        const sortedFriends = this.friends.filter(f => f);
        const maxFriendSteps = sortedFriends.length > 0 ? Math.max(...sortedFriends.map(f => f.getStep())) : 0;
        const MAX_TICKS = 6; // Safety break to prevent infinite loops, as in the original game.

        for (let stepRound = 1; stepRound <= maxFriendSteps; stepRound++) {
            let movedInTick = true;
            let ticks = 0;
            let friendMovesMap = new Map();

            while (movedInTick && ticks < MAX_TICKS) {
                movedInTick = false;
                ticks++;
                for (const friend of sortedFriends) {
                    if (friend.getStep() >= stepRound && friend.getMovesCounter() < stepRound) {
                        const originalLocation = friend.getLocation();
                        const result = this.movePiece(friend, direction);
                        if (result.died) {
                            if (result.move) {
                                this.lastTurnMoves.push([result.move]);
                            }
                            return { isWon: false, isLost: true }; // A friend died
                        }
                        if (friend.getLocation() !== originalLocation) {
                            movedInTick = true;
                        }
                        if (result.move) {
                            friendMovesMap.set(friend, result.move);
                        } else {
                            if (!friendMovesMap.has(friend)) {
                                friendMovesMap.set(friend, { piece: friend, isBlocked: true });
                            }
                        }
                    }
                }
            }
            // Animation parallèle pour ce stepRound (état final de chaque ami)
            const allMovesForStepRound = Array.from(friendMovesMap.values());
            if (allMovesForStepRound.length > 0) {
                this.lastTurnMoves.push(allMovesForStepRound);
            }
            // Après tous les ticks de ce stepRound, on incrémente movesCounter des amis qui n'ont pas pu bouger
            for (const friend of sortedFriends) {
                if (friend.getStep() >= stepRound && friend.getMovesCounter() < stepRound) {
                    friend.incrementMoves();
                }
            }
        }

        // --- Enemies' Moves ---
        // The win condition is checked here, after friends move but before enemies move,
        // which is consistent with the original game's state machine.
        if (this.checkIfWon()) {
            // --- SCORE LOGIC ---
            let basescore = this.level.basescore || 0;
            let calculatedScore = basescore - (this.moves_counter - basescore);
            this.saveScore(this.level.id, calculatedScore);
            return { isWon: true, isLost: false };
        }

        // Sort enemies deterministically to match SceneMain.js:
        // 1. Primary sort by axis ('H' -> 'V' -> 'D').
        // 2. Secondary sort (tie-breaker) by the original 'order' property.
        const sortedEnemies = this.enemies.filter(e => e).sort((a, b) => {
            const axisOrder = { 'H': 0, 'V': 1, 'D': 2 };
            const axisA = axisOrder[a.getAxis()];
            const axisB = axisOrder[b.getAxis()];

            if (axisA !== axisB) {
                return axisA - axisB;
            }
            return a.getOrder() - b.getOrder();
        });

        const maxSteps = sortedEnemies.length > 0 ? Math.max(...sortedEnemies.map(e => e.getStep())) : 0;

        for (let stepRound = 1; stepRound <= maxSteps; stepRound++) {
            let movedInTick = true;
            let ticks = 0;
            let enemyMovesMap = new Map(); // Utiliser une Map pour stocker le dernier état de chaque ennemi
            
            while (movedInTick && ticks < MAX_TICKS) {
                movedInTick = false;
                ticks++;
                for (const enemy of sortedEnemies) {
                    if (enemy.getStep() >= stepRound && enemy.getMovesCounter() < stepRound) {
                        const originalLocation = enemy.getLocation();
                        let directionToMove = enemy.getDirection();
                        if (enemy.getAxis() === 'D') {
                            directionToMove = this.determineDiagonalEnemyDirection(enemy);
                            enemy.setDirection(directionToMove);
                        }
                        const result = this.movePiece(enemy, directionToMove);
                        if (result.died) {
                            if (result.move) {
                                this.lastTurnMoves.push([result.move]);
                            }
                            return { isWon: false, isLost: true };
                        }
                        if (enemy.getLocation() !== originalLocation) {
                            movedInTick = true;
                        }
                        
                        // Stocker le dernier état de cet ennemi (écrase les états précédents)
                        if (result.move) {
                            enemyMovesMap.set(enemy, result.move);
                        } else {
                            // Si l'ennemi ne bouge pas ET n'a pas encore de move enregistré, on ajoute le blocage
                            if (!enemyMovesMap.has(enemy)) {
                                enemyMovesMap.set(enemy, { piece: enemy, isBlocked: true, dir: enemy.getDirection() });
                            }
                        }
                    }
                }
            }

            // Animer tous les moves de ce stepRound ensemble (seulement l'état final de chaque ennemi)
            const allMovesForStepRound = Array.from(enemyMovesMap.values());
            if (allMovesForStepRound.length > 0) {
                this.lastTurnMoves.push(allMovesForStepRound);
            }

            // After all ticks for this step round, any enemy that was supposed to move but couldn't
            // (because it was blocked by another enemy for all ticks) now consumes its move.
            for (const enemy of sortedEnemies) {
                if (enemy.getStep() >= stepRound && enemy.getMovesCounter() < stepRound) {
                    enemy.incrementMoves();
                }
            }
        }

        // Reset moves for all pieces at the very end of the turn sequence.
        this.wappo.resetMoves();
        this.friends.forEach(f => f && f.resetMoves());
        this.enemies.forEach(e => e && e.resetMoves());

        return { isWon: false, isLost: false }; // Turn ends, no win or loss this turn.
    }

    /**
     * Generic move logic for any piece.
     * @returns {boolean} - True if the move resulted in a death, otherwise false.
     */
    movePiece(piece, dir) {
        const isFriend = piece instanceof Hero && piece !== this.wappo;
        const isEnemy = piece instanceof Enemy;

        let target_cellXY = this.getTargetCell(piece, dir);
        let originalDirection = isEnemy ? piece.getDirection() : null;
        let directionBeforeMove = isEnemy ? piece.getDirection() : null;

        // UNIFIED Enemy wall collision logic.
        if (isEnemy && this.getStaticCellType(target_cellXY) === Cell.STATIC_CELL_TYPE.WALL) {
            if (piece.getAxis() === 'D') {
                const newDirection = this.determineDiagonalEnemyDirection(piece);
                piece.setDirection(newDirection);
            } else {
                piece.turnAround();
            }
            target_cellXY = this.getTargetCell(piece, piece.getDirection());
            directionBeforeMove = piece.getDirection(); // direction vient d'être changée
        }

        const canMove = isEnemy ? this.canMoveEnemy(target_cellXY) : this.canMoveHero(target_cellXY);

        let moveDesc = null;
        if (canMove) {
            // directionBeforeMove est la direction effective pour le flip
            moveDesc = { piece, toXY: target_cellXY, isBlocked: false };
            if (isEnemy) moveDesc.dir = directionBeforeMove;
            piece.incrementMoves();
            const target_cellNum = getCellnum(target_cellXY.x, target_cellXY.y);
            const dest_cell = this.cells[target_cellNum];
            if (this.isFatalMove(piece, dest_cell)) {
                return { died: true, move: moveDesc };
            }
            this.cells[piece.getLocation()].removePiece();
            piece.setLocation(target_cellNum);
            dest_cell.setMovableObj(piece);
        } else {
            if (isEnemy) {
                const dest_cell = this.cells[getCellnum(target_cellXY.x, target_cellXY.y)];
                if (!dest_cell || !dest_cell.containsEnemy()) {
                    piece.incrementMoves();
                }
            } else if (!isFriend) {
                piece.incrementMoves();
            }
            // directionBeforeMove est la direction effective pour le flip
            if (!isFriend || (isEnemy && (!dest_cell || !dest_cell.containsEnemy()))) {
                moveDesc = { piece, isBlocked: true };
                if (isEnemy) moveDesc.dir = directionBeforeMove;
            }
        }
        // Si la direction a changé mais pas de move, on force un flip
        if (isEnemy && originalDirection !== piece.getDirection() && !moveDesc) {
            moveDesc = { piece, isBlocked: true, dir: piece.getDirection() };
        }
        return { died: false, move: moveDesc };
    }

    canMoveHero(target_cellXY) {
        const dest_cell_type = this.getStaticCellType(target_cellXY);
        if (dest_cell_type === Cell.STATIC_CELL_TYPE.WALL || dest_cell_type === Cell.STATIC_CELL_TYPE.GAP) {
            return false;
        }
        const target_cellNum = getCellnum(target_cellXY.x, target_cellXY.y);
        if (this.cells[target_cellNum].containsHero()) {
            return false;
        }
        return true;
    }

    canMoveEnemy(target_cellXY) {
        const dest_cell_type = this.getStaticCellType(target_cellXY);
        if (dest_cell_type === Cell.STATIC_CELL_TYPE.WALL) {
            return false;
        }
        // According to the original Java logic, enemies block each other.
        const target_cellNum = getCellnum(target_cellXY.x, target_cellXY.y);
        if (this.cells[target_cellNum].containsEnemy()) {
            return false;
        }
        return true;
    }

    /**
     * Determines the best direction for a diagonal enemy for the current turn,
     * based on a prioritized search for an open path. This replicates the
     * original game's `direction_diaBee` logic.
     * @param {Enemy} enemy The diagonal enemy.
     * @returns {string} The chosen direction for the turn.
     */
    determineDiagonalEnemyDirection(enemy) {
        const priorities = {
            [Enum.DIRECTION.NORTH_EAST]: [Enum.DIRECTION.NORTH_EAST, Enum.DIRECTION.SOUTH_EAST, Enum.DIRECTION.NORTH_WEST, Enum.DIRECTION.SOUTH_WEST],
            [Enum.DIRECTION.SOUTH_EAST]: [Enum.DIRECTION.SOUTH_EAST, Enum.DIRECTION.NORTH_EAST, Enum.DIRECTION.SOUTH_WEST, Enum.DIRECTION.NORTH_WEST],
            [Enum.DIRECTION.NORTH_WEST]: [Enum.DIRECTION.NORTH_WEST, Enum.DIRECTION.NORTH_EAST, Enum.DIRECTION.SOUTH_WEST, Enum.DIRECTION.SOUTH_EAST],
            [Enum.DIRECTION.SOUTH_WEST]: [Enum.DIRECTION.SOUTH_WEST, Enum.DIRECTION.SOUTH_EAST, Enum.DIRECTION.NORTH_WEST, Enum.DIRECTION.NORTH_EAST]
        };

        const currentDirection = enemy.getDirection();
        const searchOrder = priorities[currentDirection];

        if (searchOrder) {
            for (const nextDir of searchOrder) {
                const targetXY = this.getTargetCell(enemy, nextDir);
                // The original logic only checks for grid boundaries (walls), not other pieces.
                if (this.getStaticCellType(targetXY) !== Cell.STATIC_CELL_TYPE.WALL) {
                    return nextDir; // Found the first valid direction.
                }
            }
        }

        // Fallback, though one direction should always be valid unless completely boxed in.
        return currentDirection;
    }

    isFatalMove(piece, dest_cell) {
        if (piece instanceof Hero) {
            return dest_cell.isTrap() || dest_cell.containsEnemy();
        }
        if (piece instanceof Enemy) {
            return dest_cell.containsHero();
        }
        return false;
    }

    checkIfWon() {
        if (!this.cells[this.wappo.getLocation()].isBeeHive()) return false;
        // Filter out empty slots in the sparse array before checking.
        for (const friend of this.friends.filter(f => f)) {
            if (!this.cells[friend.getLocation()].isBeeHive()) return false;
        }
        return true;
    }

    getStaticCellType(cellXY) {
        if (cellXY.x < 0 || cellXY.x > 5 || cellXY.y < 0 || cellXY.y > 5) {
            return Cell.STATIC_CELL_TYPE.WALL;
        }
        return this.cells[getCellnum(cellXY.x, cellXY.y)].getType();
    }

    getTargetCell(obj, dir) {
        const move = { x: 0, y: 0 };
        switch (dir) {
            case Enum.DIRECTION.NORTH:
                move.y = -1;
                break;
            case Enum.DIRECTION.SOUTH:
                move.y = 1;
                break;
            case Enum.DIRECTION.WEST:
                move.x = -1;
                break;
            case Enum.DIRECTION.EAST:
                move.x = 1;
                break;
            case Enum.DIRECTION.NORTH_WEST:
                move.y = -1; move.x = -1;
                break;
            case Enum.DIRECTION.NORTH_EAST:
                move.y = -1; move.x = 1;
                break;
            case Enum.DIRECTION.SOUTH_WEST:
                move.y = 1; move.x = -1;
                break;
            case Enum.DIRECTION.SOUTH_EAST:
                move.y = 1; move.x = 1;
                break;
        }
        const obj_coords = obj.getLocationXY();
        return { x: obj_coords.x + move.x, y: obj_coords.y + move.y };
    }

    /**
     * Creates a serializable snapshot of the current state, crucial for the solver.
     */
    getStateSnapshot() {
        // Filter sparse arrays to prevent errors and create a consistent state string.
        // The order is preserved because we iterate over the original sparse array's indices.
        const enemyStates = this.enemies.map(e => e ? { loc: e.getLocation(), dir: e.getDirection() } : null);
        const friendStates = this.friends.map(f => f ? f.getLocation() : null);

        return JSON.stringify({
            wappo: this.wappo.getLocation(),
            friends: friendStates,
            enemies: enemyStates
        });
    }

    /**
     * Restores a state from a snapshot.
     */
    loadStateFromSnapshot(snapshot) {
        const state = JSON.parse(snapshot);
        this.reset(); // Start from a clean slate

        // Clear all movable objects from default positions
        this.cells.forEach(c => c.removePiece());

        // Place Wappo
        this.wappo.setLocation(state.wappo);
        this.cells[state.wappo].setMovableObj(this.wappo);

        // Place Friends, respecting the sparse array from the snapshot
        state.friends.forEach((friendLoc, index) => {
            if (friendLoc !== null && this.friends[index]) {
                this.friends[index].setLocation(friendLoc);
                this.cells[friendLoc].setMovableObj(this.friends[index]);
            }
        });

        // Place Enemies, respecting the sparse array from the snapshot
        state.enemies.forEach((enemyState, index) => {
            if (enemyState !== null && this.enemies[index]) {
                this.enemies[index].setLocation(enemyState.loc);
                this.enemies[index].direction = enemyState.dir;
                this.cells[enemyState.loc].setMovableObj(this.enemies[index]);
            }
        });
    }
}
