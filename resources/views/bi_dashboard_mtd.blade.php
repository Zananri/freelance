<x-office-layout>
    <x-slot name="menu_active">
        {{ __('bi_dashboard_mtd') }}
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
        <iframe class="iframe-box" src="https://lookerstudio.google.com/reporting/c0dd91ff-596b-4d6f-b605-c0ea7fd5cab3/page/6h4dF" frameborder="0" style="border:0" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>

    </div>


    <x-slot name="body_end_slot">
        
    </x-slot>
    
    <x-slot name="script_slot">

    </x-slot>

</x-office-layout>
