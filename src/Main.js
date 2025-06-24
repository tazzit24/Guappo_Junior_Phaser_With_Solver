'use strict';
/** @type {import('../defs/phaser')} */

/*var isMobile = navigator.userAgent.indexOf("Mobile");
if (isMobile == -1) {
    isMobile = navigator.userAgent.indexOf("Tablet");
}
if (isMobile == -1) {
    var config = {
        type: Phaser.AUTO,
        width: 480,
        height: 640,
        parent: 'phaser-game',
        scene: [SceneMain]
    };
} else {
    var config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'phaser-game',
        scene: [SceneMain]
    };
}*/

var config = {
    type: Phaser.AUTO,
    width: 600,
    height: 700,
    parent: 'phaser-game',
    scene: [SceneHome, SceneMain, SceneGameover],
    dom: {
        createContainer: true
    }
};


var cell_size = 100;
var moves_counter = 0;

var game = new Phaser.Game(config);