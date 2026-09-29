const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORAGE_KEY="stockpilotData";
const ACCOUNT_KEY="stockpilotAccount";
const LOGIN_KEY="stockpilotLogged";

const baseProducts=[
 {id:1,name:"Euro Pallet 1200×800",sku:"PAL-EURO-01",cat:"Pallets",stock:84,cost:760,sales:31,risk:"low",img:""},
 {id:2,name:"Heavy Duty Pallet",sku:"PAL-HD-07",cat:"Pallets",stock:22,cost:1180,sales:4,risk:"high",img:""},
 {id:3,name:"Wooden Crate Medium",sku:"CRT-MD-12",cat:"Crates",stock:46,cost:420,sales:13,risk:"medium",img:""},
 {id:4,name:"Export Pallet 1100×1100",sku:"PAL-EX-11",cat:"Pallets",stock:17,cost:920,sales:8,risk:"medium",img:""},
 {id:5,name:"Corner Protector",sku:"CP-001",cat:"Packaging",stock:310,cost:18,sales:124,risk:"low",img:""}
];
const defaultData={
 version:4,
 user:{name:"Business Owner",email:"",avatar:"",description:""},
 businesses:[{id:Date.now(),name:"My Business",desc:"Add your business description",location:"India",active:true,products:[],revenueHistory:[0,0,0,0,0,0],currentRevenue:0,activities:[]}]
};

function demoData(){
 const products=structuredClone(baseProducts);
 return {
  version:4,
  user:{name:"Demo Owner",email:"demo@stockpilot.app",avatar:"",description:"Manufacturing and wholesale of wooden pallets for local industrial customers."},
  businesses:[
   {id:1,name:"DD Palette Manufacturing",desc:"Wooden pallets & industrial packaging",location:"Chennai, Tamil Nadu",active:true,products,revenueHistory:[62000,74000,69000,83000,91000,103000],currentRevenue:103000,activities:[["Sale recorded","Heavy Duty Pallet × 2","Today, 4:12 PM"],["Stock alert","Heavy Duty Pallet crossed risk threshold","Today, 1:40 PM"],["Catalogue","Euro Pallet photo draft added","Yesterday, 5:28 PM"],["Report","Monthly operations report exported","Yesterday, 11:03 AM"]]},
   {id:2,name:"Aarav Components",desc:"Small-batch industrial components",location:"Sriperumbudur, Tamil Nadu",active:false,products:[{id:21,name:"Precision Bracket",sku:"BRK-101",cat:"Components",stock:140,cost:85,sales:46,risk:"low",img:""},{id:22,name:"Mounting Plate",sku:"MNT-204",cat:"Components",stock:38,cost:240,sales:9,risk:"medium",img:""}],revenueHistory:[28000,31000,36000,42000,45000,51000],currentRevenue:51000,activities:[["Workspace","Aarav Components is ready","Just now"]]}
  ]
 };
}
let data=loadData();
let currentBusiness=data.businesses.find(b=>b.active)||data.businesses[0]||null;
let charts={};

function clone(x){return structuredClone(x)}
function normalizeProduct(p){
 p.stock=Math.max(0,Number(p.stock)||0); p.cost=Math.max(0,Number(p.cost)||0); p.sales=Math.max(0,Number(p.sales)||0); p.name=String(p.name||"Unnamed product"); p.sku=String(p.sku||"SKU"); p.cat=String(p.cat||"General"); p.risk=calcRisk(p); return p;
}
function calcRisk(p){if(p.stock<=0)return "high"; if(p.sales<7)return "high"; if(p.sales>0 && p.stock/p.sales>8)return "medium"; return "low"}
function loadData(){
 try{
  const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
  if(!raw)return clone(defaultData);
  // Version 4 deliberately resets old prototype/sample data.
  // Demo data is only loaded when the user explicitly chooses Demo Workspace.
  if(raw.version===4 && Array.isArray(raw.businesses)){
   raw.businesses.forEach(b=>{
    b.products=(b.products||[]).map(normalizeProduct);
    b.revenueHistory=Array.isArray(b.revenueHistory)?b.revenueHistory:[0,0,0,0,0,0];
    b.currentRevenue=Number(b.currentRevenue)||0;
    b.activities=Array.isArray(b.activities)?b.activities:[];
   });
   if(!raw.businesses.length)raw.businesses=clone(defaultData.businesses);
   return raw;
  }
  // Never migrate v3 sample data into the clean workspace.
  return clone(defaultData);
 }catch(e){console.warn("StockPilot data reset after invalid local storage",e);return clone(defaultData)}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
function products(){return currentBusiness?.products||[]}
function toast(msg,type="success"){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show",type);clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show",type),2600)}
function initials(n){return (n||"U").split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function money(n){return "₹"+Math.round(Number(n)||0).toLocaleString("en-IN")}
function formatLakhs(n){return "₹"+(Number(n||0)/100000).toFixed(2)+"L"}

function refreshIdentity(){
 $("#sideName").textContent=data.user.name;$("#topName").textContent=data.user.name;$("#greetName").textContent=(data.user.name||"Owner").split(" ")[0];
 $("#sideBusiness").textContent=currentBusiness?.name||"No business";$("#businessLabel").textContent=currentBusiness?.name||"No business";$("#profileName").textContent=data.user.name;$("#profileEmail").textContent=data.user.email;
 $("#settingsName").value=data.user.name;$("#settingsBusiness").value=currentBusiness?.name||"My Business";$("#settingsDescription").value=data.user.description||"";
 ["sideAvatar","topAvatar","profileAvatar"].forEach(id=>{const el=$("#"+id);if(!el)return;if(data.user.avatar){el.style.backgroundImage=`url(${data.user.avatar})`;el.style.backgroundSize="cover";el.style.backgroundPosition="center";el.textContent=""}else{el.style.backgroundImage="";el.textContent=initials(data.user.name)}});
}
function showAuthMessage(msg,isError=false){const el=$("#authMessage");if(!el)return;el.textContent=msg;el.className="auth-message "+(msg?(isError?"error":"success"):"")}
function getAccount(){try{return JSON.parse(localStorage.getItem(ACCOUNT_KEY)||"null")}catch{return null}}
function init(){
 try{currentBusiness=data.businesses.find(b=>b.active)||data.businesses[0]||null;bindAuth();bindNav();bindActions();refreshIdentity();renderAll();if(localStorage.getItem(LOGIN_KEY))enterApp();else{$("#authView").classList.remove("hidden");$("#app").classList.add("hidden")}}
 catch(err){console.error(err);showAuthMessage("The app could not initialize. Please refresh the page.",true)}
}
function bindAuth(){
 $("#showSignup").onclick=()=>{$("#loginPane").classList.add("hidden");$("#signupPane").classList.remove("hidden");showAuthMessage("")};
 $("#showLogin").onclick=()=>{$("#signupPane").classList.add("hidden");$("#loginPane").classList.remove("hidden");showAuthMessage("")};
 $("#demoBtn").onclick=()=>{
  data=demoData();
  currentBusiness=data.businesses.find(b=>b.active)||data.businesses[0];
  save();
  localStorage.setItem(LOGIN_KEY,"demo");
  enterApp();
 };
 $("#loginForm").onsubmit=e=>{e.preventDefault();const email=$("#loginEmail").value.trim().toLowerCase(),password=$("#loginPassword").value,account=getAccount();if(!account){showAuthMessage("No account exists in this browser. Create an account first.",true);return}if(account.email!==email||account.password!==password){showAuthMessage("Incorrect email or password.",true);return}data.user.name=account.name;data.user.email=account.email;save();localStorage.setItem(LOGIN_KEY,"user");enterApp()};
 $("#signupForm").onsubmit=e=>{e.preventDefault();const name=$("#signupName").value.trim(),email=$("#signupEmail").value.trim().toLowerCase(),password=$("#signupPassword").value,existing=getAccount();if(name.length<2)return showAuthMessage("Please enter your name.",true);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return showAuthMessage("Please enter a valid email address.",true);if(password.length<6)return showAuthMessage("Password must be at least 6 characters.",true);if(existing?.email===email)return showAuthMessage("That email is already registered. Sign in instead.",true);localStorage.setItem(ACCOUNT_KEY,JSON.stringify({name,email,password}));
 data=clone(defaultData);
 data.user.name=name;
 data.user.email=email;
 data.businesses=[{id:Date.now(),name:"My Business",desc:"Add your business description",location:"India",active:true,products:[],revenueHistory:[0,0,0,0,0,0],currentRevenue:0,activities:[["Workspace","Workspace created","Just now"]]}];
 currentBusiness=data.businesses[0];
 save();
 localStorage.setItem(LOGIN_KEY,"user");
 enterApp()};
}
function enterApp(){$("#authView").classList.add("hidden");$("#app").classList.remove("hidden");refreshIdentity();renderAll()}
function bindNav(){
 $$(".nav[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
 $("#mobileMenu").onclick=()=>$(".sidebar").classList.toggle("open");
 $("#logoutBtn").onclick=()=>{localStorage.removeItem(LOGIN_KEY);location.reload()};
}
function showPage(page){
 const target=$("#"+page);if(!target)return;$$(".page").forEach(p=>p.classList.remove("active-page"));target.classList.add("active-page");$$(".nav[data-page]").forEach(n=>n.classList.toggle("active",n.dataset.page===page));$("#pageLabel").textContent=({overview:"Overview",inventory:"Inventory",sales:"Sales & Analytics",catalogue:"Product Catalogue",businesses:"My Businesses",reports:"Reports & Export",settings:"Profile & Settings"})[page]||"Workspace";$(".sidebar").classList.remove("open");if(page==="sales")renderCharts();if(page==="reports")renderReport();
}
function bindActions(){
 $$('[data-action="add-product"]').forEach(b=>b.onclick=()=>productModal());$$('[data-action="add-sale"]').forEach(b=>b.onclick=()=>saleModal());$$('[data-action="add-business"]').forEach(b=>b.onclick=()=>businessModal());$$('[data-action="scan"]').forEach(b=>b.onclick=()=>scanModal());
 $$("[data-page]").forEach(b=>{if(b.classList.contains("text-btn"))b.onclick=()=>showPage(b.dataset.page)});
 $("#inventorySearch").oninput=renderInventory;$("#riskFilter").onchange=renderInventory;
 $("#chatOpen").onclick=()=>{$("#chatPanel").classList.remove("hidden");$("#chatInput").focus()};$("#chatClose").onclick=()=>$("#chatPanel").classList.add("hidden");$("#chatForm").onsubmit=e=>{e.preventDefault();chat($("#chatInput").value);$("#chatInput").value=""};$$('.suggestions button').forEach(b=>b.onclick=()=>chat(b.textContent));
 $$(".modal-close").forEach(b=>b.onclick=closeModal);
 $("#saveSettings").onclick=()=>{const name=$("#settingsName").value.trim(),biz=$("#settingsBusiness").value.trim(),desc=$("#settingsDescription").value.trim();if(name.length<2)return toast("Please enter a valid name","error");if(biz.length<2)return toast("Please enter a business name","error");data.user.name=name;data.user.description=desc;currentBusiness.name=biz;save();refreshIdentity();renderAll();toast("Profile saved")};
 $("#avatarBtn").onclick=()=>$("#avatarInput").click();$("#avatarInput").onchange=e=>{const f=e.target.files[0];if(!f)return;if(f.size>2*1024*1024)return toast("Please choose an image under 2 MB","error");const r=new FileReader();r.onload=()=>{data.user.avatar=r.result;save();refreshIdentity();toast("Profile photo updated")};r.readAsDataURL(f)};
 $$('[data-export]').forEach(b=>b.onclick=()=>exportReport(b.dataset.export));
}
function renderAll(){refreshIdentity();renderKPIs();renderInventory();renderRisks();renderRecommendations();renderActivity();renderCharts();renderCatalogue();renderBusinesses();renderReport()}
function renderKPIs(){
 const ps=products(),value=ps.reduce((a,p)=>a+p.stock*p.cost,0),risk=ps.filter(p=>p.risk==="high").reduce((a,p)=>a+p.stock*p.cost,0),revenue=currentBusiness.currentRevenue||0;
 $("#kpiRevenue").textContent=formatLakhs(revenue);$("#kpiStock").textContent=formatLakhs(value);$("#kpiRisk").textContent=money(risk);$("#kpiMargin").textContent=ps.length?((ps.reduce((a,p)=>a+p.cost*p.sales,0)>0)?"28.4%":"—"):"—";
 const stockSmall=$("#kpiStock")?.parentElement?.querySelector("small");if(stockSmall)stockSmall.textContent=ps.length+" active SKU"+(ps.length===1?"":"s");const riskSmall=$("#kpiRisk")?.parentElement?.querySelector("small");if(riskSmall)riskSmall.textContent=ps.filter(p=>p.risk!=="low").length+" items need attention";
}
function renderInventory(){
 const q=($("#inventorySearch")?.value||"").toLowerCase(),f=$("#riskFilter")?.value||"all",ps=products().filter(p=>(f==="all"||p.risk===f)&&[p.name,p.sku,p.cat].join(" ").toLowerCase().includes(q));
 $("#inventoryBody").innerHTML=ps.length?ps.map(p=>`<tr><td><div class="product-cell"><div class="product-thumb">${p.img?`<img src="${p.img}" alt="">`:"▦"}</div><div><b>${escapeHtml(p.name)}</b><small style="display:block;color:#7389a1">${escapeHtml(p.cat)}</small></div></div></td><td>${escapeHtml(p.sku)}</td><td>${p.stock}</td><td>${money(p.cost)}</td><td>${money(p.stock*p.cost)}</td><td>${p.sales} / mo</td><td><span class="badge ${p.risk}">${p.risk.toUpperCase()}</span></td><td><button type="button" class="icon-btn edit-product" data-id="${p.id}" aria-label="Edit or delete product" title="Edit or delete product">⋯</button></td></tr>`).join(""):emptyRow("No products match your filters.");
 $$(".edit-product").forEach(b=>b.onclick=()=>{const p=products().find(x=>String(x.id)===String(b.dataset.id));if(p)productModal(p)})
}
function emptyRow(msg){return `<tr><td colspan="8" style="padding:34px;text-align:center;color:#7389a1">${escapeHtml(msg)}</td></tr>`}
function renderRisks(){const ps=[...products()].sort((a,b)=>({high:0,medium:1,low:2}[a.risk]??3)-({high:0,medium:1,low:2}[b.risk]??3));$("#riskList").innerHTML=ps.length?ps.slice(0,4).map(p=>`<div class="risk-item"><div><b>${escapeHtml(p.name)}</b><small>${p.stock} units · ${p.sales}/month</small></div><b class="risk-${p.risk}">${p.risk==="high"?"HIGH":p.risk==="medium"?"WATCH":"HEALTHY"}</b></div>`).join(""):"<div class='empty-note'>Add products to start risk monitoring.</div>"}
function renderRecommendations(){
 const ps=products(),high=ps.filter(p=>p.risk==="high"),slow=ps.filter(p=>p.sales<7),recs=[];if(high.length)recs.push(["↘","Reduce inventory exposure",`Review ${high[0].name}; it has ${high[0].sales} monthly sales against ${high[0].stock} units in stock.`]);if(slow.length)recs.push(["◷","Review slow movers",`${slow.length} SKU(s) have fewer than 7 monthly sales. Consider smaller purchase batches or promotions.`]);recs.push(["◎","Set reorder points","Use sales velocity plus supplier lead time instead of fixed reorder quantities."]);recs.push(["₹","Protect margin","Review unit cost whenever raw-material prices change and compare purchase cost with realised selling price."]);$("#recommendations").innerHTML=recs.map(r=>`<div class="rec"><div class="rec-icon">${r[0]}</div><div><b>${r[1]}</b><p>${escapeHtml(r[2])}</p></div></div>`).join("")
}
function renderActivity(){$("#activity").innerHTML=currentBusiness.activities?.length?currentBusiness.activities.slice(0,5).map(a=>`<div class="activity-item"><div><b>${escapeHtml(a[0])}</b><small style="display:block">${escapeHtml(a[1])}</small></div><small>${escapeHtml(a[2])}</small></div>`).join(""):"<div class='empty-note'>No activity yet.</div>"}
function chartBase(){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#71859d",font:{size:9}}},y:{grid:{color:"#17283b"},ticks:{color:"#71859d",font:{size:9},callback:v=>"₹"+Math.round(v/1000)+"k"}}}}}
function renderCharts(){
 if(typeof Chart==="undefined")return;const labels=["Apr","May","Jun","Jul","Aug","Sep"],history=(currentBusiness.revenueHistory||[0,0,0,0,0,0]).slice(-6);Object.values(charts).forEach(c=>{try{c.destroy()}catch{}});charts={};
 if($("#salesChart"))charts.sales=new Chart($("#salesChart"),{type:"line",data:{labels,datasets:[{data:history,borderColor:"#8bf0c8",backgroundColor:"rgba(139,240,200,.08)",fill:true,tension:.4,pointRadius:3,pointBackgroundColor:"#8bf0c8"}]},options:chartBase()});
 if($("#revenueChart"))charts.revenue=new Chart($("#revenueChart"),{type:"bar",data:{labels,datasets:[{data:history,backgroundColor:"#79d7c2",borderRadius:6}]},options:chartBase()});
 if($("#categoryChart")){const cats={};products().forEach(p=>cats[p.cat]=(cats[p.cat]||0)+p.sales*p.cost);charts.cat=new Chart($("#categoryChart"),{type:"doughnut",data:{labels:Object.keys(cats),datasets:[{data:Object.values(cats),backgroundColor:["#8bf0c8","#7aa8ff","#ffd47d","#c48cff"],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:"bottom",labels:{color:"#9cafc3",font:{size:9}}}}}})}
 $("#topProducts").innerHTML=products().length?[...products()].sort((a,b)=>b.sales*a.cost-a.sales*b.cost).slice(0,4).map((p,i)=>`<div class="rank"><i>0${i+1}</i><div><b>${escapeHtml(p.name)}</b><small style="display:block">${p.sales} units</small></div><b>${money(p.sales*p.cost)}</b></div>`).join(""):"<div class='empty-note'>Add products to see top performers.</div>";
}
function renderCatalogue(){$("#catalogGrid").innerHTML=products().length?products().slice(0,6).map(p=>`<div class="catalog-card">${p.img?`<img class="catalog-img" src="${p.img}" alt="${escapeHtml(p.name)}">`:`<div class="catalog-img" style="display:grid;place-items:center;font-size:40px;color:#35506b">▦</div>`}<div class="catalog-info"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.sku)} · ${escapeHtml(p.cat)}</p></div></div>`).join(""):"<div class='empty-note'>No products yet. Add one from a photo.</div>"}
function renderBusinesses(){$("#businessGrid").innerHTML=data.businesses.map(b=>`<div class="business-card ${b.active?"active":""}"><div class="biz-icon">${initials(b.name).slice(0,2)}</div><h3>${escapeHtml(b.name)}</h3><p>${escapeHtml(b.desc||"")}</p><div class="business-meta"><span>▦ ${b.products?.length||0} SKUs</span><span>⌖ ${escapeHtml(b.location||"India")}</span></div><div style="margin-top:17px"><button class="btn ${b.active?"ghost":"primary"} switch-biz" data-id="${b.id}">${b.active?"Active workspace":"Switch to this business"}</button></div></div>`).join("");$$('.switch-biz').forEach(b=>b.onclick=()=>switchBusiness(b.dataset.id))}
function switchBusiness(id){const target=data.businesses.find(b=>String(b.id)===String(id));if(!target)return;data.businesses.forEach(x=>x.active=String(x.id)===String(id));currentBusiness=target;save();renderAll();toast(`Switched to ${target.name}`)}
function renderReport(){const ps=products(),value=ps.reduce((a,p)=>a+p.stock*p.cost,0),risk=ps.filter(p=>p.risk==="high").reduce((a,p)=>a+p.stock*p.cost,0);$("#reportPreview").innerHTML=`<h4>${escapeHtml(currentBusiness.name)} — September 2026</h4><p>Revenue: <b>${formatLakhs(currentBusiness.currentRevenue)}</b> · Inventory value: <b>${formatLakhs(value)}</b> · High-risk inventory: <b>${money(risk)}</b> · Tracked SKUs: <b>${ps.length}</b></p>`}
function handleModalEscape(e){if(e.key==="Escape")closeModal()}
function openModal(html){
 const modal=$("#modal"),content=$("#modalContent");
 content.innerHTML=html;modal.classList.remove("hidden");
 content.querySelectorAll(".modal-close").forEach(b=>{b.type="button";b.onclick=e=>{e.preventDefault();e.stopPropagation();closeModal()}});
 modal.onclick=e=>{if(e.target===modal)closeModal()};
 document.addEventListener("keydown",handleModalEscape);
}
function closeModal(){
 const modal=$("#modal"),content=$("#modalContent");
 modal.classList.add("hidden");content.innerHTML="";document.removeEventListener("keydown",handleModalEscape);
}
function productModal(p=null){
 const editing=Boolean(p);
 openModal(`<div class="modal-head-row"><div><span class="eyebrow">${editing?"EDIT PRODUCT":"NEW PRODUCT"}</span><h2>${editing?"Update product":"Add a product"}</h2></div><button type="button" class="modal-close modal-x" aria-label="Close">×</button></div><form id="productForm"><div class="form-grid"><label>Product name<input id="pname" value="${escapeHtml(p?.name||"")}" placeholder="e.g. Amul Taaza Milk 1L" required></label><label>SKU<input id="psku" value="${escapeHtml(p?.sku||"")}" placeholder="e.g. ABC-001" required></label><label>Category<input id="pcat" value="${escapeHtml(p?.cat||"")}" placeholder="e.g. Dairy" required></label><label>Stock quantity<input id="pstock" type="number" min="0" step="1" value="${p?.stock??0}" required></label><label>Unit cost (₹)<input id="pcost" type="number" min="0" step="0.01" value="${p?.cost??0}" required></label><label>Monthly sales<input id="psales" type="number" min="0" step="1" value="${p?.sales??0}" required></label></div><div class="form-actions"><button type="button" class="btn ghost modal-close">Cancel</button>${editing?'<button type="button" id="deleteProductBtn" class="btn danger-btn">Delete Product</button>':''}<button type="submit" class="btn primary">${editing?"Save changes":"Add product"}</button></div></form>`);
 $("#productForm").onsubmit=e=>{
  e.preventDefault();
  const name=$("#pname").value.trim(),sku=$("#psku").value.trim(),cat=$("#pcat").value.trim(),stock=Number($("#pstock").value),cost=Number($("#pcost").value),sales=Number($("#psales").value);
  if(!name||!sku||!cat)return toast("Please complete the product details","error");
  if(!Number.isFinite(stock)||stock<0||!Number.isFinite(cost)||cost<0||!Number.isFinite(sales)||sales<0)return toast("Enter valid non-negative numbers","error");
  if(products().some(x=>x.sku.toLowerCase()===sku.toLowerCase()&&x.id!==p?.id))return toast("That SKU already exists in this business","error");
  const obj=normalizeProduct({id:p?.id||Date.now(),name,sku,cat,stock,cost,sales,risk:p?.risk||"low",img:p?.img||""});
  if(editing)currentBusiness.products=currentBusiness.products.map(x=>x.id===p.id?obj:x);else currentBusiness.products.push(obj);
  currentBusiness.activities.unshift(["Inventory",`${name} ${editing?"updated":"added"}`,"Just now"]);save();closeModal();renderAll();toast(editing?"Product updated successfully":"Product added successfully");
 };
 if(editing)$("#deleteProductBtn").onclick=()=>{
  if(!confirm(`Delete "${p.name}"?\n\nThis will permanently remove the product from this business workspace.`))return;
  currentBusiness.products=currentBusiness.products.filter(x=>x.id!==p.id);
  currentBusiness.activities.unshift(["Inventory",`${p.name} deleted`,"Just now"]);save();closeModal();renderAll();toast("Product deleted successfully");
 };
}
function saleModal(){
 if(!products().length)return toast("Add a product before recording a sale","error");
 openModal(`<span class="eyebrow">SALES ENTRY</span><h2>Record a sale</h2><form id="saleForm"><label>Product<select id="saleProduct">${products().map(p=>`<option value="${p.id}">${escapeHtml(p.name)} — ${p.stock} in stock</option>`).join("")}</select></label><label>Quantity sold<input id="saleQty" type="number" min="1" step="1" value="1" required></label><label>Total sale value (₹)<input id="saleValue" type="number" min="0" step="0.01" placeholder="Enter invoice value" required></label><div class="form-actions"><button type="button" class="btn ghost modal-close">Cancel</button><button class="btn primary">Record sale</button></div></form>`);
 const updateValue=()=>{const p=products().find(x=>String(x.id)===$("#saleProduct").value);const q=Math.max(1,Number($("#saleQty").value)||1);$("#saleValue").placeholder=p?`Suggested: ${money(p.cost*q*1.25)}`:"Enter invoice value"};$("#saleProduct").onchange=updateValue;$("#saleQty").oninput=updateValue;updateValue();
 $("#saleForm").onsubmit=e=>{e.preventDefault();const p=products().find(x=>String(x.id)===$("#saleProduct").value),q=Number($("#saleQty").value),value=Number($("#saleValue").value);if(!p)return toast("Select a valid product","error");if(!Number.isInteger(q)||q<1)return toast("Quantity must be at least 1","error");if(q>p.stock)return toast(`Only ${p.stock} units are available for ${p.name}`,"error");if(!Number.isFinite(value)||value<0)return toast("Enter a valid sale value","error");p.stock-=q;p.sales+=q;currentBusiness.currentRevenue=(currentBusiness.currentRevenue||0)+value;currentBusiness.revenueHistory[currentBusiness.revenueHistory.length-1]=currentBusiness.currentRevenue;p.risk=calcRisk(p);currentBusiness.activities.unshift(["Sale recorded",`${p.name} × ${q}`,"Just now"]);save();closeModal();renderAll();toast("Sale recorded — inventory and revenue updated")};
}
function businessModal(){
 openModal(`<span class="eyebrow">NEW WORKSPACE</span><h2>Add a business</h2><form id="bizForm"><label>Business name<input id="bname" required placeholder="e.g. GreenBox Traders"></label><label>Description<textarea id="bdesc" placeholder="What does this business sell or make?"></textarea></label><label>Location<input id="bloc" placeholder="City, State"></label><div class="form-actions"><button type="button" class="btn ghost modal-close">Cancel</button><button class="btn primary">Create business</button></div></form>`);
 $("#bizForm").onsubmit=e=>{e.preventDefault();const name=$("#bname").value.trim(),desc=$("#bdesc").value.trim(),location=$("#bloc").value.trim();if(name.length<2)return toast("Enter a business name","error");if(data.businesses.some(b=>b.name.toLowerCase()===name.toLowerCase()))return toast("That business already exists","error");data.businesses.forEach(x=>x.active=false);const b={id:Date.now(),name,desc:desc||"Business workspace",location:location||"India",active:true,products:[],revenueHistory:[0,0,0,0,0,0],currentRevenue:0,activities:[["Workspace","Business created","Just now"]]};data.businesses.push(b);currentBusiness=b;save();closeModal();renderAll();toast("Business workspace created")}
}
function scanModal(){
 openModal(`<span class="eyebrow">PHOTO CATALOGUE</span><h2>Scan a product</h2><p>Upload a photo or use your camera. Review the fields before saving.</p><div class="dropzone"><label style="margin:0">Click to choose a product photo<input id="scanFile" type="file" accept="image/*" capture="environment"></label><div id="scanPreview"></div></div><div class="form-grid"><label>Product name<input id="scanName" placeholder="Enter product name" required></label><label>SKU<input id="scanSku" placeholder="Enter SKU" required></label><label>Category<input id="scanCat" placeholder="e.g. Dairy, Grocery" required></label><label>Unit cost (₹)<input id="scanCost" type="number" min="0" step="0.01" value="0" required></label></div><div class="form-actions"><button type="button" class="btn ghost modal-close">Cancel</button><button id="saveScan" type="button" class="btn primary">Add to catalogue</button></div>`);
 let imageData="";$("#scanFile").onchange=e=>{const f=e.target.files[0];if(!f)return;if(f.size>3*1024*1024)return toast("Please choose an image under 3 MB","error");const r=new FileReader();r.onload=()=>{imageData=r.result;$("#scanPreview").innerHTML=`<img class="preview-img" src="${imageData}" alt="Product preview">`};r.readAsDataURL(f)};
 $("#saveScan").onclick=()=>{const name=$("#scanName").value.trim(),sku=$("#scanSku").value.trim(),cat=$("#scanCat").value.trim(),cost=Number($("#scanCost").value);if(!imageData)return toast("Choose a product photo first","error");if(!name||!sku||!cat||!Number.isFinite(cost)||cost<0)return toast("Complete the product details","error");if(products().some(p=>p.sku.toLowerCase()===sku.toLowerCase()))return toast("That SKU already exists","error");currentBusiness.products.push(normalizeProduct({id:Date.now(),name,sku,cat,stock:0,cost,sales:0,risk:"high",img:imageData}));currentBusiness.activities.unshift(["Catalogue",`${name} added from photo`,"Just now"]);save();closeModal();renderAll();toast("Product added to catalogue")}
}
function localChat(q){
 const low=q.toLowerCase(),ps=products(),high=ps.filter(p=>p.risk==="high"),slow=ps.filter(p=>p.sales<7),value=ps.reduce((a,p)=>a+p.stock*p.cost,0);
 if(/risk|risky|attention/.test(low))return high.length?`I found <b>${high.length}</b> high-risk item(s): <b>${high.map(p=>escapeHtml(p.name)).join(", ")}</b>. Review purchasing or replenishment before adding more stock.`:"No product is currently marked high risk.";
 if(/wast|reduce/.test(low))return "To reduce wastage, monitor slow movers weekly, use smaller purchase batches when demand is uncertain, set reorder points from sales velocity, and record damaged/shrinkage stock separately.";
 if(/sales|trend|revenue/.test(low))return `This workspace has current revenue of <b>${formatLakhs(currentBusiness?.currentRevenue||0)}</b>. Compare sales velocity with stock cover before replenishment.`;
 if(/how.*use|use.*site|use.*app/.test(low))return "Use <b>Inventory</b> for SKUs, <b>Sales & Analytics</b> for sales entries and trends, <b>My Businesses</b> for separate workspaces, and <b>Reports & Export</b> for management reports.";
 if(/stock|inventory|value/.test(low))return `This workspace has <b>${ps.length}</b> tracked SKU(s) with inventory value of <b>${formatLakhs(value)}</b>.`;
 if(/slow|dead|moving/.test(low))return slow.length?`Slow-moving items are: <b>${slow.map(p=>escapeHtml(p.name)).join(", ")}</b>. Consider smaller purchase batches or promotions.`:"No products currently fall below the slow-moving threshold.";
 return "I can analyse your current inventory, sales, wastage risk, slow-moving stock, reorder decisions, margins, or explain how to use StockPilot.";
}
async function chat(q){
 q=(q||"").trim();if(!q)return;
 const box=$("#chatMessages");
 box.insertAdjacentHTML("beforeend",`<div class="bubble user">${escapeHtml(q)}</div>`);box.scrollTop=box.scrollHeight;
 const typingId=`typing-${Date.now()}`;box.insertAdjacentHTML("beforeend",`<div class="bubble bot" id="${typingId}"><span class="typing">Thinking…</span></div>`);
 const context={business:currentBusiness?{name:currentBusiness.name,description:currentBusiness.desc,location:currentBusiness.location,revenue:currentBusiness.currentRevenue,revenueHistory:currentBusiness.revenueHistory}:null,products:products().map(p=>({name:p.name,sku:p.sku,category:p.cat,stock:p.stock,unitCost:p.cost,monthlySales:p.sales,risk:p.risk})),user:{name:data.user?.name||"Business owner"}};
 try{
  const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q,context})});
  if(!r.ok)throw new Error("Chat server unavailable");
  const j=await r.json();
  const answer=String(j.answer||"").trim();
  if(!answer)throw new Error("Empty AI response");
  $("#"+typingId)?.remove();box.insertAdjacentHTML("beforeend",`<div class="bubble bot"><span class="ai-label">AI</span>${escapeHtml(answer).replace(/\n/g,"<br>")}</div>`);
 }catch(err){
  console.warn("AI chatbot fallback:",err);$("#"+typingId)?.remove();box.insertAdjacentHTML("beforeend",`<div class="bubble bot">${localChat(q)}<br><small class="chat-note">AI server is not connected, so I used the built-in business assistant.</small></div>`);
 }
 box.scrollTop=box.scrollHeight;
}
async function exportReport(type){
 try{
  const ps=products(),high=ps.filter(p=>p.risk==="high"),value=ps.reduce((a,p)=>a+p.stock*p.cost,0),risk=high.reduce((a,p)=>a+p.stock*p.cost,0),title=currentBusiness.name+" — Business Intelligence Report";
  if(type==="pdf"){if(!window.jspdf)throw new Error("PDF library unavailable");const {jsPDF}=window.jspdf,doc=new jsPDF();doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text(title,18,22);doc.setFontSize(11);doc.setFont("helvetica","normal");doc.text(["Generated by StockPilot",`Revenue (current month): ${formatLakhs(currentBusiness.currentRevenue)}`,`Inventory value: ${formatLakhs(value)}`,`High-risk inventory: ${money(risk)}`,`Tracked SKUs: ${ps.length}`,"","Key recommendations:","• Review slow-moving stock weekly.","• Use sales velocity to set reorder points.","• Investigate damaged/shrinkage stock separately.",...high.map(p=>`• High risk: ${p.name} — ${p.stock} units`)],18,36,{maxWidth:170,lineHeightFactor:1.6});doc.save("stockpilot-report.pdf");toast("PDF downloaded")}
  else if(type==="ppt"){if(!window.pptxgen)throw new Error("PowerPoint library unavailable");const ppt=new pptxgen();ppt.layout="LAYOUT_WIDE";const s=ppt.addSlide();s.background={color:"07111F"};s.addText(title,{x:.7,y:.7,w:11,h:.5,fontSize:24,bold:true,color:"FFFFFF"});s.addText("Inventory intelligence snapshot",{x:.7,y:1.3,w:8,h:.4,fontSize:14,color:"8BF0C8"});s.addText(`Revenue: ${formatLakhs(currentBusiness.currentRevenue)}\nInventory value: ${formatLakhs(value)}\nRisk inventory: ${money(risk)}\nTracked SKUs: ${ps.length}`,{x:.7,y:2,w:5,h:2,fontSize:20,color:"FFFFFF"});s.addText("Actions\n• Review slow movers\n• Set data-driven reorder points\n• Track shrinkage separately",{x:6,y:2,w:5,h:2,fontSize:18,color:"DCE8F5"});await ppt.writeFile({fileName:"stockpilot-report.pptx"});toast("PowerPoint downloaded")}
  else if(type==="doc"){
   if(!window.docx)throw new Error("Word library unavailable");
   const d=new docx.Document({sections:[{children:[
    new docx.Paragraph({text:title,heading:docx.HeadingLevel.TITLE}),
    new docx.Paragraph("StockPilot business intelligence snapshot."),
    new docx.Paragraph({text:"Key metrics",heading:docx.HeadingLevel.HEADING_1}),
    new docx.Paragraph(`Revenue: ${formatLakhs(currentBusiness.currentRevenue)}`),
    new docx.Paragraph(`Inventory value: ${formatLakhs(value)}`),
    new docx.Paragraph(`High-risk inventory: ${money(risk)}`),
    new docx.Paragraph(`Tracked SKUs: ${ps.length}`),
    new docx.Paragraph({text:"Recommended actions",heading:docx.HeadingLevel.HEADING_1}),
    new docx.Paragraph("Review slow-moving stock weekly and use sales velocity to set reorder points."),
    new docx.Paragraph("Investigate damaged/shrinkage stock separately from normal inventory movement.")
   ]}]});
   const blob=await docx.Packer.toBlob(d),a=document.createElement("a");
   a.href=URL.createObjectURL(blob);a.download="stockpilot-report.docx";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Word report downloaded")
  }
 }catch(e){console.error(e);toast("Report export could not start. Check your internet connection and try again.","error")}
}
init();
