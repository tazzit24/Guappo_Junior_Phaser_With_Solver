// File SaveGameHelper.js
// Centralizes score save/load logic

export class SaveGameHelper {
    
    // Returns the full scores JSON object, or an empty object if none exists
    static getScoresObj() {
        try {
            return JSON.parse(window.localStorage.getItem('scores') || '{}');
        } catch (e) {
            return {};
        }
    }

    // Save score for a given level
    static saveScore(levelId, score) {
        const now = new Date().toISOString();
        let scoresObj = this.getScoresObj();
        if (!scoresObj.levels) scoresObj.levels = {};
        const key = String(levelId);
        let levelScore = scoresObj.levels[key];
        if (!levelScore) {
            scoresObj.levels[key] = {
                bestScore: score,
                dateBest: now,
                lastScore: score,
                dateLast: now
            };
        } else {
            levelScore.lastScore = score;
            levelScore.dateLast = now;
            if (score > levelScore.bestScore) {
                levelScore.bestScore = score;
                levelScore.dateBest = now;
            }
        }
        window.localStorage.setItem('scores', JSON.stringify(scoresObj));
    }

    // Returns the highest saved level (integer), or null if none saved
    static getHighestSavedLevel() {
        const scoresObj = SaveGameHelper.getScoresObj();
        if (!scoresObj.levels) return null;
        const keys = Object.keys(scoresObj.levels);
        if (keys.length === 0) return null;
        // Return the highest numeric key
        return Math.max(...keys.map(k => parseInt(k, 10)).filter(n => !isNaN(n)));
    }

    // Returns the score JSON object for a given level, or null if none
    static getLevelScore(levelId) {
        const scoresObj = SaveGameHelper.getScoresObj();
        if (!scoresObj.levels) return null;
        return scoresObj.levels[String(levelId)] || null;
    }

     /* Return the adjusted display score (1 if <= 0 to avoid zero or negative scores)
         In the original game, an immediate gameover occurred if the score fell too low, depending on the chosen difficulty.
         I don't want to reproduce that frustrating behavior; all paths lead to Rome. */
    static getDisplayScore(score) {
        return score <= 0 ? 1 : score;
    }

    // Calculate the final score (the one saved) based on moves performed and the base score
    static getCalculatedScore(moves, baseScore) {
        return baseScore - (moves - baseScore);
    }

    // Recompute the number of moves performed from the saved calculated score and the base score (inverse of getCalculatedScore)
    static getMovesFromScore(calculatedScore, baseScore) {
        return (baseScore - calculatedScore) + baseScore;
    }

    static clearScores() {
        // TODO: remove scores
        window.localStorage.removeItem('scores');
    }

    
}