import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  Profile,
  ProfileUpdateInput,
  fetchMyProfile,
  updateMyProfile,
  uploadAvatar as uploadAvatarApi,
  uploadFacePhoto as uploadFacePhotoApi,
} from "@/shared/lib/api-client/profile";

export function useProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => fetchMyProfile(),
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: ProfileUpdateInput) => {
      return updateMyProfile(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error("File too large. Maximum 5MB.");

      const url = await uploadAvatarApi(file);
      await updateProfile.mutateAsync({ avatarUrl: url });
      return url;
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const uploadFacePhoto = useMutation({
    mutationFn: async (file: File) => {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error("File too large. Maximum 5MB.");

      const url = await uploadFacePhotoApi(file);
      await updateProfile.mutateAsync({ facePhotoUrl: url });
      return url;
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutateAsync,
    uploadAvatar: uploadAvatar.mutateAsync,
    uploadFacePhoto: uploadFacePhoto.mutateAsync,
    isUpdating: updateProfile.isPending,
    isUploadingAvatar: uploadAvatar.isPending,
    isUploadingFacePhoto: uploadFacePhoto.isPending,
  };
}
