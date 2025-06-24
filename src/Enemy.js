'use strict';

class Enemy extends MovablePiece {
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

    turnAround() {
        switch (this.direction) {
            case DIRECTION.NORTH:
                this.direction = DIRECTION.SOUTH;
                if (super.getImg()) {
                    super.getImg().flipY = !super.getImg().flipY;
                }
                break;
            case DIRECTION.SOUTH:
                this.direction = DIRECTION.NORTH;
                if (super.getImg()) {
                    super.getImg().flipY = !super.getImg().flipY;
                }
                break;
            case DIRECTION.WEST:
                this.direction = DIRECTION.EAST;
                if (super.getImg()) {
                    super.getImg().flipX = !super.getImg().flipX;
                }
                break;
            case DIRECTION.EAST:
                this.direction = DIRECTION.WEST;
                if (super.getImg()) {
                    super.getImg().flipX = !super.getImg().flipX;
                }
                break;
            case DIRECTION.NORTH_EAST:
                this.direction = DIRECTION.SOUTH_WEST;
                if (super.getImg()) {
                    super.getImg().flipX = !super.getImg().flipX;
                    super.getImg().flipY = !super.getImg().flipY;
                }
                break;
            case DIRECTION.SOUTH_WEST:
                this.direction = DIRECTION.NORTH_EAST;
                if (super.getImg()) {
                    super.getImg().flipX = !super.getImg().flipX;
                    super.getImg().flipY = !super.getImg().flipY;
                }
                break;
            case DIRECTION.NORTH_WEST:
                this.direction = DIRECTION.SOUTH_EAST;
                if (super.getImg()) {
                    super.getImg().flipX = !super.getImg().flipX;
                    super.getImg().flipY = !super.getImg().flipY;
                }
                break;
            case DIRECTION.SOUTH_EAST:
                this.direction = DIRECTION.NORTH_WEST;
                if (super.getImg()) {
                    super.getImg().flipX = !super.getImg().flipX;
                    super.getImg().flipY = !super.getImg().flipY;
                }
                break;
        }
    } 

    getOrder() {
        return this.order;
    }
}