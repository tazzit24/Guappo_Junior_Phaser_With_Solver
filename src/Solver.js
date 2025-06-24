'use strict';

class Solver {

    /**
     * Attempts to find a solution for a given level.
     * @param {Level} level - The level object to solve.
     * @returns {object} An object with the solution path or failure status.
     */
    static solve(level) {
        const initialLogic = new GameLogic(level);
        const initialState = initialLogic.getStateSnapshot();

        // The queue stores states to visit. Each item is { state, path_to_state }
        const queue = [{
            state: initialState,
            path: []
        }];

        // 'visited' stores states we've already processed to avoid cycles and redundant work.
        const visited = new Set([initialState]);

        const possibleMoves = [Enum.DIRECTION.NORTH, Enum.DIRECTION.SOUTH, Enum.DIRECTION.EAST, Enum.DIRECTION.WEST];

        // Limit search depth to prevent it from running forever on unsolvable/complex levels
        const MAX_DEPTH = level.getBasescore() * 3; // Arbitrary limit based on level's base score

        while (queue.length > 0) {
            const { state, path } = queue.shift(); // Get the next state to explore

            if (path.length >= MAX_DEPTH) {
                continue; // Stop exploring this path if it's too long
            }

            // Try every possible move from the current state
            for (const move of possibleMoves) {
                const logic = new GameLogic(level);
                logic.loadStateFromSnapshot(state); // Load the state we're exploring

                const result = logic.simulateTurn(move);
                const nextState = logic.getStateSnapshot();

                if (result.isWon) {
                    return { solved: true, path: [...path, move] }; // SUCCESS!
                }

                if (!result.isLost && !visited.has(nextState)) {
                    visited.add(nextState);
                    queue.push({ state: nextState, path: [...path, move] });
                }
            }
        }

        return { solved: false, path: null }; // No solution found within the limits
    }
}