(() => {
'use strict';
if(window.__vfNativeMutationObserver)return;
const Native=window.MutationObserver;
if(typeof Native!=='function')return;
window.__vfNativeMutationObserver=Native;
window.MutationObserver=class SafeMutationObserver{
  constructor(callback){
    let target=null,options=null,inCallback=false;
    const observer=new Native((records)=>{
      if(inCallback)return;
      inCallback=true;
      observer.disconnect();
      try{callback(records,this)}finally{
        inCallback=false;
        if(target)observer.observe(target,options);
      }
    });
    this.observe=(nextTarget,nextOptions)=>{target=nextTarget;options=nextOptions;observer.observe(target,options)};
    this.disconnect=()=>{target=null;options=null;observer.disconnect()};
    this.takeRecords=()=>observer.takeRecords();
  }
};
})();
