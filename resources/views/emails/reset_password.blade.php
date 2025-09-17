<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#eef6fb; color:#566172; }
    .container{max-width:700px;margin:40px auto;background:#fff;padding:40px;border-radius:4px}
    .brand{ text-align:center; margin-bottom:20px }
    .button{ display:inline-block;background:#2b3946;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none }
    .muted{ color:#97a0ab }
  </style>
</head>
<body>
  <div style="background:#e9f0f4;padding:40px 0">
    <div class="container">
      <div class="brand">
        <h2 style="margin:0;color:#2b3946">NSA Performance</h2>
      </div>

      <h3>Hello!</h3>
      <p class="muted">You are receiving this email because we received a password reset request for your account.</p>

      <p style="text-align:center;margin:30px 0"><a href="{{ $url }}" class="button">Reset Password</a></p>

      <p class="muted">This password reset link will expire in 60 minutes.</p>
      <p class="muted">If you did not request a password reset, no further action is required.</p>

      <p>Regards,<br>NSA Performance</p>

      <hr>
      <p class="muted">If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser: <br>
      <a href="{{ $url }}">{{ $url }}</a></p>
    </div>
  </div>
</body>
</html>