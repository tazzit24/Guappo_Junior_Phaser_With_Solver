class SpaceSlider {
    constructor(scene, x, y, width, minValue, maxValue, initialValue, bearTexture = 'wappo') {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.value = initialValue;
        this.bearTexture = bearTexture;
        
        this.sliderHeight = 20;
        this.handleSize = 40;
        this.isDragging = false;
        
        this.components = {};
        this.onValueChange = null;
        
        this.create();
    }
    
    create() {
        // Create space-themed track with gradient effect
        this.components.track = this.scene.add.graphics();
        this.components.track.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        this.components.track.fillRoundedRect(
            this.x - this.width/2, 
            this.y - this.sliderHeight/2, 
            this.width, 
            this.sliderHeight, 
            4
        );
        
        // Add cosmic glow effect
        this.components.track.lineStyle(2, 0x4a90e2, 0.6);
        this.components.track.strokeRoundedRect(
            this.x - this.width/2, 
            this.y - this.sliderHeight/2, 
            this.width, 
            this.sliderHeight, 
            4
        );
        
        // Add star decorations along the track
        this.components.stars = [];
        for (let i = 0; i < 5; i++) {
            const starX = this.x - this.width/2 + (this.width * i / 4);
            const starY = this.y;
            const star = this.createStar(starX, starY, 3, 0xffffff, 0.3);
            this.components.stars.push(star);
        }
        
        // Create the bear head handle (mafioso bear)
        this.components.handle = this.scene.add.image(0, this.y, this.bearTexture);
        this.components.handle.setScale(this.handleSize / Math.max(this.components.handle.width, this.components.handle.height));
        this.components.handle.setTint(0xffddaa); // Give it a slight golden tint for mafioso feel
        
        // Add a cosmic aura around the bear
        this.components.aura = this.scene.add.graphics();
        this.components.aura.fillStyle(0x4a90e2, 0.2);
        this.components.aura.fillCircle(0, this.y, this.handleSize * 0.8);
        
        // Create level display text
        this.components.text = this.scene.add.text(this.x, this.y - 50, `Level: ${this.value}`, {
            fontSize: '20px',
            fontFamily: '"Arial Black", Gadget, sans-serif',
            color: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Set initial position
        this.updatePosition();
        
        // Setup interactivity
        this.setupInteractivity();
    }
    
    createStar(x, y, size, color, alpha) {
        const star = this.scene.add.graphics();
        star.fillStyle(color, alpha);
        star.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 144) * Math.PI / 180;
            const starX = x + Math.cos(angle) * size;
            const starY = y + Math.sin(angle) * size;
            if (i === 0) {
                star.moveTo(starX, starY);
            } else {
                star.lineTo(starX, starY);
            }
        }
        star.closePath();
        star.fillPath();
        return star;
    }
    
    setupInteractivity() {
        // Make handle interactive
        this.components.handle.setInteractive({ useHandCursor: true });
        
        this.components.handle.on('pointerdown', () => {
            this.isDragging = true;
            this.components.handle.setTint(0xffcc88); // Slightly different tint when pressed
        });
        
        this.scene.input.on('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.components.handle.setTint(0xffddaa); // Return to normal tint
            }
        });
        
        this.scene.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const newX = Phaser.Math.Clamp(pointer.x, this.x - this.width/2, this.x + this.width/2);
                this.components.handle.x = newX;
                this.components.aura.x = newX;
                
                const newValue = this.positionToValue(newX);
                this.setValue(Math.round(newValue));
            }
        });
    }
    
    setValue(value) {
        this.value = Phaser.Math.Clamp(value, this.minValue, this.maxValue);
        this.updatePosition();
        this.updateText();
        
        // Call callback if provided
        if (this.onValueChange) {
            this.onValueChange(this.value);
        }
    }
    
    getValue() {
        return this.value;
    }
    
    updatePosition() {
        const position = this.valueToPosition(this.value);
        this.components.handle.x = position;
        this.components.aura.x = position;
    }
    
    updateText() {
        this.components.text.setText(`Level: ${this.value}`);
    }
    
    valueToPosition(value) {
        const ratio = (value - this.minValue) / (this.maxValue - this.minValue);
        return (this.x - this.width/2) + ratio * this.width;
    }
    
    positionToValue(position) {
        const ratio = (position - (this.x - this.width/2)) / this.width;
        return this.minValue + ratio * (this.maxValue - this.minValue);
    }
    
    setOnValueChange(callback) {
        this.onValueChange = callback;
    }
    
    destroy() {
        // Clean up all components
        if (this.components.handle) {
            this.components.handle.destroy();
        }
        if (this.components.track) {
            this.components.track.destroy();
        }
        if (this.components.aura) {
            this.components.aura.destroy();
        }
        if (this.components.text) {
            this.components.text.destroy();
        }
        if (this.components.stars) {
            this.components.stars.forEach(star => star.destroy());
        }
        
        // Remove event listeners
        if (this.scene && this.scene.input) {
            this.scene.input.off('pointerup');
            this.scene.input.off('pointermove');
        }
        
        this.components = {};
    }
    
    setVisible(visible) {
        Object.values(this.components).forEach(component => {
            if (component && component.setVisible) {
                component.setVisible(visible);
            } else if (Array.isArray(component)) {
                component.forEach(item => {
                    if (item && item.setVisible) {
                        item.setVisible(visible);
                    }
                });
            }
        });
    }
    
    setAlpha(alpha) {
        Object.values(this.components).forEach(component => {
            if (component && component.setAlpha) {
                component.setAlpha(alpha);
            } else if (Array.isArray(component)) {
                component.forEach(item => {
                    if (item && item.setAlpha) {
                        item.setAlpha(alpha);
                    }
                });
            }
        });
    }
}
