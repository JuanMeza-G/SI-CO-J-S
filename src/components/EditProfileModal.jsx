import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "../supabaseClient";
import Modal from "./Modal";
import { FaCamera, FaUser, FaLock, FaChevronDown, FaChevronUp } from "react-icons/fa";
import Loader from "./Loader";

const EditProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [user, setUser] = useState(null);

  const { register, handleSubmit, setValue, reset, watch } = useForm();
  const newPassword = watch("newPassword");

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    try {
      setFetchingData(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // Fetch specific profile from DB
      const { data: profile, error } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const metaName = user.user_metadata?.full_name;
      const metaAvatar = user.user_metadata?.avatar_url;

      if (profile) {
        setValue("full_name", profile.full_name || metaName || "");
        setAvatarPreview(profile.avatar_url || metaAvatar);
      } else {
        // Fallback to metadata if no profile found
        setValue("full_name", metaName || user.email.split("@")[0]);
        if (metaAvatar) setAvatarPreview(metaAvatar);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setFetchingData(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      let avatarUrl = avatarPreview;

      const fileInput = document.getElementById("avatar-upload");
      if (fileInput?.files?.length > 0) {
        avatarUrl = await uploadAvatar(fileInput.files[0]);
      }

      const { error } = await supabase
        .from("users")
        .update({
          full_name: data.full_name,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update password if provided
      if (data.newPassword) {
        if (data.newPassword.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres");
          return;
        }
        if (data.newPassword !== data.confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.newPassword
        });

        if (passwordError) throw passwordError;
      }

      if (error) throw error;

      toast.success("Perfil actualizado correctamente");
      if (onProfileUpdate) onProfileUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil">
      {fetchingData ? (
        <div className="flex justify-center items-center py-12">
          <Loader />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 dark:border-zinc-800">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                    <FaUser className="text-3xl" />
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg"
              >
                <FaCamera className="text-xs" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre Completo
            </label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              {...register("full_name")}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-full cursor-pointer flex items-center justify-between text-left p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                <FaLock className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                Cambiar Contraseña
              </div>
              {showPassword ? (
                <FaChevronUp className="text-xs text-gray-400" />
              ) : (
                <FaChevronDown className="text-xs text-gray-400" />
              )}
            </button>

            {showPassword && (
              <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...register("newPassword")}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Repite la contraseña"
                    {...register("confirmPassword")}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                <span>Guardando...</span>
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </form>
      )}
    </Modal >
  );
};

export default EditProfileModal;
