import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, TestTube } from 'lucide-react';

interface DataSourceToggleProps {
  dataSource: 'mock' | 'live';
  onToggle: (source: 'mock' | 'live') => void;
  liveDataCount: number;
}

const DataSourceToggle = ({ dataSource, onToggle, liveDataCount }: DataSourceToggleProps) => {
  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-sports flex items-center space-x-2">
          <Database className="w-4 h-4" />
          <span>DATA SOURCE</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={dataSource === 'mock' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggle('mock')}
            className="font-sports text-xs"
          >
            <TestTube className="w-3 h-3 mr-1" />
            DEMO DATA
          </Button>
          <Button
            variant={dataSource === 'live' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggle('live')}
            className="font-sports text-xs"
          >
            <Database className="w-3 h-3 mr-1" />
            LIVE DATA
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {dataSource === 'mock' ? (
            <div className="flex items-center justify-between">
              <span>Showing demo analytics</span>
              <Badge variant="secondary" className="text-xs">100 picks</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span>Your actual betting data</span>
              <Badge variant="secondary" className="text-xs">{liveDataCount} picks</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceToggle;