import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { WorkoutLog } from '@/types/workout';

interface VolumeChartProps {
  logs: WorkoutLog[];
}

export default function VolumeChart({ logs }: VolumeChartProps) {
  const [chartFilter, setChartFilter] = useState('all');

  const uniqueOptions = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((log) => {
      log.exercises?.forEach((ex) => {
        const key = `${log.workoutId}|${ex.name}`;
        map.set(key, `${log.workoutTitle} - ${ex.name}`);
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [logs]);

  const chartData = useMemo(() => {
    const data: { date: string; value: number }[] = [];
    logs.forEach((log) => {
      const date = new Date(log.date).toLocaleDateString('de-DE');

      if (chartFilter === 'all') {
        const totalVolume = log.exercises.reduce(
          (sum, ex) => sum + ex.actualSets * ex.actualReps * ex.actualWeight,
          0
        );
        data.push({ date, value: totalVolume });
      } else {
        const [wId, selectedExName] = chartFilter.split('|');
        if (log.workoutId === wId) {
          const ex = log.exercises.find((e) => e.name === selectedExName);
          if (ex) data.push({ date, value: ex.actualWeight });
        }
      }
    });
    return data;
  }, [logs, chartFilter]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fortschritt (Gewicht)</h2>

        <Select value={chartFilter} onValueChange={(v) => setChartFilter(v || 'all')}>
          <SelectTrigger className="w-[300px] overflow-hidden">
            <span className="truncate flex-1 text-left">
              {chartFilter === 'all'
                ? 'Alle (Gesamtvolumen)'
                : uniqueOptions.find((o) => o[0] === chartFilter)?.[1] || chartFilter}
            </span>
          </SelectTrigger>
          <SelectContent className="max-w-[90vw] w-fit">
            <SelectItem value="all">Alle (Gesamtvolumen)</SelectItem>
            {uniqueOptions.map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4 h-[400px]">
        <ChartContainer
          config={{ value: { label: 'Wert', color: 'hsl(142.1 76.2% 36.3%)' } }}
          className="h-full w-full"
        >
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ChartContainer>
      </Card>
    </div>
  );
}
