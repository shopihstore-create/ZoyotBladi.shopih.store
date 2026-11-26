module.exports = async (req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 if(process.env.ORDERS_ENABLED!=='true') return res.status(503).json({error:'Orders disabled'});
 const {TURNSTILE_SECRET_KEY,SUPABASE_SECRET_KEY}=process.env;
 if(!TURNSTILE_SECRET_KEY||!SUPABASE_SECRET_KEY) return res.status(503).json({error:'Configuration missing'});
 const b=req.body||{}; const {product_id,name,phone,city,address,token,request_id}=b;
 if(![product_id,name,phone,city,address,token,request_id].every(x=>typeof x==='string')||! /^[0-9a-f-]{36}$/i.test(product_id)||! /^[0-9a-f-]{36}$/i.test(request_id)||name.trim().length<2||name.length>100||city.trim().length<2||city.length>100||address.trim().length<5||address.length>300||! /^(\+212|00212|0)[567][0-9]{8}$/.test(phone)||token.length>2048) return res.status(400).json({error:'Invalid information'});
 try{
 const check=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:TURNSTILE_SECRET_KEY,response:token})});
 const v=await check.json(); const allowedHostnames = [   'zoyotbladi.shopih.store',   ...(process.env.VERCEL_ENV === 'preview'     ? [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean)     : []) ];  if (!v.success || !allowedHostnames.includes(v.hostname) || v.action !== 'cod') return res.status(403).json({error:'Verification failed'});
 const r=await fetch('https://aghuiwywjipiuuqcxwre.supabase.co/rest/v1/rpc/submit_cod_order',{method:'POST',headers:{apikey:SUPABASE_SECRET_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_request_id:request_id,p_product_id:product_id,p_name:name,p_phone:phone,p_city:city,p_address:address})});
 if(!r.ok) return res.status(409).json({error:'Order not accepted'});
 return res.status(200).json({number:await r.json()});
 }catch{return res.status(503).json({error:'Service unavailable'});}
};
