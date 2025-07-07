<x-office-layout>
    <x-slot name="menu_active">
        {{ __('dashboard') }}
    </x-slot>
    <div class="title-content">
        <h2>Dashboard</h2>
    </div>
    <div class="body-content scrollable-container rounded-4 p-5" style="">
       
    </div>
    @if(session('success'))
    <div class="alert-success-container mb-3" style="width: 100%;">
        <div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center m-0 text-center" role="alert" style="width: 100%;">
            {{ session('success') }}
        </div>
    </div>
    <script>
        // Auto dismiss alert after 1.5 seconds
        setTimeout(function() {
            const alertContainer = document.querySelector('.alert-success-container');
            if (alertContainer) {
                alertContainer.style.transition = 'opacity 0.5s ease';
                alertContainer.style.opacity = '0';
                setTimeout(() => alertContainer.remove(), 500);
            }
        }, 1500);
    </script>
    @endif

</x-office-layout>
