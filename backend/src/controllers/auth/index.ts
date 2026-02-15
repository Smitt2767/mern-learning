import { changePassword } from "./changePassword.js";
import { forgotPassword } from "./forgotPassword.js";
import { login } from "./login.js";
import { logout } from "./logout.js";
import { oauthCallback } from "./oauthCallback.js";
import { oauthRedirect } from "./oauthRedirect.js";
import { resetPassword } from "./resetPassword.js";
import { signUp } from "./signup.js";

export class AuthController {
  static signUp = signUp;
  static login = login;
  static logout = logout;
  static oauthRedirect = oauthRedirect;
  static oauthCallback = oauthCallback;
  static forgotPassword = forgotPassword;
  static resetPassword = resetPassword;
  static changePassword = changePassword;
}
