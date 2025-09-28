// Fichier SaveGameHelper.js
// Centralise la logique de sauvegarde/chargement des scores

export class SaveGameHelper {
    
    // Retourne l'objet JSON complet des scores, ou un objet vide s'il n'existe pas
    static getScoresObj() {
        try {
            return JSON.parse(window.localStorage.getItem('scores') || '{}');
        } catch (e) {
            return {};
        }
    }

    // Sauvegarde le score pour un niveau donné
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

    // Retourne le plus haut niveau sauvegardé (Integer), ou null si aucun niveau sauvegardé
    static getHighestSavedLevel() {
        const scoresObj = SaveGameHelper.getScoresObj();
        if (!scoresObj.levels) return null;
        const keys = Object.keys(scoresObj.levels);
        if (keys.length === 0) return null;
        // Return the highest numeric key
        return Math.max(...keys.map(k => parseInt(k, 10)).filter(n => !isNaN(n)));
    }

    // Retourne l'objet json du score pour un niveau donné, ou null si pas de score
    static getLevelScore(levelId) {
        const scoresObj = SaveGameHelper.getScoresObj();
        if (!scoresObj.levels) return null;
        return scoresObj.levels[String(levelId)] || null;
    }

    /* Retourne le score corrigé à afficher (1 si <= 0 pour éviter les scores nuls ou négatifs)
       Dans le jeu d'origine, on obtenait un gameover immédiat si le score tombait trop bas, en fonction du niveau de difficulté choisi.
       Je ne veux pas reproduire ce comportement frustrant, tous les chemins mènent à Rome */
    static getDisplayScore(score) {
        return score <= 0 ? 1 : score;
    }

    // Calcule le score final (celui sauvegardé) en fonction des mouvements effectués et du score de base
    static getCalculatedScore(moves, baseScore) {
        return baseScore - (moves - baseScore);
    }

    // Recalcule le nombre de mouvements effectués en fonction du score calculé sauvegardé et du score de base (fait l'inverse de getCalculatedScore)
    static getMovesFromScore(calculatedScore, baseScore) {
        return (baseScore - calculatedScore) + baseScore;
    }

    static clearScores() {
        // TODO: supprimer les scores
        window.localStorage.removeItem('scores');
    }

    
}