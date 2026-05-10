<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Project Notification</title>
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
                <h2 style="margin:0;color:#2b3946">ACER</h2>
            </div>

            <h3>Hello!</h3>
            <p class="muted">You are receiving this email because a new project has been assigned to you.</p>

            <p>
                <a href="{{ $url }}"
                    style="color:#fff !important; background: #444; text-decoration: none; padding: 10px 18px;">View
                    Project</a>
            </p>

            <p class="muted">Please review the project details and take the necessary actions.</p>

            <p>Best regards,<br>ACER</p>
        </div>
</body>

</html>
