import { useEffect, useRef } from 'react';

interface RealtimeEvent {
    type: 'connected' | 'state.changed';
    scope?: string;
    at: number;
}

function getRealtimeUrl(userId: string) {
    let configuredBase = '';
    try {
        configuredBase = localStorage.getItem('slaptax_api_base') || '';
    } catch {
        configuredBase = '';
    }

    const base = configuredBase
        ? new URL(configuredBase, window.location.origin)
        : new URL(window.location.origin);
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    base.pathname = '/api/realtime';
    base.search = `?userId=${encodeURIComponent(userId)}`;
    return base.toString();
}

export function useRealtime(userId: string | null, onEvent: (event: RealtimeEvent) => void) {
    const callbackRef = useRef(onEvent);
    callbackRef.current = onEvent;

    useEffect(() => {
        if (!userId) return;
        let socket: WebSocket | null = null;
        let reconnectTimer = 0;
        let stopped = false;
        let attempt = 0;

        function connect() {
            if (stopped) return;
            socket = new WebSocket(getRealtimeUrl(userId as string));
            socket.addEventListener('open', () => {
                attempt = 0;
                callbackRef.current({ type: 'connected', at: Date.now() });
            });
            socket.addEventListener('message', (message) => {
                try {
                    callbackRef.current(JSON.parse(String(message.data)) as RealtimeEvent);
                } catch {
                    // Ignore malformed transport messages and keep the connection alive.
                }
            });
            socket.addEventListener('close', () => {
                if (stopped) return;
                attempt += 1;
                reconnectTimer = window.setTimeout(connect, Math.min(10_000, 500 * (2 ** attempt)));
            });
        }

        connect();
        return () => {
            stopped = true;
            window.clearTimeout(reconnectTimer);
            socket?.close();
        };
    }, [userId]);
}
