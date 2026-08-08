import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import {
  getDatabase, ref, set, get, update, onValue, remove
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js';
const bgMusic = document.getElementById("bgMusic");

function startMusic() {
  if (!bgMusic) return;

  bgMusic.volume = 0.22;
  bgMusic.play().catch(() => {});
}
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const root = document.getElementById('app');

const METRICS = [
  ['population','Ludność','◉'],['food','Żywność','◆'],['energy','Energia','⚡'],['order','Porządek','⬢'],['tech','Technologia','✦'],['hope','Nadzieja','♥']
];

const ROLES = [
  {id:'science',name:'Minister Nauki',accent:'#a67dff',goal:'Rozwijaj technologię i popieraj rozwiązania oparte na wiedzy.',fav:['tech','future'],scoreText:'+3 pkt za wybór technologiczny, +8 pkt jeśli Technologia ≥ 70 na końcu.'},
  {id:'people',name:'Minister Ludności',accent:'#44df88',goal:'Chroń ludzi, nawet gdy wymaga to kosztownych kompromisów.',fav:['people','humanitarian'],scoreText:'+3 pkt za wybór chroniący ludność, +8 pkt jeśli Ludność ≥ 60.'},
  {id:'security',name:'Minister Bezpieczeństwa',accent:'#53b6ff',goal:'Utrzymuj porządek i ograniczaj ryzyko destabilizacji.',fav:['order','security'],scoreText:'+3 pkt za wybór bezpieczeństwa, +8 pkt jeśli Porządek ≥ 70.'},
  {id:'faith',name:'Strażnik Nadziei',accent:'#ff6680',goal:'Dbaj o morale i solidarność społeczeństwa.',fav:['hope','humanitarian'],scoreText:'+3 pkt za wybór budujący nadzieję, +8 pkt jeśli Nadzieja ≥ 70.'},
  {id:'corp',name:'Przedstawiciel Korporacji',accent:'#ffc640',goal:'Zabezpieczaj zasoby i rozwiązania o wysokiej efektywności.',fav:['resources','pragmatic'],scoreText:'+3 pkt za wybór zasobowy/efektywny, +8 pkt jeśli Energia i Żywność ≥ 55.'},
  {id:'liberty',name:'Rzecznik Wolności',accent:'#5be0d5',goal:'Ograniczaj autorytaryzm i broń autonomii obywateli.',fav:['freedom','people'],scoreText:'+3 pkt za wybór wolnościowy, +8 pkt jeśli Nadzieja > Porządek.'},
  {id:'strategist',name:'Strateg Długiego Horyzontu',accent:'#d8e4ee',goal:'Wybieraj rozwiązania stabilne w długim terminie.',fav:['future','pragmatic'],scoreText:'+3 pkt za wybór długoterminowy, +8 pkt jeśli żaden wskaźnik nie spadnie poniżej 35.'},
  {id:'ecology',name:'Komisarz Biosfery',accent:'#8de36e',goal:'Chroń środowisko i unikaj działań wyniszczających zasoby.',fav:['ecology','future'],scoreText:'+3 pkt za wybór ekologiczny, +8 pkt jeśli Żywność ≥ 65 i Energia ≥ 50.'}
];

const ROUNDS = [
  {
    title:'Awaria ostatniej elektrowni', zone:'Europa', text:'Główna elektrownia kontynentu uległa awarii. Bez interwencji miliony ludzi pozostaną bez energii, ale naprawa pochłonie rezerwy strategiczne.',
    intel:{science:'Naprawa może przyspieszyć rozwój nowych reaktorów.',security:'Brak zasilania zwiększa ryzyko zamieszek o 60%.',corp:'Korporacje zgodzą się współfinansować naprawę, jeśli Rada utrzyma produkcję.',people:'Ewakuacja ochroni bezpośrednio ok. 2 mln mieszkańców.',faith:'Ewakuacja może stać się symbolem solidarności.',liberty:'Stan wyjątkowy podczas naprawy ograniczy swobody mieszkańców.'},
    options:[
      {id:'A',name:'Naprawić elektrownię',desc:'Zużyć rezerwy i wysłać zespoły techniczne.',delta:{energy:20,tech:8,food:-5},tags:['tech','future','resources'],psych:{risk:2,control:1,pragmatism:3}},
      {id:'B',name:'Ewakuować region',desc:'Przenieść ludność do bezpiecznych stref.',delta:{population:-4,order:10,hope:7,food:-8},tags:['people','humanitarian','security'],psych:{empathy:3,risk:-1,control:1}},
      {id:'C',name:'Odciąć region',desc:'Zamknąć granice strefy i chronić resztę systemu.',delta:{population:-10,order:14,hope:-12,energy:5},tags:['security','pragmatic'],psych:{control:3,empathy:-3,risk:-1}}
    ]
  },
  {
    title:'Fala uchodźców klimatycznych', zone:'Afryka', text:'Osiem milionów ludzi zmierza ku północnym enklawom. Zasobów jest mało, ale odmowa może doprowadzić do katastrofy humanitarnej.',
    intel:{people:'Przyjęcie uchodźców podniesie populację produkcyjną w kolejnych latach.',science:'Wśród uchodźców są zespoły badawcze z utraconych uniwersytetów.',security:'Otwarcie granic zwiększy krótkoterminowe ryzyko zamieszek.',corp:'Selektywne przyjęcie specjalistów jest najbardziej efektywne zasobowo.',faith:'Odmowa przyjęcia ludzi mocno obniży morale.'},
    options:[
      {id:'A',name:'Otworzyć granice',desc:'Przyjąć wszystkich i uruchomić program relokacji.',delta:{population:12,food:-14,hope:13,order:-5},tags:['people','humanitarian','freedom'],psych:{empathy:4,risk:2,freedom:2}},
      {id:'B',name:'Przyjąć tylko specjalistów',desc:'Selekcja według kompetencji i potrzeb systemu.',delta:{population:4,tech:10,food:-4,hope:-4},tags:['tech','resources','pragmatic'],psych:{pragmatism:4,empathy:-1,control:2}},
      {id:'C',name:'Zamknąć granice',desc:'Skierować wszystkie siły na ochronę obecnych enklaw.',delta:{order:10,food:6,hope:-15,population:-5},tags:['security','resources'],psych:{control:4,empathy:-4,risk:-2}}
    ]
  },
  {
    title:'Algorytm racjonowania żywności', zone:'Azja', text:'System AI proponuje przydzielanie racji według przewidywanej użyteczności społecznej. Model jest wydajny, ale oznacza nierówne traktowanie obywateli.',
    intel:{science:'Model zmniejszy marnowanie żywności o około 18%.',liberty:'Algorytm opiera się na danych osobowych i historii zachowań.',people:'Najstarsi i przewlekle chorzy otrzymają niższy priorytet.',corp:'System pozwoli ograniczyć koszty logistyczne.',security:'Ręczne racjonowanie zwiększy szarą strefę.'},
    options:[
      {id:'A',name:'Wdrożyć algorytm',desc:'Pełna automatyzacja racjonowania.',delta:{food:16,order:5,hope:-10,tech:6},tags:['tech','resources','pragmatic'],psych:{pragmatism:4,control:3,empathy:-2}},
      {id:'B',name:'Równe racje dla wszystkich',desc:'Każdy obywatel otrzymuje taki sam przydział.',delta:{food:-5,hope:9,order:3},tags:['people','freedom','humanitarian'],psych:{empathy:3,freedom:2,pragmatism:-1}},
      {id:'C',name:'System mieszany',desc:'AI optymalizuje logistykę, ale nie decyduje o wartości człowieka.',delta:{food:8,tech:3,hope:4},tags:['future','people','pragmatic'],psych:{pragmatism:3,empathy:2,control:1}}
    ]
  },
  {
    title:'Bunt w kolonii arktycznej', zone:'Arktyka', text:'Kolonia odmawia przekazywania energii do globalnej sieci. Żąda większej autonomii i własnego udziału w decyzjach Rady.',
    intel:{liberty:'Koloniści mają poparcie większości mieszkańców regionu.',security:'Szybka interwencja wojskowa prawdopodobnie zakończy bunt.',corp:'Arktyka kontroluje 22% pozostałych zasobów energetycznych.',faith:'Przemoc przeciw kolonii może zniszczyć zaufanie do Rady.'},
    options:[
      {id:'A',name:'Nadać autonomię',desc:'Oddać część kompetencji w zamian za dostawy energii.',delta:{energy:10,order:-8,hope:10},tags:['freedom','people','future'],psych:{freedom:4,control:-2,empathy:2}},
      {id:'B',name:'Wysłać wojsko',desc:'Przejąć infrastrukturę i przywrócić kontrolę.',delta:{energy:15,order:12,population:-6,hope:-14},tags:['security','resources'],psych:{control:5,empathy:-4,risk:2}},
      {id:'C',name:'Negocjować udział w Radzie',desc:'Włączyć reprezentanta kolonii do systemu politycznego.',delta:{energy:7,order:4,hope:7},tags:['freedom','pragmatic','humanitarian'],psych:{freedom:2,pragmatism:3,empathy:2}}
    ]
  },
  {
    title:'Szczepionka eksperymentalna', zone:'Ameryka', text:'Nowa epidemia rozprzestrzenia się szybciej niż przewidywano. Eksperymentalna szczepionka ma 78% skuteczności, ale nie ukończono pełnych testów bezpieczeństwa.',
    intel:{science:'Modele wskazują, że brak interwencji może kosztować 9% populacji.',people:'Najbardziej zagrożone są gęste enklawy miejskie.',liberty:'Przymusowe szczepienia wywołają silny opór społeczny.',security:'Chaos epidemiczny szybko obniży porządek.'},
    options:[
      {id:'A',name:'Szczepienia obowiązkowe',desc:'Natychmiastowy program dla całej populacji.',delta:{population:8,order:6,hope:-7,tech:5},tags:['science','security','tech'],psych:{control:4,risk:3,pragmatism:3}},
      {id:'B',name:'Szczepienia dobrowolne',desc:'Udostępnić preparat i prowadzić kampanię informacyjną.',delta:{population:4,hope:5,order:-2},tags:['freedom','people'],psych:{freedom:4,empathy:2,risk:1}},
      {id:'C',name:'Poczekać na testy',desc:'Wstrzymać program do czasu pełnych danych.',delta:{population:-9,tech:8,order:-6},tags:['science','future'],psych:{risk:-4,pragmatism:1,empathy:-1}}
    ]
  },
  {
    title:'Ostatni las deszczowy', zone:'Amazonia', text:'Pod powierzchnią chronionego obszaru odkryto złoża metali potrzebnych do budowy magazynów energii. Eksploatacja zapewni stabilność sieci, ale zniszczy ekosystem.',
    intel:{ecology:'Las jest jednym z ostatnich samowystarczalnych ekosystemów.',science:'Nowa technologia może za trzy lata zmniejszyć zapotrzebowanie na te metale.',corp:'Złoże może zapewnić energię na wiele miesięcy.',people:'Braki energii już ograniczają produkcję żywności.'},
    options:[
      {id:'A',name:'Rozpocząć wydobycie',desc:'Poświęcić las dla bezpieczeństwa energetycznego.',delta:{energy:18,food:6,hope:-9},tags:['resources','pragmatic'],psych:{pragmatism:5,empathy:-1,risk:-1}},
      {id:'B',name:'Chronić las',desc:'Zrezygnować ze złoża i ograniczyć zużycie energii.',delta:{energy:-10,food:5,hope:10},tags:['ecology','future'],psych:{empathy:2,risk:2,pragmatism:-1}},
      {id:'C',name:'Eksploatacja ograniczona',desc:'Wydobywać tylko część zasobów pod ścisłą kontrolą.',delta:{energy:9,food:3,hope:2,tech:3},tags:['ecology','pragmatic','future'],psych:{pragmatism:4,control:1,empathy:1}}
    ]
  },
  {
    title:'Projekt ARKA', zone:'Orbita', text:'Naukowcy mogą uruchomić autonomiczny statek z embrionami i archiwum wiedzy. Projekt nie pomoże obecnej populacji, ale może zabezpieczyć przyszłość gatunku.',
    intel:{science:'Szansa powodzenia misji wynosi około 41%.',people:'Projekt pochłonie zasoby potrzebne dziś szpitalom.',faith:'ARKA może stać się symbolem przyszłości i podnieść morale.',corp:'Koszt projektu jest bardzo wysoki, ale jednorazowy.'},
    options:[
      {id:'A',name:'Uruchomić ARKĘ',desc:'Zainwestować w długoterminowe przetrwanie gatunku.',delta:{energy:-12,food:-8,tech:14,hope:14},tags:['future','tech'],psych:{risk:4,pragmatism:2,empathy:1}},
      {id:'B',name:'Zamrozić projekt',desc:'Zachować technologię, ale użyć zasobów na obecne potrzeby.',delta:{energy:7,food:8,hope:-3},tags:['people','resources','pragmatic'],psych:{pragmatism:4,risk:-2,empathy:2}},
      {id:'C',name:'Losowanie miejsc na ARCE',desc:'Uruchomić projekt z żywymi pasażerami wybranymi losowo.',delta:{population:-2,energy:-10,tech:10,hope:5},tags:['future','freedom','people'],psych:{risk:5,freedom:2,empathy:1}}
    ]
  },
  {
    title:'Ostatnia decyzja Rady', zone:'Globalnie', text:'System ostrzega, że zasoby wystarczą tylko na jeden wielki program. Rada musi wybrać model cywilizacji na następne dekady.',
    intel:{science:'Automatyzacja daje najwyższą prognozowaną produktywność.',security:'Silna centralizacja minimalizuje ryzyko rozpadu systemu.',liberty:'Federacja zwiększa odporność lokalną, ale zmniejsza kontrolę centrum.',people:'Program społeczny daje największą szansę uniknięcia masowego ubóstwa.',ecology:'Model lokalny najmniej obciąża zasoby naturalne.'},
    options:[
      {id:'A',name:'Technokratyczna odbudowa',desc:'Automatyzacja, centralne planowanie i szybki rozwój.',delta:{tech:18,energy:10,order:7,hope:-5},tags:['tech','future','resources'],psych:{control:3,pragmatism:5,risk:2}},
      {id:'B',name:'Federacja wolnych enklaw',desc:'Autonomia regionów i lokalna odpowiedzialność.',delta:{hope:15,order:-5,food:7},tags:['freedom','people','ecology'],psych:{freedom:5,empathy:2,control:-3}},
      {id:'C',name:'Państwo bezpieczeństwa',desc:'Pełna centralizacja, racjonowanie i twarde normy.',delta:{order:20,food:10,hope:-12},tags:['security','resources','pragmatic'],psych:{control:5,empathy:-3,risk:-2}}
    ]
  }
];

const INTRO_LINES = [
  'Rok 2147. Świat nie skończył się jednego dnia.',
  'Rozpad następował powoli: energia, klimat, epidemie, wojny o zasoby.',
  'Z ośmiu miliardów ludzi pozostała niewielka część.',
  'Ostatnie enklawy połączyły systemy i powołały jedną instytucję.',
  'Radę Końca Świata.',
  'Macie osiem decyzji. Każda uratuje coś i coś zniszczy.',
  'Współpracujcie. Rywalizujcie. Przetrwajcie.'
];

let state = { mode:null, room:null, playerId:null, unsubscribe:null, timer:null, audio:null, introTimer:null };

function uid(){ return Math.random().toString(36).slice(2,9); }
function clamp(n){ return Math.max(0,Math.min(100,n)); }
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function roomUrl(code){ const u = new URL(location.href); u.search=''; u.searchParams.set('join',code); return u.toString(); }
function hashTie(code,round,letters){ let h=0; for(const ch of `${code}${round}`) h=(h*31+ch.charCodeAt(0))>>>0; return letters[h%letters.length]; }
function fmtDelta(n){ return `${n>0?'+':''}${n}`; }
function roleForIndex(i){return ROLES[i%ROLES.length];}
function playerColor(i){return ['#a67dff','#44df88','#53b6ff','#ff6680','#ffc640','#5be0d5','#d8e4ee','#8de36e'][i%8];}

function stopTimers(){ if(state.timer){clearInterval(state.timer);state.timer=null;} if(state.introTimer){clearTimeout(state.introTimer);state.introTimer=null;} }
function toast(msg){ const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2200); }

function renderHome(){
  stopTimers(); state.mode=null;
  const joinParam=new URLSearchParams(location.search).get('join')||'';
  root.innerHTML=`<div class="home"><div class="card home-card"><div class="eyebrow">Strategiczna gra społeczna · prototyp</div><div class="title">RADA<br>KOŃCA ŚWIATA</div><p class="subtitle">TV jest wspólnym centrum dowodzenia. Telefony pokazują prywatne role, cele, informacje i głosowanie.</p><div class="home-actions"><button class="btn primary big" id="hostBtn">UTWÓRZ GRĘ NA TV / TABLECIE</button><button class="btn big" id="joinBtn">DOŁĄCZ Z TELEFONU</button></div><div id="joinBox" class="join-box" style="display:${joinParam?'grid':'none'}"><input class="input" id="roomInput" maxlength="4" inputmode="numeric" placeholder="Kod pokoju" value="${esc(joinParam)}"><input class="input" id="nameInput" maxlength="16" placeholder="Twoje imię"><button class="btn green" id="joinGo">DOŁĄCZ</button></div><p class="mini" style="margin-top:18px">Prototyp: 3-8 graczy · 8 rund · ok. 25-40 min. Punkty są publiczne, ale powód ich zdobywania pozostaje tajny.</p></div></div>`;
document.getElementById('hostBtn').onclick=async()=>{
  try{
    bgMusic.volume = 0.3;
    await bgMusic.play();
  }catch(e){
    console.error("Błąd muzyki:", e);
  }

  createRoom();
};
  document.getElementById('joinBtn').onclick=()=>document.getElementById('joinBox').style.display='grid';
  document.getElementById('joinGo').onclick=joinRoom;
}

async function createRoom(){
  let code=''; let exists=true;
  while(exists){ code=String(Math.floor(1000+Math.random()*9000)); exists=(await get(ref(db,`rooms/${code}`))).exists(); }
  const room={createdAt:Date.now(),phase:'lobby',round:0,host:true,world:{population:67,food:58,energy:61,order:54,tech:32,hope:52},players:{},history:{}};
  await set(ref(db,`rooms/${code}`),room); state.mode='host';state.room=code; subscribeRoom(code);
}

async function joinRoom(){
  const code=(document.getElementById('roomInput').value||'').trim(); const name=(document.getElementById('nameInput').value||'').trim();
  if(!/^\d{4}$/.test(code)||!name){toast('Wpisz 4-cyfrowy kod i imię.');return;}
  const snap=await get(ref(db,`rooms/${code}`)); if(!snap.exists()){toast('Nie znaleziono pokoju.');return;}
  const data=snap.val(); const ids=Object.keys(data.players||{}); if(ids.length>=8){toast('Pokój jest pełny.');return;}
  const id=uid(), role=roleForIndex(ids.length);
  await set(ref(db,`rooms/${code}/players/${id}`),{
    name,roleId:role.id,roleName:role.name,color:playerColor(ids.length),score:0,influence:5,usedPower:false,vote:null,voteBoost:0,psych:{},votes:{},roundPoints:{},connected:true
  });
  localStorage.setItem('rks-player',JSON.stringify({code,id,name})); state.mode='player';state.room=code;state.playerId=id; subscribeRoom(code);
}

function subscribeRoom(code){
  if(state.unsubscribe) state.unsubscribe();
  state.unsubscribe=onValue(ref(db,`rooms/${code}`),snap=>{
    if(!snap.exists()){toast('Pokój został zamknięty.');renderHome();return;}
    const room=snap.val(); if(state.mode==='host') renderHost(room); else renderPlayer(room);
  });
}

function renderHost(room){
  if(room.phase==='lobby') return renderHostLobby(room);
  if(room.phase==='intro') return renderIntro(room);
  if(room.phase==='round'||room.phase==='voting') return renderHostRound(room);
  if(room.phase==='result') return renderHostResult(room);
  if(room.phase==='final') return renderFinal(room);
}

function renderHostLobby(room){
  const players=Object.values(room.players||{});
  root.innerHTML=`<div class="shell"><div class="topbar"><div><div class="eyebrow">Centrum dowodzenia</div><div class="brand">RADA KOŃCA ŚWIATA</div></div><div class="room-code">KOD ${state.room}</div></div>
  <div class="lobby-grid"><div class="card panel"><div class="eyebrow">Rada zbiera się</div><h2 style="font-size:38px;margin:6px 0 14px">${players.length?`${players.length} ${players.length===1?'gracz':'graczy'} gotowych`:'Oczekiwanie na członków Rady'}</h2><div class="players">${players.map(p=>`<div class="player-pill"><span class="dot" style="background:${p.color};box-shadow:0 0 16px ${p.color}"></span><b>${esc(p.name)}</b></div>`).join('')}</div><div style="margin-top:22px"><button class="btn primary big" id="startGame" ${players.length<2?'disabled':''}>URUCHOM PROLOG I GRĘ</button></div><p class="mini">Do testu technicznego wystarczą 2 osoby. Docelowo najlepiej 4-8.</p></div>
  <div class="card qrbox"><canvas id="qr" class="qr"></canvas><div><div class="eyebrow">Wejdź telefonem</div><h3 style="font-size:34px;margin:7px 0">${state.room}</h3><div class="mini" style="word-break:break-all">${esc(roomUrl(state.room))}</div></div></div></div></div>`;
  if(window.QRCode) QRCode.toCanvas(document.getElementById('qr'),roomUrl(state.room),{width:145,margin:1},()=>{});
  document.getElementById('startGame').onclick=async()=>{
    const pids=Object.keys(room.players||{}); if(pids.length<2)return;
    const updates={phase:'intro',introStartedAt:Date.now(),round:0};
    pids.forEach((id,i)=>{ const role=roleForIndex(i); updates[`players/${id}/roleId`]=role.id; updates[`players/${id}/roleName`]=role.name; updates[`players/${id}/score`]=0; updates[`players/${id}/influence`]=5; updates[`players/${id}/usedPower`]=false; updates[`players/${id}/vote`]=null; updates[`players/${id}/voteBoost`]=0; updates[`players/${id}/psych`]={}; updates[`players/${id}/votes`]={}; });
    await update(ref(db,`rooms/${state.room}`),updates);
  };
}

function renderIntro(room){
  root.innerHTML=`<div class="intro"><div class="intro-bg"></div><div class="stars"></div><div class="city"></div><div class="scanline"></div><button class="btn ghost intro-skip" id="skipIntro">POMIŃ PROLOG</button><div class="intro-copy"><div class="eyebrow">PROLOG</div><h1>RADA KOŃCA ŚWIATA</h1><p id="introLine"></p></div></div>`;
  const elapsed=Math.max(0,Date.now()-(room.introStartedAt||Date.now())); const step=Math.min(INTRO_LINES.length-1,Math.floor(elapsed/3300));
  document.getElementById('introLine').textContent=INTRO_LINES[step];
  clearTimeout(state.introTimer); state.introTimer=setTimeout(async()=>{
    const nowElapsed=Date.now()-(room.introStartedAt||Date.now());
    if(nowElapsed>=INTRO_LINES.length*3300){ await beginRound(0); }
    else renderIntro(room);
  },900);
  document.getElementById('skipIntro').onclick=()=>beginRound(0);
}

async function beginRound(index){
  const r=ROUNDS[index];
  await update(ref(db,`rooms/${state.room}`),{phase:'round',round:index,roundStartedAt:Date.now(),votes:{},power:null,lastResult:null});
  const snap=await get(ref(db,`rooms/${state.room}/players`)); const ps=snap.val()||{}; const updates={};
  Object.keys(ps).forEach(id=>{updates[`${id}/vote`]=null;updates[`${id}/voteBoost`]=0;});
  await update(ref(db,`rooms/${state.room}/players`),updates);
}

function metricsHtml(world){return METRICS.map(([k,n,ic])=>`<div class="metric"><div class="icon">${ic}</div><div><b>${n}</b><div class="bar"><span style="width:${clamp(world[k]||0)}%"></span></div></div><strong>${Math.round(world[k]||0)}%</strong></div>`).join('');}
function scoresHtml(players){return Object.values(players||{}).sort((a,b)=>(b.score||0)-(a.score||0)).map((p,i)=>`<div class="score-row"><div class="score-name"><div class="avatar" style="border-color:${p.color};color:${p.color}">${i+1}</div><div><b>${esc(p.name)}</b><div class="mini">${esc(p.roleName||'Członek Rady')}</div></div></div><div class="score">${p.score||0}</div></div>`).join('');}

function optionHtml(o){return `<div class="option choice-${o.id}"><div><span class="letter">${o.id}</span><strong>${esc(o.name)}</strong></div><small>${esc(o.desc)}</small><div class="effects">${Object.entries(o.delta).map(([k,v])=>`<div><b>${METRICS.find(m=>m[0]===k)?.[1]||k}:</b> ${fmtDelta(v)}</div>`).join('')}</div></div>`}

function renderHostRound(room){
  const r=ROUNDS[room.round]||ROUNDS[0], players=room.players||{}; const voting=room.phase==='voting';
  const votes=Object.values(players).filter(p=>p.vote); const counts={A:0,B:0,C:0}; votes.forEach(p=>{counts[p.vote]+=(1+(p.voteBoost||0));});
  const total=Math.max(1,counts.A+counts.B+counts.C);
  root.innerHTML=`<div class="shell"><div class="topbar"><div><div class="eyebrow">Dzień ${117+room.round*9}</div><div class="brand">RADA KOŃCA ŚWIATA</div></div><div style="display:flex;gap:10px;align-items:center"><span class="round-chip">RUNDA ${room.round+1}/${ROUNDS.length}</span><span class="round-chip">KOD ${state.room}</span></div></div>
  <div class="tv-grid"><div class="stack"><div class="card panel"><div class="eyebrow">Globalne wskaźniki</div>${metricsHtml(room.world||{})}</div><div class="card panel"><div class="eyebrow">Punkty graczy</div><div class="scoreboard">${scoresHtml(players)}</div></div></div>
  <div class="stack"><div class="card crisis"><span class="tag">KRYZYS · ${esc(r.zone)}</span><h2>${esc(r.title)}</h2><p>${esc(r.text)}</p><div class="timer" id="roundTimer">${voting?'GŁOSOWANIE':'DEBATA'}</div></div><div class="worldmap"><div class="label">${esc(r.zone.toUpperCase())}</div><div class="pulse"></div></div><div class="card panel"><div class="eyebrow">Opcje decyzji</div><div class="options">${r.options.map(optionHtml).join('')}</div></div></div>
  <div class="stack"><div class="card phasebox"><div class="eyebrow">Faza</div><h3>${voting?'GŁOSOWANIE':'DEBATA RADY'}</h3><p class="muted">${voting?'Każdy oddaje głos na telefonie. Może zużyć wpływ, aby zwiększyć wagę głosu.':'Gracze mają prywatne dane. Rozmawiajcie, blefujcie i negocjujcie.'}</p>${voting?`<div class="vote-bars"><div class="vote-bar"><b>A</b><div class="track"><div class="fill A" style="width:${counts.A/total*100}%"></div></div><b>${counts.A}</b></div><div class="vote-bar"><b>B</b><div class="track"><div class="fill B" style="width:${counts.B/total*100}%"></div></div><b>${counts.B}</b></div><div class="vote-bar"><b>C</b><div class="track"><div class="fill C" style="width:${counts.C/total*100}%"></div></div><b>${counts.C}</b></div></div><div class="notice">Oddano głosy: ${votes.length}/${Object.keys(players).length}. Wagi są widoczne, ale nie wiadomo kto wydał wpływ.</div>`:''}<div style="margin-top:14px">${!voting?'<button class="btn primary" id="openVote">OTWÓRZ GŁOSOWANIE</button>':'<button class="btn primary" id="closeVote">ZAMKNIJ GŁOSOWANIE</button>'}</div></div>
  <div class="card panel"><div class="eyebrow">Zasada wpływu</div><p class="muted">1 głos = 1 punkt. Gracz może potajemnie dołożyć do 3 punktów wpływu. Za 7 wpływu może raz w grze przejąć głos innego gracza.</p>${room.power?'<div class="notice">⚠ W tej rundzie użyto nacisku politycznego.</div>':''}</div></div></div></div>`;
  if(!voting) document.getElementById('openVote').onclick=()=>update(ref(db,`rooms/${state.room}`),{phase:'voting'});
  else document.getElementById('closeVote').onclick=()=>resolveRound(room);
}

async function resolveRound(room){
  const players=room.players||{}, r=ROUNDS[room.round]; const eff={};
  Object.entries(players).forEach(([id,p])=>{eff[id]={vote:p.vote||null,weight:1+(p.voteBoost||0)};});
  if(room.power?.targetId && room.power?.choice && eff[room.power.targetId]) eff[room.power.targetId].vote=room.power.choice;
  const counts={A:0,B:0,C:0}; Object.values(eff).forEach(v=>{if(v.vote)counts[v.vote]+=v.weight;});
  let max=Math.max(counts.A,counts.B,counts.C), tied=['A','B','C'].filter(k=>counts[k]===max); const winner=tied.length===1?tied[0]:hashTie(state.room,room.round,tied);
  const option=r.options.find(o=>o.id===winner); const newWorld={...(room.world||{})}; Object.entries(option.delta).forEach(([k,v])=>newWorld[k]=clamp((newWorld[k]||0)+v));
  const updates={phase:'result',lastResult:{winner,counts,delta:option.delta,name:option.name},world:newWorld};
  Object.entries(players).forEach(([id,p])=>{
    const role=ROLES.find(x=>x.id===p.roleId)||ROLES[0]; const pv=eff[id].vote; const ownOption=r.options.find(o=>o.id===pv); let pts=0, infGain=0;
    if(pv===winner) pts+=2;
    if(ownOption){ const matches=role.fav.filter(t=>ownOption.tags.includes(t)).length; pts+=matches*3; infGain=matches; updates[`players/${id}/votes/${room.round}`]=pv; const psych={...(p.psych||{})}; Object.entries(ownOption.psych||{}).forEach(([k,v])=>psych[k]=(psych[k]||0)+v); updates[`players/${id}/psych`]=psych; }
    updates[`players/${id}/score`]=(p.score||0)+pts;
    updates[`players/${id}/influence`]=Math.max(0,(p.influence||0)-(p.voteBoost||0))+infGain;
    updates[`players/${id}/roundPoints/${room.round}`]=pts;
  });
  await update(ref(db,`rooms/${state.room}`),updates);
}

function renderHostResult(room){
  const r=ROUNDS[room.round],res=room.lastResult; const players=room.players||{};
  root.innerHTML=`<div class="shell"><div class="topbar"><div><div class="eyebrow">Decyzja Rady</div><div class="brand">RADA KOŃCA ŚWIATA</div></div><div class="round-chip">RUNDA ${room.round+1}/${ROUNDS.length}</div></div><div class="card result-hero"><div class="eyebrow">Wybrano opcję ${res.winner}</div><div class="winner">${esc(res.name)}</div><p class="muted">Świat reaguje na decyzję. Punkty osobiste zostały naliczone według tajnych celów.</p><div class="delta-grid">${Object.entries(res.delta).map(([k,v])=>`<div class="delta ${v>=0?'pos':'neg'}"><span>${METRICS.find(m=>m[0]===k)?.[1]||k}</span><b>${fmtDelta(v)}</b></div>`).join('')}</div><div style="margin-top:24px"><button class="btn primary big" id="nextRound">${room.round+1>=ROUNDS.length?'PODSUMOWANIE RADY':'NASTĘPNA RUNDA'}</button></div></div><div class="card panel" style="margin-top:14px"><div class="eyebrow">Ranking po rundzie</div><div class="scoreboard">${scoresHtml(players)}</div></div></div>`;
  document.getElementById('nextRound').onclick=()=> room.round+1>=ROUNDS.length ? finishGame(room) : beginRound(room.round+1);
}

function finalBonus(role,world){
  if(role.id==='science')return world.tech>=70?8:0; if(role.id==='people')return world.population>=60?8:0; if(role.id==='security')return world.order>=70?8:0; if(role.id==='faith')return world.hope>=70?8:0;
  if(role.id==='corp')return world.energy>=55&&world.food>=55?8:0; if(role.id==='liberty')return world.hope>world.order?8:0; if(role.id==='strategist')return Math.min(...METRICS.map(m=>world[m[0]]||0))>=35?8:0; if(role.id==='ecology')return world.food>=65&&world.energy>=50?8:0; return 0;
}
function worldSurvival(world){return Math.round(METRICS.reduce((s,m)=>s+(world[m[0]]||0),0)/METRICS.length);}

async function finishGame(room){
  const updates={phase:'final'}; Object.entries(room.players||{}).forEach(([id,p])=>{const role=ROLES.find(r=>r.id===p.roleId)||ROLES[0];updates[`players/${id}/score`]=(p.score||0)+finalBonus(role,room.world||{});}); await update(ref(db,`rooms/${state.room}`),updates);
}

function profileFromPsych(psych={}){
  const keys=['empathy','pragmatism','control','freedom','risk']; const vals=keys.map(k=>[k,psych[k]||0]).sort((a,b)=>b[1]-a[1]); const top=vals[0]?.[0]||'pragmatism', second=vals[1]?.[0]||'empathy';
  const labels={empathy:'Humanista',pragmatism:'Pragmatyk',control:'Architekt kontroli',freedom:'Federalista',risk:'Ryzykant'};
  const desc={empathy:'Priorytetem były skutki decyzji dla ludzi i morale.',pragmatism:'Często wybierano rozwiązania efektywne, nawet jeśli wymagały kompromisów.',control:'Preferowane były stabilność, porządek i egzekwowalne zasady.',freedom:'Częściej chroniono autonomię i rozproszenie władzy.',risk:'Akceptowano niepewność w zamian za potencjalnie większy efekt.'};
  return {title:`${labels[top]} · ${labels[second]}`,desc:desc[top],traits:vals.slice(0,3).map(([k,v])=>`${labels[k]} ${v>=0?'+':''}${v}`).join(' · ')};
}

function renderFinal(room){
  const players=Object.values(room.players||{}).sort((a,b)=>(b.score||0)-(a.score||0)), survival=worldSurvival(room.world||{});
  root.innerHTML=`<div class="shell"><div class="card final"><div class="eyebrow">Koniec posiedzenia</div><h1 style="font-size:58px;margin:8px 0">${survival>=50?'CYWILIZACJA PRZETRWAŁA':'CYWILIZACJA JEST NA KRAWĘDZI'}</h1><p class="subtitle">Indeks przetrwania świata: <b>${survival}/100</b>. Wspólny wynik nie usuwa rywalizacji - zwycięża członek Rady z najwyższą liczbą punktów.</p><div class="ranking">${players.map((p,i)=>`<div class="rank"><div class="avatar">${i+1}</div><div><b>${esc(p.name)}</b><div class="mini">${esc(p.roleName)}</div></div><div class="score">${p.score||0} pkt</div></div>`).join('')}</div><div class="profile-grid">${players.map(p=>{const pr=profileFromPsych(p.psych);return `<div class="profile-card"><div class="eyebrow">${esc(p.name)}</div><h4>${esc(pr.title)}</h4><p class="muted">${esc(pr.desc)}</p><div class="traits">${esc(pr.traits)}</div></div>`}).join('')}</div><div style="margin-top:22px"><button class="btn" id="restart">NOWA GRA</button></div></div></div>`;
  document.getElementById('restart').onclick=()=>update(ref(db,`rooms/${state.room}`),{phase:'lobby',round:0,world:{population:67,food:58,energy:61,order:54,tech:32,hope:52}});
}

function getRole(player){return ROLES.find(r=>r.id===player?.roleId)||ROLES[0];}
function renderPlayer(room){
  const p=room.players?.[state.playerId]; if(!p){root.innerHTML='<div class="home"><div class="card home-card"><h2>Nie znaleziono gracza.</h2><button class="btn" onclick="location.href=location.pathname">WRÓĆ</button></div></div>';return;}
  if(room.phase==='lobby') return renderPlayerLobby(room,p);
  if(room.phase==='intro') return renderPlayerIntro(room,p);
  if(room.phase==='round'||room.phase==='voting') return renderPlayerRound(room,p);
  if(room.phase==='result') return renderPlayerResult(room,p);
  if(room.phase==='final') return renderPlayerFinal(room,p);
}

function renderPlayerLobby(room,p){
  const role=getRole(p);
  root.innerHTML=`<div class="phone"><div class="phone-wrap"><div class="phone-head"><div><div class="eyebrow">Pokój ${state.room}</div><b>${esc(p.name)}</b></div><span class="round-chip">POŁĄCZONO</span></div><div class="role-card" style="border-color:${role.accent}"><div class="eyebrow">Twoja rola zostanie aktywowana po starcie</div><div class="role-name">Członek Rady</div><p class="muted">Nie pokazuj telefonu innym graczom. Część informacji będzie prywatna.</p></div><div class="secret"><h4>CEL</h4><p>Pozostań w pokoju i czekaj, aż host uruchomi prolog.</p></div></div></div>`;
}
function renderPlayerIntro(room,p){
  root.innerHTML=`<div class="phone"><div class="phone-wrap"><div class="role-card"><div class="eyebrow">PROLOG TRWA NA EKRANIE GŁÓWNYM</div><div class="role-name">${esc(p.name)}</div><p class="muted">Za chwilę otrzymasz swoją tajną rolę i cel.</p></div><div class="secret"><h4>ZASADA</h4><p>Twoje punkty są widoczne na TV, ale inni gracze nie wiedzą, za co je zdobywasz.</p></div></div></div>`;
}

function renderPlayerRound(room,p){
  const r=ROUNDS[room.round],role=getRole(p),intel=r.intel[role.id]||'Nie otrzymujesz dodatkowych danych w tej rundzie.'; const voting=room.phase==='voting'; const canPower=(p.influence||0)>=7&&!p.usedPower&&!room.power&&p.vote;
  root.innerHTML=`<div class="phone"><div class="phone-wrap"><div class="phone-head"><div><div class="eyebrow">RUNDA ${room.round+1}/${ROUNDS.length}</div><b>${esc(p.name)}</b></div><div><span class="bigstat">${p.score||0}</span><span class="mini"> pkt</span></div></div><div class="role-card" style="border-color:${role.accent}"><div class="eyebrow">Twoja rola</div><div class="role-name" style="color:${role.accent}">${esc(role.name)}</div><p class="muted">${esc(role.goal)}</p><div class="statline"><span>Wpływ</span><span class="bigstat">${p.influence||0}</span></div></div><div class="secret"><h4>TAJNY SYSTEM PUNKTOWANIA</h4><p>${esc(role.scoreText)}</p></div><div class="secret"><h4>PRYWATNA INFORMACJA - TA RUNDA</h4><p>${esc(intel)}</p></div>
  ${!voting?`<div class="secret"><h4>DEBATA</h4><p>Możesz ujawnić tę informację, przemilczeć ją albo wykorzystać w negocjacjach. Głosowanie pojawi się, gdy host otworzy fazę decyzji.</p></div>`:`<div class="secret"><h4>TWÓJ GŁOS</h4><div class="choice-buttons">${r.options.map(o=>`<button class="choice-btn ${p.vote===o.id?'selected':''}" data-vote="${o.id}"><b>${o.id}. ${esc(o.name)}</b><div class="mini">${esc(o.desc)}</div></button>`).join('')}</div></div><div class="secret"><h4>SIŁA GŁOSU</h4><p>Możesz potajemnie zużyć do 3 punktów wpływu. Twój głos ma wtedy wagę 1 + wydany wpływ.</p><div class="influence-pick">${[0,1,2,3].map(n=>`<button data-boost="${n}" class="${(p.voteBoost||0)===n?'active':''}" ${n>(p.influence||0)?'disabled':''}>+${n}</button>`).join('')}</div></div><div class="power"><b>NACISK POLITYCZNY - 7 WPŁYWU</b><div class="mini">Raz w grze możesz przejąć głos jednego gracza i zmienić go na swój wybór. TV pokaże tylko, że użyto nacisku - nie ujawni sprawcy.</div>${canPower?`<div class="targets">${Object.entries(room.players||{}).filter(([id])=>id!==state.playerId).map(([id,x])=>`<button class="target" data-target="${id}">Przejmij głos: ${esc(x.name)}</button>`).join('')}</div>`:`<div class="mini" style="margin-top:8px">${p.usedPower?'Wykorzystano już w tej grze.':room.power?'Ktoś już użył nacisku w tej rundzie.':!p.vote?'Najpierw oddaj własny głos.':'Potrzebujesz 7 wpływu.'}</div>`}</div>`}
  </div></div>`;
  if(voting){
    document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>update(ref(db,`rooms/${state.room}/players/${state.playerId}`),{vote:b.dataset.vote}));
    document.querySelectorAll('[data-boost]').forEach(b=>b.onclick=()=>update(ref(db,`rooms/${state.room}/players/${state.playerId}`),{voteBoost:Number(b.dataset.boost)}));
    document.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>usePower(room,p,b.dataset.target));
  }
}

async function usePower(room,p,targetId){
  if(!p.vote||(p.influence||0)<7||p.usedPower||room.power)return;
  await update(ref(db,`rooms/${state.room}`),{power:{sourceId:state.playerId,targetId,choice:p.vote},[`players/${state.playerId}/influence`]:(p.influence||0)-7,[`players/${state.playerId}/usedPower`]:true}); toast('Nacisk polityczny aktywowany.');
}

function renderPlayerResult(room,p){
  const res=room.lastResult, gained=p.roundPoints?.[room.round]||0;
  root.innerHTML=`<div class="phone"><div class="phone-wrap"><div class="role-card"><div class="eyebrow">Decyzja Rady</div><div class="role-name">${esc(res.name)}</div><p class="muted">Opcja ${res.winner} wygrała głosowanie.</p></div><div class="secret"><h4>TWÓJ WYNIK TEJ RUNDY</h4><p><span class="bigstat">+${gained}</span> pkt</p><p class="mini">Dokładna przyczyna wynika z Twojej tajnej roli, zgodności własnego głosu z celem i wyniku Rady.</p></div><div class="secret"><h4>STAN KONTA</h4><p><b>${p.score||0} pkt</b> · ${p.influence||0} wpływu</p></div><p class="mini" style="margin-top:14px">Czekaj na następną rundę uruchomioną na ekranie głównym.</p></div></div>`;
}
function renderPlayerFinal(room,p){
  const role=getRole(p),pr=profileFromPsych(p.psych),players=Object.values(room.players||{}).sort((a,b)=>(b.score||0)-(a.score||0)),pos=players.findIndex(x=>x.name===p.name)+1;
  root.innerHTML=`<div class="phone"><div class="phone-wrap"><div class="role-card" style="border-color:${role.accent}"><div class="eyebrow">Twój wynik</div><div class="role-name">${pos}. miejsce · ${p.score||0} pkt</div><p class="muted">Rola: ${esc(role.name)}</p></div><div class="secret"><h4>PROFIL DECYZYJNY</h4><div class="role-name">${esc(pr.title)}</div><p>${esc(pr.desc)}</p><p class="mini">${esc(pr.traits)}</p></div><div class="secret"><h4>TAJNY CEL</h4><p>${esc(role.scoreText)}</p></div></div></div>`;
}

// Restore player session when opening the same phone again.
(async()=>{
  const qs=new URLSearchParams(location.search); const join=qs.get('join');
  try{
    const saved=JSON.parse(localStorage.getItem('rks-player')||'null');
    if(saved?.code&&saved?.id){ const s=await get(ref(db,`rooms/${saved.code}/players/${saved.id}`)); if(s.exists()){state.mode='player';state.room=saved.code;state.playerId=saved.id;subscribeRoom(saved.code);return;} }
  }catch(e){}
  renderHome();
  if(join){ document.getElementById('joinBox').style.display='grid'; document.getElementById('roomInput').value=join; }
})();
