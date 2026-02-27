import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { audioService, NotificationSound } from '@/utils/audioService';

const AudioSettings: React.FC = () => {
  const [volume, setVolume] = useState(0.7);
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load current settings
    const settings = audioService.getSettings();
    setVolume(settings.volume);
    setEnabled(settings.enabled);
  }, []);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    audioService.setVolume(newVolume);
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    audioService.setEnabled(checked);
  };

  const testSound = async (sound: NotificationSound, soundName: string) => {
    setIsLoading(true);
    try {
      await audioService.testSound(sound);
    } catch (error) {
      console.error(`Failed to test ${soundName} sound:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Audio Settings
        </CardTitle>
        <CardDescription>
          Configure notification sounds and volume preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Sounds */}
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-enabled" className="text-sm font-medium">
            Enable Notification Sounds
          </Label>
          <Switch
            id="sound-enabled"
            checked={enabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        {/* Volume Control */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Volume: {Math.round(volume * 100)}%
          </Label>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            min={0}
            step={0.1}
            disabled={!enabled}
            className="w-full"
          />
        </div>

        {/* Sound Test Buttons */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Test Sounds</Label>
          <div className="grid gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound(NotificationSound.APP_ACCESS, 'App Access')}
              disabled={isLoading || !enabled}
              className="justify-start"
            >
              <Play className="h-4 w-4 mr-2" />
              App Access Sound
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound(NotificationSound.DRUG_IDENTIFICATION_COMPLETE, 'Drug Identification')}
              disabled={isLoading || !enabled}
              className="justify-start"
            >
              <Play className="h-4 w-4 mr-2" />
              Drug Identification Sound
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound(NotificationSound.THEME_SWITCH, 'Theme Switch')}
              disabled={isLoading || !enabled}
              className="justify-start"
            >
              <Play className="h-4 w-4 mr-2" />
              Theme Switch Sound
            </Button>
          </div>
        </div>

        {/* Info Text */}
        <div className="text-xs text-muted-foreground">
          <p>
            Notification sounds enhance your PharmaLens experience by providing 
            audio feedback for important actions and events.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioSettings;
