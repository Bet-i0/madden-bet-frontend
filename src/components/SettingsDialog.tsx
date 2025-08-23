import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Shield,
  BarChart3,
  Brain,
  Bell,
  Palette,
  ChevronDown,
  Crown,
  LogOut,
  Mail,
  Smartphone,
  Chrome,
  User,
  ArrowUp
} from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Settings state
  const [oddsFormat, setOddsFormat] = useState("american");
  const [betStyle, setBetStyle] = useState("balanced");
  const [gptTone, setGptTone] = useState("analytical");
  const [darkMode, setDarkMode] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [aiAlerts, setAiAlerts] = useState(true);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const settingsSections = [
    {
      id: "account",
      icon: Shield,
      title: "Account",
      emoji: "🔐"
    },
    {
      id: "betting",
      icon: BarChart3,
      title: "Betting Preferences",
      emoji: "📊"
    },
    {
      id: "ai",
      icon: Brain,
      title: "AI Settings",
      emoji: "🧠"
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      emoji: "🔔"
    },
    {
      id: "appearance",
      icon: Palette,
      title: "Appearance",
      emoji: "🌑"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card border-border">
        <DialogHeader>
          <DialogTitle className="font-sports text-2xl text-center">SETTINGS</DialogTitle>
        </DialogHeader>

        {/* Hero Profile Section */}
        <div className="bg-gradient-primary p-6 rounded-lg mb-6 text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-primary-foreground shadow-neon">
            <AvatarImage src="/api/placeholder/80/80" />
            <AvatarFallback className="bg-gradient-neon font-bold text-xl">PB</AvatarFallback>
          </Avatar>
          
          <h3 className="font-sports text-xl text-primary-foreground mb-2">SportsFan_99</h3>
          
          <div className="flex justify-center mb-4">
            <Badge className="bg-gold-accent text-background font-sports px-4 py-1">
              <Crown className="w-4 h-4 mr-1" />
              PRO ANALYST
            </Badge>
          </div>
          
          <p className="text-primary-foreground/80 text-sm mb-4">
            Active since Jan 2024 • 127 successful predictions
          </p>
          
          <Button 
            className="bg-gradient-neon text-accent-foreground hover:shadow-glow font-sports"
            size="lg"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            UPGRADE TO ELITE
          </Button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {settingsSections.map((section) => (
            <Collapsible 
              key={section.id}
              open={expandedSections[section.id]}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-muted/50 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{section.emoji}</span>
                    <span className="font-sports text-lg">{section.title}</span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${
                      expandedSections[section.id] ? 'rotate-180' : ''
                    }`} 
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 p-4 bg-muted/20 rounded-lg border border-border/50">
                {section.id === "account" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email / Username</label>
                      <div className="p-3 bg-background rounded-md border text-muted-foreground">
                        sportsfan_99@email.com
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Link Accounts</h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Chrome className="w-4 h-4 mr-2" />
                          Google
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Smartphone className="w-4 h-4 mr-2" />
                          Apple
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <Button variant="destructive" className="w-full">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </Button>
                  </div>
                )}

                {section.id === "betting" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-3 block">Odds Format</label>
                      <Select value={oddsFormat} onValueChange={setOddsFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="american">American (+120)</SelectItem>
                          <SelectItem value="decimal">Decimal (2.20)</SelectItem>
                          <SelectItem value="fractional">Fractional (6/5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">Preferred Sportsbooks</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["FanDuel", "DraftKings", "BetMGM", "Caesars"].map((book) => (
                          <div key={book} className="flex items-center space-x-2 p-2 border rounded">
                            <Switch id={book} />
                            <label htmlFor={book} className="text-sm">{book}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">Favorite Teams / Sports</label>
                      <div className="flex flex-wrap gap-2">
                        {["NFL", "NBA", "MLB", "Chiefs", "Lakers"].map((item) => (
                          <Badge key={item} variant="secondary" className="cursor-pointer hover:bg-primary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "ai" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-3 block">Bet Style</label>
                      <Select value={betStyle} onValueChange={setBetStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">Conservative</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">GPT Voice Tone</label>
                      <Select value={gptTone} onValueChange={setGptTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="analytical">Analytical (stats heavy)</SelectItem>
                          <SelectItem value="chill">Chill (casual, plain English)</SelectItem>
                          <SelectItem value="sharp">Sharp (risk-savvy, high ROI focus)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">Receive AI Alerts?</label>
                      <div className="space-y-3">
                        {[
                          { id: "injury", label: "Injury changes" },
                          { id: "line", label: "Line movement" },
                          { id: "gpt", label: "GPT-pick updates" }
                        ].map((alert) => (
                          <div key={alert.id} className="flex items-center space-x-3">
                            <Switch id={alert.id} checked={aiAlerts} onCheckedChange={setAiAlerts} />
                            <label htmlFor={alert.id} className="text-sm">{alert.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "notifications" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <label className="text-sm font-medium">Email Alerts</label>
                      </div>
                      <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Chrome className="w-4 h-4" />
                        <label className="text-sm font-medium">Browser Push Alerts</label>
                      </div>
                      <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4" />
                        <label className="text-sm font-medium">Text Alerts</label>
                      </div>
                      <Switch />
                    </div>
                  </div>
                )}

                {section.id === "appearance" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Dark Mode</label>
                      <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">Accent Color Theme</label>
                      <div className="flex gap-2">
                        {[
                          { name: "Neon Blue", color: "bg-blue-500" },
                          { name: "Electric Purple", color: "bg-purple-500" },
                          { name: "Gold", color: "bg-yellow-500" },
                          { name: "Green", color: "bg-green-500" }
                        ].map((theme) => (
                          <button
                            key={theme.name}
                            className={`w-8 h-8 rounded-full ${theme.color} border-2 border-border hover:scale-110 transition-transform`}
                            title={theme.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;