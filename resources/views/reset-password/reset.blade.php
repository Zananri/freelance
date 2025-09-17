<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Reset Password</title>
    <link rel="stylesheet" href="{{ asset('asset/css/reset_password.css') }}">
    <link rel="stylesheet" href="{{ asset('asset/css/guest-alert.css') }}">
    <link rel="stylesheet" href="{{ asset('asset/css/guest-alert-reset.css') }}">
    <!-- If you use Bootstrap in the project, this view keeps compatibility. -->
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
                        <h2 class="title">Reset Password</h2>
                        <p class="fs-14 text-black text-opacity-75">Set a new password for your account</p>
                    </div>

                    <form method="POST" action="{{ url('/reset-password') }}" autocomplete="off">
                        @csrf
                        <input type="hidden" name="token" value="{{ $token ?? old('token') }}">

                        <div class="mb-3">
                            <input type="email" name="email" class="form-control form-input bg-white bg-opacity-75" placeholder="Email" value="{{ old('email', $email ?? '') }}" required>
                        </div>

                        <div class="mb-3">
                            <input type="password" name="password" class="form-control form-input bg-white bg-opacity-75" placeholder="New password" required>
                        </div>

                        <div class="mb-4">
                            <input type="password" name="password_confirmation" class="form-control form-input bg-white bg-opacity-75" placeholder="Confirm password" required>
                        </div>

                        <button type="submit" class="btn btn-submit-black w-100 mb-2">Reset Password</button>
                    </form>
                </div>

            </div>
        </div>
    </div>

</body>
</html>

<!-- If controller passed a status_message, show floating alert and then redirect (guest-alert handles redirect if data attr present) -->
@if(!empty($status_message ?? ''))
    <div class="box-alert-messages" id="guestFloatingAlert"
         data-guest-message="{{ e($status_message) }}"
         data-guest-type="success"
         data-guest-delay="2500"
         data-guest-redirect="{{ e($redirect_to ?? route('login')) }}">
        <div class="box-message" role="">
            <div class="message-content fs-14">{{ $status_message }}</div>
            <div class="btn-close-alert-messages" aria-hidden="true"></div>
        </div>
    </div>
    <script src="{{ asset('asset/js/guest-alert.js') }}"></script>
@endif
