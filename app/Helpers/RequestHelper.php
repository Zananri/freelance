<?php

namespace App\Helpers;

use Illuminate\Http\Request;

class RequestHelper
{
    /**
     * Get the client's real IP address, checking common proxy headers.
     *
     * @param Request $request
     * @return string|null
     */
    public static function getClientIp(Request $request)
    {
        // Check X-Forwarded-For (may contain a list of IPs)
        $xForwardedFor = $request->header('X-Forwarded-For') ?? $request->server('HTTP_X_FORWARDED_FOR');
        if ($xForwardedFor) {
            // X-Forwarded-For can be a comma separated list. Prefer first valid IPv4, otherwise first valid IP
            $parts = array_map('trim', explode(',', $xForwardedFor));
            $ipv4 = null;
            $anyIp = null;
            foreach ($parts as $p) {
                if (!$anyIp && filter_var($p, FILTER_VALIDATE_IP)) {
                    $anyIp = $p;
                }
                if (!$ipv4 && filter_var($p, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                    $ipv4 = $p;
                    break;
                }
            }
            if ($ipv4) return $ipv4;
            if ($anyIp) return $anyIp;
        }

        // Common proxy header
        $clientIp = $request->server('HTTP_CLIENT_IP') ?? $request->header('HTTP_CLIENT_IP');
        if ($clientIp) {
            if (filter_var($clientIp, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                return $clientIp;
            }
            if (filter_var($clientIp, FILTER_VALIDATE_IP)) {
                return $clientIp;
            }
        }

        // Fallback to Laravel's ip() method (uses Symfony request)
        $ip = $request->ip();
        // Prefer IPv4 if available
        if ($ip && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $ip;
        }
        if ($ip && filter_var($ip, FILTER_VALIDATE_IP)) {
            // Keep as fallback (could be IPv6)
            $detected = $ip;
        } else {
            $detected = null;
        }

        // Final fallback to REMOTE_ADDR server var
        $remote = $request->server('REMOTE_ADDR') ?? ($_SERVER['REMOTE_ADDR'] ?? null);
        if ($remote && filter_var($remote, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $remote;
        }

        // If the detected IP is loopback (::1 or 127.0.0.1) or missing, try to resolve the host LAN IP
        $loopbacks = ['127.0.0.1', '::1'];
        if (empty($detected) || in_array($detected, $loopbacks, true) || (filter_var($detected, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) && ($detected === '::1'))) {
            // Attempt to get LAN IPv4 of the host machine
            $host = gethostname();
            if ($host) {
                $lanIp = gethostbyname($host);
                if ($lanIp && $lanIp !== $host && filter_var($lanIp, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                    return $lanIp;
                }
            }
        }

        // If we had a detected (maybe IPv6) value, return it
        if (!empty($detected)) {
            return $detected;
        }

        return null;
    }
}
