import {installCanvasCompatibility} from './platform/canvasCompatibility';
import {prepareNative} from './platform/native';
import './styles/native.css';
import { lazy, StrictMode, Suspense, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import './styles/cartoon.css'
import App from './App'
import {RecoveryBoundary} from './components/RecoveryBoundary/RecoveryBoundary'
const Legal=lazy(()=>import('./components/Legal/Legal').then(m=>({default:m.Legal})));
const legalPaths=['/privacy','/terms','/support','/delete-account','/account-deleted'];
const AdminDashboard = lazy(() => import('./components/AdminDashboard/AdminDashboard'));

const subscribeRoute=(listener:()=>void)=>{window.addEventListener('popstate',listener);return()=>window.removeEventListener('popstate',listener);};
function RootRouter(){
 const path=useSyncExternalStore(subscribeRoute,()=>location.pathname,()=>'/');
 return legalPaths.includes(path)?<Suspense fallback={<p>Chargement…</p>}><Legal key={path}/></Suspense>:path==='/admin'?<Suspense fallback={<p>Chargement…</p>}><AdminDashboard/></Suspense>:<App/>;
}
async function mount(){
installCanvasCompatibility();
try{await prepareNative();}catch(error){console.error('Native integration unavailable',error);}
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RecoveryBoundary><RootRouter/></RecoveryBoundary>
    </StrictMode>,
)

}
void mount();
