// Fichier SaveGameHelper.js
// Centralise la logique de sauvegarde/chargement des scores

class SaveGameHelper {
    static getScoresObj() {
        try {
            return JSON.parse(localStorage.getItem('scores') || '{}');
        } catch (e) {
            return {};
        }
    }

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
        localStorage.setItem('scores', JSON.stringify(scoresObj));
    }

    static getHighestLevel() {
        const scoresObj = SaveGameHelper.getScoresObj();
        if (!scoresObj.levels) return 1;
        const keys = Object.keys(scoresObj.levels);
        if (keys.length === 0) return 1;
        // Return the highest numeric key
        return Math.max(...keys.map(k => parseInt(k, 10)).filter(n => !isNaN(n)));
    }

    static getLevelScore(levelId) {
        const scoresObj = SaveGameHelper.getScoresObj();
        if (!scoresObj.levels) return null;
        return scoresObj.levels[String(levelId)] || null;
    }
}

window.SaveGameHelper = SaveGameHelper;
