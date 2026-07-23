<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="app-url" content="{{ url('/') }}">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>SGS</title>

        <link rel="icon" href="{{ asset('asset/img/logo/logo.png') }}" type="image/x-icon">
        <link rel="shortcut icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">

        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
            }

            @page {
                size: A4 portrait;
            }

            @media print {
                body {
                    background-color: #fff !important;
                }
            }

            .page-salary {
                width: 985px !important;
                min-height: 29.7cm !important;
                margin: 0 auto;
                padding: 15mm 25mm;
                background-color: rgb(255, 255, 255);
                font-size: 12px;
            }

            .page-download {
                min-height: 200px !important;
                font-size: 11px;
                padding-left: 20px;
                padding-right: 20px;
                background-color: #fff;
            }

            .payslip-company-name {
                font-size: 15px;
                font-weight: bold;
            }

            .payslip-company-address {
                font-size: 11px;
                line-height: 15px;
            }

            .payslip-info-table {
                width: 100%;
                margin-top: 10px;
                border-collapse: collapse;
            }

            .payslip-info-table td {
                padding: 2px 0;
                font-size: 12px;
                vertical-align: top;
            }

            .payslip-info-table td.label {
                width: 150px;
                color: #333;
            }

            .payslip-info-table td.value {
                text-align: right;
            }

            .payslip-info-table td.label-2 {
                width: 130px;
                color: #333;
            }

            .payslip-summary-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            .payslip-summary-table th {
                background-color: #d9d9d9;
                text-align: left;
                padding: 8px 10px;
                font-size: 13px;
                font-weight: bold;
            }

            .payslip-summary-table td {
                padding: 5px 10px;
                font-size: 12px;
            }

            .payslip-summary-table td.amount {
                text-align: right;
                width: 35%;
            }

            .payslip-total-row td {
                font-weight: bold;
                border-top: 2px solid #000;
                padding-top: 8px;
            }

            .payslip-footer-note {
                font-size: 12px;
                line-height: 20px;
            }

            .payslip-footer-box {
                border: 1px solid #000;
                text-align: center;
                padding: 15px 10px;
            }

            .payslip-footer-box .box-label {
                font-size: 13px;
            }

            .payslip-footer-box .box-amount {
                font-size: 28px;
                font-weight: bold;
                margin-top: 8px;
            }
        </style>
    </head>

    <body style="padding: 0px; margin:0px;">
        @php
            $companyName = 'PT. Sekar Global Solusindo';
            $companyAddress = 'Ruko Sultan Agung No. 07 Jl.Sultan Agung 104-106 Candisari';

            $hireDateFormatted = $employee->hire_date ? \Carbon\Carbon::parse($employee->hire_date)->format('d/m/Y') : '-';
            $periodeGaji = $employeePayslip->date_salary ? \Carbon\Carbon::parse($employeePayslip->date_salary)->format('Y/m') : '-';
            $statusKawin = $employee->marital_status ?? '-';

            $incomeItems = [
                ['label' => 'Gaji Pokok', 'value' => $employeePayslip->prorate_basic_salary ?? $employeePayslip->basic_salary ?? 0],
                ['label' => 'Tunjangan Jabatan', 'value' => $employeePayslip->prorate_positional_allowance ?? $employeePayslip->positional_allowance ?? 0],
                ['label' => 'Tunjangan Kehadiran', 'value' => $employeePayslip->attendance_allowance ?? 0],
                ['label' => 'Tunjangan BPJS Kesehatan', 'value' => $employeePayslip->prorate_bpjs_allowance ?? $employeePayslip->bpjs_allowance ?? 0],
                ['label' => 'Tunjangan BPJS Ketenagakerjaan', 'value' => $employeePayslip->prorate_bpjs_tenaga_kerja_allowance ?? $employeePayslip->bpjs_tenaga_kerja_allowance ?? 0],
                ['label' => 'Tunjangan BPJSTK Dana Pensiun', 'value' => $employeePayslip->prorate_pension_allowance ?? $employeePayslip->pension_allowance ?? 0],
                ['label' => 'THR', 'value' => $employeePayslip->thr ?? 0],
                ['label' => 'Kompensasi PKWT', 'value' => $employeePayslip->kompensasi_pkwt ?? $employeePayslip->pkwt ?? 0],
            ];

            $deductionItems = [
                ['label' => 'Potongan Absen', 'value' => $employeePayslip->deduction_absent ?? 0],
                ['label' => 'Potongan Datang Terlambat', 'value' => $employeePayslip->deduction_late ?? 0],
                ['label' => 'Potongan BPJS Kesehatan', 'value' => $employeePayslip->deduction_bpjs_kesehatan ?? 0],
                ['label' => 'Potongan BPJS Ketenagakerjaan', 'value' => $employeePayslip->deduction_bpjs_tenaga_kerja ?? 0],
                ['label' => 'Potongan BPJS TK Dana Pensiun', 'value' => $employeePayslip->deduction_bpjs_dana_pensiun ?? 0],
                ['label' => 'Potongan Pajak PPh21', 'value' => $employeePayslip->deduction_pph21 ?? 0],
                ['label' => 'Potongan Koperasi', 'value' => $employeePayslip->deduction_cooperative ?? 0],
                ['label' => 'Potongan Lainnya', 'value' => $employeePayslip->deduction_other ?? 0],
            ];

            $totalIncome = collect($incomeItems)->sum('value');
            $totalDeduction = $employeePayslip->deduction ?? collect($deductionItems)->sum('value');
            $totalReceived = $employeePayslip->take_home_pay ?? ($totalIncome - $totalDeduction);

            $formatAmount = function ($value) {
                $value = (int) $value;
                return $value > 0 ? number_format($value, 0, '', '.') : '-';
            };
        @endphp

        @if ($downloadPayslip == 1)
            <div class="page-download">
                <table style="width: 100%;">
                    <tr>
                        <td>
                            <div class="payslip-company-name">{{ $companyName }}</div>
                            <div class="payslip-company-address">{{ $companyAddress }}</div>
                        </td>
                        <td style="width: 45%; vertical-align: top;">
                            <table class="payslip-info-table">
                                <tr>
                                    <td class="label">Nama</td>
                                    <td class="value" colspan="3">{{ $employee->name }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Jabatan</td>
                                    <td class="value" colspan="3">{{ $employee->job->job_name ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <td class="label">NIK</td>
                                    <td class="value" colspan="3">{{ $employee->employee_niks ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Tgl Mulai Bekerja</td>
                                    <td>{{ $hireDateFormatted }}</td>
                                    <td class="label-2">Periode Gaji</td>
                                    <td class="value">{{ $periodeGaji }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Status Kawin</td>
                                    <td class="value" colspan="3">{{ $statusKawin }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <table class="payslip-summary-table">
                    <tr>
                        <th style="width: 15%;">Pendapatan</th>
                        <th style="width: 35%;"></th>
                        <th style="width: 15%;">Potongan</th>
                        <th style="width: 35%;"></th>
                    </tr>
                    @foreach ($incomeItems as $i => $item)
                        <tr>
                            <td>{{ $item['label'] }}</td>
                            <td class="amount">{{ $formatAmount($item['value']) }}</td>
                            <td>{{ $deductionItems[$i]['label'] }}</td>
                            <td class="amount">{{ $formatAmount($deductionItems[$i]['value']) }}</td>
                        </tr>
                    @endforeach
                    <tr class="payslip-total-row">
                        <td>Total Ditagihkan</td>
                        <td class="amount">{{ $formatAmount($totalIncome) }}</td>
                        <td>Total Potongan Karyawan</td>
                        <td class="amount">{{ $formatAmount($totalDeduction) }}</td>
                    </tr>
                </table>

                <table style="width: 100%; margin-top: 25px;">
                    <tr>
                        <td style="width: 60%; vertical-align: top;" class="payslip-footer-note">
                            Pembayaran gaji telah dilakukan oleh perusahaan<br>
                            Secara transfer ke rekening karyawan<br><br>
                            Nomor Rekening &nbsp;: {{ $employeePayslip->bank_account_number ?? '-' }}<br>
                            Bank &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {{ $employeePayslip->bank_name ?? '-' }}
                        </td>
                        <td style="width: 40%; vertical-align: top;">
                            <div class="payslip-footer-box">
                                <div class="box-label">Total Penerimaan Bulan Ini</div>
                                <div class="box-amount">{{ $formatAmount($totalReceived) }}</div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        @else
            <div class="page-salary">
                <table style="width: 100%;">
                    <tr>
                        <td>
                            <div class="payslip-company-name">{{ $companyName }}</div>
                            <div class="payslip-company-address">{{ $companyAddress }}</div>
                        </td>
                        <td style="width: 45%; vertical-align: top;">
                            <table class="payslip-info-table">
                                <tr>
                                    <td class="label">Nama</td>
                                    <td class="value" colspan="3">{{ $employee->name }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Jabatan</td>
                                    <td class="value" colspan="3">{{ $employee->job->job_name ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <td class="label">NIK</td>
                                    <td class="value" colspan="3">{{ $employee->employee_niks ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Tgl Mulai Bekerja</td>
                                    <td>{{ $hireDateFormatted }}</td>
                                    <td class="label-2">Periode Gaji</td>
                                    <td class="value">{{ $periodeGaji }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Status Kawin</td>
                                    <td class="value" colspan="3">{{ $statusKawin }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <table class="payslip-summary-table">
                    <tr>
                        <th style="width: 15%;">Pendapatan</th>
                        <th style="width: 35%;"></th>
                        <th style="width: 15%;">Potongan</th>
                        <th style="width: 35%;"></th>
                    </tr>
                    @foreach ($incomeItems as $i => $item)
                        <tr>
                            <td>{{ $item['label'] }}</td>
                            <td class="amount">{{ $formatAmount($item['value']) }}</td>
                            <td>{{ $deductionItems[$i]['label'] }}</td>
                            <td class="amount">{{ $formatAmount($deductionItems[$i]['value']) }}</td>
                        </tr>
                    @endforeach
                    <tr class="payslip-total-row">
                        <td>Total Ditagihkan</td>
                        <td class="amount">{{ $formatAmount($totalIncome) }}</td>
                        <td>Total Potongan Karyawan</td>
                        <td class="amount">{{ $formatAmount($totalDeduction) }}</td>
                    </tr>
                </table>

                <table style="width: 100%; margin-top: 25px;">
                    <tr>
                        <td style="width: 60%; vertical-align: top;" class="payslip-footer-note">
                            Pembayaran gaji telah dilakukan oleh perusahaan<br>
                            Secara transfer ke rekening karyawan<br><br>
                            Nomor Rekening &nbsp;: {{ $employeePayslip->bank_account_number ?? '-' }}<br>
                            Bank &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {{ $employeePayslip->bank_name ?? '-' }}
                        </td>
                        <td style="width: 40%; vertical-align: top;">
                            <div class="payslip-footer-box">
                                <div class="box-label">Total Penerimaan Bulan Ini</div>
                                <div class="box-amount">{{ $formatAmount($totalReceived) }}</div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <script src="{{ asset('asset/js/jquery-3.7.1.min.js') }}"></script>
            <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"
                integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous">
            </script>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.min.js"
                integrity="sha384-RuyvpeZCxMJCqVUGFI0Do1mQrods/hhxYlcVfGPOfQtPJh0JCw12tUAZ/Mv10S7D" crossorigin="anonymous">
            </script>
        @endif
    </body>
</html>