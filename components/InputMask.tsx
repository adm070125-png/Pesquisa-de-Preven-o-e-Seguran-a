
import React from 'react';

interface InputMaskProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<InputMaskProps> = ({ label, value, onChange, placeholder, required }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    
    if (v.length > 11) v = v.substring(0, 11);

    // Aplica a máscara dinamicamente baseada no comprimento
    if (v.length === 11) {
      // Padrão Celular: (XX) XXXXX-XXXX
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (v.length === 10) {
      // Padrão Fixo: (XX) XXXX-XXXX
      v = v.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    } else if (v.length > 6) {
      // Digitando... (XX) XXXX-XXXX
      v = v.replace(/^(\d{2})(\d{4})(\d{0,5})$/, "($1) $2-$3");
    } else if (v.length > 2) {
      // Digitando... (XX) XXXX
      v = v.replace(/^(\d{2})(\d{0,4})$/, "($1) $2");
    } else if (v.length > 0) {
      // Digitando... (XX
      v = v.replace(/^(\d{0,2})$/, "($1");
    }
    
    onChange(v);
  };

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "(00) 00000-0000"}
        className="px-4 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-600 transition-all text-slate-900 bg-slate-50 font-bold shadow-sm"
      />
    </div>
  );
};
