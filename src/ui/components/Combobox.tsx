import * as Select from '@radix-ui/react-select';
import { ChevronIcon } from './Icons';

export interface ComboOption {
  value: string;
  label: string;
  /** Número ou prefixo mostrado antes do rótulo, só na lista. */
  prefix?: string;
}

interface ComboboxProps {
  /** Rótulo pequeno acima do valor (ex.: "Escala"). */
  label: string;
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  /** Texto curto mostrado no gatilho, quando diferente do rótulo da opção. */
  display?: string;
}

/** Lista suspensa acessível (teclado, foco e leitor de tela tratados pelo Radix). */
export function Combobox({ label, value, options, onChange, display }: ComboboxProps) {
  const current = options.find((o) => o.value === value);
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="cb" aria-label={label}>
        <span className="cb__text">
          <span className="cb__label">{label}</span>
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
                <Select.ItemText>{o.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
