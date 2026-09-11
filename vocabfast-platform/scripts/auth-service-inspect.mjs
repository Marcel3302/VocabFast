const {CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account}=process.env;
const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts`,{headers:{Authorization:`Bearer ${token}`}});
const data=await response.json();if(!response.ok||!data.success)throw new Error('Could not inspect Worker names.');
console.log('Available Workers:',JSON.stringify(data.result.map(worker=>({id:worker.id,modified_on:worker.modified_on}))));
