import {parseEnv} from 'node:util';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const cli=process.env.VERCEL_CLI;
if(!cli)throw new Error('Set VERCEL_CLI to the installed Vercel CLI entrypoint.');
const values=parseEnv(readFileSync('.env','utf8'));
const keys=['OWNER_SECRET','AGENT_SECRET','MERCHANT_SECRET','DEVICE_HASH','SETUP_LEDGER','ADMIN_TOKEN','VELO_API_KEY','VELO_WEBHOOK_SECRET'];
for(const key of keys){
 if(!values[key])continue;
 const result=spawnSync(process.execPath,[cli,'env','add',key,'--environment','production','--sensitive','--force','--yes','--global-config','/private/tmp/demopay-vercel'],{input:values[key],encoding:'utf8'});
 if(result.status!==0){console.error(`Could not configure ${key}; no secret value was logged.`);process.exit(1);}
 console.log(`Configured ${key} privately.`);
}
if(process.env.DEPLOY_APP_URL){
 const result=spawnSync(process.execPath,[cli,'env','add','APP_URL','--environment','production','--force','--yes','--global-config','/private/tmp/demopay-vercel'],{input:process.env.DEPLOY_APP_URL,encoding:'utf8'});
 if(result.status!==0)throw new Error('Could not configure the public app origin.');
 console.log('Configured the public app origin.');
}
