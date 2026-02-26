import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    GitHub,
    Google,
    Resend({
      from: "HopSession 🍻 <auth@hopsession.azene.co>"
    })
  ],
});