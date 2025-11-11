export class DragFeedback {
    constructor(scene, depth = 950) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(depth).setVisible(false);
        this.pointerId = null;
        this.start = null;
    }

    begin(pointer) {
        this.pointerId = pointer.id;
        this.start = { x: pointer.x, y: pointer.y };
        this._drawStartCircle(pointer.x, pointer.y);
    }

    update(pointer) {
        if (!this.start || !this.graphics || pointer.id !== this.pointerId) {
            return;
        }

        const { x: startX, y: startY } = this.start;
        const dx = pointer.x - startX;
        const dy = pointer.y - startY;
        const distance = Math.min(Math.hypot(dx, dy), 200);

        this.graphics.clear();
        this._drawStartCircle(startX, startY);

        if (distance <= 2) {
            this.graphics.setVisible(true);
            return;
        }

        const angle = Math.atan2(dy, dx);
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;

        this.graphics.lineStyle(6, 0xffc400, 0.9);
        this.graphics.beginPath();
        this.graphics.moveTo(startX, startY);
        this.graphics.lineTo(endX, endY);
        this.graphics.strokePath();

        const headLength = 18;
        const leftAngle = angle + Math.PI / 7;
        const rightAngle = angle - Math.PI / 7;

        this.graphics.fillStyle(0xffc400, 0.95);
        this.graphics.beginPath();
        this.graphics.moveTo(endX, endY);
        this.graphics.lineTo(
            endX - Math.cos(leftAngle) * headLength,
            endY - Math.sin(leftAngle) * headLength
        );
        this.graphics.lineTo(
            endX - Math.cos(rightAngle) * headLength,
            endY - Math.sin(rightAngle) * headLength
        );
        this.graphics.closePath();
        this.graphics.fillPath();

        this.graphics.fillStyle(0xffe066, 0.2);
        this.graphics.fillCircle(endX, endY, 12);
        this.graphics.setVisible(true);
    }

    end(pointer) {
        if (pointer && this.pointerId !== null && pointer.id !== this.pointerId) {
            return;
        }
        this._reset();
    }

    destroy() {
        this._reset();
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
        this.scene = null;
    }

    _drawStartCircle(x, y) {
        if (!this.graphics) {
            return;
        }
        this.graphics.lineStyle(4, 0xffe066, 0.9);
        this.graphics.fillStyle(0xffe066, 0.25);
        this.graphics.fillCircle(x, y, 24);
        this.graphics.strokeCircle(x, y, 28);
        this.graphics.setVisible(true);
    }

    _reset() {
        if (this.graphics) {
            this.graphics.clear();
            this.graphics.setVisible(false);
        }
        this.pointerId = null;
        this.start = null;
    }
}
