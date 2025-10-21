<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project Notification</title>
  <style>
    .button {
      display: inline-block;
      padding: 10px 18px;
      background-color: #1f93ff;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
    }
    .card { max-width:700px; margin:20px auto; font-family: Arial, Helvetica, sans-serif; }
    .header { background:#f6f8fa; padding:12px; border-bottom:1px solid #e1e4e8 }
    .body { padding:18px }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <strong>Project Notification</strong>
    </div>
    <div class="body">
      <p>Halo,</p>

      <p>
        Ada pembaruan proyek: <strong>{{ $project->title ?? 'Untitled project' }}</strong>.
      </p>

      @if(!empty($project->description))
      <p>{{ Str::limit(strip_tags($project->description), 200) }}</p>
      @endif

      <p>
        <a href="{{ $url }}" class="button">See Project</a>
      </p>

      <p>Jika tombol tidak berfungsi, buka link ini: <br>
        <a href="{{ $url }}">{{ $url }}</a>
      </p>

      <p>Salam,<br>
      Tim NSA Office</p>
    </div>
  </div>
</body>
</html>
