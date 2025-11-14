/**
 * SpaceSlider - A configurable space-themed slider component for Phaser 3
 * 
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} x - X position
 * @param {number} y - Y position  
 * @param {number} width - Width of the slider
 * @param {number} minValue - Minimum value
 * @param {number} maxValue - Maximum value
 * @param {number} initialValue - Initial value
 * @param {Object} config - Configuration object with the following optional properties:
 *   - handleTexture: string - Texture key for the handle (default: 'wappo')
 *   - handleSize: number - Size of the handle (default: 40)
 *   - handleTint: number - Normal tint color for handle (default: 0xffddaa)
 *   - handleActiveTint: number - Active tint color for handle (default: 0xffcc88)
 *   - sliderHeight: number - Height of the track (default: 20)
 *   - trackColor: number - Solid color for the track (default: 0x1a1a2e)
 *   - glowColor: number - Color of the glow effect (default: 0x4a90e2)
 *   - glowAlpha: number - Alpha of the glow effect (default: 0.6)
 *   - textOffset: number - Y offset for text from slider (default: -50)
 *   - textPrefix: string - Prefix for the display text (default: 'Level: ')
 *   - textStyle: object - Phaser text style object
 *   - showStars: boolean - Whether to show star decorations (default: true)
 *   - starCount: number - Number of stars to show (default: 5)
 *   - showAura: boolean - Whether to show aura around handle (default: true)
 *   - auraColor: number - Color of the aura (default: 0x4a90e2)
 *   - auraAlpha: number - Alpha of the aura (default: 0.2)
 *   - borderRadius: number - Border radius for rounded corners (default: 4)
 *   - showProgress: boolean - Whether to show progress fill (default: true)
 *   - progressColor: number - Solid color for progress fill (default: 0x4a90e2)
 *   - progressAlpha: number - Alpha transparency for progress fill (default: 1.0)
 */
export class SpaceSlider {
    constructor(scene, x, y, width, minValue, maxValue, initialValue, config = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.value = initialValue;
        
        // Configuration with defaults
        this.config = {
            handleTexture: config.handleTexture || 'wappo',
            handleSize: config.handleSize || 40,
            handleTint: config.handleTint || 0xffddaa,
            handleActiveTint: config.handleActiveTint || 0xffcc88,
            sliderHeight: config.sliderHeight || 20,
            trackColor: config.trackColor || 0x1a1a2e, // Solid color only
            glowColor: config.glowColor || 0x4a90e2,
            glowAlpha: config.glowAlpha || 0.6,
            textOffset: config.textOffset || -50,
            textPrefix: config.textPrefix || 'Level: ',
            textStyle: config.textStyle || {
                fontSize: '20px',
                fontFamily: '"Arial Black", Gadget, sans-serif',
                color: '#4a90e2',
                stroke: '#000000',
                strokeThickness: 2
            },
            showStars: config.showStars !== false, // Default true
            starCount: config.starCount || 5,
            showAura: config.showAura !== false, // Default true
            auraColor: config.auraColor || 0x4a90e2,
            auraAlpha: config.auraAlpha || 0.2,
            borderRadius: config.borderRadius || 4,
            showProgress: config.showProgress !== false, // Default true
            progressColor: config.progressColor || 0x4a90e2, // Solid color only
            progressAlpha: config.progressAlpha || 1.0 // Fully opaque by default
        };
        
        this.isDragging = false;
        this.components = {};
        this.onValueChange = null;
        
        this.create();
    }
    
    create() {
        // Create space-themed track with solid color
        this.components.track = this.scene.add.graphics();
        this.drawTrack();
        this.components.track.setDepth(0); // Base layer

        // Create progress fill (colored background on the left part) - AFTER track, BEFORE handle
        if (this.config.showProgress) {
            this.components.progressFill = this.scene.add.graphics();
            this.components.progressFill.setDepth(1); // Above track, below handle
        }

        // Add star decorations along the track (optional)
        if (this.config.showStars) {
            this.components.stars = [];
            this.drawStars();
        }

        // Create the handle (configurable texture)
        this.components.handle = this.scene.add.image(0, this.y, this.config.handleTexture);
        this.components.handle.setScale(this.config.handleSize / Math.max(this.components.handle.width, this.components.handle.height));
        this.components.handle.setTint(this.config.handleTint);
        this.components.handle.setDepth(3); // Above everything else

        // Add aura around the handle (optional)
        if (this.config.showAura) {
            this.components.aura = this.scene.add.graphics();
            this.drawAura();
            this.components.aura.setDepth(2); // Below handle, above progress
        }

        // Create display text
        this.components.text = this.scene.add.text(
            this.x, 
            this.y + this.config.textOffset, 
            `${this.config.textPrefix}${this.value}`, 
            this.config.textStyle
        ).setOrigin(0.5);
        this.components.text.setDepth(4); // On top of everything

        // Set initial position
        this.updatePosition();

        // Draw initial progress fill
        if (this.config.showProgress) {
            this.updateProgressFill();
        }

        // Setup interactivity
        this.setupInteractivity();
    }

    drawTrack() {
        if (!this.components.track) return;
        this.components.track.clear();
        this.components.track.fillStyle(this.config.trackColor, 1);
        this.components.track.fillRoundedRect(
            this.x - this.width/2,
            this.y - this.config.sliderHeight/2,
            this.width,
            this.config.sliderHeight,
            this.config.borderRadius
        );
        this.components.track.lineStyle(2, this.config.glowColor, this.config.glowAlpha);
        this.components.track.strokeRoundedRect(
            this.x - this.width/2,
            this.y - this.config.sliderHeight/2,
            this.width,
            this.config.sliderHeight,
            this.config.borderRadius
        );
    }

    drawAura() {
        if (!this.components.aura || !this.components.handle) return;
        this.components.aura.clear();
        this.components.aura.fillStyle(this.config.auraColor, this.config.auraAlpha);
        this.components.aura.fillCircle(this.components.handle.x, this.components.handle.y, this.config.handleSize * 0.8);
    }

    drawStars() {
        // Destroy old stars if any
        if (this.components.stars && this.components.stars.length) {
            this.components.stars.forEach(star => star.destroy());
            this.components.stars = [];
        }
        const starCount = this.config.starCount;
        for (let i = 0; i < starCount; i++) {
            const starX = this.x - this.width/2 + (this.width * i / (starCount - 1));
            const starY = this.y;
            const star = this.createStar(starX, starY, 3, 0xffffff, 0.3);
            this.components.stars.push(star);
        }
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
            this.components.handle.setTint(this.config.handleActiveTint);
        });
        
        this.scene.input.on('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.components.handle.setTint(this.config.handleTint);
            }
        });
        
        this.scene.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const newX = Phaser.Math.Clamp(pointer.x, this.x - this.width/2, this.x + this.width/2);
                this.components.handle.x = newX;
                if (this.components.aura) {
                    this.drawAura();
                }
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
        if (this.components.aura) {
            this.drawAura();
        }
        this.updateProgressFill();
    }
    
    updateProgressFill() {
        if (!this.config.showProgress || !this.components.progressFill) {
            return;
        }
        
        // Clear previous progress fill
        this.components.progressFill.clear();
        
        // Calculate progress width based on current value
        const ratio = (this.value - this.minValue) / (this.maxValue - this.minValue);
        let progressWidth = this.width * ratio;
        
        // Ensure some progress is visible even at minimum value + small amount
        if (this.value > this.minValue && progressWidth < 5) {
            progressWidth = 5; // Minimum visible width
        }
        
        if (progressWidth > 0) {
            // Use solid color for better visibility
            this.components.progressFill.fillStyle(this.config.progressColor, this.config.progressAlpha);
            this.components.progressFill.fillRoundedRect(
                this.x - this.width/2,
                this.y - this.config.sliderHeight/2,
                progressWidth,
                this.config.sliderHeight,
                this.config.borderRadius
            );
        }
    }
    
    updateText() {
        this.components.text.setText(`${this.config.textPrefix}${this.value}`);
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
    
    resize(x, y, width, config = {}) {
        // Update position and size
        this.x = x;
        this.y = y;
        this.width = width;

        // Update configuration with new values
        Object.assign(this.config, config);

        // Update text style if provided
        if (this.components.text && config.textStyle) {
            this.components.text.setStyle(config.textStyle);
        }

        // Update track
        if (this.components.track) {
            this.drawTrack();
        }

        // Update progress fill
        if (this.config.showProgress && this.components.progressFill) {
            this.updateProgressFill();
        }

        // Update stars
        if (this.config.showStars && this.components.stars) {
            this.drawStars();
        }

        // Update handle
        if (this.components.handle) {
            this.components.handle.y = this.y;
            this.components.handle.setScale(this.config.handleSize / Math.max(this.components.handle.width, this.components.handle.height));
        }

        // Update aura
        if (this.config.showAura && this.components.aura) {
            this.drawAura();
        }

        // Update text
        if (this.components.text) {
            this.components.text.x = this.x;
            this.components.text.y = this.y + this.config.textOffset;
            this.updateText();
        }

        // Update handle position
        this.updatePosition();
    }
    
    destroy() {
        // Clean up all components
        if (this.components.handle) {
            this.components.handle.destroy();
        }
        if (this.components.track) {
            this.components.track.destroy();
        }
        if (this.components.progressFill) {
            this.components.progressFill.destroy();
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
