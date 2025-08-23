
import { Bet } from '@/hooks/useBets';

export const exportBetsToCSV = (bets: Bet[]) => {
  const headers = [
    'Date',
    'Sport',
    'League', 
    'Teams',
    'Market',
    'Selection',
    'Odds',
    'Open Odds',
    'Closing Odds',
    'Bet Type',
    'Stake',
    'Potential Payout',
    'Status',
    'Sportsbook',
    'Tags',
    'Notes'
  ];

  const rows = bets.flatMap(bet => 
    bet.legs.map(leg => [
      bet.created_at ? new Date(bet.created_at).toLocaleDateString() : '',
      leg.sport || '',
      leg.league || '',
      `${leg.team1} vs ${leg.team2}`,
      leg.bet_market || '',
      leg.bet_selection || '',
      leg.odds?.toString() || '',
      leg.open_odds?.toString() || '',
      leg.closing_odds?.toString() || '',
      bet.bet_type || '',
      bet.stake?.toString() || '',
      bet.potential_payout?.toString() || '',
      bet.status || '',
      bet.sportsbook || '',
      Array.isArray(bet.tags) ? bet.tags.join(';') : '',
      bet.notes || ''
    ])
  );

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `bet-history-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSVFile = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => {
          // Simple CSV parser - handles quoted fields
          const fields: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              fields.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          fields.push(current.trim());
          return fields;
        }).filter(row => row.some(field => field.length > 0));
        
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
