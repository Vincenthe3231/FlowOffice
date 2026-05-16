<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Claim;
use App\Models\ClaimCategory;
use App\Models\Department;
use App\Models\Leave;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\User;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    use ApiResponse;

    private function periodRange(string $period): array
    {
        $end = Carbon::now()->endOfDay();

        $start = match ($period) {
            '30d'  => Carbon::now()->subDays(29)->startOfDay(),
            '90d'  => Carbon::now()->subDays(89)->startOfDay(),
            '6m'   => Carbon::now()->subMonths(6)->startOfDay(),
            '12m'  => Carbon::now()->subMonths(12)->startOfDay(),
            'ytd'  => Carbon::now()->startOfYear()->startOfDay(),
            default => Carbon::now()->subDays(29)->startOfDay(),
        };

        return [$start, $end];
    }

    private function baseUserQuery(?int $deptId)
    {
        return User::query()
            ->where('status', 'active')
            ->when($deptId, fn ($q) => $q->where('department_id', $deptId));
    }

    public function overview(Request $request): JsonResponse
    {
        $deptId = $request->integer('department_id') ?: null;

        $headcount = $this->baseUserQuery($deptId)->count();

        $presentToday = AttendanceLog::whereDate('timestamp', today())
            ->where('type', 'clock_in')
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->distinct('user_id')
            ->count('user_id');

        $onLeaveToday = Leave::where('status', 'approved')
            ->whereDate('start_date', '<=', today())
            ->whereDate('end_date', '>=', today())
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->distinct('user_id')
            ->count('user_id');

        $pendingLeave = Leave::whereIn('status', ['pending', 'pending_l1', 'pending_l2', 'pending_l3'])
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->count();

        $pendingClaims = Claim::whereIn('status', ['pending', 'pending_l1', 'pending_l2', 'pending_l3', 'pending_l4'])
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->count();

        return $this->success([
            'headcount'     => $headcount,
            'present_today' => $presentToday,
            'on_leave_today' => $onLeaveToday,
            'pending_leave'  => $pendingLeave,
            'pending_claims' => $pendingClaims,
            'attendance_rate' => $headcount > 0
                ? round($presentToday / $headcount * 100, 1)
                : 0,
        ]);
    }

    public function attendance(Request $request): JsonResponse
    {
        $deptId = $request->integer('department_id') ?: null;
        $period = $request->string('period', '30d')->toString();
        [$start, $end] = $this->periodRange($period);

        $lateHour = 9;

        // Daily trend: attendance rate per day
        $dailyLogs = AttendanceLog::whereBetween('timestamp', [$start, $end])
            ->where('type', 'clock_in')
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->select(DB::raw('DATE(timestamp) as date'), 'user_id')
            ->distinct()
            ->get();

        $headcount = $this->baseUserQuery($deptId)->count();

        $dailyTrend = $dailyLogs
            ->groupBy('date')
            ->map(fn ($rows, $date) => [
                'date'  => $date,
                'count' => $rows->count(),
                'rate'  => $headcount > 0 ? round($rows->count() / $headcount * 100, 1) : 0,
            ])
            ->values();

        // Dept breakdown: attendance rate per department today
        $departments = Department::where('status', true)->get(['id', 'name', 'color_scheme']);

        $todayLogs = AttendanceLog::whereDate('timestamp', today())
            ->where('type', 'clock_in')
            ->when($deptId, fn ($q) => $q->where(fn ($q2) => $q2->whereHas('user', fn ($u) => $u->where('department_id', $deptId))))
            ->with('user:id,department_id')
            ->get();

        $deptBreakdown = $departments
            ->when($deptId, fn ($c) => $c->where('id', $deptId))
            ->map(function ($dept) use ($todayLogs) {
                $deptHeadcount = User::where('status', 'active')->where('department_id', $dept->id)->count();
                $present = $todayLogs->filter(fn ($l) => $l->user?->department_id === $dept->id)->count();

                return [
                    'department_id'   => $dept->id,
                    'department_name' => $dept->name,
                    'color_scheme'    => $dept->color_scheme,
                    'headcount'       => $deptHeadcount,
                    'present'         => $present,
                    'rate'            => $deptHeadcount > 0 ? round($present / $deptHeadcount * 100, 1) : 0,
                ];
            })
            ->values();

        // Late arrivals by dept today
        $lateLogs = AttendanceLog::whereDate('timestamp', today())
            ->where('type', 'clock_in')
            ->whereRaw('EXTRACT(HOUR FROM timestamp) >= ?', [$lateHour])
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->with('user:id,department_id')
            ->get();

        $lateByDept = $departments
            ->when($deptId, fn ($c) => $c->where('id', $deptId))
            ->map(fn ($dept) => [
                'department_id'   => $dept->id,
                'department_name' => $dept->name,
                'late_count'      => $lateLogs->filter(fn ($l) => $l->user?->department_id === $dept->id)->count(),
            ])
            ->values();

        return $this->success([
            'daily_trend'   => $dailyTrend,
            'dept_breakdown' => $deptBreakdown,
            'late_by_dept'  => $lateByDept,
            'period'        => $period,
        ]);
    }

    public function leave(Request $request): JsonResponse
    {
        $deptId = $request->integer('department_id') ?: null;
        $period = $request->string('period', 'ytd')->toString();
        [$start, $end] = $this->periodRange($period);

        // Status breakdown
        $statusBreakdown = Leave::whereBetween('created_at', [$start, $end])
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Leave utilization by dept
        $departments = Department::where('status', true)->get(['id', 'name', 'color_scheme']);

        $balances = LeaveBalance::with('user:id,department_id')
            ->where('year', now()->year)
            ->get();

        $utilizationByDept = $departments
            ->when($deptId, fn ($c) => $c->where('id', $deptId))
            ->map(function ($dept) use ($balances) {
                $deptBalances = $balances->filter(fn ($b) => $b->user?->department_id === $dept->id);
                $quota = $deptBalances->sum('annual_quota');
                $used  = $deptBalances->sum('used');

                return [
                    'department_id'   => $dept->id,
                    'department_name' => $dept->name,
                    'color_scheme'    => $dept->color_scheme,
                    'quota'           => $quota,
                    'used'            => $used,
                    'utilization_pct' => $quota > 0 ? round($used / $quota * 100, 1) : 0,
                ];
            })
            ->values();

        // Leave type breakdown
        $typeBreakdown = Leave::whereBetween('created_at', [$start, $end])
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->with('leaveType:id,name')
            ->selectRaw('leave_type_id, COUNT(*) as count')
            ->groupBy('leave_type_id')
            ->get()
            ->map(fn ($row) => [
                'leave_type_id'   => $row->leave_type_id,
                'leave_type_name' => $row->leaveType?->name ?? 'Unknown',
                'count'           => $row->count,
            ]);

        // Monthly trend (last 12 months)
        $monthlyTrend = Leave::where('created_at', '>=', Carbon::now()->subMonths(12)->startOfMonth())
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->selectRaw("TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month');

        return $this->success([
            'status_breakdown'  => $statusBreakdown,
            'utilization_by_dept' => $utilizationByDept,
            'type_breakdown'    => $typeBreakdown,
            'monthly_trend'     => $monthlyTrend,
            'period'            => $period,
        ]);
    }

    public function claims(Request $request): JsonResponse
    {
        $deptId = $request->integer('department_id') ?: null;
        $period = $request->string('period', 'ytd')->toString();
        [$start, $end] = $this->periodRange($period);

        // Total spend in period (paid claims)
        $totalYtd = Claim::where('status', 'paid')
            ->whereBetween('paid_at', [$start, $end])
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->sum('amount');

        // Pending payment
        $pendingPaymentAmount = Claim::where('status', 'approved')
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->sum('amount');

        // Budget vs actual by category
        $budgetVsActual = ClaimCategory::all()->map(fn ($cat) => [
            'id'      => $cat->id,
            'name'    => $cat->name,
            'budget'  => (float) $cat->budget,
            'spent'   => (float) $cat->spent,
            'pct'     => $cat->budget > 0 ? round($cat->spent / $cat->budget * 100, 1) : 0,
        ]);

        // Spend by dept
        $departments = Department::where('status', true)->get(['id', 'name', 'color_scheme']);

        $paidClaims = Claim::where('status', 'paid')
            ->whereBetween('paid_at', [$start, $end])
            ->with('user:id,department_id')
            ->get(['id', 'user_id', 'amount']);

        $spendByDept = $departments
            ->when($deptId, fn ($c) => $c->where('id', $deptId))
            ->map(fn ($dept) => [
                'department_id'   => $dept->id,
                'department_name' => $dept->name,
                'color_scheme'    => $dept->color_scheme,
                'total'           => (float) $paidClaims->filter(fn ($c) => $c->user?->department_id === $dept->id)->sum('amount'),
            ])
            ->values();

        // Monthly trend (last 12 months)
        $monthlyTrend = Claim::where('status', 'paid')
            ->where('paid_at', '>=', Carbon::now()->subMonths(12)->startOfMonth())
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->selectRaw("TO_CHAR(paid_at, 'YYYY-MM') as month, SUM(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        // Type breakdown
        $typeBreakdown = Claim::whereBetween('created_at', [$start, $end])
            ->when($deptId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('department_id', $deptId)))
            ->selectRaw('type, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('type')
            ->get()
            ->map(fn ($row) => [
                'type'  => $row->type,
                'count' => $row->count,
                'total' => (float) $row->total,
            ]);

        return $this->success([
            'total_ytd'             => (float) $totalYtd,
            'pending_payment_amount' => (float) $pendingPaymentAmount,
            'budget_vs_actual'      => $budgetVsActual,
            'spend_by_dept'         => $spendByDept,
            'monthly_trend'         => $monthlyTrend,
            'type_breakdown'        => $typeBreakdown,
            'period'                => $period,
        ]);
    }
}
