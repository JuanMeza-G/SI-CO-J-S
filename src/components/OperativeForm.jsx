import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { toast } from "sonner";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom"
const operativeSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
});
const OperativeForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(operativeSchema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate()
  const onSubmit = async (data) => {
    try {
      const { email, password } = data;
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
          return;
        }
        if (userProfile?.role !== "secretaria" && userProfile?.role !== "optometra") {
          await supabase.auth.signOut();
          throw new Error("Acceso denegado. Este formulario es solo para personal operativo.");
        }
      }
      toast.success("Sesión iniciada correctamente");
      navigate("/home");
    } catch (error) {
      console.error(error);
      let message = error.message;
      if (message === "Invalid login credentials") {
        message = "Correo o contraseña incorrectos";
      } else if (message.includes("JSON object requested, but no rows returned") ||
        message.includes("The request yielded no results")) {
        message = "Correo o contraseña incorrectos";
      }
      toast.error(message || "Error al iniciar sesión");
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
                : "border-gray-300 focus:ring-green-500 dark:focus:ring-green-500"
              }`}
          />
          {errors.email && (
            <span className="text-red-500 dark:text-red-400 text-sm">
              {errors.email.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              {...register("password")}
              autoComplete="current-password"
              className={`px-4 py-2 w-90 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] dark:border-[#262626] pr-10
                ${errors.password
                  ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                  : "border-gray-300 focus:ring-green-500 dark:focus:ring-green-500"
                }`}
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
            <span className="text-red-500 dark:text-red-400 text-sm">
              {errors.password.message}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition text-white py-2 rounded-lg font-medium disabled:opacity-50 cursor-pointer"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
};
export default OperativeForm;
