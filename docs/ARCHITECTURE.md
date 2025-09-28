# Architecture Événementielle - Guappo Junior

## Vue d'ensemble

Cette version refactorisée du jeu Guappo Junior implémente une architecture MVC avec gestion événementielle pour découpler la logique de jeu de son affichage.

## Composants Principaux

### 1. EventEmitter (`src/game/EventEmitter.js`)
- **Rôle** : Système de communication entre composants
- **Fonctionnalités** :
  - `on(event, callback)` : S'abonner à un événement
  - `off(event, callback)` : Se désabonner d'un événement  
  - `emit(event, ...args)` : Émettre un événement avec des données
- **Avantages** : Découplage total, gestion d'erreurs, API simple

### 2. GameLogic (Modèle - `src/game/GameLogic.js`)
- **Rôle** : Logique de jeu pure, sans dépendance graphique
- **Nouveautés** :
  - Intégration d'un `EventEmitter` 
  - Émission d'événements pour toutes les actions importantes
  - Méthodes utilitaires `on`/`off` pour faciliter l'usage
- **Événements émis** :
  - `turnStart` : Début d'un tour de jeu
  - `pieceMoved` : Déplacement de pièce(s)
  - `turnEnd` : Fin d'un tour normal
  - `gameWon` : Victoire du joueur
  - `gameOver` : Défaite du joueur

### 3. SceneMain (Vue - `src/scenes/SceneMain.js`)
- **Rôle** : Affichage et interactions utilisateur
- **Nouveautés** :
  - Écoute des événements GameLogic au lieu d'accès direct aux données
  - Animation synchronisée des mouvements avant toute action de fin de jeu
  - Centralisation des abonnements dans `setupGameEventListeners()`
  - Nettoyage automatique des événements à la fermeture
  - Gestion correcte de l'état d'animation

## Flux de Communication

```
┌─────────────┐                   ┌───────────────┐                      ┌──────────────────┐
│ Utilisateur │                   │   SceneMain   │                      │    GameLogic     │
└──────┬──────┘                   └───────┬───────┘                      └────────┬─────────┘
       │                                  │                                       │
       │   Appuie sur une direction       │                                       │
       ├─────────────────────────────────>│                                       │
       │                                  │                                       │
       │                                  │        simulateTurn(direction)        │
       │                                  ├──────────────────────────────────────>│
       │                                  │                                       │
       │                                  │                                       │ Calcule les mouvements
       │                                  │                                       │ et l'état final du jeu
       │                                  │                                       │
       │                                  │       Émet 'turnStart', 'pieceMoved'  │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │      Si victoire: émet 'gameWon'      │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │      Si défaite: émet 'gameOver'      │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │ Met à jour lastTurnMoves et retourne  │
       │                                  │<──────────────────────────────────────┤
       │                                  │                                       │
       │                                  │ Anime tous les mouvements             │
       │                                  │ avec await animateMoves()             │
       │                                  │                                       │
       │                                  │                                       │
       │           APRÈS l'animation complète:                                    │
       │                                  │                                       │
       │                                  │ Si victoire/défaite:                  │
       │                                  │ Affiche écran de fin                  │
       │                                  │                                       │
       │                                  │ Sinon: Réactive contrôles             │
       │                                  │                                       │
       │                                  │ Émet 'turnEnd'                        │
       │                                  │                                       │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Événements Détaillés

### `turnStart`
```javascript
{
  direction: string,  // Direction du mouvement
  moves: number      // Nombre de coups joués
}
```

### `pieceMoved` 
```javascript
{
  moves: Array  // Liste des mouvements à animer
}
```

### `turnEnd`
```javascript
{
  moves: number,     // Nombre total de coups
  state: string      // État sérialisé du jeu
}
```

### `gameWon`
```javascript
{
  score: number,     // Score calculé
  moves: number,     // Nombre de coups
  levelId: number    // ID du niveau
}
```

### `gameOver`
```javascript
{
  reason: string,    // 'wappo_died', 'friend_died', 'enemy_attack'
  moves: number      // Nombre de coups
}
```

## Avantages de cette Architecture

1. **Découplage** : GameLogic fonctionne indépendamment de Phaser
2. **Testabilité** : La logique peut être testée unitairement
3. **Maintenabilité** : Modifications isolées dans chaque composant
4. **Évolutivité** : Ajout facile de nouvelles fonctionnalités
5. **Flexibilité** : Possibilité d'avoir plusieurs vues pour le même modèle

## Utilisation

### Écouter un événement de jeu
```javascript
game.on('gameWon', (data) => {
  console.log(`Niveau gagné en ${data.moves} coups !`);
});
```

### Se désabonner d'un événement
```javascript
const unsubscribe = game.on('turnStart', callback);
unsubscribe(); // Se désabonner
```

## Tests

Un script de test est disponible dans `test-events.js` pour vérifier le bon fonctionnement du système d'événements.