import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "../supabaseClient";
import Modal from "./Modal";
import { FaCamera, FaUser, FaLock, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import Loader from "./Loader";
const EditProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [user, setUser] = useState(null);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState(null);
  const [initialFullName, setInitialFullName] = useState(null);
  const [avatarFileChanged, setAvatarFileChanged] = useState(false);
  const { register, handleSubmit, setValue, reset, watch } = useForm();
  const newPassword = watch("newPassword");
  const fullName = watch("full_name");
  useEffect(() => {
    if (isOpen) {
      loadUserData();
    } else {
      setValue("newPassword", "");
      setValue("confirmPassword", "");
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setAvatarFileChanged(false);
      const fileInput = document.getElementById("avatar-upload");
      if (fileInput) {
        fileInput.value = "";
      }
    }
  }, [isOpen, setValue]);
  const loadUserData = async () => {
    try {
      setFetchingData(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const { data: profile, error } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      const metaName = user.user_metadata?.full_name;
      const metaAvatar = user.user_metadata?.avatar_url;
      let finalName = "";
      let finalAvatar = null;
      if (profile) {
        finalName = profile.full_name || metaName || "";
        finalAvatar = profile.avatar_url || metaAvatar;
      } else {
        finalName = metaName || user.email.split("@")[0];
        finalAvatar = metaAvatar || null;
      }
      setValue("full_name", finalName);
      setAvatarPreview(finalAvatar);
      setInitialFullName(finalName);
      setInitialAvatarUrl(finalAvatar);
      setAvatarFileChanged(false);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setFetchingData(false);
    }
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFileChanged(true);
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
      setInitialFullName(data.full_name);
      setInitialAvatarUrl(avatarUrl);
      setAvatarFileChanged(false);
      setValue("newPassword", "");
      setValue("confirmPassword", "");
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      if (onProfileUpdate) onProfileUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };
  const hasChanges = () => {
    const nameChanged = fullName !== initialFullName;
    const avatarChanged = avatarFileChanged;
    const passwordChanged = newPassword && newPassword.length > 0;
    return nameChanged || avatarChanged || passwordChanged;
  };
  const isFormDirty = hasChanges();
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
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 dark:border-[#262626]">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-gray-400 dark:text-[#a3a3a3]">
                    <FaUser className="text-3xl" />
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition"
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
            <label className="text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
              Nombre Completo
            </label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              {...register("full_name")}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5]"
            />
          </div>
          <div className="border-t border-gray-100 dark:border-[#262626] pt-4">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-full cursor-pointer flex items-center justify-between text-left p-2 hover:bg-gray-50 dark:hover:bg-[#1f1f1f] rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-[#f5f5f5]">
                <FaLock className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                Cambiar Contraseña
              </div>
              {showPassword ? (
                <FaChevronUp className="text-xs text-gray-400 dark:text-[#a3a3a3]" />
              ) : (
                <FaChevronDown className="text-xs text-gray-400 dark:text-[#a3a3a3]" />
              )}
            </button>
            {showPassword && (
              <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      {...register("newPassword")}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] cursor-pointer transition-colors"
                      tabIndex="-1"
                    >
                      {showNewPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-[#e5e5e5]">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repite la contraseña"
                      {...register("confirmPassword")}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#262626] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-[#1a1a1a] dark:text-[#f5f5f5] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] cursor-pointer transition-colors"
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !isFormDirty}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-bold py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
