import { supabase } from "./supabase";

export async function checkUserRole(email: string | undefined) {
  console.log(`[Helper] 🔍 Consultando rol único para: ${email}`);
  
  if (!email) {
    return { isAdmin: false, isStudent: false, perfil: null };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Una sola consulta para traer todo
  const { data: usuario, error } = await supabase
    .from("estudiantes")
    .select("email, rol, activo, curso")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (error) {
    console.error(`[Helper] ❌ Error en consulta:`, error.message);
    return { isAdmin: false, isStudent: false, perfil: null };
  }

  console.log(`[Helper] 📊 Registro encontrado en BD:`, usuario);

  // Si no existe el registro en la tabla, es un usuario completamente nuevo
  if (!usuario) {
    return { isAdmin: false, isStudent: false, perfil: null };
  }

  // Si existe, evaluamos sus propiedades
  const isAdmin = usuario.rol === "admin";
  const isStudent = usuario.rol === "estudiante" && usuario.activo !== false;

  return { 
    isAdmin, 
    isStudent,
    perfil: usuario // Devolvemos el perfil completo para ahorrar futuras consultas
  };
}