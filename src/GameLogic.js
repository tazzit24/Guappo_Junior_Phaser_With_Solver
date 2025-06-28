'use strict';

/**
 * This class represents a "headless" version of the game.
 * It knows the rules and can simulate moves without any graphics.
 */
class GameLogic {

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

        // --- Wappo's Move ---
        // The game checks for a loss/win condition after every single piece moves.
        // The simulation must replicate this behavior.
        if (this.movePiece(this.wappo, direction)) {
            return { isWon: false, isLost: true }; // Wappo died
        }
        // A win is possible if Wappo was the only piece left and moved onto a beehive.
        if (this.checkIfWon()) {
            return { isWon: true, isLost: false };
        }

        // --- Friends' Moves ---
        const friendSteps = this.friends.filter(f => f).map(f => f.getStep());
        const maxFriendSteps = friendSteps.length > 0 ? Math.max(...friendSteps) : 0;

        for (let i = 0; i < maxFriendSteps; i++) {
            // Move friends sequentially for each step to prevent race conditions,
            // matching the updated logic in SceneMain.js.
            for (const friend of this.friends.filter(f => f)) {
                if (friend && !friend.finishedMoving()) {
                    const isLost = this.movePiece(friend, direction);
                    if (isLost) {
                        return { isWon: false, isLost: true }; // A friend died
                    }
                    if (this.checkIfWon()) {
                        return { isWon: true, isLost: false }; // A win occurred
                    }
                }
            }
        }

        // --- Enemies' Moves ---
        // This logic mirrors SceneMain.js: enemies are sorted by axis (H, V, D)
        // and moved sequentially for each step to ensure deterministic behavior.
        const activeEnemies = this.enemies.filter(e => e);
        if (activeEnemies.length > 0) {
            const enemySteps = activeEnemies.map(e => e.getStep());
            const maxEnemySteps = Math.max(...enemySteps);

            // Sort enemies deterministically to match SceneMain.js:
            // 1. Primary sort by axis ('H' -> 'V' -> 'D').
            // 2. Secondary sort (tie-breaker) by the original 'order' property.
            const sortedEnemies = activeEnemies.sort((a, b) => {
                const axisOrder = { 'H': 0, 'V': 1, 'D': 2 };
                const axisA = axisOrder[a.getAxis()];
                const axisB = axisOrder[b.getAxis()];

                if (axisA !== axisB) {
                    return axisA - axisB;
                }
                return a.getOrder() - b.getOrder();
            });

            for (let i = 0; i < maxEnemySteps; i++) {
                for (const enemy of sortedEnemies) {
                    if (enemy && !enemy.finishedMoving()) {
                        const isLost = this.movePiece(enemy, enemy.getDirection());
                        if (isLost) {
                            // If an enemy move results in a loss, the turn ends immediately.
                            return { isWon: false, isLost: true };
                        }
                    }
                }
            }
        }

        // Reset moves for all pieces at the very end of the turn sequence.
        this.wappo.resetMoves();
        this.friends.forEach(f => f && f.resetMoves());
        this.enemies.forEach(e => e && e.resetMoves());

        // Final check, in case the board is clear and heroes are already on beehives
        return { isWon: this.checkIfWon(), isLost: false };
    }

    /**
     * Generic move logic for any piece.
     * @returns {boolean} - True if the move resulted in a death, otherwise false.
     */
    movePiece(piece, dir) {
        const isFriend = piece instanceof Hero && piece !== this.wappo;
        const isEnemy = piece instanceof Enemy;

        let target_cellXY = this.getTargetCell(piece, dir);

        // Enemy-specific logic: turn around at walls
        if (isEnemy && this.getStaticCellType(target_cellXY) === Cell.STATIC_CELL_TYPE.WALL) {
            piece.turnAround();
            target_cellXY = this.getTargetCell(piece, piece.getDirection());
        }

        const canMove = isEnemy ? this.canMoveEnemy(target_cellXY) : this.canMoveHero(target_cellXY);

        // --- Perform Move ---
        if (canMove) {
            piece.incrementMoves();

            const target_cellNum = getCellnum(target_cellXY.x, target_cellXY.y);
            const dest_cell = this.cells[target_cellNum];

            if (this.isFatalMove(piece, dest_cell)) {
                return true; // Death occurred.
            }

            this.cells[piece.getLocation()].removePiece();
            piece.setLocation(target_cellNum);
            dest_cell.setMovableObj(piece);
        } else { // Blocked
            // A friend's move should only be consumed if blocked by a static obstacle (wall/gap).
            // If blocked by another hero, it should wait for the path to clear.
            const dest_cell_type = this.getStaticCellType(target_cellXY);
            const isBlockedByStatic = (dest_cell_type === Cell.STATIC_CELL_TYPE.WALL || dest_cell_type === Cell.STATIC_CELL_TYPE.GAP);

            if (!isFriend || isBlockedByStatic) {
                // Wappo, Enemies, and Friends blocked by static obstacles consume their move.
                piece.incrementMoves();
            }
        }

        return false; // Move was successful and not fatal.
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
