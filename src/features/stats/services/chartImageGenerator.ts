import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BRAND = {
  navy: '#1B3A5C',
  green: '#2D8C3C',
  lightBlue: '#4A9BD9',
  red: '#C41E3A',
  greenLight: 'rgba(45,140,60,0.15)',
  blueLight: 'rgba(74,155,217,0.15)',
};

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png').split(',')[1];
}

export interface ChartImage {
  base64: string;
  width: number;
  height: number;
}

export function generateLineChart(
  title: string,
  labels: string[],
  datasets: Array<{ label: string; data: number[]; color: string; fill?: boolean }>
): ChartImage {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d')!;

  new ChartJS(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.fill ? ds.color + '20' : 'transparent',
        fill: ds.fill || false,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: ds.color,
      })),
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        title: { display: true, text: title, font: { size: 16, weight: 'bold' } },
        legend: { position: 'top' },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });

  return { base64: canvasToBase64(canvas), width: 800, height: 400 };
}

export function generateBarChart(
  title: string,
  labels: string[],
  datasets: Array<{ label: string; data: number[]; color: string }>,
  horizontal = false
): ChartImage {
  const canvas = createCanvas(800, 450);
  const ctx = canvas.getContext('2d')!;

  new ChartJS(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.color + 'CC',
        borderColor: ds.color,
        borderWidth: 1,
      })),
    },
    options: {
      responsive: false,
      animation: false,
      indexAxis: horizontal ? 'y' : 'x',
      plugins: {
        title: { display: true, text: title, font: { size: 16, weight: 'bold' } },
        legend: { position: 'top' },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });

  return { base64: canvasToBase64(canvas), width: 800, height: 450 };
}

export function generatePieChart(
  title: string,
  labels: string[],
  data: number[],
  colors: string[]
): ChartImage {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext('2d')!;

  new ChartJS(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.map((c) => c + 'CC'),
          borderColor: colors,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        title: { display: true, text: title, font: { size: 16, weight: 'bold' } },
        legend: { position: 'right' },
      },
    },
  });

  return { base64: canvasToBase64(canvas), width: 600, height: 400 };
}

export function generateMultiLineChart(
  title: string,
  labels: string[],
  datasets: Array<{ label: string; data: number[]; color: string }>
): ChartImage {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d')!;

  new ChartJS(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        title: { display: true, text: title, font: { size: 16, weight: 'bold' } },
        legend: { position: 'top' },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });

  return { base64: canvasToBase64(canvas), width: 800, height: 400 };
}

export { BRAND };
