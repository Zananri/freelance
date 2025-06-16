<x-office-layout>
    <div class="title-content">
        <h2>Master</h2>
    </div>
    <div class="body-content scrollable-container rounded-4 p-5" style="margin-top: 20px; width: 100%;">
        <div class="card">
            <div class="card-body" style="background-color: transparent;">
                <h5 class="card-title text-center mb-4">Department Table</h5>
                <div class="table-responsive">
                    @php
                        $departments = [
                            ['id' => 1, 'name' => 'Keuangan (Finance)'],
                            ['id' => 2, 'name' => 'Sumber Daya Manusia (Human Resources / HRD)'],
                            ['id' => 3, 'name' => 'Pemasaran (Marketing)'],
                            ['id' => 4, 'name' => 'Penjualan (Sales)'],
                            ['id' => 5, 'name' => 'Produksi/Operasional (Production/Operations)'],
                            ['id' => 6, 'name' => 'Umum (General Affairs / GA)'],
                            ['id' => 7, 'name' => 'Teknologi Informasi (Information Technology / IT)'],
                            ['id' => 8, 'name' => 'Riset dan Pengembangan (Research & Development / R&D)'],
                            ['id' => 9, 'name' => 'Hukum (Legal)'],
                            ['id' => 10, 'name' => 'Layanan Pelanggan (Customer Service)'],
                            ['id' => 11, 'name' => 'Logistik/Distribusi'],
                            ['id' => 12, 'name' => 'Pembelian/Pengadaan (Procurement)'],
                        ];
                    @endphp
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>No</th>
                                <th>Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach(array_slice($departments, 0, 5) as $dept)
                            <tr>
                                <td>{{ $dept['id'] }}</td>
                                <td>{{ $dept['name'] }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                <div class="text-center mt-3">
                    <a href="{{ route('detail-department') }}" class="btn rounded-5 text-white" style="background-color: black">See More</a>
                </div>
            </div>
        </div>
    </div>
</x-office-layout>
