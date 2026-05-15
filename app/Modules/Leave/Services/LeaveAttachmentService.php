<?php

namespace App\Modules\Leave\Services;

use App\Models\Leave;
use App\Models\LeaveAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LeaveAttachmentService
{
    public function store(Leave $leave, UploadedFile $file): LeaveAttachment
    {
        $disk = 'attachment';
        $directory = 'leaves/'.$leave->id;
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();

        $path = $file->storeAs($directory, $filename, $disk);

        if (! $path) {
            throw new \RuntimeException('Failed to store attachment.');
        }

        return LeaveAttachment::create([
            'leave_id' => $leave->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
        ]);
    }

    public function destroy(LeaveAttachment $attachment): void
    {
        $disk = $attachment->disk;
        $path = $attachment->path;
        $attachment->delete();
        if ($path && Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }
}
