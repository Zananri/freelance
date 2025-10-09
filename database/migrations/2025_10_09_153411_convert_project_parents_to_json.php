<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Create a temporary table with the new structure
        Schema::create('project_parents_temp', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->json('project_parent_ids')->nullable();
            $table->timestamps();
            
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->index('project_id');
        });
        
        // Step 2: Group existing data and convert to JSON format
        $existingData = DB::table('project_parents')
            ->select('project_id')
            ->groupBy('project_id')
            ->get();
        
        foreach ($existingData as $project) {
            $parentIds = DB::table('project_parents')
                ->where('project_id', $project->project_id)
                ->pluck('parent_project_id')
                ->toArray();
                
            DB::table('project_parents_temp')->insert([
                'project_id' => $project->project_id,
                'project_parent_ids' => json_encode(array_map('intval', $parentIds)),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
        
        // Step 3: Drop the old table and rename temp table
        Schema::dropIfExists('project_parents');
        Schema::rename('project_parents_temp', 'project_parents');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Create temp table with old structure
        Schema::create('project_parents_temp', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('parent_project_id');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('parent_project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->unique(['project_id', 'parent_project_id']);
        });
        
        // Step 2: Convert JSON data back to individual rows
        $jsonData = DB::table('project_parents')
            ->whereNotNull('project_parent_ids')
            ->get();
            
        foreach ($jsonData as $row) {
            $parentIds = json_decode($row->project_parent_ids, true);
            if (is_array($parentIds)) {
                foreach ($parentIds as $index => $parentId) {
                    DB::table('project_parents_temp')->insert([
                        'project_id' => $row->project_id,
                        'parent_project_id' => $parentId,
                        'is_primary' => $index === 0,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                }
            }
        }
        
        // Step 3: Replace tables
        Schema::dropIfExists('project_parents');
        Schema::rename('project_parents_temp', 'project_parents');
    }
};
