# Zoobumon

RPG de captura em pixel art no estilo GBA, feito pra jogar no celular com os amigos.

- **O jogo** fica no GitHub Pages (grátis): `https://douglas-santos-nunes.github.io/zoobumon/`
- **Contas, saves e o online** ficam no Supabase (grátis)

> **Como está agora:** login e save na nuvem **ligados** (`contas: true` em `js/config.js`), então o progresso fica na conta e vale em qualquer aparelho. Amigos no mapa e duelo ao vivo estão **desligados** (`online: false`): cada um evolui no seu ritmo. O Duelo por código (Menu › Duelo) continua funcionando.

---

## 1. Criar a conta no Supabase (uns 5 minutos)

1. Entre em **https://supabase.com** e clique em **Start your project**.
2. Escolha **Continue with GitHub** e entre com sua conta do GitHub. Não precisa de cartão.
3. Clique em **New project**:
   - **Name:** `zoobumon`
   - **Database Password:** clique em *Generate a password* e guarde num lugar seguro (o jogo não usa, mas o Supabase pede).
   - **Region:** *South America (São Paulo)*, pra ficar mais rápido no Brasil.
   - Clique em **Create new project** e espere uns 2 minutos até ele ficar pronto.

## 2. Criar o banco de dados

1. No menu da esquerda, abra **SQL Editor**.
2. Abra o arquivo `supabase/esquema.sql` desta pasta, copie tudo e cole no editor.
3. Clique em **Run**. Deve aparecer *Success*.

## 3. Ajustar o login

1. Menu da esquerda: **Authentication** → **URL Configuration**.
2. Em **Site URL**, coloque `https://douglas-santos-nunes.github.io/zoobumon/` e salve.
3. (Opcional, deixa mais fácil pros amigos) **Authentication** → **Sign In / Providers** → **Email** → desligue **Confirm email**.
   Assim a conta funciona na hora, sem precisar clicar no link do email.

## 4. Pegar as duas chaves e colocar no jogo

1. Clique na engrenagem **Project Settings** → **API** (em algumas versões: **Data API** e **API Keys**).
2. Copie:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - a chave **anon public** (fica na aba *Legacy API Keys*, começa com `eyJ...`)
3. Abra `js/config.js` e cole:

```js
window.CB_CONFIG = {
  supabaseUrl: 'https://abcdefgh.supabase.co',
  supabaseKey: 'eyJ...'
};
```

Essa chave pode ficar pública: quem protege os saves são as regras do banco (passo 2).
**Nunca** coloque aqui a chave `service_role`.

## 5. Publicar no GitHub Pages

1. Em **https://github.com/new** crie um repositório chamado `zoobumon`, **Public**, sem marcar nada mais.
2. Envie os arquivos desta pasta pra ele (o Claude faz isso pra você com o Git deste computador).
3. No repositório: **Settings** → **Pages** → em *Branch* escolha `main` e a pasta `/ (root)` → **Save**.
4. Em 1 ou 2 minutos o jogo aparece em `https://douglas-santos-nunes.github.io/zoobumon/`.

Depois é só mandar o link pros amigos. Cada um cria a própria conta na tela de entrada.

---

## Como jogar

- **Andar:** arraste a bolinha do controle (canto de baixo, à esquerda). Segure **B** pra correr.
- **Falar/entrar:** fique de frente pra pessoa ou porta e aperte **A**.
- **Menu:** botão no canto de cima (zoobumons, bolsa, ficha do treinador, duelo por código, salvar).
- **Duelo por código:** Menu › Duelo. Mande seu código pra um amigo, ele cola no jogo dele e luta contra o seu time.
- **Amigos online** (só com `online: true`): aparecem andando no mapa com o nome em cima. Fique de frente pra um amigo e aperte **A** pra **desafiar pra um duelo ao vivo**: cada um escolhe o golpe na sua vez.
  Duelos não machucam os times de verdade; quem vence ganha 150 moedas.
- **Regiões:** Vila Aurora (início), Trilha 1 (Nv 2-5), Pedreira Seca (6-10), Bosque Sombrio (9-15), Distrito Corporativo (12-18, ao sul), Praia Brava (14-20, depois da Pedreira), Rua do Boteco (16-24, depois do Bosque) e Serra Alta (24-34, no fim de tudo).
- **UPA** (telhado vermelho): entre, fale com a Enfermeira pelo balcão pra curar o time e use o **PC** do canto pra guardar e retirar zoobumons. O time anda com no máximo 6.
- **Loja da Vila** (tijolinho com toldo verde): entre e fale com o Vendedor pra **comprar** (itens, equipamentos e skins) ou **vender** pela metade do preço.
- **Skins**: bonés (inclusive MST e VERO), chapéu, gorro, coroa, óculos, mochila e cachecol. Use em Menu › Treinador › Visual.
- **Aparência**: dá pra trocar personagem, cabelo, barba e cores a qualquer hora, de graça, em Menu › Treinador › Aparência.

## Estrutura

| Pasta/arquivo | O que é |
|---|---|
| `index.html` | A página do jogo |
| `zoobudex.html` | A Zoobudex: todos os zoobumons, de frente e de costas |
| `sprites/` | Os desenhos de cada zoobumon em PNG (64×64) e a imagem da Zoobudex |
| `css/style.css` | Visual das telas e menus |
| `js/config.js` | Liga/desliga contas e online, e guarda as chaves do Supabase |
| `js/dados.js` | Zoobumons, golpes, itens e equipamentos |
| `js/sprites.js` | Desenho dos zoobumons, personagens e cenário |
| `js/mapa.js`, `js/mundo.js`, `js/desenho.js` | Mapa, movimento e desenho do mundo |
| `js/batalha.js`, `js/regras.js` | Batalha, dano, XP e captura |
| `js/menus.js`, `js/interface.js`, `js/entrada.js` | Menus, caixas de texto, toque e teclado |
| `js/nuvem.js` | Login e save na nuvem |
| `js/online.js` | Amigos no mapa e duelo ao vivo |
| `supabase/esquema.sql` | Tabela e regras do banco |
| `esboco/` | O protótipo antigo de um arquivo só (não vai pro GitHub) |

## Limites conhecidos

- As batalhas são calculadas no aparelho de cada jogador. Entre amigos tudo bem, mas alguém que entende de programação conseguiria trapacear. Dá pra blindar depois com funções no servidor do Supabase.
- O plano grátis do Supabase pausa o projeto depois de 1 semana sem ninguém jogar. É só entrar no painel e clicar em *Restore*.
