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

        // // Geolocation script
        // document.addEventListener('DOMContentLoaded', () => {
        //     // Create geolocation UI elements
        //     const geolocationContainer = document.createElement('div');
        //     geolocationContainer.innerHTML = `
        //         <div id="geolocation-section" class="mb-3">
        //             <div id="loading" class="text-center">
        //                 <div class="spinner-border text-primary" role="status">
        //                     <span class="visually-hidden">Loading...</span>
        //                 </div>
        //                 <p class="mt-2 mb-0">Mengambil lokasi Anda...</p>
        //             </div>
                    
        //             <div id="location-info" class="hidden">
        //                 <div class="alert alert-info">
        //                     <strong>Lokasi Terdeteksi:</strong><br>
        //                     Latitude: <span id="latitude">-</span><br>
        //                     Longitude: <span id="longitude">-</span>
        //                 </div>
        //             </div>
                    
        //             <div id="error-message" class="hidden">
        //                 <div class="alert alert-danger">
        //                     <strong>Error:</strong> <span id="error-text">-</span>
        //                 </div>
        //             </div>
        //         </div>
        //     `;
            
        //     // Insert after login form title
        //     const loginForm = document.querySelector('.login-box-form');
        //     if (loginForm) {
        //         loginForm.insertBefore(geolocationContainer, loginForm.children[1]);
        //     }

        //     // Add CSS for hidden class
        //     const style = document.createElement('style');
        //     style.textContent = `
        //         .hidden { display: none !important; }
        //         #geolocation-section { margin-bottom: 20px; }
        //     `;
        //     document.head.appendChild(style);

        //     const loadingElement = document.getElementById('loading');
        //     const locationInfoElement = document.getElementById('location-info');
        //     const latitudeElement = document.getElementById('latitude');
        //     const longitudeElement = document.getElementById('longitude');
        //     const errorElement = document.getElementById('error-message');
        //     const errorTextElement = document.getElementById('error-text');

        //     function showLocation(position) {
        //         loadingElement.classList.add('hidden');
        //         locationInfoElement.classList.remove('hidden');

        //         const latitude = position.coords.latitude;
        //         const longitude = position.coords.longitude;

        //         latitudeElement.textContent = latitude.toFixed(6);
        //         longitudeElement.textContent = longitude.toFixed(6);
                
        //         // Store location in hidden inputs for form submission
        //         const latInput = document.createElement('input');
        //         latInput.type = 'hidden';
        //         latInput.name = 'latitude';
        //         latInput.value = latitude;
                
        //         const lngInput = document.createElement('input');
        //         lngInput.type = 'hidden';
        //         lngInput.name = 'longitude';
        //         lngInput.value = longitude;
                
        //         const loginForm = document.querySelector('form');
        //         if (loginForm) {
        //             loginForm.appendChild(latInput);
        //             loginForm.appendChild(lngInput);
        //         }
        //     }

        //     function showError(error) {
        //         loadingElement.classList.add('hidden');
        //         errorElement.classList.remove('hidden');
                
        //         let errorMessage = '';
        //         switch(error.code) {
        //             case error.PERMISSION_DENIED:
        //                 errorMessage = "Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser Anda.";
        //                 break;
        //             case error.POSITION_UNAVAILABLE:
        //                 errorMessage = "Informasi lokasi tidak tersedia saat ini.";
        //                 break;
        //             case error.TIMEOUT:
        //                 errorMessage = "Permintaan untuk mendapatkan lokasi Anda habis waktu.";
        //                 break;
        //             default:
        //                 errorMessage = "Terjadi kesalahan yang tidak diketahui saat mendapatkan lokasi.";
        //                 break;
        //         }
        //         errorTextElement.textContent = errorMessage;
                
        //         // Tampilkan pesan kesalahan di console
        //         console.error(`Error code: ${error.code}, Message: ${errorMessage}`);
        //     }

        //     // Minta lokasi pengguna
        //     if (navigator.geolocation) {
        //         navigator.geolocation.getCurrentPosition(showLocation, showError);
        //     } else {
        //         loadingElement.classList.add('hidden');
        //         errorElement.classList.remove('hidden');
        //         errorTextElement.textContent = "Geolocation tidak didukung oleh browser Anda.";
        //     }
        // });
    </script>


</x-guest-layout>
