/**
 * Test script pour vérifier l'architecture événementielle
 * Peut être exécuté dans la console du navigateur
 */

// Test de l'EventEmitter
console.log("=== Test EventEmitter ===");
const testEmitter = new EventEmitter();

// Test basic on/off/emit
let counter = 0;
const listener = (data) => {
    counter++;
    console.log(`Event received: ${data}, count: ${counter}`);
};

testEmitter.on('test', listener);
testEmitter.emit('test', 'hello');
testEmitter.emit('test', 'world');
console.log(`Counter after 2 events: ${counter}`); // Should be 2

testEmitter.off('test', listener);
testEmitter.emit('test', 'ignored');
console.log(`Counter after off: ${counter}`); // Should still be 2

// Test GameLogic events
console.log("\n=== Test GameLogic Events ===");
// Cette partie nécessite d'avoir une instance de GameLogic active

function testGameLogicEvents() {
    if (typeof game !== 'undefined' && game.eventEmitter) {
        console.log("GameLogic instance found, testing events...");
        
        // Subscribe to all game events
        game.on('turnStart', (data) => console.log('🎮 Turn started:', data));
        game.on('pieceMoved', (data) => console.log('🚶 Piece moved:', data.moves.length, 'moves'));
        game.on('turnEnd', (data) => console.log('⏹️ Turn ended:', data));
        game.on('gameWon', (data) => console.log('🎉 Game won!', data));
        game.on('gameOver', (data) => console.log('💀 Game over:', data));
        
        console.log("Event listeners set up. Try making a move!");
    } else {
        console.log("GameLogic instance not found. Start a game level first.");
    }
}

// Auto-run test if we're in the game context
if (typeof window !== 'undefined') {
    window.testGameLogicEvents = testGameLogicEvents;
    console.log("Type 'testGameLogicEvents()' in console after starting a level to test game events");
}

export { testEmitter, testGameLogicEvents };