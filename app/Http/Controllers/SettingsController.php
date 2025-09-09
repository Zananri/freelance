<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Employee;

class SettingsController extends Controller
{
    //
    public function showSettingsPage()
    {
        return view('settings.settings');
    }

    public function getAllUser(Request $request ){

        $qrySearch = '';

        if(isset($request->SEARCH_QUERY)){
            $qrySearch = $request->SEARCH_QUERY;
        }

       
        

        $totalRow = 20;

        if(isset($request->TOTAL_ROW)){
            
            $totalRow = $request->TOTAL_ROW;
            
        }

        $dtResult = Employee::select(
            'employees.id',
            'employees.name',
            'employees.status',
            'employees.user_id',
            'employees.photo', // legacy employee photo
            'employees.profile_picture', // new primary avatar
            'users.photo as user_photo', // user-level legacy photo
            'users.email',
            'users.user_type',
            'users.user_role'
        )
        ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE");

         $status = 'ALL';

        if(isset($request->SEARCH_STATUS)){
            $status = $request->SEARCH_STATUS;
         
            if($status != 'ALL'){
                $dtResult = $dtResult->where('status',$status);
            }
        }

        
 
        if($qrySearch != ''){

            $dtResult = $dtResult->when($qrySearch, function($q) use ($qrySearch) {
                $q->where(function($query) use ($qrySearch) {
                    $query->where('employees.name','like','%'.$qrySearch.'%');
                    $query->orWhere('users.email','like','%'.$qrySearch.'%');
                });
            });
               
        }

        $dtResult = $dtResult->orderBy('employees.name','desc')->paginate($totalRow);

        // Map collection to resolve avatar with file existence check (profile_picture > photo > user_photo > default)
        $collection = $dtResult->getCollection()->map(function($item){
            $raw = $item->profile_picture ?: ($item->photo ?: ($item->user_photo ?? null));
            $resolved = null;
            if ($raw) {
                if (preg_match('/^(https?:)?\/\//i', $raw)) {
                    $resolved = $raw; // absolute URL
                } else {
                    $relative = ltrim($raw,'/');
                    $publicPath = public_path($relative);
                    if (is_file($publicPath)) {
                        $resolved = asset($relative);
                    }
                }
            }
            if (!$resolved) {
                $resolved = asset('asset/img/avatar.png');
            }
            // Override profile_picture so existing frontend logic picks it first
            $item->profile_picture = $resolved;
            // Provide explicit URL field as well (future-safe)
            $item->profile_picture_url = $resolved;
            return $item;
        });
        $dtResult->setCollection($collection);

        return response()->json(['data_result' => json_encode($dtResult)]);

    }

    public function editUserRole(Request $request){


        try{

            // ADMINISTRATOR REGULAR MANAGEMENT  
            // GENERAL_MANAGER MANAGER LEADER HR_MANAGER FINANCE_MANAGER EMPLOYEE
            $request->validate([
                'user_type' => 'required|string|in:ADMINISTRATOR,REGULAR,MANAGEMENT',
                'user_role' => 'required|string|in:GENERAL_MANAGER,MANAGER,LEADER,HR_MANAGER,FINANCE_MANAGER,EMPLOYEE',

                'employee_id' => 'required|numeric',
                'user_id' => 'required|numeric'
            ]);

            
            $employee_id = $request->employee_id;
            $userId = $request->user_id;


            $employee = Employee::where('id',$request->employee_id)->where('user_id',$request->user_id)->first();

            if(!$employee){
                throw new \Exception('Employee not found');
            }
 
            $user = User::find($request->user_id);


            $userType = $request->user_type;
            $userRole = $request->user_role;

            $user->user_type = $userType;
            $user->user_role = $userRole;

            $user->save();

            $successMsg = "User ".$employee->name." successfully updated";

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => $successMsg
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'code' => 406,
                'status' => "error",
                'message'=> $e->getMessage()
            ], 406);
            
        }


    }
}
