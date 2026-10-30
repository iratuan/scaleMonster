import type { ReactNode } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronIcon } from './Icons';

export interface ComboOption {
  value: string;
  label: string;
  /** Número ou prefixo mostrado antes do rótulo, só na lista. */
  prefix?: string;
  /** Ícone de traço mostrado antes do rótulo (lista e gatilho). */
  icon?: ReactNode;
}

interface ComboboxProps {
  /** Rótulo pequeno acima do valor (ex.: "Escala"). Omitido quando a linha já tem rótulo ao lado. */
  label?: string;
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  /** Texto curto mostrado no gatilho, quando diferente do rótulo da opção. */
  display?: string;
  /** field: bloco de formulário (filtros do topo). inline: select compacto para linhas e cabeçalho. */
  variant?: 'field' | 'inline';
}

/** Lista suspensa acessível (teclado, foco e leitor de tela tratados pelo Radix). */
export function Combobox({ label, value, options, onChange, display, variant = 'field' }: ComboboxProps) {
  const current = options.find((o) => o.value === value);
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className={variant === 'inline' ? 'cb cb--inline' : 'cb'} aria-label={label ?? current?.label}>
        {current?.icon && !display && <span className="cb__glyph">{current.icon}</span>}
        <span className="cb__text">
          {label && <span className="cb__label">{label}</span>}
          <span className="cb__value">{display ?? current?.label ?? value}</span>
        </span>
        <Select.Icon className="cb__icon">
          <ChevronIcon width={14} height={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="cb__menu" position="popper" sideOffset={6} collisionPadding={12}>
          <Select.Viewport className="cb__list">
            {options.map((o) => (
              <Select.Item key={o.value} value={o.value} className="cb__item">
                {o.prefix && <span className="cb__prefix">{o.prefix}</span>}
                {o.icon && <span className="cb__glyph">{o.icon}</span>}
                <Select.ItemText>{o.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
