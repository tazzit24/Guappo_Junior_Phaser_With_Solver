export const GlobalSettings = {
    gameName: 'Guappo Junior',
    version: '1.0.4',
    musicEnabled: true,
    updatesEnabled: true,
    
    toggleMusic: function() {
        this.musicEnabled = !this.musicEnabled;
        return this.musicEnabled;
    },

    toggleUpdates: function() {
        this.updatesEnabled = !this.updatesEnabled;
        return this.updatesEnabled;
    }
};
