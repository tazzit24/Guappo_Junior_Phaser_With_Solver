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
    parent: 'phaser-game',
    scene: [SceneHome, SceneMain, SceneGameover],
    dom: {
        createContainer: true
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        pixelArt: true
    },
    render: {
        pixelArt: true,
        antialias: true
    }
};

var game = new Phaser.Game(config);