/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

(() => {
    'use strict'
  
    const savedStateSidebar = localStorage.getItem('sidebarHidden');
    const windowWidth = window.innerWidth;

    if(windowWidth < 570){
        document.documentElement.setAttribute('data-sidebar', 'show-sidebar')
    }else{
        if (savedStateSidebar === 'true') {
            document.documentElement.setAttribute('data-sidebar', 'hide-sidebar')
        }
    }
    
   
 
  })()