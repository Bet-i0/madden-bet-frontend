import React from 'react';
import { TrendingUp, Activity, Users, Zap } from 'lucide-react';

interface TrendCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const TrendCard = ({ title, value, icon: Icon, color }: TrendCardProps) => (
  <div className="glass-card p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <h3 className="font-semibold">{title}</h3>
    </div>
    <p className="text-lg font-bold orbitron">{value}</p>
  </div>
);

export default function Trending() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-8">
      <h1 className="bebas-neue text-3xl">Trending Now</h1>

      <section>
        <h2 className="text-xl bebas-neue mb-3 text-primary">Hot Right Now</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <TrendCard title="Most Bet Team" value="Los Angeles Lakers" icon={TrendingUp} color="text-primary"/>
          <TrendCard title="Popular Prop Bet" value="LeBron James Over 25.5 Pts" icon={Activity} color="text-secondary"/>
          <TrendCard title="Top Parlay Leg" value="Man City ML" icon={Users} color="text-electric-purple"/>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl bebas-neue mb-3 text-secondary">Line Movements</h2>
        <p className="glass-card p-4 text-sm">DAL Mavericks: <span className="font-mono">1.85 &rarr; 1.70</span> (Significant money coming in)</p>
      </section>

      <section>
        <h2 className="text-xl bebas-neue mb-3 text-electric-purple">Value Alerts</h2>
        <p className="glass-card p-4 text-sm">
          <Zap className="w-4 h-4 inline mr-2 text-gold-accent"/> 
          AI has detected a +EV opportunity on the NY Knicks moneyline.
        </p>
      </section>
    </div>
  );
}
