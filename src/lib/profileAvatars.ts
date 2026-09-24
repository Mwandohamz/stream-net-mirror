import avatar1 from "@/assets/avatars/avatar-1.png.asset.json";
import avatar2 from "@/assets/avatars/avatar-2.png.asset.json";
import avatar3 from "@/assets/avatars/avatar-3.png.asset.json";
import avatar4 from "@/assets/avatars/avatar-4.png.asset.json";
import avatar5 from "@/assets/avatars/avatar-5.png.asset.json";

export const PROFILE_AVATARS = [
  { id: "streamer", label: "Streamer", url: avatar1.url },
  { id: "supporter", label: "Supporter", url: avatar2.url },
  { id: "viewer", label: "Viewer", url: avatar3.url },
  { id: "premiere", label: "Premiere", url: avatar4.url },
  { id: "gamer", label: "Gamer", url: avatar5.url },
] as const;

export const DEFAULT_PROFILE_AVATAR = PROFILE_AVATARS[0].url;