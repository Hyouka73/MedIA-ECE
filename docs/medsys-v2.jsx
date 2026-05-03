import { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────
   TOKENS
───────────────────────────────────────────── */
const C = {
  /* Azul naval institucional */
  b50:"#EEF3FB", b100:"#D4E1F5", b200:"#A9C3EB",
  b400:"#4B7EC8", b500:"#2459A8", b600:"#1A4080", b700:"#112B58", b900:"#0A1B38",
  /* Acento ámbar */
  a50:"#FEF5EB", a100:"#FAE2C2", a200:"#F4C07D",
  a400:"#E8921F", a500:"#C9720E", a700:"#8C4D08",
  /* Semánticos */
  g50:"#EAF6F0", g100:"#C3E8D3", g500:"#237A4B", g600:"#196038",
  w50:"#FEF4E4", w100:"#FCECC8", w500:"#B86E12", w600:"#8F540D",
  r50:"#FEF0F3", r100:"#FBDAE0", r500:"#BA2E45", r600:"#901F33",
  /* Fondos cálidos */
  bg:"#EDEBE6",        // page
  sf:"#F5F2EC",        // surface
  cd:"#FDFAF5",        // card
  si:"#101E33",        // sidebar dark
  si2:"#162540",       // sidebar hover
  /* Neutrales */
  n50:"#EDE9E2", n100:"#E2DDD4", n150:"#D4CEC4", n200:"#C3BBB0",
  n300:"#A9A097", n400:"#877E74", n500:"#605850", n700:"#2C2620", n800:"#1A1510",
  /* Texto */
  th:"#1A1510", tb:"#2C2620", ts:"#5A5048", tm:"#877E74", td:"#A9A097",
  ti:"#FDFAF5",
  /* Borde */
  bd:"#DAD4CC", bdf:"#2459A8",
};

/* ─────────────────────────────────────────────
   CSS GLOBAL
───────────────────────────────────────────── */
const Css = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    body{background:${C.bg};color:${C.tb}}
    button{font-family:inherit;cursor:pointer}
    input,textarea,select{font-family:inherit}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${C.n200};border-radius:99px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .view{animation:fadeUp .22s ease both}
    .sn-item{transition:background .12s,color .12s}
    .sn-item:hover{background:${C.si2} !important}
    .btn-base{transition:all .13s;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-weight:500}
    .btn-base:hover{filter:brightness(1.07)}
    .btn-base:active{transform:scale(.98)}
    .row-hover:hover{background:${C.n50} !important}
    .pat-item:hover{background:${C.b50} !important}
    .tab-btn{transition:color .12s,border-color .12s}
    .input-base:focus{border-color:${C.bdf} !important;box-shadow:0 0 0 3px ${C.b100} !important;outline:none}
    .card{background:${C.cd};border:1px solid ${C.bd};border-radius:12px}
    .otp-digit:focus{border-color:${C.b500} !important;box-shadow:0 0 0 3px ${C.b100} !important;outline:none}
    .agenda-block{transition:box-shadow .15s,transform .15s}
    .agenda-block:hover{box-shadow:0 4px 16px rgba(0,0,0,.12) !important;transform:translateX(2px)}
    .tooltip-wrap{position:relative}
    .tooltip-wrap .tt{position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);background:${C.n800};color:#fff;font-size:11px;font-weight:500;padding:5px 10px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s}
    .tooltip-wrap:hover .tt{opacity:1}
  `}</style>
);

/* ─────────────────────────────────────────────
   PRIMITIVOS
───────────────────────────────────────────── */

/* Botón */
const BV = {
  primary:   {bg:C.b500, color:"#fff",       border:C.b500,  shadow:`0 1px 4px ${C.b500}55`},
  secondary: {bg:C.cd,   color:C.b600,       border:C.b200,  shadow:"none"},
  accent:    {bg:C.a400, color:"#fff",        border:C.a400,  shadow:`0 1px 4px ${C.a400}66`},
  success:   {bg:C.g500, color:"#fff",        border:C.g500,  shadow:`0 1px 4px ${C.g500}44`},
  danger:    {bg:C.r500, color:"#fff",        border:C.r500,  shadow:`0 1px 4px ${C.r500}44`},
  ghost:     {bg:"transparent", color:C.ts,   border:"transparent", shadow:"none"},
  outline:   {bg:"transparent", color:C.tb,   border:C.bd,    shadow:"none"},
  dark:      {bg:C.n700, color:"#fff",        border:C.n700,  shadow:"none"},
};
const BS = {
  xs:{p:"3px 9px",  fs:11, r:6},
  sm:{p:"5px 12px", fs:12, r:7},
  md:{p:"8px 16px", fs:13, r:8},
  lg:{p:"10px 22px",fs:14, r:9},
};
const Btn = ({v="primary",sz="md",children,onClick,disabled,full,style:s}) => {
  const cv=BV[v]||BV.primary, cs=BS[sz]||BS.md;
  return (
    <button className="btn-base" onClick={disabled?undefined:onClick} style={{
      background:cv.bg, color:cv.color,
      border:`1.5px solid ${cv.border}`,
      boxShadow:disabled?"none":cv.shadow,
      opacity:disabled?.45:1, cursor:disabled?"not-allowed":"pointer",
      width:full?"100%":"auto",
      padding:cs.p, fontSize:cs.fs, borderRadius:cs.r,
      letterSpacing:.1, ...s,
    }}>{children}</button>
  );
};

/* Badge */
const BG_V = {
  default:{bg:C.n100,color:C.n500},
  blue:   {bg:C.b100,color:C.b600},
  amber:  {bg:C.a100,color:C.a500},
  success:{bg:C.g100,color:C.g600},
  warning:{bg:C.w100,color:C.w600},
  error:  {bg:C.r100,color:C.r600},
  navy:   {bg:C.b700,color:"#fff"},
};
const Bdg = ({v="default",children,dot,style:s}) => {
  const cv=BG_V[v]||BG_V.default;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:dot?4:0,
      padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:600,letterSpacing:.2,
      background:cv.bg,color:cv.color,...s,
    }}>
      {dot&&<span style={{width:5,height:5,borderRadius:"50%",background:cv.color,display:"inline-block"}}/>}
      {children}
    </span>
  );
};

/* Input */
const Inp = ({label,placeholder,type="text",value,onChange,error,pre,suf,autoFocus,style:s}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11.5,fontWeight:600,color:C.ts,letterSpacing:.3,textTransform:"uppercase"}}>{label}</label>}
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      {pre&&<span style={{position:"absolute",left:11,color:C.tm,fontSize:14,pointerEvents:"none"}}>{pre}</span>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
        className="input-base"
        style={{
          width:"100%", padding:`9px 12px`,
          paddingLeft:pre?35:12, paddingRight:suf?35:12,
          border:`1.5px solid ${error?C.r500:C.bd}`,
          borderRadius:9, fontSize:13,
          color:C.th, background:C.cd,
          transition:"border-color .15s,box-shadow .15s",
          boxShadow:error?`0 0 0 3px ${C.r100}`:"none",
          ...s,
        }}
      />
      {suf&&<span style={{position:"absolute",right:11,color:C.tm,fontSize:12}}>{suf}</span>}
    </div>
    {error&&<span style={{fontSize:11,color:C.r500,display:"flex",alignItems:"center",gap:4,marginTop:1}}>⚠ {error}</span>}
  </div>
);

/* Textarea */
const TA = ({label,value,onChange,placeholder,rows=3}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11.5,fontWeight:600,color:C.ts,letterSpacing:.3,textTransform:"uppercase"}}>{label}</label>}
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="input-base"
      style={{
        width:"100%",padding:"10px 12px",
        border:`1.5px solid ${C.bd}`,
        borderRadius:9,fontSize:13,color:C.th,
        background:C.cd,resize:"vertical",lineHeight:1.6,
      }}/>
  </div>
);

/* Callout */
const CALLV = {
  info:    {bg:C.b50, left:C.b500, ic:"ℹ", c:C.b600},
  warning: {bg:C.w50, left:C.w500, ic:"⚠", c:C.w600},
  critical:{bg:C.r50, left:C.r500, ic:"!", c:C.r600},
};
const Callout = ({level="info",title,children}) => {
  const cv=CALLV[level];
  return (
    <div style={{
      background:cv.bg, borderLeft:`3px solid ${cv.left}`,
      borderRadius:"0 8px 8px 0", padding:"10px 14px",
      display:"flex", gap:10,
    }}>
      <span style={{
        width:18,height:18,borderRadius:"50%",
        background:cv.left, color:"#fff",
        fontSize:10,fontWeight:800,
        display:"flex",alignItems:"center",justifyContent:"center",
        flexShrink:0,marginTop:1,
      }}>{cv.ic}</span>
      <div>
        {title&&<div style={{fontSize:12,fontWeight:700,color:cv.c,marginBottom:2}}>{title}</div>}
        <div style={{fontSize:12,color:cv.c,lineHeight:1.6}}>{children}</div>
      </div>
    </div>
  );
};

/* Divider */
const Hr = ({style:s}) => <div style={{height:1,background:C.bd,...s}}/>;

/* Mini sparkline SVG */
const Spark = ({data, color, h=32, w=80}) => {
  const max=Math.max(...data), min=Math.min(...data);
  const pts=data.map((v,i) => {
    const x=(i/(data.length-1))*w;
    const y=h-((v-min)/(max-min||1))*(h-4)-2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={.8}/>
      <circle cx={pts.split(" ").at(-1).split(",")[0]} cy={pts.split(" ").at(-1).split(",")[1]} r={2.5} fill={color}/>
    </svg>
  );
};

/* ─────────────────────────────────────────────
   SIDEBAR — ICON RAIL STYLE (inspirado en Linear)
───────────────────────────────────────────── */
const NAVITEMS = [
  {id:"dashboard",  ic:"⊞",  label:"Inicio",    group:"clinica"},
  {id:"agenda",     ic:"📅", label:"Agenda",     group:"clinica"},
  {id:"patients",   ic:"👥", label:"Pacientes",  group:"clinica"},
  {id:"consult",    ic:"🩺", label:"Consulta",   group:"clinica"},
  {id:"security",   ic:"🛡", label:"Seguridad",  group:"admin"},
  {id:"palette",    ic:"◑",  label:"Paleta",     group:"admin"},
];

const Sidebar = ({cur, onNav}) => {
  return (
    <aside style={{
      width:220, flexShrink:0, height:"100vh",
      background:C.si, display:"flex", flexDirection:"column",
      borderRight:"1px solid rgba(255,255,255,0.04)",
      position:"sticky",top:0,
    }}>
      {/* Logo */}
      <div style={{
        padding:"20px 16px 16px",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        display:"flex",alignItems:"center",gap:10,
      }}>
        <div style={{
          width:32,height:32,borderRadius:9,flexShrink:0,
          background:`linear-gradient(135deg, ${C.b500}, ${C.b700})`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:16, boxShadow:`0 2px 8px ${C.b900}80`,
        }}>⚕</div>
        <div>
          <div style={{color:"#fff",fontWeight:700,fontSize:14,lineHeight:1.1,letterSpacing:-.2}}>MedSys</div>
          <div style={{color:"rgba(255,255,255,.3)",fontSize:10,marginTop:2,lineHeight:1}}>IMSS · UMF 42</div>
        </div>
        <div style={{marginLeft:"auto"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.g500,boxShadow:`0 0 6px ${C.g500}`}}/>
        </div>
      </div>

      {/* Nav — grupo clínica */}
      <nav style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
        <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:1.2,padding:"6px 10px 4px",textTransform:"uppercase"}}>Clínica</div>
        {NAVITEMS.filter(n=>n.group==="clinica").map(n=>{
          const active=cur===n.id;
          return (
            <button key={n.id} className="sn-item" onClick={()=>onNav(n.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:9,
              padding:"8px 10px",borderRadius:8,border:"none",
              marginBottom:1,
              background:active?`linear-gradient(90deg,${C.b500}22,${C.b500}11)`:"transparent",
              position:"relative",
              color:active?"#fff":"rgba(255,255,255,.42)",
              fontSize:13, fontWeight:active?600:400,
              cursor:"pointer", textAlign:"left",
            }}>
              {active&&<span style={{
                position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",
                width:3,height:20,borderRadius:"0 3px 3px 0",
                background:C.a400,
              }}/>}
              <span style={{fontSize:14,width:18,textAlign:"center",flexShrink:0}}>{n.ic}</span>
              <span>{n.label}</span>
            </button>
          );
        })}

        <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:1.2,padding:"14px 10px 4px",textTransform:"uppercase"}}>Sistema</div>
        {NAVITEMS.filter(n=>n.group==="admin").map(n=>{
          const active=cur===n.id;
          return (
            <button key={n.id} className="sn-item" onClick={()=>onNav(n.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:9,
              padding:"8px 10px",borderRadius:8,border:"none",
              marginBottom:1,
              background:active?`linear-gradient(90deg,${C.b500}22,${C.b500}11)`:"transparent",
              position:"relative",
              color:active?"#fff":"rgba(255,255,255,.42)",
              fontSize:13, fontWeight:active?600:400,
              cursor:"pointer", textAlign:"left",
            }}>
              {active&&<span style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:20,borderRadius:"0 3px 3px 0",background:C.a400}}/>}
              <span style={{fontSize:14,width:18,textAlign:"center",flexShrink:0}}>{n.ic}</span>
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer de usuario */}
      <div style={{
        padding:"12px 10px",
        borderTop:"1px solid rgba(255,255,255,.06)",
        background:"rgba(0,0,0,.15)",
      }}>
        {/* Notif */}
        <div style={{display:"flex",gap:6,marginBottom:10,padding:"0 2px"}}>
          {[{ic:"🔔",label:"2"},{ic:"⚙",label:null}].map((b,i)=>(
            <button key={i} style={{
              flex:1,padding:"7px",borderRadius:7,border:"none",
              background:"rgba(255,255,255,.05)",
              color:"rgba(255,255,255,.5)",fontSize:13,cursor:"pointer",
              position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:5,
              transition:"background .12s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.1)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.05)"}>
              {b.ic}
              {b.label&&<span style={{
                position:"absolute",top:4,right:4,
                width:14,height:14,borderRadius:"50%",
                background:C.r500,color:"#fff",
                fontSize:9,fontWeight:700,
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>{b.label}</span>}
            </button>
          ))}
        </div>
        {/* User */}
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"8px 8px",borderRadius:8,cursor:"pointer",transition:"background .12s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.07)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{
            width:30,height:30,borderRadius:"50%",flexShrink:0,
            background:`linear-gradient(135deg,${C.b400},${C.b600})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            color:"#fff",fontSize:11,fontWeight:700,
          }}>MR</div>
          <div style={{flex:1,overflow:"hidden"}}>
            <div style={{color:"rgba(255,255,255,.85)",fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Dr. R. Morales</div>
            <div style={{color:"rgba(255,255,255,.28)",fontSize:10,marginTop:1}}>Medicina Gral · T.Mat</div>
          </div>
          <span style={{color:"rgba(255,255,255,.22)",fontSize:13}}>⏻</span>
        </div>
      </div>
    </aside>
  );
};

/* ─────────────────────────────────────────────
   TOP BAR DE PÁGINA
───────────────────────────────────────────── */
const TopBar = ({title,sub,actions}) => (
  <div style={{
    padding:"14px 28px", display:"flex",alignItems:"center",justifyContent:"space-between",
    borderBottom:`1px solid ${C.bd}`,
    background:C.sf,
    position:"sticky",top:0,zIndex:10,
    backdropFilter:"blur(8px)",
  }}>
    <div>
      <div style={{fontSize:17,fontWeight:700,color:C.th,letterSpacing:-.3}}>{title}</div>
      {sub&&<div style={{fontSize:12,color:C.tm,marginTop:1}}>{sub}</div>}
    </div>
    {actions&&<div style={{display:"flex",gap:8,alignItems:"center"}}>{actions}</div>}
  </div>
);

/* ─────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────── */
const Login = ({onLogin}) => {
  const [step,setStep]=useState(1);
  const [email,setEmail]=useState("dr.morales@imss.gob.mx");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [otp,setOtp]=useState(["","","","","",""]);
  const refs=useRef([]);

  const next=()=>{if(!pass){setErr("Contraseña requerida");return}setErr("");setStep(2);};
  const chOtp=(i,val)=>{if(!/^\d?$/.test(val))return;const n=[...otp];n[i]=val;setOtp(n);if(val&&i<5)refs.current[i+1]?.focus();};
  const kbOtp=(i,e)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)refs.current[i-1]?.focus();};

  return (
    <div style={{
      minHeight:"100vh",background:C.bg,
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:24,position:"relative",overflow:"hidden",
    }}>
      {/* Fondo articulado */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{
          position:"absolute",width:600,height:600,
          borderRadius:"50%",
          background:`radial-gradient(circle, ${C.b100}60 0%, transparent 70%)`,
          left:"-15%",bottom:"-10%",
        }}/>
        <div style={{
          position:"absolute",width:400,height:400,
          borderRadius:"50%",
          background:`radial-gradient(circle, ${C.a50} 0%, transparent 70%)`,
          right:"5%",top:"5%",
        }}/>
        {/* Grid sutil */}
        <div style={{
          position:"absolute",inset:0,opacity:.025,
          backgroundImage:`linear-gradient(${C.b900} 1px, transparent 1px), linear-gradient(90deg, ${C.b900} 1px, transparent 1px)`,
          backgroundSize:"48px 48px",
        }}/>
      </div>

      <div style={{width:400,position:"relative",zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{
            width:52,height:52,borderRadius:14,
            background:C.si,margin:"0 auto 14px",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:24, boxShadow:`0 8px 32px ${C.b900}50`,
          }}>⚕</div>
          <div style={{fontSize:20,fontWeight:700,color:C.th,letterSpacing:-.3}}>Sistema Médico Institucional</div>
          <div style={{fontSize:12.5,color:C.tm,marginTop:4}}>Instituto Mexicano del Seguro Social · UMF 42</div>
        </div>

        {/* Tarjeta */}
        <div style={{
          background:C.cd, border:`1px solid ${C.bd}`,
          borderRadius:16, padding:32,
          boxShadow:`0 2px 4px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.07)`,
        }}>
          {step===1?(
            <div className="view">
              <div style={{fontSize:15,fontWeight:700,color:C.th,marginBottom:4}}>Iniciar sesión</div>
              <div style={{fontSize:12.5,color:C.tm,marginBottom:24,lineHeight:1.5}}>Acceso exclusivo para personal autorizado del IMSS</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Inp label="Correo institucional" value={email} onChange={e=>setEmail(e.target.value)} pre="✉" placeholder="usuario@imss.gob.mx"/>
                <div>
                  <Inp label="Contraseña" type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} pre="🔒" placeholder="••••••••" error={err}/>
                  <div style={{textAlign:"right",marginTop:7}}>
                    <button style={{background:"none",border:"none",fontSize:11.5,color:C.b500,cursor:"pointer"}}>¿Olvidaste tu contraseña?</button>
                  </div>
                </div>
                <Btn v="primary" sz="lg" onClick={next} full>Continuar →</Btn>
              </div>
              <div style={{marginTop:20}}>
                <Callout level="info" title="NOM-024-SSA3-2010">
                  Este sistema procesa datos clínicos protegidos. Toda actividad queda registrada en bitácora de auditoría.
                </Callout>
              </div>
            </div>
          ):(
            <div className="view">
              <button onClick={()=>setStep(1)} style={{background:"none",border:"none",color:C.tm,fontSize:12,cursor:"pointer",marginBottom:22,display:"flex",alignItems:"center",gap:4}}>
                ← Regresar
              </button>
              <div style={{textAlign:"center",marginBottom:26}}>
                <div style={{
                  width:56,height:56,borderRadius:16,
                  background:C.b50,border:`1.5px solid ${C.b200}`,
                  margin:"0 auto 14px",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:26,
                }}>🔐</div>
                <div style={{fontSize:15,fontWeight:700,color:C.th}}>Verificación en dos pasos</div>
                <div style={{fontSize:12.5,color:C.tm,marginTop:6,lineHeight:1.6}}>
                  Ingresa el código de 6 dígitos de<br/>tu aplicación autenticadora
                </div>
              </div>

              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
                {otp.map((v,i)=>(
                  <input key={i} ref={el=>refs.current[i]=el}
                    className="otp-digit"
                    type="text" inputMode="numeric" maxLength={1}
                    value={v} onChange={e=>chOtp(i,e.target.value)} onKeyDown={e=>kbOtp(i,e)}
                    autoFocus={i===0}
                    style={{
                      width:48,height:56,borderRadius:10,
                      border:`1.5px solid ${v?C.b500:C.bd}`,
                      background:v?C.b50:C.cd,
                      fontSize:22,fontWeight:700,color:C.th,
                      textAlign:"center",transition:"all .15s",
                    }}/>
                ))}
              </div>
              <Btn v="primary" sz="lg" onClick={onLogin} disabled={otp.join("").length<6} full>
                Verificar y entrar ✓
              </Btn>
              <div style={{textAlign:"center",marginTop:13}}>
                <button style={{background:"none",border:"none",fontSize:12,color:C.b500,cursor:"pointer"}}>Reenviar código · 00:42</button>
              </div>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:20,fontSize:10.5,color:C.td}}>
          © 2025 IMSS · MedSys v3.2 · NOM-024-SSA3-2010 · NOM-151-SCFI-2016
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────── */
const PACS = [
  {id:1,n:"García Hernández, Rosa M.",edad:47,hora:"08:00",est:"done",    al:"Penicilina",  sev:"error"  },
  {id:2,n:"Martínez López, Juan C.",  edad:32,hora:"08:30",est:"active",  al:null,          sev:null     },
  {id:3,n:"Ramos Torres, Elena",       edad:65,hora:"09:00",est:"waiting", al:"AINEs",       sev:"warning"},
  {id:4,n:"Jiménez Soto, Pedro A.",   edad:28,hora:"09:30",est:"waiting", al:null,          sev:null     },
  {id:5,n:"Vázquez Cruz, María F.",   edad:53,hora:"10:00",est:"waiting", al:"Latex",       sev:"warning"},
  {id:6,n:"Pérez Domínguez, Luis A.", edad:61,hora:"10:30",est:"waiting", al:"Sulfas",      sev:"error"  },
];
const EST_L={waiting:"En espera",active:"En consulta",done:"Atendido"};
const EST_V={waiting:"amber",active:"blue",done:"success"};

const Dashboard = ({onConsulta}) => {
  const cards=[
    {label:"Pacientes hoy",  val:"12",sub:"+2 vs ayer", ic:"👥",acc:C.b500, bg:`linear-gradient(135deg,${C.b50},${C.b100}30)`, spark:[8,9,7,11,10,12,12], sc:C.b400},
    {label:"Completadas",    val:"4", sub:"de 12 prog.", ic:"✓",  acc:C.g500, bg:`linear-gradient(135deg,${C.g50},${C.g100}30)`, spark:[2,3,4,3,4,4,4],   sc:C.g500},
    {label:"En espera",      val:"5", sub:"~22 min prom",ic:"⏱",  acc:C.w500, bg:`linear-gradient(135deg,${C.w50},${C.w100}30)`, spark:[3,5,4,6,5,5,5],   sc:C.w500},
    {label:"Tiempo prom.",   val:"18m",sub:"por consulta",ic:"◷", acc:C.a400, bg:`linear-gradient(135deg,${C.a50},${C.a100}30)`, spark:[15,22,18,16,20,19,18],sc:C.a400},
  ];
  return (
    <div style={{flex:1,overflow:"auto"}}>
      <TopBar
        title="Buenos días, Dr. Morales 👋"
        sub="Mar 3, 2025 · Turno matutino · Consultorio 4"
        actions={<>
          <Btn v="secondary" sz="sm">📊 Reporte del día</Btn>
          <Btn v="primary" sz="sm" onClick={onConsulta}>+ Nueva consulta</Btn>
        </>}
      />
      <div style={{padding:"22px 28px"}}>
        {/* Métricas */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
          {cards.map((c,i)=>(
            <div key={i} style={{
              background:c.bg, border:`1px solid ${C.bd}`,
              borderRadius:12, padding:"16px 18px",
              boxShadow:`0 1px 3px rgba(0,0,0,.05)`,
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{fontSize:11.5,color:C.ts,fontWeight:500,letterSpacing:.1}}>{c.label}</div>
                <div style={{
                  width:28,height:28,borderRadius:7,
                  background:`${c.acc}18`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:13,
                }}>{c.ic}</div>
              </div>
              <div style={{fontSize:28,fontWeight:700,color:c.acc,lineHeight:1,letterSpacing:-1}}>{c.val}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:8}}>
                <div style={{fontSize:11,color:C.td}}>{c.sub}</div>
                <Spark data={c.spark} color={c.sc} h={28} w={64}/>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.bd}`}}>
            <div style={{fontSize:14,fontWeight:600,color:C.th}}>Pacientes del día</div>
            <div style={{display:"flex",gap:8}}>
              <Bdg v="blue">12 programados</Bdg>
              <Bdg v="success" dot>4 atendidos</Bdg>
            </div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:C.n50}}>
                {["Hora","Paciente","Edad","Alergia","Estado",""].map(h=>(
                  <th key={h} style={{padding:"9px 20px",textAlign:"left",fontSize:10.5,fontWeight:700,color:C.tm,textTransform:"uppercase",letterSpacing:.6,borderBottom:`1px solid ${C.bd}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PACS.map((p,i)=>(
                <tr key={p.id} className="row-hover" style={{borderBottom:i<PACS.length-1?`1px solid ${C.bd}`:"none"}}>
                  <td style={{padding:"12px 20px",fontSize:12.5,fontWeight:600,color:C.ts,fontVariantNumeric:"tabular-nums"}}>{p.hora}</td>
                  <td style={{padding:"12px 20px"}}>
                    <div style={{fontSize:13,fontWeight:500,color:C.th}}>{p.n}</div>
                  </td>
                  <td style={{padding:"12px 20px",fontSize:12.5,color:C.ts}}>{p.edad} a</td>
                  <td style={{padding:"12px 20px"}}>
                    {p.al?<Bdg v={p.sev}>⚠ {p.al}</Bdg>:<span style={{fontSize:11,color:C.td}}>—</span>}
                  </td>
                  <td style={{padding:"12px 20px"}}><Bdg v={EST_V[p.est]} dot>{EST_L[p.est]}</Bdg></td>
                  <td style={{padding:"12px 20px"}}>
                    {p.est!=="done"&&(
                      <Btn v={p.est==="active"?"primary":"outline"} sz="xs" onClick={onConsulta}>
                        {p.est==="active"?"Continuar →":"Iniciar"}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   AGENDA DEL DÍA — timeline vertical
───────────────────────────────────────────── */
const CITAS = [
  {hora:"07:30",dur:30, pac:"García H., Rosa M.",  tipo:"Control crónico",    est:"done",    col:C.g500,  colBg:C.g50,  al:true},
  {hora:"08:00",dur:20, pac:"Martínez L., Juan C.",tipo:"Consulta general",   est:"done",    col:C.g500,  colBg:C.g50,  al:false},
  {hora:"08:30",dur:40, pac:"Ramos T., Elena",      tipo:"Seguimiento DM2",    est:"active",  col:C.b500,  colBg:C.b50,  al:false},
  {hora:"09:30",dur:30, pac:"Jiménez S., Pedro A.", tipo:"Primera vez",        est:"waiting", col:C.a400,  colBg:C.a50,  al:false},
  {hora:"10:00",dur:20, pac:"Vázquez C., María F.", tipo:"Seguimiento asma",   est:"waiting", col:C.a400,  colBg:C.a50,  al:true},
  {hora:"10:30",dur:30, pac:"Pérez D., Luis A.",    tipo:"Control HTA",        est:"waiting", col:C.a400,  colBg:C.a50,  al:false},
  {hora:"11:00",dur:20, pac:"—",                    tipo:"DISPONIBLE",         est:"free",    col:C.n300,  colBg:C.n50,  al:false},
  {hora:"11:30",dur:40, pac:"Luna V., Carmen S.",   tipo:"Revisión resultados", est:"waiting", col:C.a400, colBg:C.a50,  al:false},
  {hora:"12:30",dur:30, pac:"—",                    tipo:"DESCANSO",           est:"break",   col:C.n300,  colBg:C.n50,  al:false},
  {hora:"13:00",dur:20, pac:"Reyes C., Marco A.",   tipo:"Urgencia agregada",  est:"urgent",  col:C.r500,  colBg:C.r50,  al:true},
  {hora:"13:30",dur:30, pac:"Torres B., Sergio L.", tipo:"Control crónico",    est:"waiting", col:C.a400,  colBg:C.a50,  al:false},
];

const timeToMin=(t)=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
const minToTop=(m,base=7*60,px=3)=>(m-base)*px;

const AgendaScreen = () => {
  const [sel,setSel]=useState(null);
  const base=7*60;
  const hours=Array.from({length:8},(_,i)=>i+7);
  const estConf={
    done:    {label:"Atendido",    v:"success"},
    active:  {label:"En consulta", v:"blue"},
    waiting: {label:"En espera",   v:"amber"},
    free:    {label:"Libre",       v:"default"},
    break:   {label:"Descanso",    v:"default"},
    urgent:  {label:"Urgencia",    v:"error"},
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <TopBar
        title="Agenda del día"
        sub="Martes 3 de jun 2025 · Consultorio 4 · Dr. R. Morales"
        actions={<>
          <Bdg v="blue">12 citas</Bdg>
          <Btn v="secondary" sz="sm">◀ Ayer</Btn>
          <Btn v="outline" sz="sm">Hoy</Btn>
          <Btn v="secondary" sz="sm">Mañana ▶</Btn>
          <Btn v="primary" sz="sm">+ Agregar cita</Btn>
        </>}
      />

      <div style={{flex:1,overflow:"auto",padding:"20px 28px"}}>
        <div style={{display:"flex",gap:20}}>
          {/* Timeline */}
          <div style={{flex:1}}>
            <div style={{position:"relative"}}>
              {/* Líneas de hora */}
              {hours.map(h=>(
                <div key={h} style={{
                  position:"relative",
                  height:180,
                  borderTop:`1px solid ${C.bd}`,
                }}>
                  <span style={{
                    position:"absolute",left:0,top:-8,
                    fontSize:10.5,fontWeight:600,color:C.td,
                    background:C.sf,paddingRight:8,
                    lineHeight:1,
                  }}>{h<10?"0"+h:h}:00</span>
                </div>
              ))}
              {/* MedSys hora */}
              {hours.map(h=>(
                <div key={`${h}h`} style={{
                  position:"absolute",
                  top:minToTop((h*60+30),base)+"px",
                  left:50,right:0,
                  borderTop:`1px dashed ${C.n100}`,
                  pointerEvents:"none",
                }}/>
              ))}

              {/* Bloques de citas */}
              <div style={{position:"absolute",top:0,left:50,right:0}}>
                {CITAS.map((c,i)=>{
                  const top=minToTop(timeToMin(c.hora));
                  const h=c.dur*3;
                  const isFree=c.est==="free"||c.est==="break";
                  return (
                    <div key={i} className="agenda-block" onClick={()=>setSel(sel===i?null:i)} style={{
                      position:"absolute",
                      top:top+"px", left:8, right:0,
                      height:h+"px",
                      background:isFree?`repeating-linear-gradient(-45deg,${c.colBg},${c.colBg} 4px,transparent 4px,transparent 12px)`:`${c.colBg}`,
                      border:`1.5px solid ${c.col}22`,
                      borderLeft:`3px solid ${c.col}`,
                      borderRadius:"0 9px 9px 0",
                      padding:"6px 12px",
                      cursor:"pointer",
                      overflow:"hidden",
                      boxShadow:`0 1px 4px rgba(0,0,0,.06)`,
                      transition:"all .15s",
                    }}>
                      {!isFree&&(
                        <>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontSize:12,fontWeight:600,color:c.col,lineHeight:1.1}}>{c.pac}</div>
                              {h>50&&<div style={{fontSize:11,color:C.ts,marginTop:3}}>{c.tipo} · {c.dur} min</div>}
                            </div>
                            <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                              {c.al&&<span style={{fontSize:12}}>⚠️</span>}
                              <Bdg v={estConf[c.est].v}>{estConf[c.est].label}</Bdg>
                            </div>
                          </div>
                          {h>70&&sel===i&&(
                            <div style={{marginTop:8,display:"flex",gap:6}}>
                              <Btn v="primary" sz="xs">Iniciar consulta</Btn>
                              <Btn v="outline" sz="xs">Ver expediente</Btn>
                            </div>
                          )}
                        </>
                      )}
                      {isFree&&<div style={{fontSize:11,color:C.n400,fontStyle:"italic",lineHeight:1.4,paddingTop:2}}>{c.tipo}</div>}
                    </div>
                  );
                })}
                {/* Línea "ahora" */}
                <div style={{
                  position:"absolute",
                  top:minToTop(8*60+35)+"px",
                  left:0,right:-8,
                  height:2,background:C.r500,zIndex:5,
                }}>
                  <div style={{
                    position:"absolute",left:-5,top:-4,
                    width:10,height:10,borderRadius:"50%",background:C.r500,
                  }}/>
                </div>
              </div>
            </div>
          </div>

          {/* Panel resumen del lado derecho */}
          <div style={{width:240,flexShrink:0,display:"flex",flexDirection:"column",gap:14}}>
            {/* Mini stats */}
            {[
              {label:"Completadas",  val:"4", v:"success", of:12},
              {label:"En espera",    val:"7", v:"amber",   of:12},
              {label:"Urgencias",    val:"1", v:"error",   of:12},
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:12,color:C.ts}}>{s.label}</span>
                  <Bdg v={s.v}>{s.val}</Bdg>
                </div>
                <div style={{height:4,background:C.n100,borderRadius:99,overflow:"hidden"}}>
                  <div style={{
                    height:"100%",borderRadius:99,
                    width:`${(parseInt(s.val)/s.of)*100}%`,
                    background:s.v==="success"?C.g500:s.v==="amber"?C.a400:C.r500,
                  }}/>
                </div>
              </div>
            ))}

            {/* Próxima cita */}
            <div className="card" style={{padding:"14px 16px",borderTop:`3px solid ${C.b500}`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.3,textTransform:"uppercase",marginBottom:10}}>Siguiente</div>
              <div style={{fontSize:13,fontWeight:600,color:C.th,marginBottom:4}}>Jiménez S., Pedro A.</div>
              <div style={{fontSize:11.5,color:C.tm,marginBottom:8}}>09:30 · Primera vez · 30 min</div>
              <Btn v="primary" sz="sm" full>Iniciar consulta</Btn>
            </div>

            {/* Leyenda */}
            <div className="card" style={{padding:"14px 16px"}}>
              <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.3,textTransform:"uppercase",marginBottom:10}}>Leyenda</div>
              {Object.entries(estConf).map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:11.5,color:C.ts}}>{v.label}</span>
                  <Bdg v={v.v}>{v.label}</Bdg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PACIENTES
───────────────────────────────────────────── */
const PALL=[
  {id:1,n:"García Hernández, Rosa M.",edad:47,dob:"15/Mar/1978",curp:"GAHR780315MDFRCX01",tipo:"O+",tel:"55 1234-5678",
   al:[{n:"Penicilina",sev:"high"},{n:"Cefalosporinas",sev:"med"}],cr:["Hipertensión arterial grado II","DM2 sin control metabólico"],ult:"28 May 2025"},
  {id:2,n:"Martínez López, Juan C.",edad:32,dob:"02/Jun/1993",curp:"MALJ930602HDFZPX08",tipo:"A+",tel:"55 9876-5432",al:[],cr:[],ult:"10 Abr 2025"},
  {id:3,n:"Ramos Torres, Elena",edad:65,dob:"20/Ene/1960",curp:"RATE600120MDFMLN04",tipo:"B+",tel:"55 5566-7788",
   al:[{n:"AINEs",sev:"med"},{n:"Aspirina",sev:"med"}],cr:["Artritis reumatoide","Hipotiroidismo primario"],ult:"01 Jun 2025"},
  {id:4,n:"Jiménez Soto, Pedro A.",edad:28,dob:"07/Nov/1996",curp:"JISP961107HDFMTD09",tipo:"AB−",tel:"55 3344-2211",al:[],cr:[],ult:"03 Jun 2025"},
  {id:5,n:"Vázquez Cruz, María F.",edad:53,dob:"12/Sep/1971",curp:"VACM710912MDFZRR00",tipo:"O−",tel:"55 6677-8899",
   al:[{n:"Latex",sev:"high"}],cr:["Asma moderada persistente"],ult:"25 May 2025"},
];

const Patients = () => {
  const [q,setQ]=useState("");
  const [sel,setSel]=useState(PALL[0]);
  const [tab,setTab]=useState("Antecedentes");
  const lista=PALL.filter(p=>p.n.toLowerCase().includes(q.toLowerCase())||p.curp.toLowerCase().includes(q.toLowerCase()));
  const ini=n=>`${n.split(" ")[0][0]}${n.split(" ")[1][0]}`;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <TopBar
        title="Pacientes"
        sub={`${PALL.length} pacientes registrados`}
        actions={<><Btn v="secondary" sz="sm">Exportar</Btn><Btn v="primary" sz="sm">+ Nuevo paciente</Btn></>}
      />
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Lista lateral */}
        <div style={{width:272,flexShrink:0,borderRight:`1px solid ${C.bd}`,display:"flex",flexDirection:"column",background:C.sf}}>
          <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.bd}`}}>
            <Inp placeholder="Buscar nombre o CURP…" value={q} onChange={e=>setQ(e.target.value)} pre="⊕"/>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {lista.map(p=>{
              const act=sel?.id===p.id;
              const hasHighAl=p.al.some(a=>a.sev==="high");
              return (
                <button key={p.id} className="pat-item" onClick={()=>{setSel(p);setTab("Antecedentes");}} style={{
                  width:"100%",textAlign:"left",padding:"12px 14px",
                  border:"none",borderBottom:`1px solid ${C.n100}`,
                  borderLeft:`3px solid ${act?C.b500:"transparent"}`,
                  background:act?C.b50:"transparent",
                  cursor:"pointer",
                }}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{
                      width:34,height:34,borderRadius:"50%",flexShrink:0,
                      background:act?C.b500:C.n150,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:12,fontWeight:700,color:act?"#fff":C.n500,
                    }}>{ini(p.n)}</div>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:12.5,fontWeight:act?600:400,color:C.th,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:140}}>
                          {p.n.split(",")[0]}, {p.n.split(",")[1]?.trim().split(" ").slice(0,2).join(" ")}
                        </span>
                        {p.al.length>0&&<span style={{fontSize:12,flexShrink:0}}>{hasHighAl?"🔴":"🟡"}</span>}
                      </div>
                      <div style={{fontSize:11,color:C.tm,marginTop:2}}>{p.edad} a · {p.tipo} · {p.ult}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Perfil */}
        {sel&&(
          <div style={{flex:1,overflowY:"auto",padding:"22px 26px"}} className="view">
            {/* Header paciente */}
            <div style={{display:"flex",gap:16,alignItems:"flex-start",marginBottom:20,padding:"18px 20px",background:C.cd,border:`1px solid ${C.bd}`,borderRadius:12}}>
              <div style={{
                width:56,height:56,borderRadius:"50%",flexShrink:0,
                background:`linear-gradient(135deg,${C.b400},${C.b600})`,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",fontSize:18,fontWeight:700,
              }}>{ini(sel.n)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:700,color:C.th,letterSpacing:-.2}}>{sel.n}</div>
                <div style={{fontSize:12.5,color:C.tm,marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
                  <span>{sel.edad} años</span><span>·</span>
                  <span>Nac. {sel.dob}</span><span>·</span>
                  <span style={{
                    padding:"1px 8px",borderRadius:4,
                    background:`${C.r50}`,color:C.r600,
                    fontWeight:600,fontSize:12,
                  }}>Grupo {sel.tipo}</span>
                  <span>·</span><span>📞 {sel.tel}</span>
                </div>
                <div style={{fontSize:10.5,color:C.td,marginTop:3,fontFamily:"monospace",letterSpacing:.5}}>CURP: {sel.curp}</div>
              </div>
              <div style={{display:"flex",gap:7}}>
                <Btn v="secondary" sz="sm">📋 Historial</Btn>
                <Btn v="primary" sz="sm">+ Consulta</Btn>
              </div>
            </div>

            {/* Alergias */}
            {sel.al.length>0&&(
              <div style={{marginBottom:18}}>
                <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.5,textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:16,height:16,borderRadius:"50%",background:C.r500,color:"#fff",fontSize:9,fontWeight:800,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>!</span>
                  Alergias registradas
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {sel.al.map((a,i)=>{
                    const h=a.sev==="high";
                    return (
                      <div key={i} style={{
                        display:"flex",alignItems:"center",gap:10,
                        padding:"10px 14px",borderRadius:10,
                        background:h?C.r50:C.w50,
                        border:`1.5px solid ${h?C.r500:C.w500}`,
                        boxShadow:`0 2px 8px ${h?C.r500:C.w500}18`,
                      }}>
                        <span style={{fontSize:20}}>{h?"🔴":"🟡"}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:h?C.r600:C.w600}}>{a.n}</div>
                          <div style={{fontSize:10.5,color:h?C.r500:C.w500,marginTop:1}}>
                            {h?"Severidad alta · Contraindicado":"Severidad moderada · Usar con precaución"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.bd}`,marginBottom:18}}>
              {["Antecedentes","Medicamentos","Estudios","Notas"].map(t=>(
                <button key={t} className="tab-btn" onClick={()=>setTab(t)} style={{
                  padding:"9px 16px",border:"none",background:"transparent",
                  fontSize:13,fontWeight:tab===t?600:400,
                  color:tab===t?C.b600:C.tm,
                  borderBottom:`2px solid ${tab===t?C.b500:"transparent"}`,
                  cursor:"pointer",
                }}>{t}</button>
              ))}
            </div>

            {tab==="Antecedentes"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div className="card" style={{padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.4,textTransform:"uppercase",marginBottom:14}}>Enfermedades crónicas</div>
                  {sel.cr.length>0?sel.cr.map((c,i)=>(
                    <div key={i} style={{display:"flex",gap:9,marginBottom:10,alignItems:"flex-start"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:C.a400,marginTop:5,flexShrink:0}}/>
                      <span style={{fontSize:13,color:C.th,lineHeight:1.45}}>{c}</span>
                    </div>
                  )):<div style={{fontSize:13,color:C.td,fontStyle:"italic"}}>Sin enfermedades crónicas</div>}
                </div>
                <div className="card" style={{padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.4,textTransform:"uppercase",marginBottom:14}}>Resumen clínico</div>
                  {[["Grupo sanguíneo",sel.tipo],["Última consulta",sel.ult],["Alergias",sel.al.length>0?`${sel.al.length} registrada(s)`:"Ninguna"]].map(([k,v])=>(
                    <div key={k}>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",fontSize:13}}>
                        <span style={{color:C.tm}}>{k}</span>
                        <span style={{fontWeight:500,color:C.th}}>{v}</span>
                      </div>
                      <Hr/>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab!=="Antecedentes"&&<div style={{textAlign:"center",padding:60,color:C.td,fontSize:13}}>📁 Sección <strong>{tab}</strong> — próximamente</div>}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CONSULTA SOAP
───────────────────────────────────────────── */
const STEPS=[
  {k:"S",label:"Subjetivo",  desc:"Motivo y síntomas"},
  {k:"O",label:"Objetivo",   desc:"Exploración física"},
  {k:"A",label:"Análisis",   desc:"Diagnóstico"},
  {k:"P",label:"Plan",       desc:"Tratamiento"},
  {k:"✍",label:"Firma",      desc:"Revisión final"},
];

const Consult = () => {
  const [step,setStep]=useState(0);
  const [d,setD]=useState({motivo:"",evol:"",ta:"",fc:"",fr:"",temp:"",peso:"",talla:"",exf:"",dxP:"",dxS:"",plan:"",indicac:"",ref:"",firmado:false});
  const s=(k,v)=>setD(p=>({...p,[k]:v}));

  const contenidos=[
    <div key="S" className="view" style={{display:"flex",flexDirection:"column",gap:16}}>
      <TA label="Motivo de consulta" value={d.motivo} onChange={e=>s("motivo",e.target.value)} placeholder="Describir el motivo principal de consulta…" rows={2}/>
      <TA label="Historia de la enfermedad actual" value={d.evol} onChange={e=>s("evol",e.target.value)} placeholder="Inicio, evolución, características del padecimiento…" rows={5}/>
    </div>,
    <div key="O" className="view" style={{display:"flex",flexDirection:"column",gap:18}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.4,textTransform:"uppercase",marginBottom:12}}>Signos vitales</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[["T/A (mmHg)","ta","120/80"],["FC (lpm)","fc","72"],["FR (rpm)","fr","16"],["Temp (°C)","temp","36.5"],["Peso (kg)","peso","68.0"],["Talla (cm)","talla","162"]].map(([l,k,ph])=>(
            <Inp key={k} label={l} value={d[k]} onChange={e=>s(k,e.target.value)} placeholder={ph}/>
          ))}
        </div>
      </div>
      <TA label="Exploración física" value={d.exf} onChange={e=>s("exf",e.target.value)} placeholder="Hallazgos por aparatos y sistemas…" rows={5}/>
    </div>,
    <div key="A" className="view" style={{display:"flex",flexDirection:"column",gap:16}}>
      <TA label="Diagnóstico principal (CIE-10)" value={d.dxP} onChange={e=>s("dxP",e.target.value)} placeholder="Ej. J06.9 — Infección aguda de VRS no especificada…" rows={3}/>
      <TA label="Diagnósticos secundarios / Comorbilidades" value={d.dxS} onChange={e=>s("dxS",e.target.value)} placeholder="Diagnósticos adicionales relevantes…" rows={4}/>
    </div>,
    <div key="P" className="view" style={{display:"flex",flexDirection:"column",gap:16}}>
      <TA label="Plan farmacológico" value={d.plan} onChange={e=>s("plan",e.target.value)} placeholder="Medicamentos, dosis, vía, frecuencia, duración…" rows={4}/>
      <TA label="Indicaciones no farmacológicas" value={d.indicac} onChange={e=>s("indicac",e.target.value)} placeholder="Dieta, actividad física, señales de alarma…" rows={3}/>
      <TA label="Interconsulta / Referencia" value={d.ref} onChange={e=>s("ref",e.target.value)} placeholder="Especialidad y motivo (si aplica)…" rows={2}/>
    </div>,
    <div key="F" className="view" style={{display:"flex",flexDirection:"column",gap:16}}>
      <Callout level="warning" title="NOM-024-SSA3-2010 — Expediente Clínico Electrónico">
        La firma electrónica es equivalente a firma autógrafa (NOM-151-SCFI-2016). El documento será inmutable tras firmar.
      </Callout>
      <div style={{background:C.n50,border:`1px solid ${C.bd}`,borderRadius:9,padding:"14px 16px"}}>
        <div style={{fontSize:12.5,fontWeight:600,color:C.th,marginBottom:12}}>Resumen de la consulta</div>
        {[["Paciente","García Hernández, Rosa M. · 47 años"],["Diagnóstico",d.dxP||"(sin captura)"],["Plan",d.plan||"(sin captura)"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",gap:10,marginBottom:8}}>
            <span style={{fontSize:12,color:C.tm,width:120,flexShrink:0}}>{k}</span>
            <span style={{fontSize:12,color:C.th,lineHeight:1.5}}>{v}</span>
          </div>
        ))}
      </div>
      {!d.firmado
        ?<Btn v="primary" sz="lg" onClick={()=>s("firmado",true)} full>✍ Firmar con e.firma (FIEL) · NOM-151</Btn>
        :<div style={{padding:"16px 18px",borderRadius:10,background:C.g50,border:`1.5px solid ${C.g500}`,display:"flex",gap:14,alignItems:"center"}}>
          <span style={{fontSize:26}}>✅</span>
          <div>
            <div style={{fontWeight:700,color:C.g600,fontSize:14}}>Expediente firmado y guardado</div>
            <div style={{fontSize:11.5,color:C.g500,marginTop:3}}>3 Jun 2025 · 09:47 CST · Dr. R. Morales · Folio EXP-2025-14832</div>
          </div>
        </div>
      }
    </div>,
  ];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <TopBar
        title="Consulta SOAP"
        sub={<>
          García Hernández, Rosa M. · 47 años &nbsp;
          <Bdg v="error">⚠ Penicilina</Bdg> &nbsp;
          <Bdg v="error">⚠ Cefalosporinas</Bdg>
        </>}
        actions={<><Btn v="ghost" sz="sm">Guardar borrador</Btn><Btn v="secondary" sz="sm">Ver expediente</Btn></>}
      />
      <div style={{flex:1,overflowY:"auto",padding:"22px 28px"}}>
        {/* Stepper */}
        <div style={{
          display:"flex",alignItems:"center",
          background:C.cd,border:`1px solid ${C.bd}`,
          borderRadius:12,padding:"16px 22px",marginBottom:22,
        }}>
          {STEPS.map((st,i)=>(
            <div key={st.k} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <button onClick={()=>setStep(i)} style={{
                  width:36,height:36,borderRadius:"50%",border:"none",
                  background:i<step?C.g500:i===step?C.b500:C.n150,
                  color:i<=step?"#fff":C.tm,
                  fontWeight:700,fontSize:12,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:i===step?`0 0 0 4px ${C.b100}`:"none",
                  transition:"all .15s",
                }}>{i<step?"✓":st.k}</button>
                <div style={{textAlign:"center",minWidth:60}}>
                  <div style={{fontSize:11,fontWeight:i===step?700:400,color:i===step?C.b600:C.tm}}>{st.label}</div>
                  <div style={{fontSize:9.5,color:C.td}}>{st.desc}</div>
                </div>
              </div>
              {i<STEPS.length-1&&(
                <div style={{
                  flex:1,height:2,margin:"0 6px",marginBottom:26,
                  background:i<step?C.g500:C.n150,transition:"background .3s",
                }}/>
              )}
            </div>
          ))}
        </div>

        {/* Contenido */}
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:C.th}}>{STEPS[step].label}</div>
              <div style={{fontSize:12,color:C.tm,marginTop:1}}>{STEPS[step].desc}</div>
            </div>
            <Bdg v="blue">Paso {step+1} / {STEPS.length}</Bdg>
          </div>
          {contenidos[step]}
        </div>

        <div style={{display:"flex",justifyContent:"space-between"}}>
          <Btn v="outline" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}>← Anterior</Btn>
          {step<STEPS.length-1
            ?<Btn v="primary" onClick={()=>setStep(s=>s+1)}>Guardar y continuar →</Btn>
            :<Btn v="success" disabled={!d.firmado}>✓ Finalizar consulta</Btn>
          }
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SEGURIDAD
───────────────────────────────────────────── */
const INCS=[
  {hora:"08:14",tipo:"critical",ic:"!",titulo:"Múltiples intentos fallidos",desc:"5 intentos consecutivos · IP 189.203.47.12 · Usuario dr.torres bloqueado"},
  {hora:"07:52",tipo:"warning", ic:"⚠",titulo:"Dispositivo no registrado",  desc:"Chrome 124 · Windows 11 · No coincide con dispositivos habituales"},
  {hora:"06:30",tipo:"info",    ic:"i",titulo:"Exportación masiva de datos", desc:"248 registros · Enf. González · Autorizado Dr. Ruiz (Jefe de Servicio)"},
];
const LOG_DATA=[
  {u:"Dr. Morales R.",  acc:"Consulta expediente ECE",   pac:"García H., Rosa M.",  t:"09:42",ip:"10.0.1.45"},
  {u:"Enf. González S.",acc:"Actualización signos",      pac:"Ramos T., Elena",     t:"09:38",ip:"10.0.1.62"},
  {u:"Dr. Torres M.",  acc:"Prescripción emitida",       pac:"Jiménez S., Pedro",   t:"09:15",ip:"10.0.1.33"},
  {u:"Admin. Rodríguez",acc:"Alta de usuario",           pac:"—",                   t:"08:55",ip:"10.0.1.10"},
  {u:"Dr. Morales R.", acc:"Autenticación exitosa (2FA)","pac":"—",                 t:"07:30",ip:"10.0.1.45"},
];
const IC_C={critical:{bg:C.r50,bd:C.r500,cc:C.r600,ic:C.r500},warning:{bg:C.w50,bd:C.w500,cc:C.w600,ic:C.w500},info:{bg:C.b50,bd:C.b200,cc:C.b700,ic:C.b500}};

const Security = () => {
  const [sess,setSess]=useState([
    {u:"Dr. Morales R.",  dev:"Chrome 124 · macOS",    ip:"10.0.1.45",    t:"Hace 2h 15m",cur:true},
    {u:"Dr. Torres M.",  dev:"Safari · iPhone iOS 17",  ip:"189.203.45.12",t:"Hace 31m",    cur:false},
    {u:"Enf. González S.",dev:"Firefox 125 · Windows",  ip:"10.0.1.62",   t:"Hace 1h 8m",  cur:false},
  ]);

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <TopBar
        title="Panel de Seguridad"
        sub="Superadministrador · Auditoría NOM-024 · Tiempo real"
        actions={<><Bdg v="error" dot>2 incidentes activos</Bdg><Btn v="secondary" sz="sm">Exportar reporte</Btn></>}
      />
      <div style={{flex:1,overflowY:"auto",padding:"22px 28px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
          {/* Incidentes */}
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.bd}`}}>
              <div style={{fontSize:13,fontWeight:600,color:C.th}}>Incidentes recientes</div>
              <Bdg v="error" dot>2 sin resolver</Bdg>
            </div>
            <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
              {INCS.map((inc,i)=>{
                const cv=IC_C[inc.tipo];
                return (
                  <div key={i} style={{
                    padding:"11px 13px",borderRadius:9,
                    background:cv.bg, border:`1px solid ${cv.bd}`,
                    display:"flex",gap:11,
                  }}>
                    <span style={{width:18,height:18,borderRadius:"50%",background:cv.ic,color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{inc.ic}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:600,color:cv.cc}}>{inc.titulo}</span>
                        <span style={{fontSize:10.5,color:C.td,flexShrink:0,marginLeft:8}}>{inc.hora}</span>
                      </div>
                      <div style={{fontSize:11.5,color:C.ts,lineHeight:1.45}}>{inc.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sesiones */}
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.bd}`}}>
              <div style={{fontSize:13,fontWeight:600,color:C.th}}>Sesiones activas</div>
              <Bdg v="blue">{sess.length} sesiones</Bdg>
            </div>
            <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
              {sess.map((s,i)=>(
                <div key={i} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                  borderRadius:9, border:`1px solid ${C.bd}`,
                  background:s.cur?C.b50:C.cd,
                }}>
                  <div style={{
                    width:32,height:32,borderRadius:"50%",flexShrink:0,
                    background:s.cur?`linear-gradient(135deg,${C.b400},${C.b600})`:C.n150,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:s.cur?"#fff":C.n400,fontSize:11,fontWeight:700,
                  }}>{s.u.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12.5,fontWeight:500,color:C.th,display:"flex",gap:6,alignItems:"center"}}>
                      {s.u} {s.cur&&<Bdg v="blue">Actual</Bdg>}
                    </div>
                    <div style={{fontSize:11,color:C.tm,marginTop:1}}>{s.dev} · <span style={{fontFamily:"monospace"}}>{s.ip}</span></div>
                    <div style={{fontSize:10.5,color:C.td}}>{s.t}</div>
                  </div>
                  {!s.cur&&<Btn v="danger" sz="xs" onClick={()=>setSess(ss=>ss.filter((_,j)=>j!==i))}>Invalidar</Btn>}
                </div>
              ))}
              {sess.length===0&&<div style={{textAlign:"center",padding:20,fontSize:13,color:C.td}}>✅ Todas las sesiones externas invalidadas</div>}
            </div>
          </div>
        </div>

        {/* Bitácora */}
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.bd}`}}>
            <div style={{fontSize:13,fontWeight:600,color:C.th}}>Bitácora de accesos</div>
            <Btn v="secondary" sz="sm">Exportar CSV</Btn>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:C.n50}}>
                {["Hora","Usuario","Acción","Paciente","IP origen"].map(h=>(
                  <th key={h} style={{padding:"9px 18px",textAlign:"left",fontSize:10.5,fontWeight:700,color:C.tm,textTransform:"uppercase",letterSpacing:.6,borderBottom:`1px solid ${C.bd}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOG_DATA.map((r,i)=>(
                <tr key={i} className="row-hover" style={{borderBottom:i<LOG_DATA.length-1?`1px solid ${C.bd}`:"none"}}>
                  <td style={{padding:"11px 18px",fontSize:12.5,color:C.ts,fontVariantNumeric:"tabular-nums",fontFamily:"monospace"}}>{r.t}</td>
                  <td style={{padding:"11px 18px",fontSize:12.5,fontWeight:500,color:C.th}}>{r.u}</td>
                  <td style={{padding:"11px 18px",fontSize:12.5,color:C.ts}}>{r.acc}</td>
                  <td style={{padding:"11px 18px",fontSize:12.5,color:C.ts}}>{r.pac}</td>
                  <td style={{padding:"11px 18px",fontSize:11.5,color:C.td,fontFamily:"monospace",letterSpacing:.3}}>{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PALETA
───────────────────────────────────────────── */
const PaletteScreen = () => {
  const grupos=[
    {titulo:"Azul naval institucional",cols:[
      {n:"b-50",v:C.b50,tx:C.b600},{n:"b-100",v:C.b100,tx:C.b600},{n:"b-200",v:C.b200,tx:"#fff"},
      {n:"b-500",v:C.b500,tx:"#fff"},{n:"b-700",v:C.b700,tx:"#fff"},{n:"sidebar",v:C.si,tx:"#fff"},
    ]},
    {titulo:"Ámbar acento — no verde médico cliché",cols:[
      {n:"a-50",v:C.a50,tx:C.a500},{n:"a-100",v:C.a100,tx:C.a500},{n:"a-200",v:C.a200,tx:"#fff"},
      {n:"a-400",v:C.a400,tx:"#fff"},{n:"a-500",v:C.a500,tx:"#fff"},{n:"a-700",v:C.a700,tx:"#fff"},
    ]},
    {titulo:"Semánticos — éxito / advertencia / error",cols:[
      {n:"ok-100",v:C.g100,tx:C.g600},{n:"ok-500",v:C.g500,tx:"#fff"},
      {n:"w-100",v:C.w100,tx:C.w600},{n:"w-500",v:C.w500,tx:"#fff"},
      {n:"r-100",v:C.r100,tx:C.r600},{n:"r-500",v:C.r500,tx:"#fff"},
    ]},
    {titulo:"Fondos cálidos — fatiga visual reducida",cols:[
      {n:"bg-page",v:C.bg,tx:C.ts},{n:"bg-surf",v:C.sf,tx:C.ts},{n:"bg-card",v:C.cd,tx:C.ts},
      {n:"n-100",v:C.n100,tx:C.ts},{n:"n-400",v:C.n400,tx:"#fff"},{n:"n-700",v:C.n700,tx:"#fff"},
    ]},
  ];

  return (
    <div style={{flex:1,overflow:"auto"}}>
      <TopBar title="Paleta de diseño" sub="Tokens · Componentes · Tipografía DM Sans"/>
      <div style={{padding:"22px 28px"}}>
        {grupos.map(g=>(
          <div key={g.titulo} style={{marginBottom:26}}>
            <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>{g.titulo}</div>
            <div style={{display:"flex",gap:8}}>
              {g.cols.map(c=>(
                <div key={c.n} style={{flex:1}}>
                  <div style={{height:62,borderRadius:9,background:c.v,border:`1px solid rgba(0,0,0,.07)`,display:"flex",alignItems:"flex-end",padding:"5px 8px"}}>
                    <span style={{fontSize:9,fontFamily:"monospace",color:c.tx,opacity:.75}}>{c.v}</span>
                  </div>
                  <div style={{fontSize:10,color:C.tm,marginTop:5,textAlign:"center"}}>{c.n}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.4,textTransform:"uppercase",marginBottom:16}}>7 Variantes de botón</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
              {["primary","secondary","accent","success","danger","ghost","outline"].map(v=>(
                <Btn key={v} v={v}>{v}</Btn>
              ))}
            </div>
            <Hr style={{marginBottom:14}}/>
            <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.4,textTransform:"uppercase",marginBottom:10}}>Escala de tamaños</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {["xs","sm","md","lg"].map(sz=><Btn key={sz} v="primary" sz={sz}>{sz}</Btn>)}
            </div>
          </div>

          <div className="card" style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.4,textTransform:"uppercase",marginBottom:14}}>Badges + Callouts</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {[["blue","Activo",true],["success","Completado",true],["amber","En espera",true],["warning","Advertencia",true],["error","Crítico",true],["default","Neutro",false]].map(([v,l,d])=>(
                <Bdg key={l} v={v} dot={d}>{l}</Bdg>
              ))}
            </div>
            <Hr style={{marginBottom:14}}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Callout level="info"     title="Info NOM">Nivel informativo normativo del sistema</Callout>
              <Callout level="warning"  title="Advertencia">Acción que requiere atención del operador</Callout>
              <Callout level="critical" title="Crítico">Riesgo legal — no se puede deshacer</Callout>
            </div>
          </div>

          <div className="card" style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.4,textTransform:"uppercase",marginBottom:16}}>Inputs — estados</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Inp label="Normal" placeholder="Input estándar" value="" onChange={()=>{}}/>
              <Inp label="Con icono" placeholder="Con prefijo" value="" onChange={()=>{}} pre="✉"/>
              <Inp label="Error" placeholder="Campo requerido" value="" onChange={()=>{}} error="Este campo es obligatorio"/>
            </div>
          </div>

          <div className="card" style={{padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.4,textTransform:"uppercase",marginBottom:14}}>Tipografía — DM Sans</div>
            <div style={{fontSize:24,fontWeight:700,color:C.th,lineHeight:1.15,letterSpacing:-.5,marginBottom:6}}>Heading 700 · 24px</div>
            <div style={{fontSize:16,fontWeight:600,color:C.th,marginBottom:6}}>Subheading 600 · 16px</div>
            <div style={{fontSize:13,fontWeight:400,color:C.tb,lineHeight:1.65,marginBottom:10}}>
              Body regular 400 · 13px — Para sesiones de 8h+ en pantalla. La elección de DM Sans optimiza la lectura prolongada con terminaciones aperturadas y buen espaciado interno.
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <code style={{fontSize:11.5,background:C.n50,padding:"3px 8px",borderRadius:5,color:C.b600,border:`1px solid ${C.b100}`}}>monospace</code>
              <span style={{fontSize:11,fontWeight:700,color:C.ts,letterSpacing:.5,textTransform:"uppercase",lineHeight:"26px"}}>LABEL CAPS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   APP
───────────────────────────────────────────── */
export default function App() {
  const [screen,setScreen]=useState("login");

  if(screen==="login") return <><Css/><Login onLogin={()=>setScreen("dashboard")}/></>;

  return (
    <>
      <Css/>
      <div style={{display:"flex",height:"100vh",background:C.bg,overflow:"hidden"}}>
        <Sidebar cur={screen} onNav={setScreen}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.sf}}>
          {screen==="dashboard" && <Dashboard onConsulta={()=>setScreen("consult")}/>}
          {screen==="agenda"    && <AgendaScreen/>}
          {screen==="patients"  && <Patients/>}
          {screen==="consult"   && <Consult/>}
          {screen==="security"  && <Security/>}
          {screen==="palette"   && <PaletteScreen/>}
        </div>
      </div>
    </>
  );
}
