import type {CapacitorConfig} from '@capacitor/cli';
const config:CapacitorConfig={
 appId:'com.gignoski.slaptax',appName:'SlapTax',webDir:'dist-mobile',
 server:{androidScheme:'https',cleartext:false,errorPath:'update-required.html'},
 ios:{contentInset:'never',backgroundColor:'#1c2e62'},
 android:{minWebViewVersion:107,backgroundColor:'#1c2e62',allowMixedContent:false},
};
export default config;
