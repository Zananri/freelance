<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Reset Password</title>
    <link rel="icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">
    <link rel="shortcut icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">
    <link rel="stylesheet" href="{{ asset('asset/css/reset_password.css') }}">
    <link rel="stylesheet" href="{{ asset('asset/css/guest-alert.css') }}">
</head>

<body>

    <div class="reset-password-page">
        <div class="reset-container">

            <div class="logo-wrap">
                <img src="{{ asset('asset/img/logo.png') }}" width="70" alt="LOGO">
            </div>

            <div class="login-box-form w-100 mb-5">
                <div class="mb-3 head-form text-center">
                    <h2 class="title">Reset Password</h2>
                </div>

                <form method="POST" action="{{ url('/reset-password') }}" autocomplete="off">
                    @csrf
                    <input type="hidden" name="token" value="{{ $token ?? old('token') }}">

                    <div class="mb-3 d-flex align-items-center">
                        <div class="email-display">
                            <span class="text-secondary">Email:</span>
                            {{ old('email', $email ?? '') }}
                        </div>
                        <input type="hidden" name="email" value="{{ old('email', $email ?? '') }}">
                    </div>

                    <div class="mb-3 input-custom">
                        <input type="password" name="password" class="form-control form-input"
                            placeholder="New password" required>
                        @error('password')
                            <div class="text-danger fs-12 mt-1">{{ $message }}</div>
                        @enderror
                    </div>

                    <div class="mb-3 input-custom">
                        <input type="password" name="password_confirmation" class="form-control form-input"
                            placeholder="Confirm password" required>
                        @error('password_confirmation')
                            <div class="text-danger fs-12 mt-1">{{ $message }}</div>
                        @enderror
                    </div>

                    <button type="submit" class="btn btn-submit-black w-100 mb-2">Reset Password</button>
                </form>
            </div>

        </div>
    </div>

</body>

<!-- If controller passed a status_message, show floating alert and then redirect (guest-alert handles redirect if data attr present) -->
@if (!empty($status_message ?? ''))
    <div class="box-alert-messages" id="guestFloatingAlert" data-guest-message="{{ e($status_message) }}"
        data-guest-type="success" data-guest-delay="2500"
        data-guest-redirect="{{ e($redirect_to ?? route('login')) }}">
        <div class="box-message" role="">
            <div class="message-content fs-14">{{ $status_message }}</div>
            <div class="btn-close-alert-messages" aria-hidden="true"></div>
        </div>
    </div>
    <script src="{{ asset('asset/js/guest-alert.js') }}"></script>
@endif

</html>
