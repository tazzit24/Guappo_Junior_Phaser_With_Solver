export class MyRexUIButton {
    constructor(scene, text, iconKey, onClick, options = {}) {
        this.scene = scene;
        this.text = text;
        this.iconKey = iconKey;
        this.onClick = onClick;
        this.baseFontSize = options.baseFontSize || 48;
        this.minWidth = options.minWidth || 520;
        this.minHeight = options.minHeight || Math.round(this.baseFontSize * 1.6);

        this.label = this.scene.rexUI.add.label({
            x: 0,
            y: 0,
            background: this.createBackground(this.baseFontSize),
            icon: this.scene.add.image(0, 0, this.iconKey),
            text: this.scene.add.text(0, 0, this.text, {
                fontSize: Math.round(this.baseFontSize * 0.75) + 'px',
                fontFamily: '"Arial Black", Gadget, sans-serif',
                color: '#ffffff',
                stroke: '#ffffff',
                strokeThickness: 1,
            }).setOrigin(0, 0.5),
            align: 'left',
            space: this.getButtonSpace(this.baseFontSize),
        });

        this.label.setOrigin(0, 0.5);
        this.enableButtonInteractive();
        this.refreshLayout(this.baseFontSize, this.minWidth, this.minHeight);
    }

    createBackground(fontSize) {
        const radius = Math.round(fontSize * 0.2);
        return this.scene.rexUI.add.roundRectangle(0, 0, 0, 0, radius, 0x222222, 1)
            .setStrokeStyle(3, 0xffffff, 1);
    }

    enableButtonInteractive() {
        this.label.setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.label.setScale(1.08))
            .on('pointerout', () => this.label.setScale(1))
            .on('pointerdown', () => this.label.setScale(0.96))
            .on('pointerup', () => {
                this.label.setScale(1);
                if (this.onClick) {
                    this.onClick();
                }
            });
    }

    refreshLayout(fontSize, minWidth, minHeight) {
        if (!this.label) {
            return;
        }

        this.baseFontSize = fontSize;
        this.minWidth = minWidth;
        this.minHeight = minHeight;

        const text = this.label.getElement('text');
        const icon = this.label.getElement('icon');
        const background = this.label.getElement('background');

        text.setFontSize(Math.round(fontSize * 0.75));
        text.setOrigin(0, 0.5);
        icon.setScale(fontSize / 100);

        if (background && background.setRadius) {
            background.setRadius(Math.round(fontSize * 0.2));
        }

        if (typeof this.label.setSpace === 'function') {
            this.label.setSpace(this.getButtonSpace(fontSize));
        }
        if (typeof this.label.setMinSize === 'function') {
            this.label.setMinSize(minWidth, minHeight);
        }
        this.label.layout();
        this.label.setOrigin(0, 0.5);
    }

    setPosition(x, y) {
        if (this.label) {
            this.label.setPosition(x, y);
        }
    }

    setDepth(depth) {
        if (this.label) {
            this.label.setDepth(depth);
        }
    }

    setVisible(visible) {
        if (this.label) {
            this.label.setVisible(visible);
        }
    }

    setAlpha(alpha) {
        if (this.label) {
            this.label.setAlpha(alpha);
        }
    }

    getBounds() {
        return this.label ? this.label.getBounds() : null;
    }

    destroy(fromScene) {
        if (!this.label) {
            return;
        }

        // Destroy elements (destroy will handle interactivity and events cleanup)
        const text = this.label.getElement('text');
        const icon = this.label.getElement('icon');
        const background = this.label.getElement('background');

        if (text) {
            text.destroy(fromScene);
        }
        if (icon) {
            icon.destroy(fromScene);
        }
        if (background) {
            background.destroy(fromScene);
        }

        this.label.destroy(fromScene);
        this.label = null;
    }

    getButtonSpace(fontSize) {
        const verticalPadding = Math.round(fontSize * 0.3);
        return {
            left: 28,
            right: 28,
            top: verticalPadding,
            bottom: verticalPadding,
            icon: Math.round(fontSize * 0.6),
        };
    }
}
