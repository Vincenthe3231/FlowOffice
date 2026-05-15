<?php

namespace App\Modules\Leave\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeaveAttachmentResource;
use App\Models\Leave;
use App\Models\LeaveAttachment;
use App\Modules\Leave\Services\LeaveAttachmentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LeaveAttachmentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private LeaveAttachmentService $attachmentService
    ) {}

    public function store(Request $request, Leave $leave): JsonResponse
    {
        $this->authorize('view', $leave);
        if (! in_array($leave->status, Leave::pendingPipelineStatuses(), true)) {
            return $this->error('LEAVE_NOT_EDITABLE', 'Attachments can only be added to pending leave requests.', 422);
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:jpeg,jpg,png,pdf', 'max:10240'],
        ]);

        $attachment = $this->attachmentService->store($leave, $request->file('file'));

        return $this->success(new LeaveAttachmentResource($attachment), 'Attachment uploaded.', 201);
    }

    public function destroy(Request $request, Leave $leave, LeaveAttachment $attachment): JsonResponse
    {
        $this->authorize('view', $leave);
        if ($attachment->leave_id !== $leave->id) {
            throw ValidationException::withMessages(['attachment' => ['Attachment does not belong to this leave request.']]);
        }

        $this->attachmentService->destroy($attachment);

        return $this->success(null, 'Attachment deleted.');
    }
}
