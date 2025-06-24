
/*

(6x6 grid)

x = columns -> [0-5]
y = lines   -> [0-5] 
cellnum     -> [0-35]

*/

function getCoords(cellnum) {
    var x = cellnum % 6 ;
    var y = Math.floor(cellnum / 6);
    return {
        x: x,
        y: y
    };
}

function getCellnum(x, y) {
    let cellnum = (y * 6) + x;
    return cellnum;
}

function CreateDialog(scene) {
    var dialog = scene.rexUI.add.dialog({
        background: scene.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0xFFBF00),

        title: scene.rexUI.add.label({
            background: scene.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0xF28C28),
            text: scene.add.text(0, 0, 'Confirm', {
                fontSize: '24px',
                color: '#000000'
            }),
            space: {
                left: 15,
                right: 15,
                top: 10,
                bottom: 10
            }
        }),

        content: scene.add.text(0, 0, 'Exit Level ?', {
            fontSize: '24px',
            color: '#000000'
        }),

        actions: [
            CreateLabel(scene, 'Yes'),
            CreateLabel(scene, 'No')
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

function CreateLabel(scene, text) {
    return scene.rexUI.add.label({
        // width: 40,
        // height: 40,

        background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0xDAA520),

        text: scene.add.text(0, 0, text, {
            fontSize: '24px',
            color: '#000000'
        }),

        space: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10
        }
    });
}