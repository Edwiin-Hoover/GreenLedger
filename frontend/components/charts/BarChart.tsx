import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface BarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  dataKey?: string;
  xAxisKey?: string;
  title?: string;
  className?: string;
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  width,
  height = 300,
  color = '#22c55e',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  dataKey = 'value',
  xAxisKey = 'name',
  title,
  className = '',
  horizontal = false,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'horizontal' : 'vertical'}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={horizontal ? dataKey : xAxisKey}
            type={horizontal ? 'number' : 'category'}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            dataKey={horizontal ? xAxisKey : dataKey}
            type={horizontal ? 'category' : 'number'}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
          )}
          {showLegend && <Legend />}
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;
