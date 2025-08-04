'use strict';

class Button extends Phaser.GameObjects.Text {

    constructor(scene, x, y, text, style, callback) {
      super(scene, x, y, text, style);
      this.callback = callback; // Store the callback
      // Accept fontSize as string (e.g. '72px'), parseInt extracts the number
      this.baseFontSize = style && style.fontSize ? parseInt(style.fontSize) : 54;
      this.enableButtonInteractive(); // Call a new method to set up listeners
      this.setFontSize(this.baseFontSize);
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
      this.setFontSize(this.baseFontSize + 3);
    }
  
    enterButtonRestState() {
      this.setFontSize(this.baseFontSize);
    }
  
    enterButtonActiveState() {
      //this.setStyle({ fill: '#0ff' });
    }
  }
  