import { authStore } from "../lib/authStore";
import { supabase }
from "../lib/supabase";
const logout = document.getElementById("logout");

logout?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
});