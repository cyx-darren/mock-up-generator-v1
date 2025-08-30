'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export function EdgeFunctionTest() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testFunction = async () => {
    try {
      setLoading(true);
      setResponse('');
      
      const { data, error } = await supabase.functions.invoke('hello-world', {
        method: 'GET',
      });

      if (error) {
        setResponse(`Error: ${error.message}`);
      } else {
        setResponse(`Success: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResponse(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Edge Function Test</h3>
      <Button onClick={testFunction} disabled={loading}>
        {loading ? 'Testing...' : 'Test Hello World Function'}
      </Button>
      {response && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Response:</h4>
          <pre className="bg-white p-3 rounded border text-sm overflow-x-auto">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}