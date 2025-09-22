<x-office-layout>
    <x-slot name="menu_active">
        {{ __('project') }}
    </x-slot>
    <x-slot name="head_slot">
    <meta name="app-url" content="{{ url('/') }}">
    </x-slot>

    <div class="title-content">
        <h2>Detail Project</h2>
    </div>
</x-office-layout>
