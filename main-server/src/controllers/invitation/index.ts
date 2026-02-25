import { acceptInvitation } from "./accept.js";
import { cancelInvitation } from "./cancel.js";
import { getInvitationByToken } from "./getByToken.js";
import { invite } from "./invite.js";
import { listInvitations } from "./list.js";
import { rejectInvitation } from "./reject.js";

export class InvitationController {
  static invite = invite;
  static list = listInvitations;
  static cancel = cancelInvitation;
  static getByToken = getInvitationByToken;
  static accept = acceptInvitation;
  static reject = rejectInvitation;
}
