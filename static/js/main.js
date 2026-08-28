/* ── STARFIELD ── */
(function(){
  const c=document.getElementById('stars'),ctx=c.getContext('2d');
  let S=[],W,H;
  function resize(){W=c.width=innerWidth;H=c.height=innerHeight}
  function init(){S=[];for(let i=0;i<180;i++)S.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.1+.2,tw:Math.random()*Math.PI*2,sp:Math.random()*.005+.001,a:Math.random()*.8+.2})}
  function draw(){ctx.clearRect(0,0,W,H);S.forEach(s=>{s.tw+=s.sp;const a=(Math.sin(s.tw)*.5+.5)*s.a;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(180,210,255,${a})`;ctx.fill()});requestAnimationFrame(draw)}
  window.addEventListener('resize',()=>{resize();init()});
  resize();init();draw();
})();

/* ── BUILD STAR WIDGETS ── */
document.querySelectorAll('.rating-item').forEach(item=>{
  const id=item.dataset.id;
  const input=item.querySelector('input');
  const box=item.querySelector('.stars');
  let val=parseInt(input.value)||3;
  function render(n){
    box.innerHTML='';
    for(let i=1;i<=5;i++){
      const b=document.createElement('button');
      b.type='button';
      b.className='star'+(i<=n?' lit':'');
      b.textContent='★';
      b.addEventListener('click',()=>{val=i;input.value=i;render(i)});
      box.appendChild(b);
    }
  }
  render(val);
});

/* ── TOGGLE BUTTONS ── */
function tog(btn,groupId,inputId){
  document.getElementById(groupId).querySelectorAll('.tb').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(inputId).value=btn.dataset.v;
}

/* ── NUMERIC ADJUST ── */
function adj(id,delta){
  const el=document.getElementById(id);
  const min=parseFloat(el.min)||0;
  el.value=Math.max(min,(parseFloat(el.value)||0)+delta);
}

/* ── PREDICT ── */
async function predict(){
  const btn=document.getElementById('pred-btn');
  const txt=document.getElementById('btn-text');
  const spin=document.getElementById('btn-spin');
  const arrow=document.getElementById('btn-arrow');
  txt.style.display='none';arrow.style.display='none';spin.style.display='block';btn.disabled=true;

  // collect rating values
  const ratings={};
  document.querySelectorAll('.rating-item').forEach(item=>{
    ratings[item.dataset.id]=item.querySelector('input').value;
  });

  const payload={
    gender:              document.getElementById('gender').value,
    customer_type:       document.getElementById('customer_type').value,
    age:                 document.getElementById('age').value,
    type_of_travel:      document.getElementById('type_of_travel').value,
    class_:              document.getElementById('class_').value,
    flight_distance:     document.getElementById('flight_distance').value,
    departure_delay:     document.getElementById('departure_delay').value,
    arrival_delay:       document.getElementById('arrival_delay').value,
    ...ratings
  };

  try{
    const res=await fetch('/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await res.json();
    data.error?showErr(data.error):showResult(data);
  }catch(e){showErr('Network error — make sure the Flask server is running.')}

  txt.style.display='inline';arrow.style.display='inline';spin.style.display='none';btn.disabled=false;
}

function showResult(data){
  const sat=data.prediction===1;
  const card=document.getElementById('result-card');
  card.className='result-card '+(sat?'ok':'bad');
  document.getElementById('res-icon').textContent=sat?'🛫':'😔';
  document.getElementById('res-label').textContent=data.label;
  document.getElementById('res-desc').textContent=sat
    ?'The model predicts this passenger will have a positive flight experience.'
    :'The model predicts a neutral or negative experience. Consider reviewing service quality.';

  const pct=data.proba!=null?(data.proba*100).toFixed(1)+'%':'';
  document.getElementById('res-pct').textContent=pct;

  const bw=document.getElementById('bar-wrap');
  if(data.proba!=null){
    bw.style.display='block';
    document.getElementById('bar-pct-lbl').textContent=pct;
    setTimeout(()=>{document.getElementById('bar-fill').style.width=(data.proba*100)+'%'},60);
  }else{bw.style.display='none'}

  const r=document.getElementById('result');
  r.style.display='block';
  r.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function showErr(msg){
  const card=document.getElementById('result-card');
  card.className='result-card bad';
  document.getElementById('res-icon').textContent='⚠️';
  document.getElementById('res-label').textContent='Error';
  document.getElementById('res-desc').textContent=msg;
  document.getElementById('res-pct').textContent='';
  document.getElementById('bar-wrap').style.display='none';
  document.getElementById('result').style.display='block';
}
