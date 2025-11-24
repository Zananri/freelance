<x-office-layout>
    <x-slot name="menu_active">
        {{ __('bi_dashboard') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/dashboard_management.css')}}?v={{time()}}" rel="stylesheet">
    </x-slot>

    <div class="scrollbar-transparent pe-3">
        <style>
            .iframe-box{
                width: 100%;
                height: calc(100vh - 120px);
                
            }
        </style>
        
        {{-- 
        <iframe class="iframe-box" width="1200" height="1000" src="https://lookerstudio.google.com/embed/reporting/84f60a5c-2026-4248-9c32-b0fa6c03441e/page/p_4x6kpidmxd" frameborder="0" style="border:0" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>
        
        <iframe class="iframe-box" src="https://lookerstudio.google.com/embed/reporting/77d57bb2-6113-49f4-acc1-610dbb65d7e3/page/p_tqpt5wgiwd" frameborder="0" style="border:0" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe> --}}
        
        <iframe class="iframe-box" width="1200" height="1000" src="https://lookerstudio.google.com/embed/reporting/77d57bb2-6113-49f4-acc1-610dbb65d7e3/page/p_tqpt5wgiwd" frameborder="0" style="border:0" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>
        
    </div>


    <x-slot name="body_end_slot">
        
    </x-slot>
    
    <x-slot name="script_slot">

    </x-slot>

</x-office-layout>
