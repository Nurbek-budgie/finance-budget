import styles from './KpiCard.module.css';

interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  sparkData: number[];
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80, H = 28;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 6) - 3}`)
    .join(' ');
  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? 'var(--pos)' : 'var(--neg)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function KpiCard({ label, value, delta, deltaUp, sparkData }: KpiCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <div className={styles.foot}>
        <span className={`${styles.delta} ${deltaUp ? styles.up : styles.dn}`}>
          {deltaUp ? '↑' : '↓'} {delta}
        </span>
        <Sparkline data={sparkData} up={deltaUp} />
      </div>
    </div>
  );
}
