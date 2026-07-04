import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NumberFieldProps = {
  id: string;
  label: string;
  value: number | string;
  placeholder?: string;
  onChange: (value: string) => void;
  step?: string;
};

export function NumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
  step = "0.01",
}: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        placeholder={placeholder}
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 sm:h-9"
      />
    </div>
  );
}
