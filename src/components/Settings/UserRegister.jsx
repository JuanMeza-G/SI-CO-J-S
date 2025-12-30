import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FcAddDatabase } from "react-icons/fc";
import { supabase } from "../../supabaseClient";
import { createClient } from "@supabase/supabase-js";

const registerSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
  role: z.enum(["secretaria", "optometra", "administrador"], {
    errorMap: () => ({ message: "Selecciona un rol válido" }),
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

  const onSubmit = async (data) => {
    try {
      const { email, password, role } = data;

      // Create a temporary client to avoid overwriting the current session
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data: authData, error } = await tempSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
        },
      });

      if (error) throw error;

      if (authData.user) {
        const { error: dbError } = await supabase
          .from("users")
          .insert([
            {
              id: authData.user.id,
              email: email,
              role: role,
            },
          ]);

        if (dbError) throw dbError;
      }

      console.log("Registered user:", authData);
      toast.success("Usuario registrado exitosamente");
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || "Error al registrar usuario");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Correo electrónico
        </label>
        <input
          type="email"
          placeholder="Ej: usuario@correo.com"
          {...register("email")}
          autoComplete="email"
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
            ${errors.email
              ? "border-red-500 focus:ring-red-500 bg-red-50"
              : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            }
          `}
        />
        {errors.email && (
          <span className="text-xs text-red-500">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Contraseña
        </label>
        <input
          type="password"
          placeholder="••••••••"
          {...register("password")}
          autoComplete="new-password"
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
            ${errors.password
              ? "border-red-500 focus:ring-red-500 bg-red-50"
              : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            }
          `}
        />
        {errors.password && (
          <span className="text-xs text-red-500">{errors.password.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Rol
        </label>
        <select
          {...register("role")}
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none
            ${errors.role
              ? "border-red-500 focus:ring-red-500 bg-red-50"
              : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
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