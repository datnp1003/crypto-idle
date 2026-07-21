import { useEffect, useState, useCallback } from 'react';
import { listUpgrades, updateUpgrade, setUpgradeEnabled, type UpgradeModule } from '../../api/gameConfig';

export function UpgradeListPage() {
  const [items, setItems] = useState<UpgradeModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edits, setEdits] = useState<Record<string, Partial<UpgradeModule>>>({});
  const [saveState, setSaveState] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listUpgrades(true);
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load upgrades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function getEdited(id: string): UpgradeModule {
    const base = items.find(u => u.id === id);
    if (!base) return base!;
    const e = edits[id];
    return e ? { ...base, ...e } : base;
  }

  function setField(id: string, key: keyof UpgradeModule, val: string | number | boolean) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
    setSaveState(prev => ({ ...prev, [id]: 'idle' }));
  }

  async function handleSave(id: string) {
    const edited = getEdited(id);
    setSaveState(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await updateUpgrade(id, {
        name: edited.name,
        description: edited.description,
        baseCost: Number(edited.baseCost),
        costGrowth: Number(edited.costGrowth),
        costFormula: edited.costFormula,
        maxLevel: Number(edited.maxLevel),
        sortOrder: Number(edited.sortOrder),
        icon: edited.icon,
      });
      setSaveState(prev => ({ ...prev, [id]: 'saved' }));
      setEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
      load();
    } catch (e: any) {
      setSaveState(prev => ({ ...prev, [id]: 'error' }));
    }
  }

  async function handleToggleEnabled(id: string, enabled: boolean) {
    try {
      await setUpgradeEnabled(id, enabled);
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to toggle');
    }
  }

  if (loading) return <><h2 className="cms-main__title">Upgrades</h2><p className="cms-main__hint">Loading...</p></>;
  if (error) return <><h2 className="cms-main__title">Upgrades</h2><div className="admin-form__error">{error}</div></>;

  return (
    <>
      <h2 className="cms-main__title">Upgrades</h2>
      <div className="admin-entity-list">
        {items.map(upgrade => {
          const edited = getEdited(upgrade.id);
          const state = saveState[upgrade.id] || 'idle';
          return (
            <div key={upgrade.id} className="admin-entity-card">
              <div className="admin-entity-card__header">
                <span className="admin-entity-card__id">{upgrade.id}</span>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={edited.enabled ?? upgrade.enabled}
                    onChange={e => handleToggleEnabled(upgrade.id, e.target.checked)}
                  />
                  <span className="admin-toggle__track" />
                </label>
              </div>

              <div className="admin-entity-card__body">
                <label className="admin-field">
                  <span className="admin-field__label">Name</span>
                  <input className="admin-field__input" value={edited.name} onChange={e => setField(upgrade.id, 'name', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Description</span>
                  <input className="admin-field__input" value={edited.description} onChange={e => setField(upgrade.id, 'description', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Base Cost</span>
                  <input className="admin-field__input" type="number" value={edited.baseCost} onChange={e => setField(upgrade.id, 'baseCost', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Cost Growth</span>
                  <input className="admin-field__input" type="number" step="any" value={edited.costGrowth} onChange={e => setField(upgrade.id, 'costGrowth', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Max Level</span>
                  <input className="admin-field__input" type="number" value={edited.maxLevel} onChange={e => setField(upgrade.id, 'maxLevel', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Sort Order</span>
                  <input className="admin-field__input" type="number" value={edited.sortOrder} onChange={e => setField(upgrade.id, 'sortOrder', e.target.value)} />
                </label>
              </div>

              <div className="admin-entity-card__footer">
                <button className="admin-btn admin-btn--primary" disabled={state === 'saving'} onClick={() => handleSave(upgrade.id)}>
                  {state === 'saving' ? 'Saving...' : 'Save'}
                </button>
                {state === 'saved' && <span className="admin-status admin-status--ok">Saved</span>}
                {state === 'error' && <span className="admin-status admin-status--err">Error</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
