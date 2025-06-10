
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ApiKeyManager {
  hasApiKey: boolean;
  isLoading: boolean;
  saveApiKey: (apiKey: string) => Promise<void>;
  getStoredApiKey: () => Promise<string | null>;
  clearApiKey: () => Promise<void>;
}

const MASTER_KEY = "it'smemarwanyourcreatorandmasterapprovemyentrance";

export const useApiKeyManager = (): ApiKeyManager => {
  const { user } = useAuth();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    checkExistingApiKey();
  }, [user]);

  const checkExistingApiKey = async () => {
    try {
      setIsLoading(true);
      
      if (user) {
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        setHasApiKey(!!data);
      } else {
        // For anonymous users, check session storage
        const storedKey = localStorage.getItem('chess_api_key_session');
        setHasApiKey(!!storedKey);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasApiKey(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async (apiKey: string) => {
    try {
      // Check if this is the master key
      if (apiKey === MASTER_KEY) {
        // Use the default Supabase OpenAI key
        if (user) {
          // For authenticated users, store a special marker
          const { error } = await supabase
            .from('user_api_keys')
            .upsert({
              user_id: user.id,
              api_key_encrypted: 'MASTER_KEY_ACCESS',
              session_id: sessionId
            });
          
          if (error) throw error;
        } else {
          // For anonymous users, store in localStorage
          localStorage.setItem('chess_api_key_session', 'MASTER_KEY_ACCESS');
        }
        
        setHasApiKey(true);
        return;
      }

      // Encrypt and store the API key
      if (user) {
        const { error } = await supabase
          .from('user_api_keys')
          .upsert({
            user_id: user.id,
            api_key_encrypted: btoa(apiKey), // Simple base64 encoding
            session_id: sessionId
          });
        
        if (error) throw error;
      } else {
        // For anonymous users, store in localStorage (encrypted)
        localStorage.setItem('chess_api_key_session', btoa(apiKey));
      }
      
      setHasApiKey(true);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  };

  const getStoredApiKey = async (): Promise<string | null> => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('api_key_encrypted')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data?.api_key_encrypted === 'MASTER_KEY_ACCESS') {
          return 'MASTER_KEY_ACCESS';
        }
        
        return data ? atob(data.api_key_encrypted) : null;
      } else {
        const storedKey = localStorage.getItem('chess_api_key_session');
        if (storedKey === 'MASTER_KEY_ACCESS') {
          return 'MASTER_KEY_ACCESS';
        }
        return storedKey ? atob(storedKey) : null;
      }
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  };

  const clearApiKey = async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from('user_api_keys')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        localStorage.removeItem('chess_api_key_session');
      }
      
      setHasApiKey(false);
    } catch (error) {
      console.error('Error clearing API key:', error);
      throw error;
    }
  };

  return {
    hasApiKey,
    isLoading,
    saveApiKey,
    getStoredApiKey,
    clearApiKey
  };
};
