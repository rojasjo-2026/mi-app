type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputClass: string;
  required?: boolean;
  full?: boolean;
  placeholder?: string;
  type?: string;
};

export default function FormInput({
  label,
  value,
  onChange,
  inputClass,
  required = false,
  full = false,
  placeholder,
  type = "text",
}: FormInputProps) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
