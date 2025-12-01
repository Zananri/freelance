<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="app-url" content="{{ url('/') }}">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>NSA Performance</title>
    
        <link rel="icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">
        <link rel="shortcut icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">
        
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        
        <style>
            body{
                background-color: rgb(189, 197, 210);
                font-family:Arial, Helvetica, sans-serif;
            }

            @page {
                size: A4 portrait; /* or size: 10cm 20cm; */
            }
            
            @media print{
                body{
                    background-color: #fff !important;
                }
            
            }

            .page-salary {
                width: 985px !important;
                min-height: 29.7cm !important;
                margin: 0 auto;
                padding: 15mm 25mm;
                background-color: rgb(255, 255, 255);
                font-size: 11px;
            }

            
        </style>
    </head>
    
    <body style=" padding: 0px; margin:0px;">
        @if ($downloadPayslip ==  1)

        <style>
            body{
                background-color: #fff;
            }

            .page-download {
                min-height: 200px !important;
                font-size: 9px;
                padding-left: 20px;
                padding-right: 20px;
            }
        </style>

        <div class="page-download">
            <table style="width: 100%; position: relative;">
                <tr>
                    <td style="vertical-align: top; width: 90px;">
                        @php
                            if($downloadPayslip ==  1){
                                $logoNSA = public_path('asset/img/logo.png');
                            }else{
                                $logoNSA = asset('asset/img/logo.png');
                            }
                        @endphp
                        <img src="{{ $logoNSA }}" class="align-middle" width="70" alt="LOGO NSA Performance">
                    </td>
                    <td style="text-align: left;">
                        <div style="margin: 0px 10px 2px 10px; font-size: 16px; font-weight: bold; font-family: 'Times New Roman', Georgia, Garamond;">PT. Nosa Jaya Karya</div>
                        <div style="margin: 0px 10px 5px 10px; font-size: 16px; font-weight: bold; font-family: 'Times New Roman', Georgia, Garamond;">NSA Performance</div>
                        <div style="font-size: 9px; margin: 5px 10px;">
                            Jl. Petojo Bar. VI No.4, RT.11/RW.1, Duri Pulo, Gambir, Jakarta Pusat, 
                            <br>
                            Daerah Khusus Jakarta 10140
                        </div>
                    </td>
                </tr>
            </table>

            <div style="text-align: right; position: relative; margin-top:-10px;">
                <div style="display: inline-block; padding: 4px 25px; font-size: 18px; font-weight: bold; font-style: italic; border:solid 2px #000; color:#000; font-family:Arial, Helvetica, sans-serif;">
                    CONFIDENTIAL
                </div>
            </div>

            <div style="margin-top: 15px; line-height: 15px; margin-bottom: 10px;">
                <div style="font-size: 9px;">Slip Gaji</div>
                <div style="font-size: 9px; font-weight: bold">
                    {{ $dateSalary }}
                </div>
            </div>
            
            <div class="employee-info" >

                <table style="font-size: 9px; width: 100%; line-height: 12px;">
                    <tr>
                        <td style="width: 24%">ID Karyawan</td>
                        <td style="width: 24%">: {{$employee->employee_niks}}</td>
                        <td style="width: 24%">Divisi</td>
                        <td style="width: 24%">: {{$employee->division->name_division}}</td>
                    </tr>

                    <tr>
                        <td>Nama Karyawan</td>
                        <td>: {{$employee->name}}</td>
                        <td>Job Position</td>
                        <td>: {{$employee->job->job_name}}</td>
                    </tr>

                    <tr>
                        <td>Status Karyawan</td>
                        <td>: Aktif Bekerja</td>
                        <td>Grade</td>
                        <td>: {{$employee->grade->title}}</td>
                    </tr>

                    <tr>
                        <td>Periode Kerja</td>
                        <td>: {{ $workPeriod }}</td>
                        <td></td>
                        <td></td>
                    </tr>

                    <tr>
                        <td></td>
                        <td></td>
                        <td>Nama Bank</td>
                        <td>: {{ $employeePayslip->bank_name }}</td>
                    </tr>

                    <tr>
                        <td>Total wajib kerja tetap (hari)</td>
                        <td>: {{ $employeePayslip->total_day_active }}</td>
                        <td>Nama Penerima</td>
                        <td>: {{$employee->name}}</td>
                    </tr>

                    <tr>
                        <td>Total bekerja bulan ini (Hari)</td>
                        <td>: {{ $employeePayslip->total_working_day }}</td>
                        <td>Nomor Rekening</td>
                        <td>: {{ $employeePayslip->bank_account_number }}</td>
                    </tr>

                </table>

            </div>
            
            <div class="salary" style="margin-top: 25px;">
                <style>
                    .table-salary{
                        width: 100%;
                    }

                    .table-salary, 
                    .table-salary th, 
                    .table-salary td {
                        border-collapse: collapse;
                    }
                    .table-salary td{
                        vertical-align: top;
                        border: 1px solid #777;
                        font-size: 9px;
                        line-height: 15px;
                        padding-left: 7px;
                        padding-right: 7px;
                    }

                    .table-salary tr:nth-child(2n){
                        background-color: #eff3f6;
                    }
                </style>
                <table class="table-salary" >
                    <tr></tr>
                    <tr style="background-color: #d8dde2; color:#000; text-align: center; font-weight: bold">
                        <td>Pendapatan Gaji</td>
                        <td>Gaji Original</td>
                        <td>Pendapatan prorate bulan ini (A)</td>
                    </tr>

                    <tr>
                        <td>Gaji Pokok</td>
                        <td style="text-align: right">{{number_format($employeePayslip->basic_salary, 0, '', '.')}}</td>
                        <td style="text-align: right">{{number_format($employeePayslip->prorate_basic_salary, 0, '', '.')}}</td>
                    </tr>

                    <tr>
                        <td>Tunjangan Makan</td>
                        <td style="text-align: right">{{number_format($employeePayslip->meal_allowance, 0, '', '.')}}</td>
                        <td style="text-align: right">{{number_format($employeePayslip->prorate_meal_allowance, 0, '', '.')}}</td>
                    </tr>

                    <tr>
                        <td>Tunjangan Transportasi</td>
                        <td style="text-align: right">{{number_format($employeePayslip->transportation_allowance, 0, '', '.')}}</td>
                        <td style="text-align: right">{{number_format($employeePayslip->prorate_transportation_allowance, 0, '', '.')}}</td>
                    </tr>

                    <tr>
                        <td>Tunjangan Pulsa & Internet</td>
                        <td style="text-align: right">{{number_format($employeePayslip->internet_phone_allowance, 0, '', '.')}}</td>
                        <td style="text-align: right">{{number_format($employeePayslip->prorate_internet_phone_allowance, 0, '', '.')}}</td>
                    </tr>
                    
                    <tr>
                        <td>Tunjangan Jabatan</td>
                        <td style="text-align: right">{{number_format($employeePayslip->positional_allowance, 0, '', '.')}}</td>
                        <td style="text-align: right">{{number_format($employeePayslip->prorate_positional_allowance, 0, '', '.')}}</td>
                    </tr>
                    
                    <tr>
                        <td>Bonus</td>
                        <td style="text-align: right">0</td>
                        <td style="text-align: right">{{number_format($employeePayslip->bonus, 0, '', '.')}}</td>
                    </tr>

                    <tr>
                        <td>THR</td>
                        <td style="text-align: right">0</td>
                        <td style="text-align: right">{{number_format($employeePayslip->thr, 0, '', '.')}}</td>
                    </tr>

                    <tr>
                        <td>Lembur</td>
                        <td style="text-align: right">0</td>
                        <td style="text-align: right">{{number_format($employeePayslip->overtime, 0, '', '.')}}</td>
                    </tr>
                    
                    @php
                        $totalPendapatan1 = $employeePayslip->basic_salary + $employeePayslip->meal_allowance + $employeePayslip->transportation_allowance + $employeePayslip->internet_phone_allowance + $employeePayslip->positional_allowance;
                        $totalPendapatan2 = $employeePayslip->prorate_basic_salary + $employeePayslip->prorate_meal_allowance + $employeePayslip->prorate_transportation_allowance + $employeePayslip->prorate_internet_phone_allowance + $employeePayslip->prorate_positional_allowance + $employeePayslip->bonus + $employeePayslip->thr + $employeePayslip->overtime;
                        $totalPendapatan2excBonusOvertime = $totalPendapatan1 - ($employeePayslip->prorate_basic_salary + $employeePayslip->prorate_meal_allowance + $employeePayslip->prorate_transportation_allowance + $employeePayslip->prorate_internet_phone_allowance + $employeePayslip->prorate_positional_allowance);
                        $totalPengurangan = (($employeeAttendanceNotComplete[0] ?? 0)*50000) + $employeePayslip->deduction  + $totalPendapatan2excBonusOvertime;
                    @endphp

                    <tr style="font-weight: bold;">
                        <td>Total Pendapatan</td>
                        <td style="text-align: right">
                            {{ number_format($totalPendapatan1, 0, '', '.')}}
                        </td>
                        <td style="text-align: right">
                            {{ number_format($totalPendapatan2, 0, '', '.')}}
                        </td>
                    </tr>


                    <tr style="background-color: #ffffff; border: 0px #fff;">
                        <td colspan="3" style="background-color: #ffffff; border: 0px #fff;">
                            &nbsp;
                        </td>
                    </tr>

                    <tr></tr>
                    <tr style="background-color: #d8dde2; color:#000; text-align: center; font-weight: bold">
                        <td>Deduction A</td>
                        <td>Jumlah</td>
                        <td>Jumlah salary yang tidak diperoleh (B)</td>
                    </tr>

                    <tr>
                        <td>Sakit</td>
                        <td style="text-align: right">{{$employeeLeaveSick}}</td>
                        <td style="text-align: right">0</td>
                    </tr>
                    <tr>
                        <td>Alfa</td>
                        <td style="text-align: right">{{ $employeePayslip->total_day_active - $employeePayslip->total_working_day }}</td>
                        <td style="text-align: right">{{number_format($totalPendapatan2excBonusOvertime, 0, '', '.')}}</td>
                    </tr>
                    <tr>
                        <td>Cuti</td>
                        <td style="text-align: right">{{$employeeAnnualLeave}}</td>
                        <td style="text-align: right">0</td>
                    </tr>

                    <tr>
                        <td>Absensi Tidak Lengkap</td>
                        <td style="text-align: right">{{ $employeeAttendanceNotComplete[0] ?? 0 }}</td>
                        <td style="text-align: right">{{number_format((($employeeAttendanceNotComplete[0] ?? 0)*50000), 0, '', '.')}}</td>
                    </tr>

                    @if ($employeePayslip->deduction > 0)
                    
                    <tr>
                        <td>Potongan</td>
                        <td style="text-align: right">1</td>
                        <td style="text-align: right">{{number_format($employeePayslip->deduction, 0, '', '.')}}</td>
                    </tr>

                    @endif
                    
                    <tr style="font-weight: bold;">
                        <td colspan="2">Total Pengurangan</td>
                        <td style="text-align: right">{{number_format($totalPengurangan, 0, '', '.')}}</td>
                    </tr>

                    <tr style="background-color: #ffffff; border: 0px #fff;">
                        <td colspan="3" style="background-color: #ffffff; border: 0px #fff;">
                            &nbsp;
                        </td>
                    </tr>

                    <tr></tr>
                    
                    <tr style="background-color: #d8dde2; color:#000; text-align: center; font-weight: bold">
                        <td>Deduction B</td>
                        <td>Jumlah</td>
                        <td>Jumlah salary yang tidak diperoleh (C)</td>
                    </tr>
                    <tr>
                        <td>Pph 21</td>
                        <td style="text-align: right">0</td>
                        <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                    </tr>
                    <tr>
                        <td>BPJS Kesehatan</td>
                        <td style="text-align: right">0</td>
                        <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                    </tr>
                    <tr>
                        <td>BPJS Tenaga Kerja</td>
                        <td style="text-align: right">0</td>
                        <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                    </tr>
                    <tr>
                        <td>Asuransi Kesehatan</td>
                        <td style="text-align: right">0</td>
                        <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                    </tr>
                    <tr style="font-weight: bold;">
                        <td colspan="2">Total Pengurangan</td>
                        <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                    </tr>

                    <tr style="background-color: #ffffff; border: 0px #fff;">
                        <td colspan="3" style="background-color: #ffffff; border: 0px #fff;">
                            &nbsp;
                        </td>
                    </tr>
                    
                    <tr style=" border: 0px; border-left: 0px; background-color: #ffffff">
                        <td colspan="3" style="border: 0px; border-left: 0px">
                            <span style="font-weight: bold;">
                                Note :
                            </span>
                            {{ $employeePayslip->note }}
                        </td>
                    </tr>
                    <tr style="font-weight: bold; border-right: 0px; border-left: 0px; background-color: #ffffff">
                        <td colspan="3" style="border-right: 0px; border-left: 0px">&nbsp; </td>
                    </tr>

                    <tr style="background-color: #ffffff; border: 0px #fff;">
                        <td colspan="3" style="background-color: #ffffff; border: 0px #fff;">
                            &nbsp;
                        </td>
                    </tr>

                    <tr style="border:0px; background-color: #fff !important;">
                        <td style="background-color: #edeff1;">Gaji yang seharusnya diidapatkan
                            <span style="float: right; font-weight: bold;">
                                {{number_format($totalPendapatan1, 0, '', '.')}}
                            </span>
                        </td>
                        <td style="border:0px"></td>
                        <td style="border:0px"></td>
                    </tr>
                    <tr>
                        <td>Gaji yang dibayarkan 
                            <span style="float: right; font-weight: bold; color:#ec2525">
                                {{number_format($employeePayslip->take_home_pay, 0, '', '.')}}
                            </span>
                        </td>
                        <td style="border:0px"></td>
                        <td style="border:0px; text-align: right">
                            Jakarta, {{ $dateSalary }}
                        </td>
                    </tr>
                </table>
                

            </div>

            <div class="assignment" style="margin-top:30px;">
                <table style="width: 100%;">
                    <tr style="vertical-align: top;">
                        <td style="text-align: center; width: 200px;">
                            <div>Penerima</div>
                            <div style="height: 50px; border-bottom: 1px solid #333;">

                            </div>
                            <div style="margin-top: 7px;">
                                {{ $employee->name }}
                            </div>
                        </td>

                        <td>
                            
                        </td>

                        <td style="text-align: center; width: 100px;">
                            <div>Menyetujui,</div>
                            <div style="height: 30px; ">

                            </div>
                            <div style="margin-top: 10px; font-weight: bolder; ">
                                <span style="border-bottom: 1px solid #333;">
                                    GLENN THEODORE
                                </span>
                                
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>


        @else


        <div style="">

            <div class="page-salary">
                
                <div class="header-salary" style="margin-bottom: 20px;">
                    <table style="width: 100%; position: relative;">
                        <tr>
                            <td style="vertical-align: top; width: 90px;">
                                @php
                                    if($downloadPayslip ==  1){
                                        $logoNSA = public_path('asset\img\logo.png');
                                    }else{
                                        $logoNSA = asset('asset/img/logo.png');
                                    }
                                @endphp
                                <img src="{{ $logoNSA }}" class="align-middle" width="70" alt="LOGO NSA Performance">
                            </td>
                            <td style="text-align: left;">
                                <div style="margin: 0px 10px 5px 10px; font-size: 18px; font-weight: bold; font-family: 'Times New Roman', Georgia, Garamond;">PT. Nosa Jaya Karya</div>
                                <div style="margin: 0px 10px 7px 10px; font-size: 18px; font-weight: bold; font-family: 'Times New Roman', Georgia, Garamond;">NSA Performance</div>
                                <div style="font-size: 12px; margin: 5px 10px;">
                                    Jl. Petojo Bar. VI No.4, RT.11/RW.1, Duri Pulo, Gambir, Jakarta Pusat, 
                                    <br>
                                    Daerah Khusus Jakarta 10140
                                </div>
                            </td>
                        </tr>
                    </table>

                    <div style="text-align: right; position: relative; margin-top:-30px;">
                        <div style="display: inline-block; padding: 5px 30px; font-size: 22px; font-weight: bolder; font-style: italic; border:solid 3px #000; color:#000; font-family: fantasy;">
                            CONFIDENTIAL
                        </div>
                    </div>

                    <div style="margin-top: 25px; line-height: 22px;">
                        <div style="font-size: 12px;">Slip Gaji</div>
                        <div style="font-size: 12px; font-weight: bold">
                            {{ $dateSalary }}
                        </div>
                    </div>
                </div>

                <div class="employee-info">

                    <table style="font-size: 11px; width: 100%; line-height: 18px;">
                        <tr>
                            <td style="width: 24%">ID Karyawan</td>
                            <td style="width: 24%">: {{$employee->employee_niks}}</td>
                            <td style="width: 24%">Department</td>
                            <td style="width: 24%">: {{$employee->division->name_division}}</td>
                        </tr>

                        <tr>
                            <td>Nama Karyawan</td>
                            <td>: {{$employee->name}}</td>
                            <td>Divisi</td>
                            <td>: {{$employee->job->job_name}}</td>
                        </tr>

                        <tr>
                            <td>Status Karyawan</td>
                            <td>: Aktif Bekerja</td>
                            <td>Job Position</td>
                            <td>: {{$employee->job->job_name}}</td>
                        </tr>

                        <tr>
                            <td>Periode Kerja</td>
                            <td>: {{ $workPeriod }}</td>
                            <td>Grade</td>
                            <td>: {{$employee->grade->title}}</td>
                        </tr>

                        <tr>
                            <td></td>
                            <td></td>
                            <td>Nama Bank</td>
                            <td>: {{ $employeePayslip->bank_name }}</td>
                        </tr>

                        

                        <tr>
                            <td>Total wajib kerja tetap (hari)</td>
                            <td>: {{ $employeePayslip->total_day_active }}</td>
                            <td>Nama Penerima</td>
                            <td>: {{$employee->name}}</td>
                        </tr>

                        <tr>
                            <td>Total bekerja bulan ini (Hari)</td>
                            <td>: {{ $employeePayslip->total_working_day }}</td>
                            <td>Nomor Rekening</td>
                            <td>: {{ $employeePayslip->bank_account_number }}</td>
                        </tr>

                    </table>

                </div>

                <div class="salary" style="margin-top: 25px;">
                    <style>
                        .table-salary{
                            width: 100%;
                        }

                        .table-salary, 
                        .table-salary th, 
                        .table-salary td {
                            border-collapse: collapse;
                        }
                        .table-salary td{
                            vertical-align: top;
                            border: 1px solid #777;
                            font-size: 11px;
                            line-height: 18px;
                            padding-left: 7px;
                            padding-right: 7px;
                        }

                        .table-salary tr:nth-child(2n){
                            background-color: #eff3f6;
                        }
                    </style>
                    <table class="table-salary" >
                        <tr></tr>
                        <tr style="background-color: #d8dde2; color:#000; text-align: center; font-weight: bold">
                            <td>Pendapatan Gaji</td>
                            <td>Gaji Original</td>
                            <td>Pendapatan prorate bulan ini (A)</td>
                        </tr>

                        <tr>
                            <td>Gaji Pokok</td>
                            <td style="text-align: right">{{number_format($employeePayslip->basic_salary, 0, '', '.')}}</td>
                            <td style="text-align: right">{{number_format($employeePayslip->prorate_basic_salary, 0, '', '.')}}</td>
                        </tr>

                        <tr>
                            <td>Tunjangan Makan</td>
                            <td style="text-align: right">{{number_format($employeePayslip->meal_allowance, 0, '', '.')}}</td>
                            <td style="text-align: right">{{number_format($employeePayslip->prorate_meal_allowance, 0, '', '.')}}</td>
                        </tr>

                        <tr>
                            <td>Tunjangan Transportasi</td>
                            <td style="text-align: right">{{number_format($employeePayslip->transportation_allowance, 0, '', '.')}}</td>
                            <td style="text-align: right">{{number_format($employeePayslip->prorate_transportation_allowance, 0, '', '.')}}</td>
                        </tr>

                        <tr>
                            <td>Tunjangan Pulsa & Internet</td>
                            <td style="text-align: right">{{number_format($employeePayslip->internet_phone_allowance, 0, '', '.')}}</td>
                            <td style="text-align: right">{{number_format($employeePayslip->prorate_internet_phone_allowance, 0, '', '.')}}</td>
                        </tr>
                        
                        <tr>
                            <td>Tunjangan Jabatan</td>
                            <td style="text-align: right">{{number_format($employeePayslip->positional_allowance, 0, '', '.')}}</td>
                            <td style="text-align: right">{{number_format($employeePayslip->prorate_positional_allowance, 0, '', '.')}}</td>
                        </tr>
                        
                        <tr>
                            <td>Bonus</td>
                            <td style="text-align: right">0</td>
                            <td style="text-align: right">{{number_format($employeePayslip->bonus, 0, '', '.')}}</td>
                        </tr>

                        <tr>
                            <td>THR</td>
                            <td style="text-align: right">0</td>
                            <td style="text-align: right">{{number_format($employeePayslip->thr, 0, '', '.')}}</td>
                        </tr>

                        <tr>
                            <td>Lembur</td>
                            <td style="text-align: right">0</td>
                            <td style="text-align: right">{{number_format($employeePayslip->overtime, 0, '', '.')}}</td>
                        </tr>
                        
                        @php
                            $totalPendapatan1 = $employeePayslip->basic_salary + $employeePayslip->meal_allowance + $employeePayslip->transportation_allowance + $employeePayslip->internet_phone_allowance + $employeePayslip->positional_allowance;
                            $totalPendapatan2 = $employeePayslip->prorate_basic_salary + $employeePayslip->prorate_meal_allowance + $employeePayslip->prorate_transportation_allowance + $employeePayslip->prorate_internet_phone_allowance + $employeePayslip->prorate_positional_allowance + $employeePayslip->bonus + $employeePayslip->thr + $employeePayslip->overtime;
                            $totalPendapatan2excBonusOvertime = $totalPendapatan1 - $employeePayslip->prorate_basic_salary + $employeePayslip->prorate_meal_allowance + $employeePayslip->prorate_transportation_allowance + $employeePayslip->prorate_internet_phone_allowance + $employeePayslip->prorate_positional_allowance;
                            $totalPengurangan = (($employeeAttendanceNotComplete[0] ?? 0)*50000) + $employeePayslip->deduction  + $totalPendapatan2excBonusOvertime;
                        @endphp

                        <tr style="font-weight: bold;">
                            <td>Total Pendapatan</td>
                            <td style="text-align: right">
                                {{ number_format($totalPendapatan1, 0, '', '.')}}
                            </td>
                            <td style="text-align: right">
                                {{ number_format($totalPendapatan2, 0, '', '.')}}
                            </td>
                        </tr>
 

                        <tr style="background-color: #ffffff; border: 0px #fff;">
                            <td colspan="3" style="background-color: #ffffff; border: 0px #fff;">
                                &nbsp;
                            </td>
                        </tr>

                        <tr></tr>
                        <tr style="background-color: #d8dde2; color:#000; text-align: center; font-weight: bold">
                            <td>Deduction A</td>
                            <td>Jumlah</td>
                            <td>Jumlah salary yang tidak diperoleh (B)</td>
                        </tr>

                        <tr>
                            <td>Sakit</td>
                            <td style="text-align: right">{{$employeeLeaveSick}}</td>
                            <td style="text-align: right">0</td>
                        </tr>
                        <tr>
                            <td>Alfa</td>
                            <td style="text-align: right">{{ $employeePayslip->total_day_active - $employeePayslip->total_working_day }}</td>
                            <td style="text-align: right">{{number_format($totalPendapatan2excBonusOvertime, 0, '', '.')}}</td>
                        </tr>
                        <tr>
                            <td>Cuti</td>
                            <td style="text-align: right">{{$employeeAnnualLeave}}</td>
                            <td style="text-align: right">0</td>
                        </tr>
                        <tr>
                            <td>Absensi Tidak Lengkap</td>
                            <td style="text-align: right">0</td>
                            <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                        </tr>
                        @if ($employeePayslip->deduction > 0)
                    
                        <tr>
                            <td>Potongan</td>
                            <td style="text-align: right">1</td>
                            <td style="text-align: right">{{number_format($employeePayslip->deduction, 0, '', '.')}}</td>
                        </tr>

                        @endif
                        <tr style="font-weight: bold;">
                            <td colspan="2">Total Pengurangan</td>
                            <td style="text-align: right">{{number_format($totalPengurangan, 0, '', '.')}}</td>
                        </tr>

                        <tr style="background-color: #ffffff; border: 0px #fff;">
                            <td colspan="3" style="background-color: #ffffff; border: 0px #fff;">
                                &nbsp;
                            </td>
                        </tr>

                        <tr></tr>
                        
                        <tr style="background-color: #d8dde2; color:#000; text-align: center; font-weight: bold">
                            <td>Deduction B</td>
                            <td>Jumlah</td>
                            <td>Jumlah salary yang tidak diperoleh (C)</td>
                        </tr>
                        <tr>
                            <td>Pph 21</td>
                            <td style="text-align: right">0</td>
                            <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                        </tr>
                        <tr>
                            <td>BPJS Kesehatan</td>
                            <td style="text-align: right">0</td>
                            <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                        </tr>
                        <tr>
                            <td>BPJS Tenaga Kerja</td>
                            <td style="text-align: right">0</td>
                            <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                        </tr>
                        <tr>
                            <td>Asuransi Kesehatan</td>
                            <td style="text-align: right">0</td>
                            <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                        </tr>
                        <tr style="font-weight: bold;">
                            <td colspan="2">Total Pengurangan</td>
                            <td style="text-align: right">{{number_format(0, 0, '', '.')}}</td>
                        </tr>

                        <tr style="background-color: #ffffff; border: 0px #fff;">
                            <td colspan="3" style="background-color: #ffffff; border: 0px #fff;">
                                &nbsp;
                            </td>
                        </tr>
                        
                        <tr style="font-weight: bold; border: 0px; border-left: 0px; background-color: #ffffff">
                            <td colspan="3" style="border: 0px; border-left: 0px">Note : </td>
                        </tr>
                        <tr style="font-weight: bold; border-right: 0px; border-left: 0px; background-color: #ffffff">
                            <td colspan="3" style="border-right: 0px; border-left: 0px">&nbsp; </td>
                        </tr>

                        <tr style="background-color: #ffffff; border: 0px #fff;">
                            <td colspan="3" style="background-color: #ffffff; border: 0px #fff;">
                                &nbsp;
                            </td>
                        </tr>

                        <tr style="border:0px; background-color: #fff !important;">
                            <td style="background-color: #edeff1;">Gaji yang seharusnya diidapatkan
                                <span style="float: right; font-weight: bold;">
                                    {{number_format($totalPendapatan1, 0, '', '.')}}
                                </span>
                            </td>
                            <td style="border:0px"></td>
                            <td style="border:0px"></td>
                        </tr>
                        <tr>
                            <td>Gaji yang dibayarkan
                                <span style="float: right; font-weight: bold; color:#ec2525">
                                    {{number_format($totalPendapatan2, 0, '', '.')}}
                                </span>
                            </td>
                            <td style="border:0px"></td>
                            <td style="border:0px; text-align: right">
                                Jakarta, {{ $dateSalary }}
                            </td>
                        </tr>
                    </table>
                    

                </div>

                <div class="assignment" style="margin-top:30px;">
                    <table style="width: 100%;">
                        <tr style="vertical-align: top;">
                            <td style="text-align: center; width: 200px;">
                                <div>Penerima</div>
                                <div style="height: 70px; border-bottom: 1px solid #333;">

                                </div>
                                <div style="margin-top: 7px;">
                                    {{ $employee->name }}
                                </div>
                            </td>

                            <td>
                                
                            </td>

                            <td style="text-align: center; width: 200px;">
                                <div>Menyetujui,</div>
                                <div style="height: 40px; ">

                                </div>
                                <div style="margin-top: 10px; font-weight: bolder; ">
                                    <span style="border-bottom: 1px solid #333;">
                                        GLENN THEODORE
                                    </span>
                                    
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

            </div>

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