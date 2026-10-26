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
  },800);
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
