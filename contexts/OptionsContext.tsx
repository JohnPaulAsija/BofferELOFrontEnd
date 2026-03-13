import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getOptionsFromAPI, OptionsResponse } from '@/lib/apiInteractions';

type OptionsContextType = {
  options: OptionsResponse | null;
  loading: boolean;
  getRuleSetName: (id: string | null) => string;
};

const OptionsContext = createContext<OptionsContextType>({
  options: null,
  loading: true,
  getRuleSetName: () => 'Unknown',
});

export function OptionsProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getOptionsFromAPI()
      .then((data) => { if (!cancelled) setOptions(data); })
      .catch((err) => { if (__DEV__) console.error('[OptionsProvider] Failed to load options:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const getRuleSetName = useCallback((id: string | null): string => {
    if (!id || !options) return 'Unknown';
    const found = options.rule_sets.find((rs) => rs.id === id);
    return found?.name ?? 'Unknown';
  }, [options]);

  return (
    <OptionsContext.Provider value={{ options, loading, getRuleSetName }}>
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  return useContext(OptionsContext);
}
