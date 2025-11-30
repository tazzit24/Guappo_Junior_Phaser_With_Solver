
/*

(6x6 grid)

x = columns -> [0-5]
y = lines   -> [0-5] 
cellnum     -> [0-35]

*/

export class Utils {

    static getCoords(cellnum) {
        var x = cellnum % 6 ;
        var y = Math.floor(cellnum / 6);
        return {
            x: x,
            y: y
        };
    }

    static getCellnum(x, y) {
        let cellnum = (y * 6) + x;
        return cellnum;
    }

    static CreateDialog(scene) {
        const { width, height } = scene.scale.gameSize;
        const dialogScale = Math.min(width / 400, height / 300);
        
        var dialog = scene.rexUI.add.dialog({
            background: scene.rexUI.add.roundRectangle(0, 0, 300 * dialogScale, 200 * dialogScale, 20, 0x1a1a2e),

            title: scene.rexUI.add.label({
                background: scene.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x4a90e2),
                text: scene.add.text(0, 0, 'Confirm', {
                    fontSize: Math.max(18 * dialogScale, 16) + 'px',
                    color: '#FFFFFF'
                }),
                space: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }),

            content: scene.add.text(0, 0, 'Exit Level ?', {
                fontSize: Math.max(18 * dialogScale, 14) + 'px',
                color: '#FFFFFF'
            }),

            actions: [
                Utils.CreateLabel(scene, 'Yes', dialogScale),
                Utils.CreateLabel(scene, 'No', dialogScale)
            ],

            space: {
                title: 25,
                content: 25,
                action: 15,

                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },

            align: {
                actions: 'right', // 'center'|'left'|'right'
            },

            expand: {
                content: false,  // Content is a pure text object
            }
        })
            .on('button.over', function (button, groupName, index, pointer, event) {
                button.getElement('background').setStrokeStyle(1, 0xffffff);
            })
            .on('button.out', function (button, groupName, index, pointer, event) {
                button.getElement('background').setStrokeStyle();
            });

        return dialog;
    }

    static CreateLabel(scene, text, scale = 1) {
        return scene.rexUI.add.label({
            // width: 40,
            // height: 40,

            background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0x4a90e2),

            text: scene.add.text(0, 0, text, {
                fontSize: Math.max(18 * scale, 14) + 'px',
                color: '#FFFFFF'
            }),

            space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        });
    }

    static directionToArrow(direction) {
        const arrowMap = {
            'N': '↑',
            'S': '↓', 
            'E': '→',
            'W': '←',
            'NE': '↗',
            'NW': '↖',
            'SE': '↘',
            'SW': '↙'
        };
        return arrowMap[direction] || direction;
    }

    static directionToWord(direction) {
        const wordMap = {
            'N': 'UP',
            'S': 'DOWN',
            'E': 'RIGHT',
            'W': 'LEFT',
            'NE': 'UP-RIGHT',
            'NW': 'UP-LEFT',
            'SE': 'DOWN-RIGHT',
            'SW': 'DOWN-LEFT'
        };
        return wordMap[direction] || direction;
    }

    static createLoadingProgressBar(scene, options = {}) {
        const { text = 'Loading...', backgroundColor = '#1a1a2e' } = options;
        const { width, height } = scene.cameras.main;
        
        scene.cameras.main.setBackgroundColor(backgroundColor);
        
        const progressBox = scene.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const progressBar = scene.add.graphics();
        
        const loadingText = scene.add.text(width / 2, height / 2 - 50, text, {
            font: '20px Arial',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);
        
        const percentText = scene.add.text(width / 2, height / 2, '0%', {
            font: '18px Arial',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);

        const updateProgress = (value) => {
            percentText.setText(Math.round(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x4a90e2, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        };
        
        const destroyProgress = () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        };
        
        return { updateProgress, destroyProgress };
    }

}