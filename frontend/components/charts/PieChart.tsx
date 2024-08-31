import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  title?: string;
  className?: string;
  labelLine?: boolean;
  dataKey?: string;
  nameKey?: string;
}

const DEFAULT_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
];

const PieChart: React.FC<PieChartProps> = ({
  data,
  width,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showTooltip = true,
  innerRadius = 0,
  outerRadius = 80,
  title,
  className = '',
  labelLine = false,
  dataKey = 'value',
  nameKey = 'name',
}) => {
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={labelLine}
            label={renderLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
              />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => [
                `${value} (${((value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)`,
                name
              ]}
            />
          )}
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => (
                <span style={{ color: '#374151', fontSize: '12px' }}>
                  {value}
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;
