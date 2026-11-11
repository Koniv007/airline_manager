import { LocalAuthService, type AuthService } from "./authService.ts";
import { appStorage } from "../persistence/storage.ts";

/** The one auth service the app uses. Swap this line for Supabase when the game goes online. */
export const auth: AuthService = new LocalAuthService(appStorage);
