'use strict';

export class Level {
    #id;
    #basescore;
    #gaps;
    #beehives;
    #traps;
    #enemies;
    #wappo;
    #friends;

    constructor(lvlObj) {
        this.id = lvlObj.level;
        var lvldetail = lvlObj.detail;
        this.basescore = lvldetail.basescore;
        this.gaps = lvldetail.gaps;
        this.beehives = lvldetail.beehives;
        this.traps = lvldetail.traps;
        this.wappo = lvldetail.wappo;
        this.friends = lvldetail.friends;
        this.enemies = lvldetail.enemies;
    }

    getId() {
        return this.id;
    }

    getBasescore() {
        return this.basescore;
    }

    getGaps() {
        return this.gaps;
    }

    getBeehives() {
        return this.beehives;
    }

    getTraps() {
        return this.traps;
    }

    getEnemies() {
        return this.enemies;
    }

    getWappo() {
        return this.wappo;
    }

    getFriends() {
        return this.friends;
    }

}