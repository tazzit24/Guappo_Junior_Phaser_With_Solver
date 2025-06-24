'use strict';

class Hero extends MovablePiece {

    order;

    constructor(name, step, location, order) {
        super(name, step, location);
        this.order = order;
    }

    getOrder() {
        return this.order;
    }

}