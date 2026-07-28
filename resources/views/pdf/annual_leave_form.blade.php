<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Formulir Permohonan Cuti</title>
    <style>
        @page { margin: 28px 38px; }
        body {
            color: #172033;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.45;
        }
        .header {
            border-bottom: 3px solid #179bff;
            margin-bottom: 20px;
            padding-bottom: 12px;
            text-align: center;
        }
        .header h1 { font-size: 18px; margin: 0 0 3px; }
        .header p { color: #53627a; font-size: 11px; margin: 0; }
        .intro { margin-bottom: 10px; }
        .data-table { border-collapse: collapse; margin-bottom: 16px; width: 100%; }
        .data-table td {
            border-bottom: 1px solid #dce3ed;
            padding: 7px 5px;
            vertical-align: top;
        }
        .data-table .label { color: #53627a; width: 25%; }
        .data-table .colon { width: 2%; }
        .data-table .value { font-weight: bold; }
        .leave-box {
            background: #f4f9ff;
            border: 1px solid #cfe8ff;
            border-radius: 7px;
            margin: 8px 0 17px;
            padding: 12px 14px;
        }
        .leave-box table { border-collapse: collapse; width: 100%; }
        .leave-box td { padding: 4px; }
        .section-title {
            color: #0879cf;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .reason {
            border: 1px solid #dce3ed;
            min-height: 52px;
            padding: 9px;
        }
        .statement { margin: 17px 0 8px; }
        .signature-table { border-collapse: collapse; margin-top: 12px; width: 100%; }
        .signature-table td { text-align: center; vertical-align: top; width: 33.33%; }
        .signature-space { height: 78px; }
        .signature-image { max-height: 70px; max-width: 150px; }
        .signature-name { border-top: 1px solid #667085; font-weight: bold; padding-top: 4px; }
        .signature-role { color: #667085; font-size: 9px; }
        .notes {
            background: #f8fafc;
            border-left: 3px solid #179bff;
            color: #53627a;
            font-size: 8.5px;
            margin-top: 20px;
            padding: 8px 10px;
        }
        .notes ol { margin: 4px 0 0 15px; padding: 0; }
        .document-id { color: #98a2b3; font-size: 8px; margin-top: 8px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FORMULIR PERMOHONAN CUTI</h1>
        <p>PT SEKAR GLOBAL SOLUSINDO</p>
    </div>

    <div class="intro">Yang bertanda tangan di bawah ini:</div>

    <table class="data-table">
        <tr>
            <td class="label">Nama</td><td class="colon">:</td>
            <td class="value">{{ $employee->name }}</td>
        </tr>
        <tr>
            <td class="label">Jabatan</td><td class="colon">:</td>
            <td class="value">{{ optional($employee->job)->job_name ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Lokasi Penempatan</td><td class="colon">:</td>
            <td class="value">{{ optional($employee->division)->name_division ?: ($employee->region ?: '-') }}</td>
        </tr>
        <tr>
            <td class="label">Jenis Cuti</td><td class="colon">:</td>
            <td class="value">Cuti Tahunan</td>
        </tr>
        <tr>
            <td class="label">No. Telepon</td><td class="colon">:</td>
            <td class="value">{{ $contactPhone }}</td>
        </tr>
    </table>

    <div class="section-title">Rentang Waktu Cuti</div>
    <div class="leave-box">
        <table>
            <tr>
                <td><strong>Mulai:</strong> {{ $startDate->locale('id')->translatedFormat('d F Y') }}</td>
                <td><strong>Selesai:</strong> {{ $endDate->locale('id')->translatedFormat('d F Y') }}</td>
                <td><strong>Jumlah:</strong> {{ $dayAmount }} hari</td>
            </tr>
        </table>
    </div>

    <div class="section-title">Keperluan / Alasan Cuti</div>
    <div class="reason">{{ $reason }}</div>

    <div class="statement">
        Demikian permohonan cuti ini saya sampaikan untuk dapat diproses sebagaimana mestinya.
    </div>

    <div style="text-align:right; margin: 13px 15px 0 0;">
        Jakarta, {{ $submittedAt->locale('id')->translatedFormat('d F Y') }}
    </div>

    <table class="signature-table">
        <tr>
            <td>Hormat Saya,</td>
            <td>Menyetujui,</td>
            <td>Verifikasi,</td>
        </tr>
        <tr>
            <td class="signature-space"><img class="signature-image" src="{{ $signatureData }}" alt="Tanda tangan"></td>
            <td class="signature-space"></td>
            <td class="signature-space"></td>
        </tr>
        <tr>
            <td><div class="signature-name">{{ $employee->name }}</div><div class="signature-role">Nama Pegawai</div></td>
            <td><div class="signature-name">&nbsp;</div><div class="signature-role">Atasan Langsung Pegawai</div></td>
            <td><div class="signature-name">&nbsp;</div><div class="signature-role">HR PT Sekar Global Solusindo</div></td>
        </tr>
    </table>

    <div class="notes">
        <strong>Catatan:</strong>
        <ol>
            <li>Karyawan mengajukan permohonan cuti kepada atasan langsung paling lambat 7 hari kalender sebelum pelaksanaan cuti, kecuali dalam keadaan mendesak.</li>
            <li>Atasan langsung memberikan persetujuan atau penolakan paling lambat 2 hari kerja sejak permohonan diterima.</li>
            <li>HR melakukan verifikasi sisa hak cuti dan kelengkapan administrasi melalui sistem.</li>
            <li>Status permohonan dapat dilihat oleh karyawan melalui sistem.</li>
        </ol>
    </div>

    <div class="document-id">Dibuat otomatis oleh sistem pada {{ $submittedAt->format('d-m-Y H:i') }}</div>
</body>
</html>
