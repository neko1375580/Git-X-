import React, { createContext, useContext, useState, useEffect } from 'react';
import { encryptText, decryptText } from '../lib/crypto';

interface DecryptedKeys {
  openaiKey?: string;
  geminiKey?: string;
  githubToken?: string;
  vercelToken?: string;
  supabaseKey?: string;
}

interface VaultContextProps {
  isUnlocked: boolean;
  isConfigured: boolean;
  decryptedKeys: DecryptedKeys;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  configureVault: (password: string) => Promise<void>;
  updateKeys: (newKeys: DecryptedKeys) => Promise<void>;
}

const VaultContext = createContext<VaultContextProps | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [decryptedKeys, setDecryptedKeys] = useState<DecryptedKeys>({});

  useEffect(() => {
    // Проверяем, настроено ли шифрование локально
    const salt = localStorage.getItem('gitx_vault_salt');
    const iv = localStorage.getItem('gitx_vault_iv');
    const encryptedPayload = localStorage.getItem('gitx_vault_payload');
    
    setIsConfigured(!!(salt && iv && encryptedPayload));
  }, []);

  const configureVault = async (password: string) => {
    try {
      const keys: DecryptedKeys = {};
      const keysJson = JSON.stringify(keys);
      const { ciphertext, salt, iv } = await encryptText(keysJson, password);

      localStorage.setItem('gitx_vault_salt', salt);
      localStorage.setItem('gitx_vault_iv', iv);
      localStorage.setItem('gitx_vault_payload', ciphertext);

      setMasterPassword(password);
      setDecryptedKeys(keys);
      setIsUnlocked(true);
      setIsConfigured(true);
    } catch (err) {
      console.error('Ошибка создания сейфа:', err);
      throw err;
    }
  };

  const unlock = async (password: string): Promise<boolean> => {
    try {
      const salt = localStorage.getItem('gitx_vault_salt');
      const iv = localStorage.getItem('gitx_vault_iv');
      const encryptedPayload = localStorage.getItem('gitx_vault_payload');

      if (!salt || !iv || !encryptedPayload) {
        throw new Error('Сейф не сконфигурирован');
      }

      const decryptedJson = await decryptText(encryptedPayload, password, salt, iv);
      const keys = JSON.parse(decryptedJson) as DecryptedKeys;

      setMasterPassword(password);
      setDecryptedKeys(keys);
      setIsUnlocked(true);
      return true;
    } catch (err) {
      console.error('Ошибка разблокировки сейфа:', err);
      return false;
    }
  };

  const lock = () => {
    setMasterPassword(null);
    setDecryptedKeys({});
    setIsUnlocked(false);
  };

  const updateKeys = async (newKeys: DecryptedKeys) => {
    if (!masterPassword) {
      throw new Error('Сейф заблокирован. Сначала введите мастер-пароль.');
    }

    try {
      const salt = localStorage.getItem('gitx_vault_salt') || undefined;
      // Объединяем текущие ключи с новыми
      const updated = { ...decryptedKeys, ...newKeys };
      const updatedJson = JSON.stringify(updated);
      
      const { ciphertext, salt: s, iv } = await encryptText(updatedJson, masterPassword, salt);

      localStorage.setItem('gitx_vault_salt', s);
      localStorage.setItem('gitx_vault_iv', iv);
      localStorage.setItem('gitx_vault_payload', ciphertext);

      setDecryptedKeys(updated);
      setIsConfigured(true);
    } catch (err) {
      console.error('Ошибка сохранения ключей в сейф:', err);
      throw err;
    }
  };

  return (
    <VaultContext.Provider value={{
      isUnlocked,
      isConfigured,
      decryptedKeys,
      unlock,
      lock,
      configureVault,
      updateKeys
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault должен использоваться внутри VaultProvider');
  return context;
};
