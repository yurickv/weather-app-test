import { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
import styles from './TemperatureChart.module.css';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

export default function TemperatureChart({ labels, temps }: { labels: string[]; temps: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2f7ed8';
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels, datasets: [{ data: temps, borderColor: accent, backgroundColor: accent + '33', fill: true, tension: 0.35, pointRadius: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v) => `${v}°` } } } },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [labels, temps]);

  return <div className={styles.wrap}><canvas ref={canvasRef} /></div>;
}
