// Dados do seu projeto no Supabase (o LEIA-ME mostra onde achar).
// Com os dois campos vazios o jogo roda no "modo offline": salva só neste navegador e não mostra amigos online.
// A chave "anon"/"publishable" é pública por natureza: quem protege os dados são as regras do banco (supabase/esquema.sql).
// contas: true liga o login e o save na nuvem (o progresso acompanha a conta em qualquer aparelho).
// online: false deixa desligados os amigos no mapa e o duelo ao vivo; cada um evolui no seu ritmo.
window.CB_CONFIG = {
  contas: true,
  online: false,
  supabaseUrl: 'https://pxncaoxwcylwpnkhzvlv.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bmNhb3h3Y3lsd3Bua2h6dmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NjIyNjEsImV4cCI6MjEwODUzODI2MX0.yonmaYXqZx7habFRB1H_zPee3DslAskGHLlnekFL-vw'
};
