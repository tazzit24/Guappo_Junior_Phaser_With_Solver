'use strict';

import { Hero } from './Hero.js';
import { Enemy } from './Enemy.js';

const STATIC_CELL_TYPE = {
    VINE: "vine",
    GAP: "gap",
    TRAP: "trap",
    BEEHIVE: "beehive",
    WALL: "wall" // fake type
};

export class Cell {
    
	number; // 0 -> 35
    type; // 1 = gap , 2 = beeHive , 3 = pothos , 7 = standart cell (vine)
    movableObj;
        
    constructor (number, type) {
    	this.number = number;
        this.type = type;
    }

    static get STATIC_CELL_TYPE() {
        return STATIC_CELL_TYPE;
    }
    
    getCellNumber() {
    	return this.number;
    }

    getType() {
        return this.type;
    }

    isGap() {
    	return (STATIC_CELL_TYPE.GAP == this.type);
    }
    
    isBeeHive() {
    	return (STATIC_CELL_TYPE.BEEHIVE == this.type);
    }
    
    isTrap() {
    	return (STATIC_CELL_TYPE.TRAP == this.type);
    }

    isVine() {
        return (STATIC_CELL_TYPE.VINE == this.type);
    }

    setMovableObj(obj) {
        this.movableObj = obj;
    }

    removePiece() {
        this.movableObj = null;
    }

    getMovableObj() {
        return this.movableObj;
    }

    containsHero() {
        if (this.movableObj == null) {
            return false;
        }
        return this.movableObj instanceof Hero;
    }

    containsEnemy() {
        if (this.movableObj == null) {
            return false;
        }
        return this.movableObj instanceof Enemy;
    }
}