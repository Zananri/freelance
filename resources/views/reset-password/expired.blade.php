<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Link Expired</title>
    <link rel="icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">
    <link rel="shortcut icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">
    <link rel="stylesheet" href="{{ asset('asset/css/reset_password.css') }}">
    <link rel="stylesheet" href="{{ asset('asset/css/guest-alert.css') }}">
</head>

<body>

    <div class="reset-password-page">
        <div class="card-reset">
            <div class="login-container">

                <div class="logo-wrap">
                    <img src="{{ asset('asset/img/logo.png') }}" width="70" alt="LOGO NSA Performance">
                </div>

                <div class="login-box-form w-100 mb-5">
                    <div class="mb-3 head-form">
                        <h2 class="title">Link Expired</h2>
                        <p class="fs-14 text-black text-opacity-75">This password reset link has expired or is invalid.
                        </p>
                    </div>

                    <div class="mb-3 expired-footer d-flex flex-column align-items-center justify-content-center text-center">
                        <p class="fs-14 text-black text-opacity-75 mb-5">
                            Please request a new password reset link.
                        </p>
                        <a href="{{ url('forgot-password') }}" class="btn expired-link w-100 mb-2">
                            Request New Reset
                        </a>
                    </div>

                </div>

            </div>
        </div>
    </div>

</body>

</html>
