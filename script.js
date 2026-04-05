const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MSHORT=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT=['Mo','Tu','We','Th','Fr','Sa','Su'];
const DAYS_LONG=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const USERS={
  admin:{name:'Husni (Admin)',initials:'HU',role:'Event Administrator',dept:'Administration'},
  student:{name:'Husni',initials:'HU',role:'3rd Year, Computer Science',dept:'Computer Science & Engineering, KMCT'}
};

const today=new Date();
const todayY=today.getFullYear(),todayM=today.getMonth(),todayD=today.getDate();

function pad(n){return String(n).padStart(2,'0');}
function mkDate(dPlus){
  const d=new Date(today);d.setDate(todayD+dPlus);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

let appState={
  loggedIn:false,currentUser:null,
  page:'dashboard',filter:'all',
  calYear:todayY,calMonth:todayM,
  search:'',
  attending:new Set([1,3]),
  events:[
    {id:1,title:'Advanced Quantum Mechanics Seminar',category:'academic',venue:'Hall A',date:mkDate(2),time:'14:00 - 15:30',attending:42,desc:'Deep dive into the Copenhagen interpretation with leading researchers from the physics department.'},
    {id:2,title:'Varsity Basketball: Finals vs. Tech',category:'sports',venue:'Main Gym',date:mkDate(3),time:'19:00 - 21:00',attending:120,desc:'The biggest match of the season. Wear blue to show your support for the home team!'},
    {id:3,title:'Annual Fine Arts Showcase',category:'cultural',venue:'Student Center',date:mkDate(5),time:'10:00 - 18:00',attending:15,desc:'Exhibition of student work spanning painting, sculpture, photography, and digital media.'},
    {id:4,title:'Python for Data Science Workshop',category:'workshop',venue:'CS Lab 3',date:mkDate(7),time:'14:00 - 17:00',attending:38,desc:'Hands-on session covering pandas, matplotlib and scikit-learn for real-world datasets.'},
    {id:5,title:'Good Friday Holiday',category:'holiday',venue:'College Campus',date:mkDate(9),time:'All day',attending:0,desc:'College closed for the public holiday. No classes or activities.'},
    {id:6,title:'AI & ML Research Seminar',category:'academic',venue:'Seminar Hall B',date:mkDate(11),time:'15:00 - 17:00',attending:60,desc:'Guest lecture on the latest advances in generative AI and reinforcement learning.'},
    {id:7,title:'Inter-College Cricket Tournament',category:'sports',venue:'College Ground',date:mkDate(13),time:'08:00 - 18:00',attending:200,desc:'Annual inter-college cricket championship. Come support our team!'},
    {id:8,title:'Career Fair 2026',category:'academic',venue:'Convention Centre',date:mkDate(15),time:'09:00 - 17:00',attending:500,desc:'Campus recruitment drive with 40+ top companies across all departments.'},
  ],
  nextId:9
};

const CAT={
  academic:{label:'Academic',icon:'&#128218;',cls:'academic',dot:'#185FA5',bg:'#e6f0ff'},
  sports:{label:'Sports',icon:'&#9917;',cls:'sports',dot:'#993C1D',bg:'#fce8e0'},
  cultural:{label:'Cultural',icon:'&#127914;',cls:'cultural',dot:'#3B6D11',bg:'#e8f5e9'},
  workshop:{label:'Workshop',icon:'&#128295;',cls:'workshop',dot:'#6b21a8',bg:'#f3e8ff'},
  holiday:{label:'Holiday',icon:'&#127965;',cls:'holiday',dot:'#854F0B',bg:'#fff8e1'},
};

/* AUTH */
function doLogin(){
  const u=document.getElementById('login-user').value.trim();
  const p=document.getElementById('login-pass').value;
  const err=document.getElementById('login-error');
  if((u==='admin'&&p==='college123')||(u==='student'&&p==='pass123')){
    appState.loggedIn=true;
    appState.currentUser=u;
    const ui=USERS[u];
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app-screen').style.display='block';
    document.getElementById('user-avatar').textContent='HU';
    render();
    err.textContent='';
  }else{
    err.textContent='Invalid username or password. Please try again.';
    document.getElementById('login-pass').value='';
  }
}

function doLogout(){
  appState.loggedIn=false;appState.currentUser=null;appState.page='dashboard';
  appState.search='';appState.filter='all';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('app-screen').style.display='none';
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
  document.getElementById('login-error').textContent='';
  document.getElementById('search-input').value='';
}

/* SEARCH */
function handleSearch(){
  appState.search=document.getElementById('search-input').value;
  renderMain();
}

function highlight(text,query){
  if(!query.trim())return text;
  const re=new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return text.replace(re,'<mark class="highlight">$1</mark>');
}

/* NAV */
function setPage(p){
  appState.page=p;
  appState.search='';
  document.getElementById('search-input').value='';
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  const el=document.getElementById('nav-'+p);
  if(el)el.classList.add('active');
  const titles={dashboard:'KMCT Campus Events',calendar:'Calendar',profile:'Profile'};
  document.getElementById('topbar-title').textContent=titles[p]||'KMCT Campus Events';
  render();
}

function setFilter(f){appState.filter=f;renderMain();}
function prevCalMonth(){if(appState.calMonth===0){appState.calMonth=11;appState.calYear--;}else{appState.calMonth--;}render();}
function nextCalMonth(){if(appState.calMonth===11){appState.calMonth=0;appState.calYear++;}else{appState.calMonth++;}render();}

/* FILTER + SEARCH */
function filteredEvents(){
  let evs=appState.events;
  if(appState.filter!=='all')evs=evs.filter(e=>e.category===appState.filter);
  if(appState.search.trim()){
    const q=appState.search.toLowerCase();
    evs=evs.filter(e=>e.title.toLowerCase().includes(q)||e.venue.toLowerCase().includes(q)||e.category.toLowerCase().includes(q));
  }
  return evs;
}

/* RENDER */
function render(){renderMain();renderRight();}

function renderMain(){
  const col=document.getElementById('main-col');
  if(appState.page==='profile'){col.innerHTML=renderProfile();return;}
  if(appState.page==='calendar'){col.innerHTML=renderCalPage();return;}
  renderDashboard(col);
}

function renderDashboard(col){
  const dateStr=`${DAYS_LONG[today.getDay()]}, ${MSHORT[todayM]} ${todayD}`;
  const attending=appState.events.filter(e=>appState.attending.has(e.id)).length;
  const deadlines=appState.events.filter(e=>e.category==='academic').length;
  const evs=filteredEvents();
  const q=appState.search;

  col.innerHTML=`
    <div class="greeting">Good Morning, ${USERS[appState.currentUser]?.name.split(' ')[0] || 'Husni'}</div>
    <div class="date-row">
      <div class="big-date">${dateStr}</div>
      <div class="btn-row">
        <button class="export-btn" onclick="exportCalendar()">&#8659; Export</button>
        <button class="add-btn" onclick="openAdd()">+ Add Event</button>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div><div class="stat-label">Total Events</div><div class="stat-num">${appState.events.length}</div></div><div class="stat-icon si-blue">&#128197;</div></div>
      <div class="stat-card"><div><div class="stat-label">Attending</div><div class="stat-num">${attending}</div></div><div class="stat-icon si-teal">&#9989;</div></div>
      <div class="stat-card"><div><div class="stat-label">Deadlines</div><div class="stat-num">${deadlines}</div></div><div class="stat-icon si-red" style="font-size:20px;color:#e05050;font-weight:700;">!</div></div>
    </div>
    <div class="section-head">
      <div class="section-title">${q?`Search results for "${q}"`:' Upcoming for You'}</div>
      <div class="filter-tabs">
        <button class="ftab ${appState.filter==='all'?'active':'inactive'}" onclick="setFilter('all')">All</button>
        <button class="ftab ${appState.filter==='academic'?'active':'inactive'}" onclick="setFilter('academic')">Academic</button>
        <button class="ftab ${appState.filter==='sports'?'active':'inactive'}" onclick="setFilter('sports')">Sports</button>
        <button class="ftab ${appState.filter==='cultural'?'active':'inactive'}" onclick="setFilter('cultural')">Cultural</button>
        <button class="ftab ${appState.filter==='workshop'?'active':'inactive'}" onclick="setFilter('workshop')">Workshop</button>
      </div>
    </div>
    <div class="event-list">
      ${evs.length?evs.map(ev=>eventCardHTML(ev,q)).join(''):'<div class="empty-state">No events found. Try a different search or filter.</div>'}
    </div>
  `;
}

function eventCardHTML(ev,q=''){
  const c=CAT[ev.category];
  const attLabel=ev.attending>100?`${ev.attending}+ Attending`:`${ev.attending} Attending`;
  const title=highlight(ev.title,q);
  const venue=highlight(ev.venue,q);
  return `<div class="event-card" onclick="openDetail(${ev.id})">
    <div class="event-thumb et-${c.cls}">${c.icon}</div>
    <div class="event-info">
      <div class="event-cat-row ecat-${c.cls}">${c.label.toUpperCase()} &bull; ${venue.toUpperCase()}</div>
      <div class="event-title">${title}</div>
      <div class="event-desc">${ev.desc}</div>
      <div class="event-meta">
        <span>&#128337; ${ev.time}</span>
        <span>&#128101; ${attLabel}</span>
      </div>
    </div>
    <div class="event-arrow">&#8250;</div>
  </div>`;
}

function renderCalPage(){
  const year=appState.calYear,month=appState.calMonth;
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const prevDays=new Date(year,month,0).getDate();
  const startDay=(firstDay+6)%7;

  let cells=[];
  for(let i=startDay-1;i>=0;i--)cells.push({d:prevDays-i,other:true});
  for(let d=1;d<=daysInMonth;d++)cells.push({d,other:false});
  while(cells.length%7)cells.push({d:cells.length-startDay-daysInMonth+1,other:true});

  const gridHTML=cells.map(cell=>{
    const y2=cell.other?(cell.d>15?(month===0?year-1:year):(month===11?year+1:year)):year;
    const m2=cell.other?(cell.d>15?(month===0?11:month-1):(month===11?0:month+1)):month;
    const dateStr=`${y2}-${pad(m2+1)}-${pad(cell.d)}`;
    const isToday=!cell.other&&cell.d===todayD&&month===todayM&&year===todayY;
    const dayEvs=appState.events.filter(e=>e.date===dateStr);
    const dots=dayEvs.slice(0,2).map(e=>`<span class="cfd-dot ${e.category}" onclick="event.stopPropagation();openDetail(${e.id})">${e.title}</span>`).join('');
    const more=dayEvs.length>2?`<span style="font-size:10px;color:var(--muted);">+${dayEvs.length-2}</span>`:'';
    return `<div class="cal-full-d ${cell.other?'other':''} ${isToday?'today':''}">
      <div class="cfd-num">${cell.d}</div>${dots}${more}
    </div>`;
  }).join('');

  const monthEvs=appState.events.filter(e=>{const[ey,em]=e.date.split('-');return parseInt(ey)===year&&parseInt(em)-1===month;});

  return `
    <div class="greeting">Calendar View</div>
    <div class="date-row">
      <div class="big-date">${MONTHS[month]} ${year}</div>
      <div class="btn-row">
        <button class="export-btn" onclick="exportCalendar()">&#8659; Export</button>
        <button class="add-btn" onclick="openAdd()">+ Add Event</button>
      </div>
    </div>
    <div class="cal-page-grid">
      <div class="cal-page-head">
        <span style="font-size:15px;font-weight:600;color:var(--navy);">${MONTHS[month]} ${year}</span>
        <div style="display:flex;gap:6px;">
          <button class="mini-nav-btn" onclick="prevCalMonth()">&#8592;</button>
          <button class="mini-nav-btn" onclick="nextCalMonth()">&#8594;</button>
        </div>
      </div>
      <div class="cal-full-grid">
        ${DAYS_SHORT.map(d=>`<div class="cal-full-dh">${d}</div>`).join('')}
        ${gridHTML}
      </div>
    </div>
    <div class="section-title" style="margin-bottom:14px;">Events in ${MONTHS[month]}</div>
    <div class="event-list">
      ${monthEvs.length?monthEvs.map(ev=>eventCardHTML(ev)).join(''):'<div class="empty-state">No events this month.</div>'}
    </div>
  `;
}

function renderProfile(){
  const u=USERS[appState.currentUser]||{name:'User',initials:'U',role:'Student',dept:'Unknown'};
  const attending=appState.events.filter(e=>appState.attending.has(e.id));
  return `
    <div class="greeting">Your Profile</div>
    <div style="margin-bottom:20px;"><div class="big-date" style="font-size:24px;">${u.name}</div></div>
    <div class="profile-card">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
        <div class="profile-avatar">${u.initials}</div>
        <div>
          <div style="font-size:16px;font-weight:600;color:var(--navy);">${u.name}</div>
          <div style="font-size:13px;color:var(--muted);">${u.role}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;border-top:0.5px solid var(--border);padding-top:16px;">
        <div style="display:flex;gap:12px;"><span style="color:var(--muted);min-width:90px;">Email</span><span style="color:var(--navy);font-weight:500;">${appState.currentUser}@kmct.ac.in</span></div>
        <div style="display:flex;gap:12px;"><span style="color:var(--muted);min-width:90px;">Role</span><span style="color:var(--navy);font-weight:500;">${u.role}</span></div>
        <div style="display:flex;gap:12px;"><span style="color:var(--muted);min-width:90px;">Department</span><span style="color:var(--navy);font-weight:500;">${u.dept}</span></div>
        <div style="display:flex;gap:12px;"><span style="color:var(--muted);min-width:90px;">Attending</span><span style="color:var(--blue);font-weight:600;">${appState.attending.size} events</span></div>
      </div>
      ${attending.length?`<div style="margin-top:16px;border-top:0.5px solid var(--border);padding-top:14px;">
        <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">My Events</div>
        ${attending.map(e=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:0.5px solid var(--border);">
          <span style="font-size:18px;">${CAT[e.category].icon}</span>
          <div><div style="font-size:13px;font-weight:500;color:var(--navy);">${e.title}</div>
          <div style="font-size:12px;color:var(--muted);">${e.date} &bull; ${e.venue}</div></div>
        </div>`).join('')}
      </div>`:''}
    </div>
  `;
}

function renderRight(){
  const rc=document.getElementById('right-col');
  const year=appState.calYear,month=appState.calMonth;
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const prevDays=new Date(year,month,0).getDate();
  const startDay=(firstDay+6)%7;
  const eventDates=new Set(appState.events.map(e=>e.date));

  let cells=[];
  for(let i=startDay-1;i>=0;i--)cells.push({d:prevDays-i,other:true});
  for(let d=1;d<=daysInMonth;d++)cells.push({d,other:false});
  while(cells.length%7)cells.push({d:cells.length-startDay-daysInMonth+1,other:true});

  const gridHTML=cells.map(cell=>{
    const y2=cell.other?(cell.d>15?(month===0?year-1:year):(month===11?year+1:year)):year;
    const m2=cell.other?(cell.d>15?(month===0?11:month-1):(month===11?0:month+1)):month;
    const dateStr=`${y2}-${pad(m2+1)}-${pad(cell.d)}`;
    const isToday=!cell.other&&cell.d===todayD&&month===todayM&&year===todayY;
    const hasEv=eventDates.has(dateStr);
    return `<div class="cal-d ${cell.other?'other':''} ${isToday?'today':''} ${hasEv?'has-event':''}">${cell.d}</div>`;
  }).join('');

  rc.innerHTML=`
    <div class="mini-cal">
      <div class="mini-cal-head">
        <div class="mini-cal-month">${MONTHS[month]} ${year}</div>
        <div class="mini-nav">
          <button class="mini-nav-btn" onclick="prevCalMonth()">&#8592;</button>
          <button class="mini-nav-btn" onclick="nextCalMonth()">&#8594;</button>
        </div>
      </div>
      <div class="mini-cal-grid">
        ${DAYS_SHORT.map(d=>`<div class="cal-dh">${d}</div>`).join('')}
        ${gridHTML}
      </div>
    </div>
    <div class="loc-card">
      <div class="map-dots"></div>
      <div><div class="loc-label">Location View</div><div class="loc-title">Interactive Campus Map</div></div>
      <button class="loc-btn">&#10148;</button>
    </div>
  `;
}

/* MODALS */
function openAdd(){
  document.getElementById('modal-container').innerHTML=`
    <div class="modal-overlay" onclick="closeModalIf(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head">Add New Event</div>
        <div class="form-group"><label class="form-label2">Event Title</label><input class="form-input2" id="f-title" placeholder="e.g. Annual Sports Day"></div>
        <div class="form-row2">
          <div class="form-group"><label class="form-label2">Date</label><input class="form-input2" type="date" id="f-date"></div>
          <div class="form-group"><label class="form-label2">Time</label><input class="form-input2" id="f-time" placeholder="e.g. 10:00 AM"></div>
        </div>
        <div class="form-group"><label class="form-label2">Venue</label><input class="form-input2" id="f-venue" placeholder="e.g. Main Auditorium"></div>
        <div class="form-group"><label class="form-label2">Category</label>
          <select class="form-select2" id="f-cat">
            <option value="academic">Academic</option>
            <option value="sports">Sports</option>
            <option value="cultural">Cultural</option>
            <option value="workshop">Workshop</option>
            <option value="holiday">Holiday</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label2">Description</label><input class="form-input2" id="f-desc" placeholder="Brief description..."></div>
        <div class="modal-actions">
          <button class="btn-cancel2" onclick="closeModal()">Cancel</button>
          <button class="btn-save2" onclick="saveEvent()">Save Event</button>
        </div>
      </div>
    </div>`;
}

function openDetail(id){
  const ev=appState.events.find(e=>e.id===id);if(!ev)return;
  const c=CAT[ev.category];
  const isAtt=appState.attending.has(id);
  document.getElementById('modal-container').innerHTML=`
    <div class="modal-overlay" onclick="closeModalIf(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="detail-cat-badge" style="background:${c.bg};color:${c.dot};">${c.icon} ${c.label}</div>
        <div class="detail-title">${ev.title}</div>
        <div class="detail-rows">
          <div class="detail-row2"><span class="detail-lbl">Date</span><span class="detail-val2">${formatDate(ev.date)}</span></div>
          <div class="detail-row2"><span class="detail-lbl">Time</span><span class="detail-val2">${ev.time}</span></div>
          <div class="detail-row2"><span class="detail-lbl">Venue</span><span class="detail-val2">${ev.venue}</span></div>
          <div class="detail-row2"><span class="detail-lbl">Attending</span><span class="detail-val2">${ev.attending}${ev.attending>100?'+':''} students</span></div>
        </div>
        <div class="detail-desc">${ev.desc}</div>
        <button class="attend-btn ${isAtt?'attending':''}" onclick="toggleAttend(${id})">${isAtt?'&#10003; Attending':'Mark as Attending'}</button>
        <button class="delete-btn2" onclick="deleteEvent(${id})">Remove Event</button>
        <div style="text-align:center;margin-top:8px;"><button class="btn-cancel2" onclick="closeModal()">Close</button></div>
      </div>
    </div>`;
}

function saveEvent(){
  const title=document.getElementById('f-title').value.trim();
  const date=document.getElementById('f-date').value;
  const time=document.getElementById('f-time').value.trim();
  const venue=document.getElementById('f-venue').value.trim();
  const category=document.getElementById('f-cat').value;
  const desc=document.getElementById('f-desc').value.trim();
  if(!title||!date){alert('Please enter event title and date.');return;}
  appState.events.push({id:appState.nextId++,title,date,time:time||'TBD',venue:venue||'TBD',category,attending:0,desc:desc||'No description.'});
  closeModal();render();
}

function toggleAttend(id){
  if(appState.attending.has(id))appState.attending.delete(id);else appState.attending.add(id);
  openDetail(id);renderMain();
}

function deleteEvent(id){
  appState.events=appState.events.filter(e=>e.id!==id);
  appState.attending.delete(id);
  closeModal();render();
}

function closeModal(){document.getElementById('modal-container').innerHTML='';}
function closeModalIf(e){if(e.target.classList.contains('modal-overlay'))closeModal();}

function formatDate(ds){
  if(!ds)return'';
  const[y,m,d]=ds.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`;
}

/* EXPORT */
function exportCalendar(){
  const rows=appState.events.map(e=>{
    const c=CAT[e.category];
    return `<tr>
      <td>${e.title}</td>
      <td><span style="background:${c.bg};color:${c.dot};padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600;">${c.label}</span></td>
      <td>${formatDate(e.date)}</td>
      <td>${e.time}</td>
      <td>${e.venue}</td>
      <td>${e.attending}${e.attending>100?'+':''}</td>
    </tr>`;
  }).join('');

  const html=`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>KMCT College Event Calendar Export</title>
<style>
  body{font-family:'Segoe UI',sans-serif;background:#f4f6fb;margin:0;padding:40px;}
  .header{background:#1a2744;color:#fff;padding:30px 40px;border-radius:16px;margin-bottom:30px;}
  .header h1{font-size:26px;margin:0 0 6px;}
  .header p{margin:0;opacity:0.7;font-size:14px;}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);}
  thead tr{background:#1a2744;color:#fff;}
  th{padding:14px 16px;text-align:left;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;}
  td{padding:14px 16px;font-size:14px;border-bottom:0.5px solid rgba(0,0,0,0.07);color:#1a2744;}
  tr:last-child td{border-bottom:none;}
  tr:hover td{background:#f8fafd;}
  .footer{text-align:center;color:#9aa3b4;font-size:12px;margin-top:24px;}
</style></head>
<body>
<div class="header">
  <h1>KMCT College Event Calendar</h1>
  <p>Exported on ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})} &bull; ${appState.events.length} events total</p>
</div>
<table>
  <thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Time</th><th>Venue</th><th>Attending</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">KMCT College Events System &bull; Academic Year 2025-26</div>
</body></html>`;

  const blob=new Blob([html],{type:'text/html'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='college_events_export.html';
  a.click();
  URL.revokeObjectURL(a.href);
}