
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { teamThemes } from '@/lib/teamThemes';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const { profile, updateProfile, loading } = useProfile();
  const { toast } = useToast();
  const { themeState, updateSport, updateTeam, toggleThemeEnabled, resetTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: '',
    website_url: '',
    avatar_url: '',
    banner_url: '',
    public_profile: false,
    auto_save_bets: true,
    default_sportsbook: 'draftkings',
    odds_format: 'american',
    zapier_webhook_url: '',
    notification_preferences: {
      settlement_reminders: true,
      ai_picks_ready: true,
      bankroll_alerts: true,
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website_url: profile.website_url || '',
        avatar_url: profile.avatar_url || '',
        banner_url: profile.banner_url || '',
        public_profile: profile.public_profile,
        auto_save_bets: profile.auto_save_bets,
        default_sportsbook: profile.default_sportsbook,
        odds_format: profile.odds_format,
        zapier_webhook_url: profile.zapier_webhook_url || '',
        notification_preferences: profile.notification_preferences
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile(formData);
      toast({
        title: "Settings Updated",
        description: "Your profile settings have been saved successfully.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Your display name"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Your location"
                />
              </div>

              <div>
                <Label htmlFor="website_url">Website</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>

              <div>
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <Label htmlFor="banner_url">Banner URL</Label>
                <Input
                  id="banner_url"
                  type="url"
                  value={formData.banner_url}
                  onChange={(e) => handleInputChange('banner_url', e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="public_profile"
                  checked={formData.public_profile}
                  onCheckedChange={(checked) => handleInputChange('public_profile', checked)}
                />
                <Label htmlFor="public_profile">Make profile public</Label>
              </div>
            </CardContent>
          </Card>

          {/* Betting Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Betting Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_save_bets"
                  checked={formData.auto_save_bets}
                  onCheckedChange={(checked) => handleInputChange('auto_save_bets', checked)}
                />
                <Label htmlFor="auto_save_bets">Auto-save bets</Label>
              </div>

              <div>
                <Label htmlFor="default_sportsbook">Default Sportsbook</Label>
                <Select
                  value={formData.default_sportsbook}
                  onValueChange={(value) => handleInputChange('default_sportsbook', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draftkings">DraftKings</SelectItem>
                    <SelectItem value="fanduel">FanDuel</SelectItem>
                    <SelectItem value="betmgm">BetMGM</SelectItem>
                    <SelectItem value="caesars">Caesars</SelectItem>
                    <SelectItem value="pointsbet">PointsBet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="odds_format">Odds Format</Label>
                <Select
                  value={formData.odds_format}
                  onValueChange={(value) => handleInputChange('odds_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="american">American (+/-)</SelectItem>
                    <SelectItem value="decimal">Decimal</SelectItem>
                    <SelectItem value="fractional">Fractional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="settlement_reminders"
                  checked={formData.notification_preferences.settlement_reminders}
                  onCheckedChange={(checked) => handleNotificationChange('settlement_reminders', checked)}
                />
                <Label htmlFor="settlement_reminders">Settlement reminders</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ai_picks_ready"
                  checked={formData.notification_preferences.ai_picks_ready}
                  onCheckedChange={(checked) => handleNotificationChange('ai_picks_ready', checked)}
                />
                <Label htmlFor="ai_picks_ready">AI picks ready</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="bankroll_alerts"
                  checked={formData.notification_preferences.bankroll_alerts}
                  onCheckedChange={(checked) => handleNotificationChange('bankroll_alerts', checked)}
                />
                <Label htmlFor="bankroll_alerts">Bankroll alerts</Label>
              </div>
            </CardContent>
          </Card>

          {/* Team Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-sports text-primary">Team Theme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme-enabled">Enable Team Theme</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="theme-enabled"
                    checked={themeState.enabled}
                    onCheckedChange={toggleThemeEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    Apply your favorite team's colors to the app
                  </span>
                </div>
              </div>
              
              {themeState.enabled && (
                <>
                  <div>
                    <Label htmlFor="theme-sport">Sport</Label>
                    <Select value={themeState.sport} onValueChange={updateSport}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(teamThemes).map((sport) => (
                          <SelectItem key={sport} value={sport}>
                            {sport}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {themeState.sport && (
                    <div>
                      <Label htmlFor="theme-team">Team</Label>
                      <Select value={themeState.team} onValueChange={updateTeam}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamThemes[themeState.sport]?.map((team) => (
                            <SelectItem key={team.name} value={team.name}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={resetTheme}
                    className="w-full"
                  >
                    Reset to Default Theme
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="zapier_webhook_url">Zapier Webhook URL</Label>
                <Input
                  id="zapier_webhook_url"
                  type="url"
                  value={formData.zapier_webhook_url}
                  onChange={(e) => handleInputChange('zapier_webhook_url', e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Connect with Zapier to automate your betting workflow
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
