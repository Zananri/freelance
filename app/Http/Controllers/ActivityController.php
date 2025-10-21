<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\ActivityHelper;

class ActivityController extends Controller
{
    /**
     * Accept client-side activity events (e.g., modal opens) and record them.
     * Expects JSON POST with: menu, activity, description
     */
    public function logClientEvent(Request $request)
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'menu' => 'required|string|max:100',
                'activity' => 'required|string|max:100',
                'description' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json(['code' => 422, 'status' => 'error', 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }

            $user = $request->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;

            try {
                ActivityHelper::record([
                    'employee_id' => $employeeId,
                    'menu' => strtoupper($request->input('menu')),
                    'activity' => strtoupper($request->input('activity')),
                    'description' => $request->input('description') ?? null,
                    'date_time_activity' => now(),
                ]);
            } catch (\Throwable $_) {
                // swallow to avoid interrupting client UX
            }

            return response()->json(['code' => 200, 'status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['code' => 500, 'status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
