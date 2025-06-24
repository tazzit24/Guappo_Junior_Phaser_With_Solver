'use strict';

class Button extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text, style, callback) {
      super(scene, x, y, text, style);
  
      this.callback = callback; // Store the callback

      this.enableButtonInteractive(); // Call a new method to set up listeners
        this.setFontSize(15);
    }
  
    enableButtonInteractive() {
        this.setInteractive({ useHandCursor: true })
            .on('pointerover', this.enterButtonHoverState, this)
            .on('pointerout', this.enterButtonRestState, this)
            .on('pointerdown', this.enterButtonActiveState, this)
            .on('pointerup', this.onButtonUp, this); // Use a dedicated handler
    }

    disableButtonInteractive() {
        this.disableInteractive()
            .off('pointerover', this.enterButtonHoverState, this)
            .off('pointerout', this.enterButtonRestState, this)
            .off('pointerdown', this.enterButtonActiveState, this)
            .off('pointerup', this.onButtonUp, this);
    }

    onButtonUp() {
        this.enterButtonHoverState();
        if (this.callback) { // Ensure callback exists
            this.callback();
        }
    }

    enterButtonHoverState() {
      //this.setStyle({ fill: '#ff0'});
      this.setFontSize(18);
    }
  
    enterButtonRestState() {
      this.setFontSize(15);
    }
  
    enterButtonActiveState() {
      //this.setStyle({ fill: '#0ff' });
    }
  }
  