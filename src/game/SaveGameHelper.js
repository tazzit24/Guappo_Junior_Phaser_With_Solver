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

    // Export scores as JSON blob, returns the JSON object
    static exportScores() {
        const scoresObj = this.getScoresObj();
        return {
            version: 1,
            exportDate: new Date().toISOString(),
            data: scoresObj
        };
    }

    // Import scores from a JSON object, with validation
    static importScores(importedData) {
        try {
            if (!importedData || typeof importedData !== 'object') {
                throw new Error('Invalid data: not an object');
            }

            // Handle both direct scores object and versioned export format
            let scoresData = importedData.data || importedData;

            // Validate structure
            if (scoresData.levels && typeof scoresData.levels !== 'object') {
                throw new Error('Invalid data: levels must be an object');
            }

            // Validate each level entry
            if (scoresData.levels) {
                Object.entries(scoresData.levels).forEach(([levelId, levelData]) => {
                    if (typeof levelData !== 'object') {
                        throw new Error(`Invalid data: level ${levelId} is not an object`);
                    }
                    if (levelData.bestScore !== undefined && typeof levelData.bestScore !== 'number') {
                        throw new Error(`Invalid data: level ${levelId} bestScore must be a number`);
                    }
                    if (levelData.lastScore !== undefined && typeof levelData.lastScore !== 'number') {
                        throw new Error(`Invalid data: level ${levelId} lastScore must be a number`);
                    }
                });
            }

            // Replace entire scores
            window.localStorage.setItem('scores', JSON.stringify(scoresData));

            return { success: true, message: 'Scores imported successfully' };
        } catch (err) {
            return { success: false, message: `Import failed: ${err.message}` };
        }
    }

    // Trigger download of scores as JSON file
    static downloadScores() {
        const exportData = this.exportScores();
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `guappo-save-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Trigger file picker and parse the JSON without importing it yet
    static async selectScoresFile() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';

            const cleanup = () => {
                input.value = '';
                input.remove();
            };

            input.onchange = async (e) => {
                try {
                    const file = e.target.files[0];
                    cleanup();
                    if (!file) {
                        resolve({ success: false, message: 'No file selected' });
                        return;
                    }
                    const text = await file.text();
                    const importedData = JSON.parse(text);
                    resolve({
                        success: true,
                        data: importedData,
                        fileName: file.name,
                        exportDate: this.extractExportDate(importedData),
                        levelCount: this.extractLevelCount(importedData)
                    });
                } catch (err) {
                    resolve({ success: false, message: `File read error: ${err.message}` });
                }
            };

            input.click();
        });
    }

    static extractExportDate(importedData) {
        if (!importedData || typeof importedData !== 'object') {
            return null;
        }
        if (importedData.exportDate) {
            return importedData.exportDate;
        }
        if (importedData.metadata && importedData.metadata.exportDate) {
            return importedData.metadata.exportDate;
        }
        if (importedData.data && importedData.data.exportDate) {
            return importedData.data.exportDate;
        }
        return null;
    }

    static extractLevelCount(importedData) {
        if (!importedData || typeof importedData !== 'object') {
            return null;
        }
        const payload = importedData.data || importedData;
        if (!payload.levels || typeof payload.levels !== 'object') {
            return 0;
        }
        return Object.keys(payload.levels).length;
    }

    // Backwards compatible helper: select file and immediately import
    static async importScoresFromFile() {
        const selection = await this.selectScoresFile();
        if (!selection.success) {
            return selection;
        }
        return this.importScores(selection.data);
    }
}