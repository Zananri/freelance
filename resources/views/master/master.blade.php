<x-office-layout>
    <div class="title-content">
        <h2>Master Data</h2>
    </div>

    <div class="d-flex gap-4 mt-3 w-100">
        <div class="body-content scrollable-container rounded-4 p-5 w-50 d-flex justify-content-center align-items-center" style="height: 200px;">
            <a href="{{ url('department') }}" class="text-decoration-none text-dark d-flex flex-column align-items-center">
            
                <h5>Department</h5>
            </a>
        </div>
        <div class="body-content scrollable-container rounded-4 p-5 w-50 d-flex justify-content-center align-items-center" style="height: 200px;">
            <a href="{{ url('division') }}" class="text-decoration-none text-dark d-flex flex-column align-items-center">
            
                <h5>Division</h5>
            </a>        
        </div>
    </div>
</x-office-layout>
