import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <label className="search-input">
      <Search size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}
