/**
 * App JavaScript File
 * 
 * File ini dibuat untuk mengatasi error 404 pada saat mengakses halaman project
 * File ini dapat diisi dengan fungsi-fungsi JavaScript yang dibutuhkan
 */

// Fungsi untuk inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    
    // Inisialisasi fungsi umum
    initCommonFunctions();
});

// Fungsi umum yang bisa digunakan di seluruh aplikasi
function initCommonFunctions() {
    // Setup untuk AJAX dengan CSRF token
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });
    
    // Fungsi untuk menampilkan notifikasi
    window.showNotification = function(message, type = 'success') {
        // Implementasi notifikasi bisa ditambahkan di sini
        console.log(`${type}: ${message}`);
    };
    
    // Fungsi untuk format tanggal - menggunakan format "22 August 2025"
    window.formatDate = function(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString || '';
        const day = date.getDate();
        const months = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${monthName} ${year}`;
    };
}

// Fungsi untuk konfirmasi sebelum delete
window.confirmDelete = function(message = 'Are you sure you want to delete this item?') {
    return confirm(message);
};

// Fungsi untuk loading state
window.showLoading = function(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }
    }
};

// Fungsi untuk hide loading state
window.hideLoading = function(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
        }
    }
};
