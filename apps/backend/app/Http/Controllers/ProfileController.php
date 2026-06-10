<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\UploadedFileValid;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    use ApiResponse;

    /**
     * Get the authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $this->buildProfile($user),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateMe(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'department' => ['sometimes', 'nullable', 'string', 'max:255'],
            'employee_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'avatar_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'face_front_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'face_left_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'face_right_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ]);

        if (array_key_exists('full_name', $data)) {
            $user->name = $data['full_name'];
        }

        if (array_key_exists('avatar_url', $data)) {
            $user->avatar_url = $data['avatar_url'];
        }

        if (array_key_exists('face_front_url', $data)) {
            $user->face_front_url = $data['face_front_url'];
        }
        if (array_key_exists('face_left_url', $data)) {
            $user->face_left_url = $data['face_left_url'];
        }
        if (array_key_exists('face_right_url', $data)) {
            $user->face_right_url = $data['face_right_url'];
        }

        if (array_key_exists('employee_id', $data)) {
            $user->employee_id = $data['employee_id'];
        }

        // phone, department are not persisted in the users table yet.
        $user->save();
        $user->refresh();

        return response()->json([
            'data' => $this->buildProfile($user),
        ]);
    }

    /**
     * Upload a face photo for the authenticated user.
     *
     * Expects multipart/form-data with fields "face_photo" and "position" (front|left|right).
     * Replaces any existing photo for that position (old file is deleted).
     * Returns the public URL as { data: "<url>" }.
     */
    public function uploadFacePhoto(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'face_photo' => ['required', new UploadedFileValid, 'image', 'max:5120'], // 5 MB
            'position' => ['required', 'string', 'in:front,left,right'],
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $data['face_photo'];
        $position = $data['position'];
        $column = "face_{$position}_url";

        $disk = config('filesystems.default');
        $directory = 'face-photos/'.$user->id;
        $extension = $file->extension();

        /** @var \Illuminate\Filesystem\FilesystemAdapter $storage */
        $storage = Storage::disk($disk);

        // Delete previous file for this position if it exists (cleanup orphaned files).
        // Tolerates both stored object paths (new) and legacy full URLs (transition).
        $oldPath = $this->storagePath($user->$column, $storage);
        if ($oldPath) {
            $storage->delete($oldPath);
        }

        // Versioned filename (uuid) → new object path per upload → signed URL changes →
        // automatic browser/CDN cache-bust on update (ADR-001).
        // Explicit ContentType required: Supabase S3 bucket rejects uploads without it (415).
        // CacheControl lets the browser cache the bytes (private; signed URL is per-user).
        $path = $file->storeAs($directory, "face_{$position}_".Str::uuid().".{$extension}", [
            'disk' => $disk,
            'ContentType' => $file->getMimeType(),
            'CacheControl' => 'private, max-age=604800, immutable',
        ]);

        if (! $path) {
            throw ValidationException::withMessages([
                'face_photo' => ['FILE_STORAGE_FAILED: Could not save the photo. Please try again.'],
            ]);
        }

        // Store the object PATH (private); signed URLs are generated on read.
        $user->$column = $path;
        $user->save();

        return response()->json([
            'data' => $this->signedUrl($path),
        ]);
    }

    /**
     * Upload avatar photo for the authenticated user.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'avatar' => ['required', new UploadedFileValid, 'image', 'max:5120'],
        ]);

        $file = $request->file('avatar');
        $disk = config('filesystems.default');
        $directory = 'avatars/'.$user->id;
        $extension = $file->extension();
        $filename = 'avatar_'.Str::uuid().'.'.$extension;

        /** @var \Illuminate\Filesystem\FilesystemAdapter $storage */
        $storage = Storage::disk($disk);

        // Tolerates both stored object paths (new) and legacy full URLs (transition).
        $oldPath = $this->storagePath($user->avatar_url, $storage);
        if ($oldPath) {
            $storage->delete($oldPath);
        }

        $path = $file->storeAs($directory, $filename, [
            'disk' => $disk,
            'ContentType' => $file->getMimeType(),
            'CacheControl' => 'private, max-age=604800, immutable',
        ]);

        if (! $path) {
            throw ValidationException::withMessages([
                'avatar' => ['FILE_STORAGE_FAILED: Could not save the avatar. Please try again.'],
            ]);
        }

        // Store the object PATH (private); signed URLs are generated on read.
        $user->avatar_url = $path;
        $user->save();

        return response()->json(['data' => ['url' => $this->signedUrl($path)]]);
    }

    /**
     * Generate a memoized, short-lived signed URL for a private storage object (ADR-001).
     *
     * The URL is cached (per disk + path) for ~6 days, just under the 7-day signature TTL,
     * so repeated /me calls return the SAME URL string → the browser serves the bytes from
     * disk cache (zero egress) instead of re-fetching. A new upload uses a new uuid path →
     * new cache key → fresh signed URL → automatic cache-bust.
     *
     * Legacy rows that still hold a full public URL are passed through unchanged during the
     * transition to path-based storage.
     */
    private function signedUrl(?string $stored): ?string
    {
        if ($stored === null || $stored === '') {
            return null;
        }

        // Legacy value: already a full URL (pre-ADR-001). Pass through.
        if (Str::startsWith($stored, 'http')) {
            return $stored;
        }

        $disk = config('filesystems.default');

        return Cache::remember(
            "profile_signed_url:{$disk}:{$stored}",
            now()->addDays(6),
            fn () => Storage::disk($disk)->temporaryUrl($stored, now()->addDays(7)),
        );
    }

    /**
     * Resolve the storage object path from a stored value, tolerating both new path-based
     * values and legacy full URLs. Returns null for empty values.
     */
    private function storagePath(?string $stored, \Illuminate\Filesystem\FilesystemAdapter $storage): ?string
    {
        if ($stored === null || $stored === '') {
            return null;
        }

        if (! Str::startsWith($stored, 'http')) {
            return $stored;
        }

        $baseUrl = rtrim($storage->url(''), '/');

        return $baseUrl !== '' ? str_replace($baseUrl.'/', '', $stored) : $stored;
    }

    /**
     * Build the profile array for a given user.
     */
    private function buildProfile(User $user): array
    {
        $user->loadMissing('department');

        return [
            'id' => (string) $user->id,
            'userId' => (string) $user->id,
            'fullName' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first() ?? 'staff',
            'phone' => null,
            'department' => $this->departmentDisplayString($user),
            // snake_case: BFF/client may map to employeeId (e.g. keysToCamel). Prefer HR sync; else Lark open_id (ou_*).
            'employee_id' => $this->resolveEmployeeId($user),
            'avatarUrl' => $this->signedUrl($user->avatar_url),
            'faceFrontUrl' => $this->signedUrl($user->face_front_url),
            'faceLeftUrl' => $this->signedUrl($user->face_left_url),
            'faceRightUrl' => $this->signedUrl($user->face_right_url),
            'officeId' => null,
            'managerId' => null,
            'createdAt' => optional($user->created_at)->toIso8601String(),
            'updatedAt' => optional($user->updated_at)->toIso8601String(),
            'office' => null,
        ];
    }

    /**
     * Employee / directory identifier for display (HRIS sync or Lark open_id fallback).
     */
    private function resolveEmployeeId(User $user): ?string
    {
        if (filled($user->employee_id)) {
            return $user->employee_id;
        }

        return $user->lark_open_id;
    }

    /**
     * Human-readable department for profile (aligns with User Management: "Name (CODE)" when short_code set).
     */
    private function departmentDisplayString(User $user): ?string
    {
        $dept = $user->department;
        if ($dept === null) {
            return null;
        }

        if (filled($dept->short_code)) {
            return $dept->name.' ('.$dept->short_code.')';
        }

        return $dept->name;
    }
}
