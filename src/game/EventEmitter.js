/**
 * Simple implementation of an event emitter for event-driven architecture.
 * Allows components to communicate without direct references.
 */
export class EventEmitter {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} listener - Callback function
     */
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
        return () => this.off(event, listener); // Return unsubscribe function
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} listener - Callback function to remove
     */
    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {...any} args - Data to pass to listeners
     */
    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => {
            try {
                listener(...args);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }
}