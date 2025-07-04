<?php

namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class OfficeLayout extends Component
{
    /**
     * Create a new component instance.
     */
    public $photo;
    public $user;

    public function __construct($photo = null)
    {
        $this->photo = $photo;
        $user = auth()->user();
        $this->user = $user ? $user->load('employee.division') : null;
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('layouts.office-layout', ['user' => $this->user]);
    }
}
