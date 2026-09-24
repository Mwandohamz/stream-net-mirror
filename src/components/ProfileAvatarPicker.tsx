import { Check } from "lucide-react";
import { PROFILE_AVATARS } from "@/lib/profileAvatars";

interface ProfileAvatarPickerProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const ProfileAvatarPicker = ({ value, onChange, disabled = false }: ProfileAvatarPickerProps) => (
  <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Choose a profile avatar">
    {PROFILE_AVATARS.map((avatar) => {
      const selected = value === avatar.url;
      return (
        <button
          key={avatar.id}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={avatar.label}
          disabled={disabled}
          onClick={() => onChange(avatar.url)}
          className={`relative aspect-square overflow-hidden rounded-full border-2 transition-transform active:scale-95 ${
            selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/60"
          }`}
        >
          <img src={avatar.url} alt="" width={816} height={816} loading="lazy" className="h-full w-full object-cover" />
          {selected && (
            <span className="absolute bottom-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default ProfileAvatarPicker;