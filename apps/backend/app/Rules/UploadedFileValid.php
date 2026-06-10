<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class UploadedFileValid implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('FILE_NO_FILE: No file was received.');

            return;
        }

        if ($value->isValid()) {
            return;
        }

        $fail(match ($value->getError()) {
            UPLOAD_ERR_INI_SIZE,
            UPLOAD_ERR_FORM_SIZE  => 'FILE_TOO_LARGE: The file exceeds the maximum allowed size.',
            UPLOAD_ERR_PARTIAL    => 'FILE_UPLOAD_INTERRUPTED: The upload was interrupted. Please try again.',
            UPLOAD_ERR_NO_TMP_DIR => 'FILE_SERVER_ERROR: Upload temp directory is unavailable.',
            UPLOAD_ERR_CANT_WRITE => 'FILE_SERVER_ERROR: Could not write the uploaded file to disk.',
            default               => 'FILE_UPLOAD_FAILED: The file failed to upload. Please try again.',
        });
    }
}
