import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export default function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="action-menu" ref={ref}>
      <button
        className="action-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open actions menu"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="action-menu-list" role="menu">
          {items.map((item, i) => (
            <button
              key={i}
              className={`action-menu-item ${item.danger ? "danger" : ""} ${item.disabled ? "disabled" : ""}`}
              disabled={!!item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onClick && item.onClick();
              }}
              role="menuitem"
            >
              {item.icon && <item.icon size={14} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
