        // --- SNOW PARTICLE EFFECT ---
        // Create a snowflake texture (only once)
        let snowflake = this.add.graphics();
        snowflake.fillStyle(0xffffff, 1);
        snowflake.fillCircle(4, 4, 4);
        snowflake.generateTexture('snowflake', 8, 8);
        snowflake.destroy();

        // Add snow particle emitter
        this.snowEmitter = this.add.particles(0, 0, 'snowflake', {
            x: { min: 0, max: this.sys.game.config.width },
            y: 0,
            lifespan: 4000,
            speedY: { min: 50, max: 120 },
            scale: { start: 1, end: 0.5 },
            quantity: 2,
            frequency: 50,
            alpha: { start: 1, end: 0.2 }
        });
        this.snowEmitter.setDepth(9999);
        // --- END SNOW PARTICLE EFFECT ---