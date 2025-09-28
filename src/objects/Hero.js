'use strict';

import { MovablePiece } from './MovablePiece.js';

export class Hero extends MovablePiece {

    /** @type {number} */
    order;

    constructor(name, step, location, order) {
        super(name, step, location);
        this.order = order;
    }

    getOrder() {
        return this.order;
    }

}

