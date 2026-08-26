/**
 * Google Identity Services loader.
 *
 * The browser receives an ID token from Google and posts it to our backend,
 * which verifies the signature against Google's public keys. No client secret
 * lives in the frontend — there is nothing here worth stealing.
 */

const GSI_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise = null;

export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

export function isGoogleConfigured() {
  return Boolean(GOOGLE_CLIENT_ID);
}

/** Loads the GSI script once, no matter how many components ask for it. */
export function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Google script failed to load")));
      return;
    }
    const el = document.createElement("script");
    el.src = GSI_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve(window.google);
    el.onerror = () => {
      scriptPromise = null; // allow a retry
      reject(new Error("Google script failed to load"));
    };
    document.head.appendChild(el);
  });

  return scriptPromise;
}

/**
 * Renders Google's official sign-in button into `container`.
 * `onCredential` receives the ID token string to send to the backend.
 */
export async function renderGoogleButton(container, onCredential, { width = 360 } = {}) {
  if (!isGoogleConfigured()) {
    throw new Error("REACT_APP_GOOGLE_CLIENT_ID is not set");
  }
  const google = await loadGoogleScript();

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      if (response?.credential) onCredential(response.credential);
    },
    cancel_on_tap_outside: true,
    auto_select: false,
  });

  google.accounts.id.renderButton(container, {
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "continue_with",
    logo_alignment: "center",
    width,
  });
}

/** Clears Google's "auto sign back in" state so logout actually sticks. */
export function disableGoogleAutoSelect() {
  try {
    window.google?.accounts?.id?.disableAutoSelect();
  } catch {
    /* GSI not loaded; nothing to clear */
  }
}
