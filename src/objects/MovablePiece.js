'use strict';

class MovablePiece {

    #name;
    #step;
    #location;
    #moves_counter;
    #img;

    constructor (name, step, location) {
        this.#name = name;
        this.#step = step;
        this.#location = location;
        this.#moves_counter = 0;
    }

    getName() {
        return this.#name;
    }

    getStep() {
        return this.#step;
    }

    getLocation() {
        return this.#location;
    }

    getLocationXY() {
        return getCoords(this.#location);
    }

    setLocation(cell) {
        this.#location = cell;
    }

    getImg() {
        return this.#img;
    }

    setImg(img) {
        this.#img = img;
    }

    incrementMoves() {
        this.#moves_counter++;
    }

    resetMoves() {
        this.#moves_counter = 0;
    };

    finishedMoving() {
        return this.#moves_counter >= this.#step;
    }

    getMovesCounter() {
        return this.#moves_counter;
    }

}