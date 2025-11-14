'use strict';
/** @type {import('../defs/phaser')} */

import { SceneHome } from './scenes/SceneHome.js';
import { SceneMain } from './scenes/SceneMain.js';
import { SceneGameover } from './scenes/SceneGameover.js';
import { SceneScores } from './scenes/SceneScores.js';

/*var isMobile = navigator.userAgent.indexOf("Mobile");
if (isMobile == -1) {
    isMobile = navigator.userAgent.indexOf("Tablet");
}
if (isMobile == -1) {
    var config = {
        type: Phaser.AUTO,
        width: 480,
        height: 640,
        parent: 'phaser-game',
        scene: [SceneMain]
    };
} else {
    var config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'phaser-game',
        scene: [SceneMain]
    };
}*/

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    scene: [SceneHome, SceneMain, SceneGameover, SceneScores],
    plugins: {
        global: [],
        scene: [
            {
                key: 'rexUI',
                plugin: window.rexuiplugin,
                mapping: 'rexUI'
            }
        ]
    },
    dom: {
        createContainer: true
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        pixelArt: false
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

var game = new Phaser.Game(config);

// PWA Registration and Logging
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Check if we're in dev mode (?dev=true)
        const urlParams = new URLSearchParams(window.location.search);
        const isDevMode = urlParams.get('dev') === 'true';
        
        if (isDevMode) {
            console.log('Dev mode detected - forcing service worker re-registration');
            
            // Unregister existing service worker first
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for (let registration of registrations) {
                    console.log('Unregistering existing service worker:', registration.scope);
                    registration.unregister();
                }
            });
        }
        
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker registered successfully with scope:', registration.scope);
                
                // Log game version (from manifest or hardcoded)
                console.log('Guappo Junior Game Version: 1.1');
                
                // Check if the app is running as PWA
                const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                             window.navigator.standalone === true ||
                             document.referrer.includes('android-app://');
                console.log('Running as PWA:', isPWA);
                
                // Log registration status
                console.log('Service Worker registration status:', registration.active ? 'active' : 'installing');
                
                if (isDevMode) {
                    console.log('Dev mode: Skipping update call (SW was just re-registered)');
                    // In dev mode, we don't need to call update() since we just unregistered and re-registered
                } else {
                    // In production, we can safely call update to check for new versions
                    registration.update().catch(function(updateError) {
                        console.log('Service Worker update failed (this is normal if no update available):', updateError.message);
                    });
                }
                
                // Optional: Get cache version from service worker
                if (registration.active) {
                    const messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = function(event) {
                        if (event.data && event.data.cacheVersion) {
                            console.log('Cache version:', event.data.cacheVersion);
                        }
                    };
                    registration.active.postMessage({ type: 'GET_CACHE_VERSION' }, [messageChannel.port2]);
                }
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    });
} else {
    console.log('Service Workers not supported in this browser');
}