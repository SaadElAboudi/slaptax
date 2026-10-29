import economy from '../../../../shared/token-economy.json' with {type:'json'};
import type {TokenQuote} from '../../api/client';
export function StakeQuote({stake,quote,isFr}:{stake:number;quote?:TokenQuote;isFr:boolean}){
 const pot=Math.round(stake*200),fee=Math.round(pot*economy.feePercent/100);
 const q=quote||{payout:(pot-fee)/100,net:(pot-fee)/100-stake,fee:fee/100,feePercent:economy.feePercent};
 const fmt=(v:number)=>v.toLocaleString(isFr?'fr-FR':'en-US',{maximumFractionDigits:2});
 return <p data-testid="stake-quote">{isFr?'Mise chacun : ':'Each stake: '}<b>{fmt(stake)}</b> · {isFr?'Versement si victoire : ':'Win payout: '}<b>{fmt(q.payout)}</b> · {isFr?'Bénéfice net : ':'Net profit: '}<b>+{fmt(q.net)}</b><br/><small>{isFr?`Taxe : ${fmt(q.fee)} jetons (${q.feePercent} % du pot). Mise débitée quand les deux joueurs sont prêts et que le duel démarre.`:`Fee: ${fmt(q.fee)} tokens (${q.feePercent}% of the pot). Stake deducted when both players are ready and the duel starts.`}</small></p>;
}
