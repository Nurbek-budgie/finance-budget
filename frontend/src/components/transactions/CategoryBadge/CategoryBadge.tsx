import styles from './CategoryBadge.module.css';

const PALETTE = [
  '#4A90D9', '#E8834A', '#5CB87A', '#9B72D0',
  '#E8C84A', '#E86B6B', '#4AB8C8',
];

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

interface Props {
  category: string | null | undefined;
}

export default function CategoryBadge({ category }: Props) {
  const label = category ?? 'Uncategorized';
  const color = hashColor(label);
  return (
    <span className={styles.badge} style={{ '--c': color } as React.CSSProperties}>
      {label}
    </span>
  );
}
