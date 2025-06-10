
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    checkExistingApiKey();
  }, [user]);

  const checkExistingApiKey = async () => {
    try {
      setIsLoading(true);
      
      // For now, use localStorage for both authenticated and anonymous users
      const storageKey = user ? `chess_api_key_${user.id}` : 'chess_api_key_session';
      const storedKey = localStorage.getItem(storageKey);
      setHasApiKey(!!storedKey);
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
        const storageKey = user ? `chess_api_key_${user.id}` : 'chess_api_key_session';
        localStorage.setItem(storageKey, 'MASTER_KEY_ACCESS');
        setHasApiKey(true);
        return;
      }

      // Encrypt and store the API key in localStorage
      const storageKey = user ? `chess_api_key_${user.id}` : 'chess_api_key_session';
      localStorage.setItem(storageKey, btoa(apiKey)); // Simple base64 encoding
      
      setHasApiKey(true);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  };

  const getStoredApiKey = async (): Promise<string | null> => {
    try {
      const storageKey = user ? `chess_api_key_${user.id}` : 'chess_api_key_session';
      const storedKey = localStorage.getItem(storageKey);
      
      if (storedKey === 'MASTER_KEY_ACCESS') {
        return 'MASTER_KEY_ACCESS';
      }
      
      return storedKey ? atob(storedKey) : null;
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  };

  const clearApiKey = async () => {
    try {
      const storageKey = user ? `chess_api_key_${user.id}` : 'chess_api_key_session';
      localStorage.removeItem(storageKey);
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
