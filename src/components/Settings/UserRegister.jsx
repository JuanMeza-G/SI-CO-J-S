import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { toast } from "sonner";
import { FcAddDatabase } from "react-icons/fc";
import { supabase } from "../../supabaseClient";
import { createClient } from "@supabase/supabase-js";

const registerSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
  role: z.string().refine((val) => ["secretaria", "optometra", "administrador"].includes(val), {
    message: "Selecciona un rol de la lista",
  }),
});

const UserRegister = ({ onSuccess }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      const { email, password, role } = data;

      const { data: userInDb, error: dbError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (dbError) throw dbError;
      if (userInDb) {
        toast.error("Este usuario ya tiene un perfil activo en la base de datos.");
        return;
      }

      let userId = null;
      const { data: existingAuthId, error: rpcError } = await supabase.rpc(
        "get_user_id_by_email",
        { email_search: email }
      );

      if (existingAuthId) {
        userId = existingAuthId;
      } else {
        const tempSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          }
        );

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email,
          password,
          options: { data: { role } },
        });

        if (authError) throw authError;
        userId = authData.user?.id;
      }

      if (userId) {
        const { error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: userId,
              email: email,
              role: role,
              is_active: true,
            },
          ]);

        if (insertError) throw insertError;

        toast.success("Usuario registrado y vinculado exitosamente");
        reset();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.message || "Error al procesar el registro");
      console.error("Registration error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
          Correo electrónico
        </label>
        <input
          type="email"
          placeholder="Ej: usuario@correo.com"
          {...register("email")}
          autoComplete="email"
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
            ${errors.email
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
            }
          `}
        />
        {errors.email && (
          <span className="text-xs text-red-500">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            autoComplete="new-password"
            className={`px-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 transition-all pr-10
              ${errors.password
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
              }
            `}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] cursor-pointer transition-colors"
            tabIndex="-1"
          >
            {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs text-red-500">{errors.password.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
          Rol
        </label>
        <select
          {...register("role")}
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none
            ${errors.role
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 dark:border-[#262626] bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] focus:ring-blue-500 focus:border-blue-500"
            }
          `}
        >
          <option value="">Seleccionar rol...</option>
          <option value="secretaria">Secretaria</option>
          <option value="optometra">Optómetra</option>
          <option value="administrador">Administrador</option>
        </select>
        {errors.role && (
          <span className="text-xs text-red-500">{errors.role.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Registrando...
          </>
        ) : (
          "Registrar Usuario"
        )}
      </button>
    </form>
  );
};

export default UserRegister;