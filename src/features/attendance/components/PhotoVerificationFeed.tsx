import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";

interface PhotoItem {
  id: string;
  photoUrl: string;
  name: string;
  timestamp: string;
}

interface Props {
  photos: PhotoItem[];
}

export function PhotoVerificationFeed({ photos }: Props) {
  return (
    <Card className="shadow-card border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Photo Verification</p>
        </div>
        {photos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No photos yet today</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative rounded-lg overflow-hidden aspect-square">
                <img
                  src={photo.photoUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs text-white font-medium truncate">{photo.name}</p>
                  <p className="text-[10px] text-white/70">
                    {new Date(photo.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
