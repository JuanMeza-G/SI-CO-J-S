import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const adminSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
});

const AdminForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adminSchema),
  });

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("role, is_active")
          .eq("id", authData.user.id)
          .single();

        if (profileError) throw profileError;

        if (userProfile?.is_active === false) {
          await supabase.auth.signOut();
          // No lanzar error aquí, dejar que AuthContext maneje el toast
          // Solo retornar para evitar mostrar el toast de éxito
          return;
        }
        // Si is_active es null o undefined, tratarlo como activo (por defecto)

        if (userProfile?.role !== "administrador") {
          await supabase.auth.signOut();
          throw new Error("Acceso denegado. No tienes permisos de administrador.");
        }
      }

      toast.success("Login exitoso");
      navigate("/home");
    } catch (error) {
      toast.error(error.message || "Error al iniciar sesión");
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${window.location.origin}/home?admin_login=true`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast.error(error.message || "Error con Google Login");
      console.error(error);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <input
            type="email"
            placeholder="Correo electrónico"
            {...register("email")}
            autoComplete="email"
            className={`px-4 py-2 w-90 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] dark:border-[#262626]
              ${errors.email
                ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                : "border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-500"
              }
            `}
          />
          {errors.email && (
            <span className="text-xs text-red-500 dark:text-red-400">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <input
            type="password"
            placeholder="Contraseña"
            {...register("password")}
            autoComplete="current-password"
            className={`px-4 py-2 w-90 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] dark:border-[#262626]
              ${errors.password
                ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                : "border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-500"
              }
            `}
          />
          {errors.password && (
            <span className="text-xs text-red-500 dark:text-red-400">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isGoogleLoading}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition text-white py-2 rounded-lg font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="flex items-center gap-2 my-6">
        <span className="flex-1 h-px bg-gray-200 dark:bg-[#262626]" />
        <span className="text-sm text-gray-400 dark:text-[#a3a3a3]">o</span>
        <span className="flex-1 h-px bg-gray-200 dark:bg-[#262626]" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isSubmitting}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] cursor-pointer py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1f1f1f] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-[#111111]"
      >
        <FcGoogle size={22} />
        <span className="text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
          {isGoogleLoading ? "Redirigiendo..." : "Google"}
        </span>
      </button>
    </div>
  );
};

export default AdminForm;
