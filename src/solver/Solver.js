'use strict';

import { GameLogic } from '../game/GameLogic.js';
import { Utils } from '../game/Utils.js';
import { Level } from '../game/Level.js';
import { Enum } from '../game/Enum.js';

export class Solver {

    /**
     * Attempts to find a solution for a given level.
     * @param {Level} level - The level object to solve.
     * @param {object} [options={algorithm: 'BFS'}] - Solver options, e.g., { algorithm: 'DFS', initialState: null, maxDepth: null }.
     * @returns {object} An object with the solution path or failure status.
     */
    static solve(level, options = { algorithm: 'BFS' }) {
        console.log(`Using ${options.algorithm} solver.`);
        if (options.algorithm === 'A*') {
            return this._solveAStar(level, options.initialState, options.maxDepth);
        }
        if (options.algorithm === 'PureBacktracking') {
            return this._solvePureBacktracking(level, options.initialState, options.maxDepth);
        }
        if (options.algorithm === 'DFS') {
            return this._solveDFS(level, options.initialState, options.maxDepth);
        }
        // Default to BFS
        return this._solveBFS(level, options.initialState, options.maxDepth);
    }

    /**
     * Solves using Breadth-First Search (finds the shortest path).
     * @private
     */
    static _solveBFS(level, initialState = null, maxDepth = null) {
        const initialLogic = new GameLogic(level);
        
        // If an initial state is provided, load it; otherwise use the level's initial state
        if (initialState) {
            initialLogic.loadStateFromSnapshot(initialState);
        }
        
        const startState = initialLogic.getStateSnapshot();

        // The queue stores states to visit. Each item is { state, path_to_state }
        const queue = [{ state: startState, path: [] }];

        // 'visited' stores states we've already processed to avoid cycles and redundant work.
        const visited = new Set([startState]);

        const possibleMoves = [Enum.DIRECTION.NORTH, Enum.DIRECTION.SOUTH, Enum.DIRECTION.EAST, Enum.DIRECTION.WEST];

        // Limit search depth to prevent it from running forever
        const MAX_DEPTH = maxDepth || (level.getBasescore() * 2); // BFS finds shortest path, so a smaller multiplier is fine.

        while (queue.length > 0) {
            const { state, path } = queue.shift(); // Get the next state to explore

            if (path.length >= MAX_DEPTH) {
                continue;
            }

            // Try every possible move from the current state
            for (const move of possibleMoves) {
                const logic = new GameLogic(level);
                logic.loadStateFromSnapshot(state);

                const result = logic.simulateTurn(move, false); // Don't save score during solver simulation
                const nextState = logic.getStateSnapshot();

                if (result.isWon) {
                    return { solved: true, path: [...path, move], algorithm: 'BFS' };
                }

                if (!result.isLost && !visited.has(nextState)) {
                    visited.add(nextState);
                    queue.push({ state: nextState, path: [...path, move] });
                }
            }
        }

        return { solved: false, path: null, algorithm: 'BFS' };
    }

    /**
     * Solves using Depth-First Search (backtracking). More memory-efficient for long solutions.
     * @private
     */
    static _solveDFS(level) {
        const initialLogic = new GameLogic(level);
        const visited = new Set();
        // A much higher depth is needed for DFS on complex levels, as it doesn't find the shortest path.
        // This value is increased to handle levels with long solutions like 195.
        const MAX_DEPTH = level.getBasescore() * 3000;

        const solutionPath = this._dfsRecursive(initialLogic, [], visited, MAX_DEPTH);

        if (solutionPath) {
            return { solved: true, path: solutionPath, algorithm: 'DFS' };
        } else {
            return { solved: false, path: null, algorithm: 'DFS' };
        }
    }

    /**
     * The recursive helper for the DFS backtracking algorithm.
     * @private
     */
    static _dfsRecursive(logic, currentPath, visited, maxDepth) {
        const currentState = logic.getStateSnapshot();

        if (currentPath.length >= maxDepth || visited.has(currentState)) {
            return null;
        }

        visited.add(currentState); // Mark visited for this path

        const possibleMoves = [Enum.DIRECTION.NORTH, Enum.DIRECTION.SOUTH, Enum.DIRECTION.EAST, Enum.DIRECTION.WEST];
        for (const move of possibleMoves) {
            const nextLogic = new GameLogic(logic.level);
            nextLogic.loadStateFromSnapshot(currentState);
            const result = nextLogic.simulateTurn(move, false); // Don't save score during solver simulation

            if (result.isWon) return [...currentPath, move];

            if (!result.isLost) {
                const solution = this._dfsRecursive(nextLogic, [...currentPath, move], visited, maxDepth);
                if (solution) return solution;
            }
        }

        // DO NOT un-mark the state when backtracking. In a state-space graph, once a state
        // is visited, it should not be explored again, as this creates infinite cycles.
        return null;
    }

    /**
     * Solves using a "pure" backtracking (DFS) algorithm without state tracking.
     * This explores all paths up to a given depth, even if it revisits states.
     * Useful for levels where the solution involves seemingly "suboptimal" moves.
     * @private
     */
    static _solvePureBacktracking(level) {
        const initialLogic = new GameLogic(level);
        // The max depth is directly tied to the level's basescore, as per user's request.
        const MAX_DEPTH = level.getBasescore();

        const result = this._pureBacktrackingRecursive(initialLogic, [], MAX_DEPTH);

        return {
            solved: result.solved,
            path: result.path,
            algorithm: 'PureBacktracking'
        };
    }

    /**
     * The recursive helper for the pure backtracking algorithm.
     * @private
     */
    static _pureBacktrackingRecursive(logic, currentPath, maxDepth) {
        if (currentPath.length >= maxDepth) {
            return { solved: false, path: currentPath }; // Reached max depth
        }

        const currentState = logic.getStateSnapshot(); // Snapshot to restore for next branches
        let longestFailedPath = currentPath;

        const possibleMoves = [Enum.DIRECTION.NORTH, Enum.DIRECTION.SOUTH, Enum.DIRECTION.EAST, Enum.DIRECTION.WEST];
        for (const move of possibleMoves) {
            const nextLogic = new GameLogic(logic.level);
            nextLogic.loadStateFromSnapshot(currentState); // Restore state for this branch
            const result = nextLogic.simulateTurn(move, false); // Don't save score during solver simulation

            if (result.isWon) return { solved: true, path: [...currentPath, move] };

            if (!result.isLost) {
                const subResult = this._pureBacktrackingRecursive(nextLogic, [...currentPath, move], maxDepth);
                if (subResult.solved) return subResult; // Propagate solution
                if (subResult.path.length > longestFailedPath.length) {
                    longestFailedPath = subResult.path;
                }
            }
        }
        return { solved: false, path: longestFailedPath }; // No solution found from this path
    }

    /**
     * Solves using the A* algorithm. Efficient for complex levels with long paths.
     * @private
     */
    static _solveAStar(level) {
        const initialLogic = new GameLogic(level);
        const initialState = initialLogic.getStateSnapshot();

        // The set of discovered nodes that may need to be (re-)expanded.
        // We'll use an array and sort it to act as a priority queue.
        const openSet = [{
            state: initialState,
            path: [],
            gScore: 0, // Cost from start to current
            fScore: this._heuristic(initialLogic) // Total estimated cost
        }];

        // For a state, stores the gScore of the best path found so far.
        const visited = new Map();
        visited.set(initialState, 0);

        const possibleMoves = [Enum.DIRECTION.NORTH, Enum.DIRECTION.SOUTH, Enum.DIRECTION.EAST, Enum.DIRECTION.WEST];

        while (openSet.length > 0) {
            // Find node with lowest fScore in openSet (this is the "priority queue" part)
            openSet.sort((a, b) => a.fScore - b.fScore);
            const current = openSet.shift();

            // If we've found a better path to this state already, skip.
            if (current.gScore > visited.get(current.state)) {
                continue;
            }

            for (const move of possibleMoves) {
                const nextLogic = new GameLogic(level);
                nextLogic.loadStateFromSnapshot(current.state);

                const result = nextLogic.simulateTurn(move, false); // Don't save score during solver simulation
                const nextState = nextLogic.getStateSnapshot();

                if (result.isWon) {
                    return { solved: true, path: [...current.path, move], algorithm: 'A*' };
                }

                if (!result.isLost) {
                    const tentative_gScore = current.gScore + 1;

                    // If this is a new state or we found a better path to it...
                    if (!visited.has(nextState) || tentative_gScore < visited.get(nextState)) {
                        visited.set(nextState, tentative_gScore);
                        const fScore = tentative_gScore + this._heuristic(nextLogic);
                        openSet.push({
                            state: nextState,
                            path: [...current.path, move],
                            gScore: tentative_gScore,
                            fScore: fScore
                        });
                    }
                }
            }
        }

        return { solved: false, path: null, algorithm: 'A*' };
    }

    /**
     * Heuristic function for A*. Estimates the cost to reach the goal.
     * It calculates the sum of Manhattan distances for each hero to their nearest beehive.
     * @private
     */
    static _heuristic(logic) {
        const beehiveLocations = logic.level.getBeehives().map(cellNum => Utils.getCoords(cellNum));
        if (beehiveLocations.length === 0) return 0;

        const heroes = [logic.wappo, ...logic.friends.filter(f => f)];
        return heroes.reduce((totalDistance, hero) => {
            const heroCoords = hero.getLocationXY();
            const minHeroDist = Math.min(...beehiveLocations.map(bhCoords =>
                Math.abs(heroCoords.x - bhCoords.x) + Math.abs(heroCoords.y - bhCoords.y)
            ));
            return totalDistance + minHeroDist;
        }, 0);
    }
}
