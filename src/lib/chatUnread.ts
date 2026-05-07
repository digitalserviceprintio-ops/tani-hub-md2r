const KEY = "chat-unread-map";
const EVENT = "chat-unread-update";

export const ME_KEY = "chat-me-petani";

export function getUnreadMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getTotalUnread(): number {
  return Object.values(getUnreadMap()).reduce((a, b) => a + b, 0);
}

export function bumpUnread(senderId: string) {
  const map = getUnreadMap();
  map[senderId] = (map[senderId] ?? 0) + 1;
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function clearUnread(senderId: string) {
  const map = getUnreadMap();
  if (map[senderId]) {
    delete map[senderId];
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function clearAllUnread() {
  localStorage.setItem(KEY, "{}");
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function onUnreadChange(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export const UNREAD_EVENT = EVENT;
