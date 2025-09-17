(function(){
    // Public function to show a floating alert on guest pages
    function showGuestAlert(message, messageType, delayMs){
        if(!message) return;
        // Prefer global helper if available
        if(typeof window.showAlertMsg === 'function'){
            try{ window.showAlertMsg(message, messageType || 'light', delayMs || 2500); return; }catch(e){}
        }

        var container = document.getElementById('guestFloatingAlert');
        if(!container) return;
        var box = container.querySelector('.box-message');
        var content = container.querySelector('.message-content');
        content.innerHTML = message;
        box.classList.remove('success','warning','error');
        if((messageType||'').toLowerCase() === 'success' || (messageType||'').toLowerCase() === 'light') box.classList.add('success');
        else if((messageType||'').toLowerCase() === 'warning' || (messageType||'').toLowerCase() === 'warn') box.classList.add('warning');
        else box.classList.add('error');

        container.style.display = 'block';

        var closeBtn = container.querySelector('.btn-close-alert-messages');
        if(closeBtn){ closeBtn.addEventListener('click', function(){ container.style.display = 'none'; }); }

        setTimeout(function(){
            try{ container.style.transition = 'opacity 0.25s ease'; container.style.opacity = '0'; setTimeout(function(){ container.style.display='none'; container.style.opacity = ''; }, 250);}catch(e){}
        }, delayMs || 2500);
    }

    // Expose globally for inline usage if necessary
    window.showGuestAlert = showGuestAlert;

    // Auto-run on DOM ready: look for server-rendered data attributes
    document.addEventListener('DOMContentLoaded', function(){
        try{
            var el = document.getElementById('guestFloatingAlert');
            if(!el) return;
            var msg = el.getAttribute('data-guest-message');
            var type = el.getAttribute('data-guest-type');
            var redirect = el.getAttribute('data-guest-redirect');
            var delay = parseInt(el.getAttribute('data-guest-delay')) || 2500;
            if(msg){
                showGuestAlert(msg, type, delay);
                // If redirect is provided, perform it after delay + small buffer
                if(redirect){
                    setTimeout(function(){ try{ window.location.href = redirect; }catch(e){} }, delay + 300);
                }
            }
        }catch(e){}
    });
})();
