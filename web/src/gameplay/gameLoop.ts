export interface GameLoopHost {
    request: (draw: FrameRequestCallback) => number;
    cancel: (id: number) => void;
    active: () => boolean;
    subscribe: (changed: () => void) => () => void;
}
/** One render loop per scene. Suspend drawing when the webview is inactive. */
export function startGameLoop(draw: FrameRequestCallback, host?: GameLoopHost) {
    const environment: GameLoopHost = host || {
        request: callback => requestAnimationFrame(callback),
        cancel: id => cancelAnimationFrame(id),
        active: () => !document.hidden && document.documentElement.dataset.appActive !== 'false',
        subscribe: changed => {
            document.addEventListener('visibilitychange', changed);
            window.addEventListener('slaptax:app-state', changed);
            return () => {
                document.removeEventListener('visibilitychange', changed);
                window.removeEventListener('slaptax:app-state', changed);
            };
        },
    };
    let pending: number | null = null;
    let stopped = false;
    const schedule = () => {
        if (!stopped && pending === null && environment.active()) pending = environment.request(frame);
    };
    const frame: FrameRequestCallback = now => {
        pending = null;
        if (stopped || !environment.active()) return;
        try{draw(now);}catch(error){
            stopped=true;unsubscribe();
            if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('slaptax:game-error',{detail:error}));
            else throw error;
            return;
        }
        schedule();
    };
    const sync = () => {
        if (!environment.active() && pending !== null) {
            environment.cancel(pending);
            pending = null;
        }
        schedule();
    };
    const unsubscribe = environment.subscribe(sync);
    schedule();
    return () => {
        stopped = true;
        if (pending !== null) environment.cancel(pending);
        pending = null;
        unsubscribe();
    };
}
