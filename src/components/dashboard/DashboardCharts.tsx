
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Style constants
const DATA_COLOR = '#8884d8';
const GRID_COLOR = '#f5f5f5';
const CHART_HEIGHT = 300;

interface ChartProps {
  data: any[];
  isDemoMode: boolean;
  generateRandomData: (count: number) => any[];
}

export const AreaChartComponent: React.FC<ChartProps> = ({ data, isDemoMode, generateRandomData }) => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <AreaChart 
      data={isDemoMode ? generateRandomData(7) : data}
      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
    >
      <CartesianGrid stroke={GRID_COLOR} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Area type="monotone" dataKey="pv" stroke={DATA_COLOR} fill={DATA_COLOR} />
    </AreaChart>
  </ResponsiveContainer>
);

export const LineChartComponent: React.FC<ChartProps> = ({ data, isDemoMode, generateRandomData }) => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart
      data={isDemoMode ? generateRandomData(7) : data}
      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
    >
      <CartesianGrid stroke={GRID_COLOR} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke={DATA_COLOR} />
    </LineChart>
  </ResponsiveContainer>
);

export const BarChartComponent: React.FC<ChartProps> = ({ data, isDemoMode, generateRandomData }) => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <BarChart
      data={isDemoMode ? generateRandomData(7) : data}
      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid stroke={GRID_COLOR} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="profit" fill="#82ca9d" />
      <Bar dataKey="loss" fill="#e45649" />
    </BarChart>
  </ResponsiveContainer>
);

// Data generation helper functions
export const generateRandomChartData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      name: `Day ${i + 1}`,
      uv: Math.floor(Math.random() * 5000),
      pv: Math.floor(Math.random() * 5000),
      amt: Math.floor(Math.random() * 3000),
    });
  }
  return data;
};

export const generateRandomLineChartData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      name: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 10000),
    });
  }
  return data;
};

export const generateRandomBarChartData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      name: `Month ${i + 1}`,
      profit: Math.floor(Math.random() * 10000),
      loss: Math.floor(Math.random() * 1000),
    });
  }
  return data;
};

// Mock data for charts
export const mockChartData = [
  { name: 'Day 1', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Day 2', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Day 3', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Day 4', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Day 5', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Day 6', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Day 7', uv: 3490, pv: 4300, amt: 2100 },
];

export const mockLineChartData = [
  { name: 'Day 1', value: 2400 },
  { name: 'Day 2', value: 1398 },
  { name: 'Day 3', value: 9800 },
  { name: 'Day 4', value: 3908 },
  { name: 'Day 5', value: 4800 },
  { name: 'Day 6', value: 3800 },
  { name: 'Day 7', value: 4300 },
];

export const mockBarChartData = [
  { name: 'Jan', profit: 2400, loss: 100 },
  { name: 'Feb', profit: 1398, loss: 200 },
  { name: 'Mar', profit: 9800, loss: 300 },
  { name: 'Apr', profit: 3908, loss: 400 },
  { name: 'May', profit: 4800, loss: 500 },
  { name: 'Jun', profit: 3800, loss: 600 },
  { name: 'Jul', profit: 4300, loss: 700 },
];
