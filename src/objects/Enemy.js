'use strict';

import { MovablePiece } from './MovablePiece.js';
import { Enum } from '../game/Enum.js';

export class Enemy extends MovablePiece {
    axis;
    direction;
    order;

    constructor(name, axis, direction, step, location, order) {
        super(name, step, location);
        this.axis = axis;
        this.direction = direction;
        this.order = order;
    }

    getAxis() {
        return this.axis;
    }

    getDirection() {
        return this.direction;
    }

    setDirection(newDirection) {
        this.direction = newDirection;
    }

    turnAround() {
        // This method now only handles simple direction reversal for H and V enemies.
        // Image flipping and complex diagonal logic are handled by the Scene/GameLogic.
        switch (this.direction) {
            case Enum.DIRECTION.NORTH:
                this.direction = Enum.DIRECTION.SOUTH;
                break;
            case Enum.DIRECTION.SOUTH:
                this.direction = Enum.DIRECTION.NORTH;
                break;
            case Enum.DIRECTION.WEST:
                this.direction = Enum.DIRECTION.EAST;
                break;
            case Enum.DIRECTION.EAST:
                this.direction = Enum.DIRECTION.WEST;
                break;
            case Enum.DIRECTION.NORTH_EAST:
                this.direction = Enum.DIRECTION.SOUTH_WEST;
                break;
            case Enum.DIRECTION.SOUTH_WEST:
                this.direction = Enum.DIRECTION.NORTH_EAST;
                break;
            case Enum.DIRECTION.NORTH_WEST:
                this.direction = Enum.DIRECTION.SOUTH_EAST;
                break;
            case Enum.DIRECTION.SOUTH_EAST:
                this.direction = Enum.DIRECTION.NORTH_WEST;
                break;
        }
    } 

    getOrder() {
        return this.order;
    }
}