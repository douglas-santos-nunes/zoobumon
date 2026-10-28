'use strict';
/* =================== nuvem: contas e save (Supabase) =================== */
const CFG=window.CB_CONFIG||{};
const sb=CFG.contas!==false&&CFG.supabaseUrl&&CFG.supabaseKey&&window.supabase?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey):null;
let me=null,cloudTimer=0;

// salva na nuvem um pouco depois da última mudança, pra não mandar a cada passo
function cloudSave(){
  if(!sb||!me||!S)return;
  clearTimeout(cloudTimer);
  cloudTimer=setTimeout(async()=>{
    const{error}=await sb.from('saves').upsert({user_id:me.id,data:S,updated_at:new Date().toISOString()});
    if(error)console.warn('Não salvou na nuvem:',error.message);
    rankSave();
  },800);
}
// ranking: cada um só escreve a própria linha; todo mundo pode ler (regras em supabase/esquema.sql)
function rankRow(){
  const mons=[...S.party,...S.box],d=S.dex&&S.dex.p?Object.keys(S.dex.p).length:0;
  return{user_id:me.id,nome:String(S.name||'Treinador').slice(0,20),txp:Math.floor(S.txp||0),nivel:tlevel(S.txp),pegos:Math.max(d,S.caught||0),melhor:Math.max(1,...mons.map(m=>m.lv||1)),updated_at:new Date().toISOString()};
}
async function rankSave(){if(!sb||!me||!S)return;const{error}=await sb.from('ranking').upsert(rankRow());if(error)console.warn('Ranking:',error.message)}
async function rankLoad(){
  if(!sb||!me)return{off:true};
  await rankSave();
  const top=await sb.from('ranking').select('user_id,nome,txp,nivel,pegos,melhor').order('txp',{ascending:false}).order('updated_at',{ascending:true}).limit(10);
  if(top.error)return{err:top.error.message};
  const mine=rankRow(),acima=await sb.from('ranking').select('user_id',{count:'exact',head:true}).gt('txp',mine.txp);
  return{top:top.data||[],mine,pos:(acima.count||0)+1};
}
async function cloudLoad(){
  if(!sb||!me)return null;
  const{data,error}=await sb.from('saves').select('data').eq('user_id',me.id).maybeSingle();
  if(error){console.warn('Não carregou da nuvem:',error.message);return null}
  const s=data&&data.data;
  return s&&Array.isArray(s.party)&&s.party.length?s:null;
}
const AUTH_MSG={
  'Invalid login credentials':'Email ou senha errados.',
  'Email not confirmed':'Confirme seu email antes de entrar. O link chegou na sua caixa de entrada.',
  'User already registered':'Esse email já tem conta. Use o botão Entrar.',
};
function authError(e){
  const m=e&&e.message||'';
  if(AUTH_MSG[m])return AUTH_MSG[m];
  if(/password/i.test(m)&&/6/.test(m))return'A senha precisa ter pelo menos 6 caracteres.';
  if(/rate limit/i.test(m))return'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  if(/email/i.test(m)&&/invalid/i.test(m))return'Esse email não parece válido.';
  return'Não deu certo agora. Confira sua internet e tente de novo.';
}
$('#authForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const msg=$('#authMsg');msg.textContent='Entrando...';
  const{data,error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});
  if(error){msg.textContent=authError(error);return}
  me=data.user;msg.textContent='';await afterLogin();
});
$('#btnSignup').addEventListener('click',async()=>{
  const msg=$('#authMsg'),email=$('#em').value.trim(),password=$('#pw').value;
  if(!email||password.length<6){msg.textContent='Digite seu email e uma senha com pelo menos 6 caracteres.';return}
  msg.textContent='Criando sua conta...';
  const{data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
  if(error){msg.textContent=authError(error);return}
  if(!data.session){msg.textContent='Conta criada! Abra o email de confirmação que enviamos e depois entre aqui.';return}
  me=data.user;msg.textContent='';await afterLogin();
});
$('#btnLogout').addEventListener('click',async()=>{
  if(sb)await sb.auth.signOut();
  me=null;savedGame=null;$('#create').hidden=true;$('#cont').hidden=true;$('#auth').hidden=false;
});
