import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  Profile,
  ProfileUpdateInput,
  fetchMyProfile,
  updateMyProfile,
  uploadAvatar as uploadAvatarApi,
  uploadFacePhoto as uploadFacePhotoApi,
  type FacePosition,
} from "@/shared/lib/api-client/profile";
import { extractError } from "@/shared/lib/api-client/response-handler";

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
    onError: (error: unknown) => {
      const apiErr = extractError(error);
      const raw = apiErr.fields?.avatar?.[0] ?? apiErr.message;
      const display = raw.includes(": ") ? raw.split(": ").slice(1).join(": ") : raw;
      toast({ title: "Upload failed", description: display, variant: "destructive" });
    },
  });

  const uploadFacePhoto = useMutation({
    mutationFn: async ({ file, position }: { file: File; position: FacePosition }) => {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error("File too large. Maximum 5MB.");

      const url = await uploadFacePhotoApi(file, position);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      return url;
    },
    onSuccess: () => {
      toast({ title: "Face photo uploaded", description: "Your photo has been saved." });
    },
    onError: (error: unknown) => {
      const apiErr = extractError(error);
      const raw = apiErr.fields?.face_photo?.[0] ?? apiErr.message;
      const display = raw.includes(": ") ? raw.split(": ").slice(1).join(": ") : raw;
      toast({ title: "Upload failed", description: display, variant: "destructive" });
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
