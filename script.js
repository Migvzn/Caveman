/* ===== Loader ===== */
window.addEventListener('load',()=>{
  setTimeout(()=>document.getElementById('loader').classList.add('done'),1400);
});

/* ===== Custom cursor ===== */
const cursor=document.querySelector('.cursor');
const follower=document.querySelector('.cursor-follower');
let mx=0,my=0,fx=0,fy=0;
window.addEventListener('mousemove',e=>{
  mx=e.clientX;my=e.clientY;
  cursor.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;
});
function tick(){
  fx+=(mx-fx)*.18;fy+=(my-fy)*.18;
  follower.style.transform=`translate(${fx}px,${fy}px) translate(-50%,-50%)`;
  requestAnimationFrame(tick);
}
tick();
document.querySelectorAll('a,button,input,select,.card').forEach(el=>{
  el.addEventListener('mouseenter',()=>{cursor.classList.add('hover');follower.classList.add('hover')});
  el.addEventListener('mouseleave',()=>{cursor.classList.remove('hover');follower.classList.remove('hover')});
});

/* ===== Nav scroll state ===== */
const nav=document.querySelector('.nav');
window.addEventListener('scroll',()=>{
  if(window.scrollY>40)nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

/* ===== Intersection observer reveals ===== */
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
},{threshold:.12,rootMargin:'0px 0px -80px 0px'});

document.querySelectorAll('.card').forEach((c,i)=>{
  c.style.transitionDelay=`${i*120}ms`;
  io.observe(c);
});
document.querySelectorAll('.section-head, .feature, .exp-text, .booking-inner').forEach(el=>{
  el.classList.add('reveal');
  io.observe(el);
});

/* ===== 3D tilt on cards ===== */
document.querySelectorAll('.card').forEach(card=>{
  let raf;
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      card.style.transform=`perspective(1200px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-6px) translateZ(0)`;
    });
  });
  card.addEventListener('mouseleave',()=>{
    card.style.transform='';
  });
});

/* ===== Hero parallax ===== */
const hero=document.querySelector('.hero');
const heroTitle=document.querySelector('.hero-title');
const heroSub=document.querySelector('.hero-sub');
window.addEventListener('scroll',()=>{
  const y=window.scrollY;
  if(y<window.innerHeight){
    heroTitle.style.transform=`translateY(${y*.18}px)`;
    heroSub.style.transform=`translateY(${y*.12}px)`;
    heroSub.style.opacity=1-y/600;
  }
});

/* ===== Smooth scroll for anchors ===== */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href');
    if(id.length>1){
      const t=document.querySelector(id);
      if(t){
        e.preventDefault();
        t.scrollIntoView({behavior:'smooth',block:'start'});
      }
    }
  });
});

/* ===== Card book buttons → fill form & scroll ===== */
document.querySelectorAll('[data-book]').forEach(b=>{
  b.addEventListener('click',()=>{
    const car=b.dataset.book;
    const sel=document.getElementById('carSelect');
    [...sel.options].forEach(o=>{if(o.value===car||o.text===car)sel.value=o.value});
    document.getElementById('booking').scrollIntoView({behavior:'smooth'});
  });
});

/* ===== Form submit ===== */
const form=document.getElementById('form');
const confirm=document.getElementById('confirm');
form.addEventListener('submit',e=>{
  e.preventDefault();
  form.classList.add('hide');
  setTimeout(()=>confirm.classList.add('show'),350);
});
