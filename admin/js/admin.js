
(() => {
  async function guard(){
    const {data:{session},error:sessionError}=await sb.auth.getSession();

    if(sessionError || !session){
      location.replace('login.html');
      return null;
    }

    const {data:profile,error:profileError}=await sb
      .from('admin_profiles')
      .select('*')
      .eq('user_id',session.user.id)
      .eq('is_active',true)
      .maybeSingle();

    if(profileError){
      console.error('Admin profile error:',profileError);
      await sb.auth.signOut();
      location.replace('login.html?error=profile');
      return null;
    }

    if(profile){
      return {session,profile};
    }

    // ถ้ายังไม่เคยสร้าง Admin คนแรก ให้กลับไปหน้า Setup แทนการเด้ง Login วน
    const {data:status,error:statusError}=await sb.rpc('admin_setup_status');

    if(!statusError && !Boolean(status?.initialized)){
      location.replace('setup.html');
      return null;
    }

    // Auth สำเร็จแต่ไม่มีสิทธิ์ Admin
    await sb.auth.signOut();
    location.replace('login.html?error=no_admin');
    return null;
  }

  window.ADMIN={
    guard,
    async event(){return APP.getEvent()},
    toast(msg,type='success'){
      const el=document.querySelector('#adminMsg');
      if(el) el.innerHTML=`<div class="${type}">${APP.esc(msg)}</div>`;
    }
  };

  document.querySelector('#logout')?.addEventListener('click',async()=>{
    await sb.auth.signOut();
    location.replace('login.html');
  });
})();
