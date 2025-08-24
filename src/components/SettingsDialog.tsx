
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { teamThemes, getTeamsByLeague } from '@/lib/teamThemes';
import { Settings, Zap, Shield, Bell, Database, Palette } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { profile, updateProfile, loading } = useProfile();
  const { toast } = useToast();
  const { themeState, updateSport, updateTeam, toggleThemeEnabled, resetTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    display_name: '',
    auto_save_bets: true,
    default_sportsbook: 'draftkings',
    odds_format: 'american',
    zapier_webhook_url: '',
    public_profile: false,
    notification_preferences: {
      settlement_reminders: true,
      ai_picks_ready: true,
      bankroll_alerts: true
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        auto_save_bets: profile.auto_save_bets ?? true,
        default_sportsbook: profile.default_sportsbook || 'draftkings',
        odds_format: profile.odds_format || 'american',
        zapier_webhook_url: profile.zapier_webhook_url || '',
        public_profile: profile.public_profile || false,
        notification_preferences: {
          settlement_reminders: profile.notification_preferences?.settlement_reminders ?? true,
          ai_picks_ready: profile.notification_preferences?.ai_picks_ready ?? true,
          bankroll_alerts: profile.notification_preferences?.bankroll_alerts ?? true
        }
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        display_name: formData.display_name,
        auto_save_bets: formData.auto_save_bets,
        default_sportsbook: formData.default_sportsbook,
        odds_format: formData.odds_format as 'american' | 'decimal' | 'fractional',
        zapier_webhook_url: formData.zapier_webhook_url || null,
        public_profile: formData.public_profile,
        notification_preferences: formData.notification_preferences
      });
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully."
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testZapierWebhook = async () => {
    if (!formData.zapier_webhook_url) {
      toast({
        title: "No webhook URL",
        description: "Please enter your Zapier webhook URL first.",
        variant: "destructive"
      });
      return;
    }

    try {
      await fetch(formData.zapier_webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: "Test webhook from BET.IO settings"
        }),
      });

      toast({
        title: "Test sent",
        description: "Check your Zapier dashboard to see if the webhook was received.",
      });
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Unable to send test webhook. Please check the URL.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-card border-border"
        aria-describedby="settings-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 font-sports text-xl">
            <Settings className="w-5 h-5" />
            <span>SETTINGS</span>
          </DialogTitle>
        </DialogHeader>
        
        <div id="settings-description" className="sr-only">
          Configure your betting preferences, notifications, and app settings
        </div>
        
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-sports text-lg">PROFILE</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Your display name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Default Sportsbook</Label>
                <Select 
                  value={formData.default_sportsbook} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, default_sportsbook: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draftkings">DraftKings</SelectItem>
                    <SelectItem value="fanduel">FanDuel</SelectItem>
                    <SelectItem value="betmgm">BetMGM</SelectItem>
                    <SelectItem value="caesars">Caesars</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Odds Format</Label>
              <Select 
                value={formData.odds_format} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, odds_format: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="american">American (-110)</SelectItem>
                  <SelectItem value="decimal">Decimal (1.91)</SelectItem>
                  <SelectItem value="fractional">Fractional (10/11)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Public Profile</Label>
                <p className="text-sm text-muted-foreground">Allow others to see your betting stats</p>
              </div>
              <Switch
                checked={formData.public_profile}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, public_profile: checked }))}
              />
            </div>
          </div>

          <Separator />

          {/* Bet Tracking Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="font-sports text-lg">BET TRACKING</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-save AI Suggestions</Label>
                <p className="text-sm text-muted-foreground">Automatically save AI picks to your bet tracker</p>
              </div>
              <Switch
                checked={formData.auto_save_bets}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_save_bets: checked }))}
              />
            </div>
          </div>

          <Separator />

          {/* Notification Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-sports text-lg">NOTIFICATIONS</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Settlement Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminded to settle pending bets</p>
                </div>
                <Switch
                  checked={formData.notification_preferences.settlement_reminders}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    notification_preferences: { ...prev.notification_preferences, settlement_reminders: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>AI Picks Ready</Label>
                  <p className="text-sm text-muted-foreground">Get notified when new AI picks are available</p>
                </div>
                <Switch
                  checked={formData.notification_preferences.ai_picks_ready}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    notification_preferences: { ...prev.notification_preferences, ai_picks_ready: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Bankroll Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get alerts for bankroll risk and milestones</p>
                </div>
                <Switch
                  checked={formData.notification_preferences.bankroll_alerts}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    notification_preferences: { ...prev.notification_preferences, bankroll_alerts: checked }
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Team Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="font-sports text-lg">TEAM THEME</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Team Theme</Label>
                <p className="text-sm text-muted-foreground">Apply your favorite team's colors to the app</p>
              </div>
              <Switch
                checked={themeState.enabled}
                onCheckedChange={toggleThemeEnabled}
              />
            </div>

            {themeState.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>League</Label>
                  <Select 
                    value={themeState.sport} 
                    onValueChange={updateSport}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select league" />
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

                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select 
                    value={themeState.team} 
                    onValueChange={updateTeam}
                    disabled={!themeState.sport}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {themeState.sport && getTeamsByLeague(themeState.sport).map((team) => (
                        <SelectItem key={team.name} value={team.name}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {themeState.enabled && (themeState.sport || themeState.team) && (
              <div className="flex justify-start">
                <Button onClick={resetTheme} variant="outline" size="sm">
                  Reset to Default Theme
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Zapier Integration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="font-sports text-lg">ZAPIER INTEGRATION</h3>
            </div>
            
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex space-x-2">
                <Input
                  value={formData.zapier_webhook_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, zapier_webhook_url: e.target.value }))}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="flex-1"
                />
                <Button onClick={testZapierWebhook} variant="outline" size="sm">
                  Test
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your Zapier webhook to receive notifications and automate workflows.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading} className="bg-gradient-primary">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
