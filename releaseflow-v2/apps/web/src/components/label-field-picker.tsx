'use client';

import { useState, useMemo, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';
import { createNewLabel } from '@/lib/label-service';
import {
  filterLabelsForSearch,
  canCreateLabelFromSearch,
  type LabelOption,
} from '@/lib/label-field-picker-logic';

export type { LabelOption } from '@/lib/label-field-picker-logic';

interface LabelAddPanelProps {
  instanceId: string;
  labels: LabelOption[];
  organizationId: string | null;
  onSelect: (labelId: string, labelName?: string) => void;
  onLabelCreated?: (label: LabelOption) => void;
  onCancel?: () => void;
}

function LabelAddPanel({
  instanceId,
  labels,
  organizationId,
  onSelect,
  onLabelCreated,
  onCancel,
}: LabelAddPanelProps) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const resetPanelState = useCallback(() => {
    setSearch('');
    setCreating(false);
    setError(null);
  }, []);

  useEffect(() => {
    resetPanelState();
    searchInputRef.current?.focus();
  }, [instanceId, resetPanelState]);

  const searchTrimmed = search.trim();
  const normalizedSearch = searchTrimmed.toLowerCase();

  const filteredLabels = useMemo(
    () => filterLabelsForSearch(labels, search),
    [labels, search],
  );

  const canCreate = canCreateLabelFromSearch(labels, search);

  function finishSelection(labelId: string, labelName?: string) {
    resetPanelState();
    onSelect(labelId, labelName);
  }

  function handleSelect(labelId: string) {
    finishSelection(labelId);
  }

  async function handleCreate(name: string) {
    const trimmedName = name.trim();
    if (!organizationId || !trimmedName) return;

    setCreating(true);
    setError(null);
    try {
      const result = await createNewLabel({
        name: trimmedName,
        organizationId,
      });
      const created = { id: result.id, name: result.name };
      onLabelCreated?.(created);
      finishSelection(result.id, result.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create label.');
      setCreating(false);
    }
  }

  function handleCancel() {
    resetPanelState();
    onCancel?.();
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && canCreate && !creating) {
      e.preventDefault();
      void handleCreate(searchTrimmed);
    }
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-3 space-y-3">
      <input
        ref={searchInputRef}
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setError(null);
        }}
        onKeyDown={handleSearchKeyDown}
        placeholder="Type to search or create a label..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        name={`label-search-${instanceId}`}
        data-1p-ignore
        data-lpignore="true"
        className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
      />

      {filteredLabels.length > 0 ? (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filteredLabels.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() => handleSelect(label.id)}
              className="w-full text-left rounded-lg border border-surface-700 bg-surface-950 px-3 py-2.5 text-sm text-surface-100 hover:border-primary-500/40 hover:bg-primary-500/5 transition-colors"
            >
              <span className="text-success-400 mr-2">✓</span>
              {label.name}
            </button>
          ))}
        </div>
      ) : null}

      {canCreate ? (
        <div className="space-y-2 pt-1 border-t border-surface-700/60">
          <button
            type="button"
            onClick={() => handleCreate(searchTrimmed)}
            disabled={creating}
            className="w-full text-left rounded-lg border border-dashed border-primary-500/40 bg-primary-500/5 px-3 py-2.5 text-sm text-primary-300 hover:border-primary-500/60 hover:bg-primary-500/10 transition-colors disabled:opacity-40"
          >
            {creating ? 'Adding...' : `+ Create Label "${searchTrimmed}"`}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-danger-400">{error}</p> : null}

      {!normalizedSearch ? (
        <p className="text-xs text-text-500 text-center">
          {labels.length > 0
            ? 'Type a label name to search or create a new label.'
            : 'No labels yet. Type a name to create one.'}
        </p>
      ) : null}

      {onCancel ? (
        <button
          type="button"
          onClick={handleCancel}
          className="w-full h-9 rounded-xl border border-surface-700 text-sm text-text-400"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}

interface LabelFieldPickerProps {
  instanceId: string;
  label: string;
  value: string;
  onChange: (labelId: string) => void;
  labels: LabelOption[];
  organizationId: string | null;
  orgName?: string;
  onLabelCreated?: (label: LabelOption) => void;
  error?: string;
}

export function LabelFieldPicker({
  instanceId,
  label,
  value,
  onChange,
  labels,
  organizationId,
  orgName,
  onLabelCreated,
  error,
}: LabelFieldPickerProps) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [panelInstance, setPanelInstance] = useState(0);
  const mountedInstanceId = useRef(instanceId);

  const resetPickerShell = useCallback(() => {
    setShowAddPanel(false);
    setPanelInstance(0);
  }, []);

  useEffect(() => {
    if (mountedInstanceId.current !== instanceId) {
      mountedInstanceId.current = instanceId;
      resetPickerShell();
    }
  }, [instanceId, resetPickerShell]);

  function openAddPanel() {
    setPanelInstance((n) => n + 1);
    setShowAddPanel(true);
  }

  const panelKey = `${instanceId}-${panelInstance}`;
  const selectedName = value === '__org__'
    ? (orgName ?? 'Current Organization')
    : labels.find((l) => l.id === value)?.name;

  return (
    <div className="space-y-2" data-label-picker={instanceId}>
      <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">{label}</p>
      {!showAddPanel ? (
        <div className="space-y-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none"
          >
            <option value="">Select label...</option>
            {orgName ? (
              <option value="__org__">✓ {orgName}</option>
            ) : null}
            {labels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={openAddPanel}
            className="block w-full h-10 rounded-xl border border-dashed border-surface-700 bg-surface-950 px-4 text-sm text-text-400 hover:text-surface-200 hover:border-surface-600 text-left transition-colors"
          >
            + Add Label
          </button>
        </div>
      ) : (
        <LabelAddPanel
          key={panelKey}
          instanceId={panelKey}
          labels={labels}
          organizationId={organizationId}
          onLabelCreated={onLabelCreated}
          onSelect={(id) => {
            onChange(id);
            setShowAddPanel(false);
          }}
          onCancel={() => setShowAddPanel(false)}
        />
      )}
      {error ? <p className="text-xs text-danger-400">{error}</p> : null}
    </div>
  );
}
