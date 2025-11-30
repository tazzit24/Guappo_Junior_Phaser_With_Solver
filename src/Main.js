'use strict';
/** @type {import('../defs/phaser')} */

import { SceneHome } from './scenes/SceneHome.js';
import { SceneMain } from './scenes/SceneMain.js';
import { SceneGameover } from './scenes/SceneGameover.js';
import { SceneScores } from './scenes/SceneScores.js';
import { SceneSettings } from './scenes/SceneSettings.js';
import { GlobalSettings } from './game/GlobalSettings.js';

const initialLoader = createInitialLoaderController();
window.initialLoader = initialLoader;

// Once libraries are loaded, transition message
function transitionToAssetLoading() {
    if (initialLoader && initialLoader.setMessage) {
        initialLoader.setMessage('Preparing assets…');
        // Continue progress from where libraries left off
        initialLoader.setProgress(0.5);
    }
}

// Since Main.js is injected dynamically after libraries, we can run this immediately
transitionToAssetLoading();

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
    scene: [SceneHome, SceneMain, SceneGameover, SceneScores, SceneSettings],
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

// Set document title from GlobalSettings
document.title = `${GlobalSettings.gameName} v${GlobalSettings.version}`;

// PWA Registration and Logging
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) {
            return;
        }
        // Handle SW cache progress
        if (event.data.type === 'SW_CACHE_PROGRESS') {
            const loader = window.initialLoader;
            if (loader) {
                // Map SW cache progress (0–1) to 0–50% of total progress
                const swProgress = Math.min(event.data.completed / event.data.total, 1);
                loader.setProgress(swProgress * 0.5);
            }
        } else if (event.data.type === 'SW_CACHE_COMPLETE') {
            const loader = window.initialLoader;
            if (loader) {
                loader.setProgress(0.5);
            }
        }
    });

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
        
        // Register with updateViaCache: 'none' to ensure the browser checks the network for the SW
        navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
            .then(function(registration) {
                console.log('Service Worker registered successfully with scope:', registration.scope);
                
                // Check if the app is running as PWA
                const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                             window.navigator.standalone === true ||
                             document.referrer.includes('android-app://');
                console.log('Running as PWA:', isPWA);
                
                // Log registration status
                console.log('Service Worker registration status:', registration.active ? 'active' : 'installing');

                // --- Update Management ---
                
                // Function to show update notification
                function showUpdateNotification(worker) {
                    if (!GlobalSettings.updatesEnabled) {
                        console.log('Update available but notifications are disabled in settings.');
                        return;
                    }

                    const notification = document.createElement('div');
                    notification.style.position = 'fixed';
                    notification.style.bottom = '20px';
                    notification.style.left = '50%';
                    notification.style.transform = 'translateX(-50%)';
                    notification.style.backgroundColor = '#333';
                    notification.style.color = 'white';
                    notification.style.padding = '15px';
                    notification.style.borderRadius = '5px';
                    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
                    notification.style.zIndex = '10000';
                    notification.style.display = 'flex';
                    notification.style.alignItems = 'center';
                    notification.style.gap = '10px';
                    notification.style.fontFamily = 'Arial, sans-serif';

                    const text = document.createElement('span');

                    text.textContent = 'A new version is available!';
                    
                    const button = document.createElement('button');
                    button.textContent = 'Update';
                    button.style.padding = '5px 10px';
                    button.style.cursor = 'pointer';
                    button.style.backgroundColor = '#4CAF50';
                    button.style.color = 'white';
                    button.style.border = 'none';
                    button.style.borderRadius = '3px';
                    
                    button.onclick = () => {
                        if (worker) {
                            worker.postMessage({ type: 'SKIP_WAITING' });
                        }
                        notification.remove();
                    };

                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '✕';
                    closeBtn.style.background = 'none';
                    closeBtn.style.border = 'none';
                    closeBtn.style.color = 'white';
                    closeBtn.style.cursor = 'pointer';
                    closeBtn.style.marginLeft = '10px';
                    closeBtn.style.fontSize = '16px';
                    closeBtn.onclick = () => notification.remove();

                    notification.appendChild(text);
                    notification.appendChild(button);
                    notification.appendChild(closeBtn);
                    document.body.appendChild(notification);
                }

                // Expose for testing
                window.testUpdateNotification = () => showUpdateNotification(null);
                
                // Expose check for updates
                window.checkForUpdates = () => {
                    console.log('Checking for updates...');
                    registration.update().then(() => {
                        console.log('Update check completed.');
                        if (!registration.waiting && !registration.installing) {
                            alert('No updates available.');
                        }
                    }).catch(err => {
                        console.error('Update check failed:', err);
                        alert('Update check failed. See console for details.');
                    });
                };

                // Add keyboard shortcut for testing (Press 'U')
                window.addEventListener('keydown', (e) => {
                    // Only trigger if no input field is focused
                    if (e.target.tagName !== 'INPUT' && (e.key === 'u' || e.key === 'U')) {
                        console.log('Testing update notification UI');
                        showUpdateNotification(null);
                    }
                });

                // Check if there's already a waiting worker
                if (registration.waiting) {
                    showUpdateNotification(registration.waiting);
                }

                // Listen for new updates
                registration.onupdatefound = () => {
                    const newWorker = registration.installing;
                    newWorker.onstatechange = () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification(newWorker);
                        }
                    };
                };
                
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

        // Reload the page when the new service worker takes control
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    });
} else {
    console.log('Service Workers not supported in this browser');
}

function createInitialLoaderController() {
    const loader = document.getElementById('initial-loader');
    if (!loader) {
        return null;
    }
    const percentEl = loader.querySelector('[data-loader-percent]');
    const titleEl = loader.querySelector('.title');
    return {
        setProgress(value) {
            if (!percentEl) {
                return;
            }
            const bounded = Math.min(1, Math.max(0, value || 0));
            percentEl.textContent = `${Math.round(bounded * 100)}%`;
        },
        setMessage(text) {
            if (titleEl && typeof text === 'string') {
                titleEl.textContent = text;
            }
        },
        hide() {
            if (loader.classList.contains('hidden')) {
                return;
            }
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }
    };
}