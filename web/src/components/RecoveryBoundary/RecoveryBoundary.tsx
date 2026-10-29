import {Component,type ReactNode,type ErrorInfo} from 'react';
import styles from './RecoveryBoundary.module.css';
/** Keep session credentials and let the server cancel/refund interrupted games. */
export class RecoveryBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 private fail=()=>this.setState({failed:true});
 componentDidMount(){window.addEventListener('slaptax:game-error',this.fail);}
 componentWillUnmount(){window.removeEventListener('slaptax:game-error',this.fail);}
 componentDidUpdate(){if(this.state.failed)setTimeout(()=>{document.getElementById('root')?.removeAttribute('inert');document.body.style.overflow='';},0);}
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error:Error,info:ErrorInfo){
  console.error('SlapTax rendering failure',error,info.componentStack);
  document.getElementById('root')?.removeAttribute('inert');document.body.style.overflow='';
 }
 render(){if(!this.state.failed)return this.props.children;
  const fr=document.documentElement.lang!=='en';
  return <main className={styles.recovery} role="alert"><div><span>SLAP$TAX</span><h1>{fr?'La partie a rencontré un problème.':'The game hit a problem.'}</h1><p>{fr?'Recharge pour retrouver ton compte. Une interruption de connexion ne donne plus de victoire automatique : le serveur annule et rembourse le défi si la reconnexion échoue.':'Reload to return to your account. A connection interruption does not award an automatic win: the server cancels and refunds the challenge if reconnecting fails.'}</p><button onClick={()=>location.reload()}>{fr?'Recharger':'Reload'}</button><a href="/?tab=defy">{fr?'Revenir aux défis':'Back to challenges'}</a></div></main>;
 }
}
