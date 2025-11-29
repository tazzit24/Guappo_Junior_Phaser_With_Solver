 # Event-driven Architecture - Guappo Junior

 # Event-driven Architecture - Guappo Junior

## Overview

This refactored version of Guappo Junior implements an MVC architecture with an
event-driven communication layer that decouples game logic from presentation.

## Main Components

### 1. EventEmitter (`src/game/EventEmitter.js`)
- Purpose: Communication system between components
- Features:
  - `on(event, callback)`: Subscribe to an event
  - `off(event, callback)`: Unsubscribe from an event
  - `emit(event, ...args)`: Emit an event with data
- Benefits: Full decoupling, simple API, easier error handling

### 2. GameLogic (Model - `src/game/GameLogic.js`)
- Purpose: Pure game logic with no rendering dependencies
- Highlights:
  - Integrates an `EventEmitter`
  - Emits events for all important actions
  - Provides utility `on`/`off` methods for convenience
- Events emitted:
  - `turnStart`: Beginning of a simulated turn
  - `pieceMoved`: A piece moved (used to build animation queues)
  - `turnEnd`: End of a normal turn
  - `gameWon`: Player has won the level
  - `gameOver`: Player has lost the level

### 3. SceneMain (View - `src/scenes/SceneMain.js`)
- Purpose: Rendering and user interactions
- Highlights:
  - Listens to GameLogic events instead of accessing data directly
  - Synchronizes animations with the logical turn result
  - Centralizes event subscriptions in `setupGameEventListeners()`
  - Automatically cleans up subscriptions on shutdown
  - Proper animation state handling

## Communication Flow

```
┌─────────────┐                   ┌───────────────┐                      ┌──────────────────┐
│ User Input  │                   │   SceneMain   │                      │    GameLogic     │
└──────┬──────┘                   └───────┬───────┘                      └────────┬─────────┘
       │                                  │                                       │
       │   Player presses a direction     │                                       │
       ├─────────────────────────────────>│                                       │
       │                                  │                                       │
       │                                  │        simulateTurn(direction)        │
       │                                  ├──────────────────────────────────────>│
       │                                  │                                       │
       │                                  │                                       │ Compute moves and final state
       │                                  │       Emit 'turnStart', 'pieceMoved'  │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │      If win: emit 'gameWon'           │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │      If loss: emit 'gameOver'         │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │ Update lastTurnMoves and return       │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │ Animate all moves with await animateMoves()
       │                                  │                                       │
       │                                  │ After animations complete:            │
       │                                  │ If win/loss: show end screen         │
       │                                  │ Else: re-enable controls             │
       │                                  │ Emit 'turnEnd'                        │
       │                                  │                                       │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Event Payloads

### `turnStart`
```javascript
{
  direction: string,  // Movement direction
  moves: number       // Number of moves simulated
}
```

### `pieceMoved`
```javascript
{
  moves: Array  // List of atomic moves to animate
}
```

### `turnEnd`
```javascript
{
  moves: number,     // Total number of moves
  state: string      // Serialized game state
}
```

### `gameWon`
```javascript
{
  score: number,     // Calculated score
  moves: number,     // Number of moves
  levelId: number    // Level identifier
}
```

### `gameOver`
```javascript
{
  reason: string,    // 'wappo_died', 'friend_died', 'enemy_attack'
  moves: number      // Number of moves
}
```

## Benefits of this Architecture

1. Decoupling: GameLogic runs independently from Phaser rendering
2. Testability: Logic can be unit-tested easily
3. Maintainability: Changes are isolated to specific components
4. Scalability: Easy to add new features
5. Flexibility: Multiple views can be built for the same model

## Usage Examples

### Listen to a game event
```javascript
game.on('gameWon', (data) => {
  console.log(`Level won in ${data.moves} moves!`);
});
```

### Unsubscribe from an event
```javascript
const unsubscribe = game.on('turnStart', callback);
unsubscribe(); // Unsubscribe
```

## Tests

A test script is available in `test-events.js` to verify the event system behavior.

## Overview

This refactored version of Guappo Junior implements an MVC architecture with an
event-driven communication layer that decouples game logic from presentation.

## Main Components

### 1. EventEmitter (`src/game/EventEmitter.js`)
- Purpose: Communication system between components
- Features:
  - `on(event, callback)`: Subscribe to an event
  - `off(event, callback)`: Unsubscribe from an event
  - `emit(event, ...args)`: Emit an event with data
- Benefits: Full decoupling, simple API, easier error handling

### 2. GameLogic (Model - `src/game/GameLogic.js`)
- Purpose: Pure game logic with no rendering dependencies
- Highlights:
  - Integrates an `EventEmitter`
  - Emits events for all important actions
  - Provides utility `on`/`off` methods for convenience
- Events emitted:
  - `turnStart`: Beginning of a simulated turn
  - `pieceMoved`: A piece moved (used to build animation queues)
  - `turnEnd`: End of a normal turn
  - `gameWon`: Player has won the level
  - `gameOver`: Player has lost the level

### 3. SceneMain (View - `src/scenes/SceneMain.js`)
- Purpose: Rendering and user interactions
- Highlights:
  - Listens to GameLogic events instead of accessing data directly
  - Synchronizes animations with the logical turn result
  - Centralizes event subscriptions in `setupGameEventListeners()`
  - Automatically cleans up subscriptions on shutdown
  - Proper animation state handling

## Communication Flow

```
┌─────────────┐                   ┌───────────────┐                      ┌──────────────────┐
│ User Input  │                   │   SceneMain   │                      │    GameLogic     │
└──────┬──────┘                   └───────┬───────┘                      └────────┬─────────┘
       │                                  │                                       │
       │   Player presses a direction     │                                       │
       ├─────────────────────────────────>│                                       │
       │                                  │                                       │
       │                                  │        simulateTurn(direction)        │
       │                                  ├──────────────────────────────────────>│
       │                                  │                                       │
       │                                  │                                       │ Compute moves and final state
       │                                  │       Emit 'turnStart', 'pieceMoved'  │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │      If win: emit 'gameWon'           │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │      If loss: emit 'gameOver'         │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │ Update lastTurnMoves and return       │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │ Animate all moves with await animateMoves()
       │                                  │                                       │
       │                                  │ After animations complete:            │
       │                                  │ If win/loss: show end screen         │
       │                                  │ Else: re-enable controls             │
       │                                  │ Emit 'turnEnd'                        │
       │                                  │                                       │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Event Payloads

### `turnStart`
```javascript
{
  direction: string,  // Movement direction
  moves: number       // Number of moves simulated
}
```

### `pieceMoved`
```javascript
{
  moves: Array  // List of atomic moves to animate
}
```

### `turnEnd`
```javascript
{
  moves: number,     // Total number of moves
  state: string      // Serialized game state
}
```

### `gameWon`
```javascript
{
  score: number,     // Calculated score
  moves: number,     // Number of moves
  levelId: number    // Level identifier
}
```

### `gameOver`
```javascript
{
  reason: string,    // 'wappo_died', 'friend_died', 'enemy_attack'
  moves: number      // Number of moves
}
```

## Benefits of this Architecture

1. Decoupling: GameLogic runs independently from Phaser rendering
2. Testability: Logic can be unit-tested easily
3. Maintainability: Changes are isolated to specific components
4. Scalability: Easy to add new features
5. Flexibility: Multiple views can be built for the same model

## Usage Examples

### Listen to a game event
```javascript
game.on('gameWon', (data) => {
  console.log(`Level won in ${data.moves} moves!`);
});
```

### Unsubscribe from an event
```javascript
const unsubscribe = game.on('turnStart', callback);
unsubscribe(); // Unsubscribe
```

## Tests

A test script is available in `test-events.js` to verify the event system behavior.
