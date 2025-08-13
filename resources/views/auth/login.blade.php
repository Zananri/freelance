<x-guest-layout>

    <div class="login-wrapper">
        <div class="login-container">
            <div class="text-center mb-5">
                <img src="{{ asset('asset/img/logo.png') }}" width="70" alt="LOGO NSA Performance">
            </div>



            <div class="login-box-form w-100">
                <div class="text-center">
                    <h2>Welcome Back</h2>
                    <p class="fs-14 text-black text-opacity-75">Please enter log in details below</p>
                </div>

                <form method="POST" action="{{ route('login') }}" autocomplete="off">
                    @csrf
                    <div class="mb-3">
                        <input type="text" name="email" class="form-control form-input bg-white bg-opacity-75"
                            placeholder="Email" autocomplete="false" value="{{ old('email') }}">
                        @error('email')
                            <div class="text-danger fs-12 mt-1">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="mb-3">
                        <input type="password" name="password" class="form-control form-input bg-white bg-opacity-75"
                            placeholder="Password" autocomplete="new-password">
                        @error('password')
                            <div class="text-danger fs-12 mt-1">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="mb-3 text-end">
                        <a href="{{ url('forgot-password') }}"
                            class="text-black text-link text-opacity-75 fs-14 text-decoration-none">Forgot password
                            ?</a>
                    </div>
                    <button type="submit" class="btn btn-submit w-100 ">Submit</button>
                </form>
            </div>



        </div>
    </div>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"
        integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous">
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.min.js"
        integrity="sha384-RuyvpeZCxMJCqVUGFI0Do1mQrods/hhxYlcVfGPOfQtPJh0JCw12tUAZ/Mv10S7D" crossorigin="anonymous">
    </script>
    <script>
          // Auto dismiss alert after 1.5 seconds
        setTimeout(function() {
            const alertContainer = document.querySelector('.alert-success');
            if (alertContainer) {
                alertContainer.style.transition = 'opacity 0.5s ease';
                alertContainer.style.opacity = '0';
                setTimeout(() => alertContainer.remove(), 500);
            }
        }, 1500);
    </script>


</x-guest-layout>
