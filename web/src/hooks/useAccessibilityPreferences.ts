import {useEffect} from 'react';
import {useBooleanPreference} from './useFeedbackPreferences';
export function useAccessibilityPreferences(){
 const [highContrast,setHighContrast]=useBooleanPreference('slaptax.a11y.highContrast',false);
 const [reduceMotion,setReduceMotion]=useBooleanPreference('slaptax.a11y.reduceMotion',false);
 const [largeText,setLargeText]=useBooleanPreference('slaptax.a11y.largeText',false);
 useEffect(()=>{const root=document.documentElement;root.dataset.highContrast=String(highContrast);root.dataset.reduceMotion=String(reduceMotion);root.dataset.largeText=String(largeText);},[highContrast,reduceMotion,largeText]);
 return{highContrast,setHighContrast,reduceMotion,setReduceMotion,largeText,setLargeText};
}
