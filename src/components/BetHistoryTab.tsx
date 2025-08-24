
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useBets, type Bet } from '@/hooks/useBets';
import { exportBetsToCSV } from '@/utils/csvUtils';
import { CheckCircle, XCircle, MinusCircle, Download, Search, Filter, Archive } from 'lucide-react';

interface BetHistoryTabProps {
  bets?: Bet[] | any[];
}

const BetHistoryTab = ({ bets: propBets }: BetHistoryTabProps) => {
  const { bets: hookBets, updateBetStatus, loading } = useBets();
  const bets = propBets || hookBets;
  const { toast } = useToast();
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [bookFilter, setBookFilter] = useState<string>('all');

  const filteredBets = useMemo(() => {
    return bets.filter(bet => {
      const matchesSearch = !searchTerm || 
        bet.legs.some(leg => 
          leg.team1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leg.team2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leg.bet_selection?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        bet.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || bet.status === statusFilter;
      const matchesSport = sportFilter === 'all' || bet.legs.some(leg => leg.sport === sportFilter);
      const matchesBook = bookFilter === 'all' || bet.sportsbook === bookFilter;

      return matchesSearch && matchesStatus && matchesSport && matchesBook;
    });
  }, [bets, searchTerm, statusFilter, sportFilter, bookFilter]);

  const uniqueSports = [...new Set(bets.flatMap(bet => bet.legs.map(leg => leg.sport)).filter(Boolean))];
  const uniqueBooks = [...new Set(bets.map(bet => bet.sportsbook).filter(Boolean))];

  const handleStatusUpdate = async (betId: string, status: 'won' | 'lost' | 'void' | 'push') => {
    try {
      await updateBetStatus(betId, status);
      toast({
        title: "Bet updated",
        description: `Bet marked as ${status.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bet status",
        variant: "destructive"
      });
    }
  };

  const handleBulkStatusUpdate = async (status: 'won' | 'lost' | 'void' | 'push') => {
    const promises = Array.from(selectedBets).map(betId => updateBetStatus(betId, status));
    
    try {
      await Promise.all(promises);
      toast({
        title: "Bulk update complete",
        description: `${selectedBets.size} bets marked as ${status.toUpperCase()}`
      });
      setSelectedBets(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Some bets failed to update",
        variant: "destructive"
      });
    }
  };

  const toggleBetSelection = (betId: string) => {
    const newSelected = new Set(selectedBets);
    if (newSelected.has(betId)) {
      newSelected.delete(betId);
    } else {
      newSelected.add(betId);
    }
    setSelectedBets(newSelected);
  };

  const selectAllVisible = () => {
    const visibleIds = new Set(filteredBets.map(bet => bet.id!));
    setSelectedBets(visibleIds);
  };

  const clearSelection = () => {
    setSelectedBets(new Set());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'lost':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'push':
      case 'void':
        return <MinusCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 font-sports">
            <Archive className="w-5 h-5 text-primary" />
            <span>BET HISTORY</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => exportBetsToCSV(filteredBets)}
              variant="outline"
              size="sm"
              className="font-sports"
            >
              <Download className="w-4 h-4 mr-2" />
              EXPORT CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="void">Void</SelectItem>
              <SelectItem value="push">Push</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Sports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {uniqueSports.map(sport => (
                <SelectItem key={sport} value={sport}>{sport}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={bookFilter} onValueChange={setBookFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Books" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              {uniqueBooks.map(book => (
                <SelectItem key={book} value={book}>{book}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedBets.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm font-sports">
              {selectedBets.size} bet{selectedBets.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={() => handleBulkStatusUpdate('won')} className="bg-green-600 hover:bg-green-700">
                Mark Won
              </Button>
              <Button size="sm" onClick={() => handleBulkStatusUpdate('lost')} className="bg-red-600 hover:bg-red-700">
                Mark Lost
              </Button>
              <Button size="sm" onClick={() => handleBulkStatusUpdate('void')} className="bg-yellow-600 hover:bg-yellow-700">
                Mark Void
              </Button>
              <Button size="sm" onClick={clearSelection} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Selection Controls */}
        <div className="flex items-center space-x-2 text-sm">
          <Button size="sm" variant="ghost" onClick={selectAllVisible}>
            Select All ({filteredBets.length})
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            Clear Selection
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedBets.size === filteredBets.length && filteredBets.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllVisible();
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Matchup</TableHead>
                <TableHead>Selection</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stake</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBets.map((bet) => (
                <TableRow key={bet.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedBets.has(bet.id!)}
                      onCheckedChange={() => toggleBetSelection(bet.id!)}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {bet.created_at ? new Date(bet.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {bet.legs.slice(0, 2).map((leg, idx) => (
                        <div key={idx} className="text-sm">
                          {leg.team1} vs {leg.team2}
                        </div>
                      ))}
                      {bet.legs.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{bet.legs.length - 2} more
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {bet.legs.slice(0, 2).map((leg, idx) => (
                        <div key={idx} className="text-sm">
                          {leg.bet_selection}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{bet.bet_type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(bet.stake)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(bet.status)}
                      <Badge variant={bet.status === 'won' ? 'default' : bet.status === 'lost' ? 'destructive' : 'secondary'}>
                        {bet.status.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {bet.sportsbook || '-'}
                  </TableCell>
                  <TableCell>
                    {bet.status === 'pending' && (
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(bet.id!, 'won')}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 h-auto text-xs"
                        >
                          Won
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(bet.id!, 'lost')}
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 h-auto text-xs"
                        >
                          Lost
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredBets.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No bets match your current filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BetHistoryTab;
