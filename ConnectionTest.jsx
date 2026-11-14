
import { useEffect, useState } from 'react';
import { supabase } from './src/supabase.js';

export default function ConnectionTest() {
  const [result, setResult] = useState('جاري الاتصال...');

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .limit(1);

      if (error) {
        setResult('فشل الاتصال: ' + error.message);
      } else {
        setResult('الاتصال ناجح مع Supabase!');
      }
    }

    testConnection();
  }, []);

  return (
    <div style={{ padding: 30, color: 'white' }}>
      <h2>BOTOLA FAR</h2>
      <p>{result}</p>
    </div>
  );
}
