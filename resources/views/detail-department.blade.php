<x-office-layout>
    <div class="mt-3" style="text-align: left;">
        <a href="{{ route('master') }}" style="color: black; text-decoration: none; font-size: 24px; display: inline-flex; align-items: center;">
<span class="material-symbols-outlined" style="color: black; font-size: 28px;">arrow_back</span> 
        </a>
    </div>
    <div class="body-content scrollable-container rounded-4 p-5" style="margin-top: 20px; width: 100%;">
        <div class="card" style="background-color :rgba(248, 248, 249, 0); border: none;">
            <div class="card-body">
                <h5 class="card-title text-center mb-4">All Department Data</h5>
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
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
                                <th style="background-color :rgba(248, 248, 249, 0); ">No</th>
                                <th style="background-color :rgba(248, 248, 249, 0); ">Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($departments as $dept)
                            <tr>
                                <td style="background-color :rgba(248, 248, 249, 0); ">{{ $dept['id'] }}</td>
                                <td style="background-color :rgba(248, 248, 249, 0); ">{{ $dept['name'] }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                
            </div>
        </div>
    </div>
</x-office-layout>
