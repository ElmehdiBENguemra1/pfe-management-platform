import { STUDENT_LEVELS } from "../../constants/levels";

export default function LevelSelect({ value, onChange, name = "level", required = false, className = "form-input" }) {
  const groups = [...new Set(STUDENT_LEVELS.map(l => l.group))];
  
  return (
    <select 
      name={name} 
      value={value} 
      onChange={onChange} 
      required={required}
      className={className}
    >
      <option value="">-- Sélectionner le niveau --</option>
      {groups.map(group => (
        <optgroup key={group} label={group}>
          {STUDENT_LEVELS.filter(l => l.group === group).map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
