import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './CategoryCombobox.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  budgetedNames?: Set<string>;
  placeholder?: string;
  disabled?: boolean;
}

const MAX_SHOWN = 8;

export default function CategoryCombobox({
  value,
  onChange,
  suggestions,
  budgetedNames,
  placeholder,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(value.trim().toLowerCase())).slice(0, MAX_SHOWN)
    : suggestions.slice(0, MAX_SHOWN);

  useEffect(() => {
    setHighlighted(0);
  }, [value]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const select = useCallback((name: string) => {
    onChange(name);
    setOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted(h => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter' && filtered[highlighted]) {
      select(filtered[highlighted]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showNoMatches = open && value.trim() && filtered.length === 0 && suggestions.length > 0;

  return (
    <div className={styles.wrap} ref={containerRef}>
      <input
        ref={inputRef}
        className={styles.input}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {(open && filtered.length > 0) && (
        <ul className={styles.dropdown} role="listbox">
          {filtered.map((name, i) => {
            const isBudgeted = budgetedNames?.has(name.toLowerCase());
            return (
              <li
                key={name}
                role="option"
                aria-selected={i === highlighted}
                className={`${styles.item} ${i === highlighted ? styles.itemActive : ''}`}
                onMouseDown={e => { e.preventDefault(); select(name); }}
                onMouseEnter={() => setHighlighted(i)}
              >
                <span className={styles.itemName}>{name}</span>
                {isBudgeted && <span className={styles.badge}>budgeted</span>}
              </li>
            );
          })}
        </ul>
      )}
      {showNoMatches && (
        <div className={styles.noMatches}>No matching categories</div>
      )}
    </div>
  );
}
