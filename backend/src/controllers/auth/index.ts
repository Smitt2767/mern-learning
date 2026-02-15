import { login } from "./login.js";
import { logout } from "./logout.js";
import { oauthCallback } from "./oauthCallback.js";
import { oauthRedirect } from "./oauthRedirect.js";
import { signUp } from "./signup.js";

export class AuthController {
  static signUp = signUp;
  static login = login;
  static logout = logout;
  static oauthRedirect = oauthRedirect;
  static oauthCallback = oauthCallback;
}
