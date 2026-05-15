"use client"

import { useRef } from "react"
import { Paperclip, X, ImageIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LEAVE_DRAFT_MAX_ATTACHMENT_FILES } from "@/features/leave/data"

interface LeaveAttachmentZoneProps {
  files: File[]
  onAdd: (file: File) => void
  onRemove: (index: number) => void
  required?: boolean
  error?: string
  maxFiles?: number
  className?: string
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/")
  const sizeKb = Math.round(file.size / 1024)
  const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      {isImage ? (
        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">{sizeLabel}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function LeaveAttachmentZone({
  files,
  onAdd,
  onRemove,
  required = false,
  error,
  maxFiles = LEAVE_DRAFT_MAX_ATTACHMENT_FILES,
  className,
}: LeaveAttachmentZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const canAdd = files.length < maxFiles

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const remaining = maxFiles - files.length
    const toAdd = Array.from(fileList).slice(0, remaining)
    toAdd.forEach((f) => onAdd(f))
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {canAdd && (
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition-colors cursor-pointer",
            error ? "border-destructive/60 bg-destructive/5" : "border-border hover:border-primary/60 hover:bg-muted/30",
          )}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Paperclip className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {required ? (
                <>
                  Upload supporting document{" "}
                  <span className="text-destructive">*</span>
                </>
              ) : (
                "Attach document (optional)"
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click or drag & drop · Up to {maxFiles} file{maxFiles !== 1 ? "s" : ""}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            multiple={maxFiles > 1}
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Upload attachment"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <FilePreview key={`${file.name}-${i}`} file={file} onRemove={() => onRemove(i)} />
          ))}
        </div>
      )}

      {files.length >= maxFiles && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxFiles} file{maxFiles !== 1 ? "s" : ""} reached.
        </p>
      )}
    </div>
  )
}
