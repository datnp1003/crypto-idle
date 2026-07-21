import { useEffect, useState, useCallback } from 'react';
import { listSettings, updateSetting, type GameSetting } from '../../api/gameConfig';

const NUMERIC_KEYS = ['prestigeThreshold', 'pumpMultiplier', 'pumpDurationMs'];

export function SettingsPage() {
  const [items, setItems] = useState<GameSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listSettings();
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function getDisplayValue(key: string): string {
    if (key in edits) return edits[key] ?? '';
    const item = items.find(s => s.key === key);
    if (!item) return '';
    try {
      const parsed = JSON.parse(item.valueJson);
      return String(parsed);
    } catch {
      return item.valueJson;
    }
  }

  async function handleSave(key: string) {
    setSaveState(prev => ({ ...prev, [key]: 'saving' }));
    try {
      const raw = edits[key];
      const val = NUMERIC_KEYS.includes(key) ? Number(raw) : raw;
      await updateSetting(key, val);
      setSaveState(prev => ({ ...prev, [key]: 'saved' }));
      setEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
      load();
    } catch (e: any) {
      setSaveState(prev => ({ ...prev, [key]: 'error' }));
    }
  }

  if (loading) return <><h2 className="cms-main__title">Settings</h2><p className="cms-main__hint">Loading...</p></>;
  if (error) return <><h2 className="cms-main__title">Settings</h2><div className="admin-form__error">{error}</div></>;

  return (
    <>
      <h2 className="cms-main__title">Settings</h2>
      <div className="admin-settings-list">
        {items.map(setting => {
          const state = saveState[setting.key] || 'idle';
          const isNum = NUMERIC_KEYS.includes(setting.key);
          return (
            <div key={setting.key} className="admin-setting-row">
              <label className="admin-field">
                <span className="admin-field__label">{setting.key}</span>
                <input
                  className="admin-field__input"
                  type={isNum ? 'number' : 'text'}
                  step={isNum ? 'any' : undefined}
                  value={getDisplayValue(setting.key)}
                  onChange={e => setEdits(prev => ({ ...prev, [setting.key]: e.target.value }))}
                />
              </label>
              <button className="admin-btn admin-btn--primary" disabled={state === 'saving'} onClick={() => handleSave(setting.key)}>
                {state === 'saving' ? 'Saving...' : 'Save'}
              </button>
              {state === 'saved' && <span className="admin-status admin-status--ok">Saved</span>}
              {state === 'error' && <span className="admin-status admin-status--err">Error</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}
