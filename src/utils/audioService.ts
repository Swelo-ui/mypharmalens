/**
 * Audio Service for managing notification sounds in PharmaLens
 * Handles playing different notification sounds with volume control
 */

export enum NotificationSound {
  DRUG_IDENTIFICATION_COMPLETE = 'drug-identification',
  THEME_SWITCH = 'theme-switch',
  APP_ACCESS = 'app-access'
}

interface AudioSettings {
  volume: number; // 0.0 to 1.0
  enabled: boolean;
}

class AudioService {
  private audioCache: Map<NotificationSound, HTMLAudioElement> = new Map();
  private settings: AudioSettings = {
    volume: 0.7,
    enabled: true
  };

  constructor() {
    this.loadSettings();
    this.preloadSounds();
  }

  /**
   * Load audio settings from localStorage
   */
  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('pharmalens-audio-settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  /**
   * Save audio settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('pharmalens-audio-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  /**
   * Preload all notification sounds for better performance
   */
  private preloadSounds(): void {
    const soundMappings = {
      [NotificationSound.DRUG_IDENTIFICATION_COMPLETE]: '/notifications/drug identification.mp3',
      [NotificationSound.THEME_SWITCH]: '/notifications/darkandlight mode chang.mp3',
      [NotificationSound.APP_ACCESS]: '/notifications/opening sound of pharmalens.mp3'
    };

    Object.entries(soundMappings).forEach(([key, path]) => {
      try {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = this.settings.volume;
        
        // Add error handling for missing files
        audio.addEventListener('error', (e) => {
          console.warn(`Audio file not found: ${path}. Please add the required audio files to the public/notifications folder.`);
        });
        
        this.audioCache.set(key as NotificationSound, audio);
      } catch (error) {
        console.warn(`Failed to preload sound ${key}:`, error);
      }
    });
  }

  /**
   * Play a notification sound
   */
  public async playSound(sound: NotificationSound): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    try {
      const audio = this.audioCache.get(sound);
      if (!audio) {
        console.warn(`Sound ${sound} not found in cache`);
        return;
      }

      // Reset audio to beginning and play
      audio.currentTime = 0;
      audio.volume = this.settings.volume;
      
      // Use promise-based approach for better error handling
      await audio.play();
    } catch (error) {
      // Handle autoplay restrictions gracefully
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.info('Audio autoplay blocked by browser. User interaction required.');
      } else {
        console.warn(`Failed to play sound ${sound}:`, error);
      }
    }
  }

  /**
   * Set volume for all sounds (0.0 to 1.0)
   */
  public setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all cached audio elements
    this.audioCache.forEach(audio => {
      audio.volume = this.settings.volume;
    });
    
    this.saveSettings();
  }

  /**
   * Get current volume setting
   */
  public getVolume(): number {
    return this.settings.volume;
  }

  /**
   * Enable or disable notification sounds
   */
  public setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  /**
   * Check if notification sounds are enabled
   */
  public isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * Test play a specific sound (useful for settings/preferences)
   */
  public async testSound(sound: NotificationSound): Promise<void> {
    const wasEnabled = this.settings.enabled;
    this.settings.enabled = true;
    await this.playSound(sound);
    this.settings.enabled = wasEnabled;
  }

  /**
   * Get audio settings for UI display
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }
}

// Export singleton instance
export const audioService = new AudioService();

// Convenience functions for common use cases
export const playDrugIdentificationSound = () => 
  audioService.playSound(NotificationSound.DRUG_IDENTIFICATION_COMPLETE);

export const playThemeSwitchSound = () => 
  audioService.playSound(NotificationSound.THEME_SWITCH);

export const playAppAccessSound = () => 
  audioService.playSound(NotificationSound.APP_ACCESS);
