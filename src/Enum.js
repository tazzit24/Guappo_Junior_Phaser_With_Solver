'use strict';

const AXIS = {
    VERTICAL: "V",
    HORIZONTAL: "H",
    DIAGONAL: "D"
};

const DIRECTION = {
    NORTH: "N",
    SOUTH: "S",
    WEST: "W",
    EAST: "E",
    NORTH_EAST: "NE",
    NORTH_WEST: "NW",
    SOUTH_EAST: "SE",
    SOUTH_WEST: "SW"
};

class Enum {

    static get DIRECTION() {
        return DIRECTION;
    }

    static get AXIS() {
        return AXIS;
    }

}