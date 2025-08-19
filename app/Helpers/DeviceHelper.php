<?php

namespace App\Helpers;

class DeviceHelper
{
    /**
     * Detect device type based on user agent
     * 
     * @param string $userAgent
     * @return string 'Mobile' or 'Desktop'
     */
    public static function detectDevice($userAgent = null)
    {
        if ($userAgent === null) {
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        }

        // Mobile detection patterns
        $mobilePatterns = [
            '/android/i',
            '/webos/i',
            '/iphone/i',
            '/ipad/i',
            '/ipod/i',
            '/blackberry/i',
            '/windows phone/i',
            '/iemobile/i',
            '/mobile/i',
            '/tablet/i'
        ];

        foreach ($mobilePatterns as $pattern) {
            if (preg_match($pattern, strtolower($userAgent))) {
                return 'Mobile';
            }
        }

        return 'Desktop';
    }

    /**
     * Get device info from request
     * 
     * @param \Illuminate\Http\Request $request
     * @return string
     */
    public static function getDeviceFromRequest($request)
    {
        $userAgent = $request->header('User-Agent') ?? '';
        return self::detectDevice($userAgent);
    }

    /**
     * Build device array string from check-in and check-out devices
     * 
     * @param string $checkInDevice
     * @param string $checkOutDevice
     * @return string
     */
    public static function buildDeviceArray($checkInDevice, $checkOutDevice)
    {
        $devices = [];
        
        if (!empty($checkInDevice)) {
            $devices[] = $checkInDevice;
        }
        
        if (!empty($checkOutDevice)) {
            $devices[] = $checkOutDevice;
        }
        
        // Remove duplicates while preserving order
        $devices = array_unique($devices);
        
        return implode(', ', $devices);
    }

    /**
     * Get combined device string from attendance trackings
     * 
     * @param \Illuminate\Database\Eloquent\Collection $trackings
     * @return string
     */
    public static function getCombinedDeviceFromTrackings($trackings)
    {
        $devices = [];
        
        foreach ($trackings as $tracking) {
            if (!empty($tracking->device)) {
                $devices[] = $tracking->device;
            }
        }
        
        // Remove duplicates while preserving order
        $devices = array_unique($devices);
        
        return implode(', ', $devices);
    }
}
