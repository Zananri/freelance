(function () {
    "use strict";

    const appUrl = (
        document.querySelector('meta[name="app-url"]')?.content || ""
    ).replace(/\/$/, "");
    const csrfToken =
        document.querySelector('meta[name="csrf-token"]')?.content || "";

    const UPDATE_INTERVAL_MS = 10000;
    const STATUS_INTERVAL_MS = 60000;
    const GEOLOCATION_OPTIONS = {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
    };

    let trackingEnabled = false;
    let watchId = null;
    let updateTimer = null;
    let statusTimer = null;
    let latestPosition = null;
    let requestInFlight = false;
    let lastError = null;
    let employeeId = null;

    async function requestJson(url, options) {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
                ...(options?.headers || {}),
            },
            ...options,
        });

        const payload = await response.json().catch(function () {
            return {};
        });

        if (!response.ok) {
            const error = new Error(
                payload.message || "Live location request failed",
            );
            error.status = response.status;
            throw error;
        }

        return payload;
    }

    async function sendPosition(position) {
        if (!trackingEnabled || !position || requestInFlight) {
            return;
        }

        requestInFlight = true;

        const data = new URLSearchParams({
            latitude: String(position.coords.latitude),
            longitude: String(position.coords.longitude),
            accuracy: String(position.coords.accuracy || ""),
            tracked_at: new Date(position.timestamp || Date.now()).toISOString(),
            _token: csrfToken,
        });

        try {
            await requestJson(appUrl + "/location/update", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: data.toString(),
            });
            lastError = null;
            window.dispatchEvent(
                new CustomEvent("hris:live-location-sent", {
                    detail: {
                        employeeId: employeeId,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    },
                }),
            );
        } catch (error) {
            lastError = error.message;
            if (error.status === 401 || error.status === 403) {
                stop();
            } else {
                console.warn("Live location gagal dikirim:", error.message);
            }
        } finally {
            requestInFlight = false;
        }
    }

    function handlePosition(position) {
        latestPosition = position;
        sendPosition(position);
    }

    function requestCurrentPosition() {
        if (!trackingEnabled || !navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            handlePosition,
            function (error) {
                console.warn("Live location tidak tersedia:", error.message);
            },
            GEOLOCATION_OPTIONS,
        );
    }

    function start() {
        if (trackingEnabled || !navigator.geolocation) {
            return;
        }

        trackingEnabled = true;

        watchId = navigator.geolocation.watchPosition(
            handlePosition,
            function (error) {
                console.warn("Live location tidak dapat dipantau:", error.message);
            },
            GEOLOCATION_OPTIONS,
        );

        requestCurrentPosition();
        updateTimer = window.setInterval(function () {
            if (latestPosition) {
                sendPosition(latestPosition);
            } else {
                requestCurrentPosition();
            }
        }, UPDATE_INTERVAL_MS);
    }

    function stop() {
        trackingEnabled = false;
        latestPosition = null;

        if (watchId !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        if (updateTimer !== null) {
            window.clearInterval(updateTimer);
            updateTimer = null;
        }
    }

    async function refreshStatus() {
        try {
            const payload = await requestJson(appUrl + "/location/status");
            employeeId = payload.employee_id || null;
            if (payload.tracking) {
                lastError = null;
                start();
            } else {
                lastError =
                    payload.reason || "Akun tidak terhubung ke employee";
                stop();
                console.warn("Live location tidak aktif:", lastError);
            }
        } catch (error) {
            lastError = error.message;
            if (error.status === 401) {
                stop();
            }
        }
    }

    function init() {
        if (!appUrl || !csrfToken || !navigator.geolocation) {
            return;
        }

        refreshStatus();
        statusTimer = window.setInterval(refreshStatus, STATUS_INTERVAL_MS);

        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) {
                refreshStatus();
                if (trackingEnabled) {
                    requestCurrentPosition();
                }
            }
        });

        window.addEventListener("online", refreshStatus);
    }

    window.HRISLiveLocationTracker = {
        start: start,
        stop: stop,
        refreshStatus: refreshStatus,
        isRunning: function () {
            return trackingEnabled;
        },
        getState: function () {
            return {
                running: trackingEnabled,
                employeeId: employeeId,
                hasPosition: latestPosition !== null,
                requestInFlight: requestInFlight,
                lastError: lastError,
            };
        },
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
