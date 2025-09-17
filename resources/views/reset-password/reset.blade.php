<x-guest-layout>

    <div class="login-wrapper">
        <div class="login-container">

            <div class="text-center mb-5">
                <img src="{{ asset('asset/img/logo.png') }}" width="70" alt="LOGO NSA Performance">
            </div>

            <div class="login-box-form w-100 mb-5">
                <div class="text-center">
                    <h2 class="mb-1">Reset Password</h2>
                    <p class="fs-14 text-black text-opacity-75">Set a new password for your account</p>
                </div>

                @if (session('status'))
                    <div class="alert alert-success">{{ session('status') }}</div>
                @endif

                @if ($errors->any())
                    <div class="alert alert-danger">
                        <ul class="mb-0">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <form method="POST" action="{{ route('password.update') }}" autocomplete="off">
                    @csrf

                    <input type="hidden" name="token" value="{{ $token ?? '' }}">

                    <div class="mb-3">
                        <input type="email" name="email" class="form-control form-input bg-white bg-opacity-75"
                            placeholder="Email" value="{{ old('email', $email ?? '') }}" required>
                    </div>

                    <div class="mb-3">
                        <input type="password" name="password" class="form-control form-input bg-white bg-opacity-75"
                            placeholder="New password" required>
                    </div>

                    <div class="mb-4">
                        <input type="password" name="password_confirmation" class="form-control form-input bg-white bg-opacity-75"
                            placeholder="Confirm password" required>
                    </div>

                    <button type="submit" class="btn btn-submit w-100 mb-2">Reset Password</button>
                </form>
            </div>

        </div>
    </div>

</x-guest-layout>
