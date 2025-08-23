
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useBets } from '@/hooks/useBets';
import { parseCSVFile } from '@/utils/csvUtils';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CSVImportDialog = ({ open, onOpenChange }: CSVImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const { saveBet } = useBets();
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    try {
      const data = await parseCSVFile(selectedFile);
      setCsvData(data);
    } catch (err) {
      setError('Failed to parse CSV file. Please check the format.');
      setCsvData([]);
    }
  };

  const handleImport = async () => {
    if (csvData.length < 2) {
      setError('CSV file must have at least a header row and one data row.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = csvData[0];
      console.log('CSV Headers:', headers);
      
      // Expected headers: Date, Sport, League, Teams, Market, Selection, Odds, Open Odds, Closing Odds, Bet Type, Stake, Potential Payout, Status, Sportsbook, Tags, Notes
      const dataRows = csvData.slice(1);
      let importedCount = 0;
      let errorCount = 0;

      for (const row of dataRows) {
        try {
          // Parse teams
          const teamsStr = row[3] || '';
          const [team1 = '', team2 = ''] = teamsStr.split(' vs ').map(t => t.trim());

          if (!team1 || !team2) {
            console.warn('Skipping row with invalid teams:', row);
            errorCount++;
            continue;
          }

          const bet = {
            bet_type: (row[9] || 'single').toLowerCase() as 'single' | 'parlay' | 'teaser' | 'round_robin',
            stake: parseFloat(row[10]) || 0,
            potential_payout: parseFloat(row[11]) || undefined,
            status: (row[12] || 'pending').toLowerCase() as 'pending' | 'won' | 'lost' | 'void' | 'push',
            sportsbook: row[13] || undefined,
            notes: row[15] || undefined,
            ai_suggested: false,
            tags: row[14] ? row[14].split(';').map(t => t.trim()).filter(Boolean) : [],
            legs: [{
              sport: row[1] || '',
              league: row[2] || '',
              team1,
              team2,
              bet_market: row[4] || '',
              bet_selection: row[5] || '',
              odds: parseFloat(row[6]) || undefined,
              open_odds: parseFloat(row[7]) || undefined,
              closing_odds: parseFloat(row[8]) || undefined,
              result: (row[12] || 'pending').toLowerCase() as 'pending' | 'won' | 'lost' | 'void' | 'push'
            }]
          };

          if (bet.stake <= 0) {
            console.warn('Skipping row with invalid stake:', row);
            errorCount++;
            continue;
          }

          await saveBet(bet);
          importedCount++;
        } catch (err) {
          console.error('Error importing row:', row, err);
          errorCount++;
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${importedCount} bets. ${errorCount} errors.`
      });

      onOpenChange(false);
    } catch (err) {
      setError('Failed to import bets. Please check the file format.');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setCsvData([]);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetDialog();
    }}>
      <DialogContent className="max-w-2xl bg-gradient-card border-border">
        <DialogHeader>
          <DialogTitle className="font-sports text-xl flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Import Bets from CSV</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Alert>
            <FileText className="w-4 h-4" />
            <AlertDescription>
              Upload a CSV file with columns: Date, Sport, League, Teams, Market, Selection, Odds, Open Odds, Closing Odds, Bet Type, Stake, Potential Payout, Status, Sportsbook, Tags, Notes
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {csvData.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (First 3 rows)</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {csvData[0]?.map((header, idx) => (
                          <th key={idx} className="px-3 py-2 text-left font-medium border-r">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(1, 4).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-t">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-3 py-2 border-r text-xs">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {csvData.length - 1} rows ready to import
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={loading || csvData.length < 2}
              className="bg-gradient-primary"
            >
              {loading ? 'Importing...' : `Import ${csvData.length - 1} Bets`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;
