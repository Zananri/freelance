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

    public function __construct($photo = null)
    {
        $this->photo = $photo;
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('layouts.office-layout');
    }
}
