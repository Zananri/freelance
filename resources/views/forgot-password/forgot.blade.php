<x-guest-layout>

    <div class="login-wrapper">
        <div class="login-container">

            <div class="text-center mb-5">
                <img src="{{ asset('asset/img/logo.png') }}" width="70" alt="LOGO NSA Performance">
            </div>

            <div class="login-box-form w-100 mb-5">
                <div class="text-center">
                    <h2>Forgot Password</h2>
                    <p class="fs-14 text-black text-opacity-75">Please enter email below</p>
                </div>

                <form method="POST" action="{{ route('forgot-password.post') }}" autocomplete="off">
                    @csrf
                    <div class="mb-3">
                        <input type="text" name="email" class="form-control form-input bg-white bg-opacity-75"
                            placeholder="Email" autocomplete="false" value="{{ old('email') }}">
                        @error('email')
                            <div class="text-danger fs-12 mt-1">{{ $message }}</div>
                        @enderror
                    </div>
                    <button type="submit" class="btn btn-submit w-100 mb-5 ">Submit</button>
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
    <style>
        /* Minimal styles copied from office.css for the floating alert so guest pages can reuse same appearance */
        .box-alert-messages { position: fixed; display: none; bottom: 20px; left: calc(50% - 250px); width: 500px; z-index: 99999; }
        @media (max-width: 567px) { .box-alert-messages { left: 20px; width: calc(100% - 40px); } }
        .box-alert-messages .box-message { position: relative; border: 0px; background-color: #f2f7fa; padding: 17px 48px 17px 17px; min-height: 55px; box-shadow: 0px 10px 35px rgba(0,0,0,0.07), 0px 3px 5px rgba(0,0,0,0.1); border-radius: 15px; }
        .box-alert-messages .box-message.success { background-color: #cef4e0; }
        .box-alert-messages .box-message.warning { background-color: #f5ebcf; }
        .box-alert-messages .box-message.error { background-color: #d2224b; }
        .box-alert-messages .box-message.error .message-content { color: #ffffff; }
        .box-alert-messages .btn-close-alert-messages { position: absolute; display: inline-block; top: 20px; right: 20px; padding: 6px 6px; height: 5px; width: 5px; opacity: 0.5; cursor: pointer; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e"); }
        .box-alert-messages .btn-close-alert-messages:hover { opacity: 1; }
    </style>

    <!-- Floating alert markup (self-contained for guest pages) -->
    <div class="box-alert-messages" id="guestFloatingAlert">
        <div class="box-message" role="">
            <div class="message-content fs-14"></div>
            <div class="btn-close-alert-messages" aria-hidden="true"></div>
        </div>
    </div>

    <script>
        (function(){
            // Read possible flash messages from session (common keys)
            var message = {!! json_encode(session('success') ?? session('status') ?? session('message') ?? null) !!};
            var messageType = {!! json_encode(session('status_type') ?? (session('success') ? 'success' : 'light')) !!};

            // If there's no message, do nothing
            if (!message) return;

            // If global showAlertMsg exists (from office.js), prefer it
            if (typeof window.showAlertMsg === 'function') {
                try { window.showAlertMsg(message, messageType, 2500); } catch(e) { /* ignore */ }
                return;
            }

            // Otherwise show the local floating alert
            var container = document.getElementById('guestFloatingAlert');
            if (!container) return;
            var box = container.querySelector('.box-message');
            var content = container.querySelector('.message-content');
            content.innerHTML = message;
            // set class according to type
            box.classList.remove('success','warning','error');
            if (messageType === 'success' || messageType === 'light') box.classList.add('success');
            else if (messageType === 'warning' || messageType === 'warn') box.classList.add('warning');
            else box.classList.add('error');

            // show
            container.style.display = 'block';

            // close handler
            var closeBtn = container.querySelector('.btn-close-alert-messages');
            if (closeBtn) closeBtn.addEventListener('click', function(){ container.style.display = 'none'; });

            // auto hide after 2.5s
            setTimeout(function(){
                container.style.transition = 'opacity 0.25s ease';
                container.style.opacity = '0';
                setTimeout(function(){ try{ container.style.display = 'none'; container.style.opacity = ''; }catch(e){} }, 250);
            }, 2500);
        })();
    </script>


</x-guest-layout>
