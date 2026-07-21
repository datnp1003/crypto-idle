import { useEffect, useState, useCallback } from 'react';
import { listStaff, updateStaff, setStaffEnabled, type StaffModule } from '../../api/gameConfig';

export function StaffListPage() {
  const [items, setItems] = useState<StaffModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edits, setEdits] = useState<Record<string, Partial<StaffModule>>>({});
  const [saveState, setSaveState] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listStaff(true);
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function getEdited(id: string): StaffModule {
    const base = items.find(s => s.id === id);
    if (!base) return base!;
    const e = edits[id];
    return e ? { ...base, ...e } : base;
  }

  function setField(id: string, key: keyof StaffModule, val: string | number | boolean) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
    setSaveState(prev => ({ ...prev, [id]: 'idle' }));
  }

  async function handleSave(id: string) {
    const edited = getEdited(id);
    setSaveState(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await updateStaff(id, {
        name: edited.name,
        baseCost: Number(edited.baseCost),
        baseProfit: Number(edited.baseProfit),
        costGrowth: Number(edited.costGrowth),
        maxCount: Number(edited.maxCount),
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
      await setStaffEnabled(id, enabled);
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to toggle');
    }
  }

  if (loading) return <><h2 className="cms-main__title">Staff</h2><p className="cms-main__hint">Loading...</p></>;
  if (error) return <><h2 className="cms-main__title">Staff</h2><div className="admin-form__error">{error}</div></>;

  return (
    <>
      <h2 className="cms-main__title">Staff</h2>
      <div className="admin-entity-list">
        {items.map(staff => {
          const edited = getEdited(staff.id);
          const state = saveState[staff.id] || 'idle';
          return (
            <div key={staff.id} className="admin-entity-card">
              <div className="admin-entity-card__header">
                <span className="admin-entity-card__id">{staff.id}</span>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={edited.enabled ?? staff.enabled}
                    onChange={e => handleToggleEnabled(staff.id, e.target.checked)}
                  />
                  <span className="admin-toggle__track" />
                </label>
              </div>

              <div className="admin-entity-card__body">
                <label className="admin-field">
                  <span className="admin-field__label">Name</span>
                  <input className="admin-field__input" value={edited.name} onChange={e => setField(staff.id, 'name', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Base Cost</span>
                  <input className="admin-field__input" type="number" value={edited.baseCost} onChange={e => setField(staff.id, 'baseCost', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Base Profit</span>
                  <input className="admin-field__input" type="number" step="any" value={edited.baseProfit} onChange={e => setField(staff.id, 'baseProfit', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Cost Growth</span>
                  <input className="admin-field__input" type="number" step="any" value={edited.costGrowth} onChange={e => setField(staff.id, 'costGrowth', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Max Count</span>
                  <input className="admin-field__input" type="number" value={edited.maxCount} onChange={e => setField(staff.id, 'maxCount', e.target.value)} />
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Sort Order</span>
                  <input className="admin-field__input" type="number" value={edited.sortOrder} onChange={e => setField(staff.id, 'sortOrder', e.target.value)} />
                </label>
              </div>

              <div className="admin-entity-card__footer">
                <button className="admin-btn admin-btn--primary" disabled={state === 'saving'} onClick={() => handleSave(staff.id)}>
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
