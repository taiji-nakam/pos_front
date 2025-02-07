import { createContext, useContext, useState, ReactNode } from "react";

// Tax データの型定義
export type Tax = {
  id: number;
  code: string;
  name: string;
  percent: number;
};

// Context の型定義
type TaxContextType = {
  tax: Tax | null;
  setTax: (tax: Tax) => void;
};

// Context を作成
const TaxContext = createContext<TaxContextType | undefined>(undefined);

// Provider コンポーネント
export const TaxProvider = ({ children }: { children: ReactNode }) => {
  const [tax, setTax] = useState<Tax | null>(null);

  return (
    <TaxContext.Provider value={{ tax, setTax }}>
      {children}
    </TaxContext.Provider>
  );
};

// Context を簡単に利用できるようにする Hook
export const useTax = () => {
  const context = useContext(TaxContext);
  if (!context) {
    throw new Error("useTax must be used within a TaxProvider");
  }
  return context;
};
