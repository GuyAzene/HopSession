import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google,
    Resend({
      from: "HopSession 🍻 <auth@hopsession.azene.co>"
    })
  ],
});