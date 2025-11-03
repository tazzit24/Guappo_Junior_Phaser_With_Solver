
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

}