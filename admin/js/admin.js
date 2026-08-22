(() => {
  const ROLE_GROUPS={
    all:['superadmin','admin','approver','viewer'],
    settings:['superadmin','admin'],
    review:['superadmin','admin','approver'],
    superadmin:['superadmin']
  };

  function normalizeRoles(roles){
    if(!roles)return ROLE_GROUPS.all;
    if(typeof roles==='string')return ROLE_GROUPS[roles]||[roles];
    return Array.isArray(roles)?roles:ROLE_GROUPS.all;
  }

  function applyNavigation(profile){
    document.querySelectorAll('[data-roles]').forEach(el=>{
      const roles=String(el.dataset.roles||'').split(',').map(x=>x.trim()).filter(Boolean);
      if(roles.length && !roles.includes(profile.role))el.style.display='none';
    });
    document.querySelectorAll('[data-admin-role]').forEach(el=>{el.textContent=profile.role||'';});
  }

  async function guard(roles){
    const {data:{session},error:sessionError}=await sb.auth.getSession();
    if(sessionError || !session){location.replace('login.html');return null;}

    const {data:profile,error:profileError}=await sb.from('admin_profiles')
      .select('*').eq('user_id',session.user.id).maybeSingle();

    if(profileError){
      console.error('Admin profile error:',profileError);
      await sb.auth.signOut();location.replace('login.html?error=profile');return null;
    }

    if(!profile){
      try{
        const displayName=session.user.user_metadata?.display_name||session.user.email?.split('@')[0]||'Admin';
        await sb.rpc('request_admin_access',{p_display_name:displayName});
      }catch(e){console.warn(e);}
      await sb.auth.signOut();location.replace('login.html?error=pending');return null;
    }

    if(profile.approval_status==='pending'){
      await sb.auth.signOut();location.replace('login.html?error=pending');return null;
    }
    if(profile.approval_status==='rejected'){
      await sb.auth.signOut();location.replace('login.html?error=rejected');return null;
    }
    if(!profile.is_active){
      await sb.auth.signOut();location.replace('login.html?error=inactive');return null;
    }

    applyNavigation(profile);
    const allowed=normalizeRoles(roles);
    if(!allowed.includes(profile.role)){location.replace('index.html?error=forbidden');return null;}
    return {session,profile};
  }

  window.ADMIN={
    guard,
    applyNavigation,
    async event(){return APP.getEvent()},
    canReview(profile){return ROLE_GROUPS.review.includes(profile?.role)},
    canEditSettings(profile){return ROLE_GROUPS.settings.includes(profile?.role)},
    isSuperadmin(profile){return profile?.role==='superadmin'},
    toast(msg,type='success'){
      const el=document.querySelector('#adminMsg');
      if(el)el.innerHTML=`<div class="${type}">${APP.esc(msg)}</div>`;
    }
  };

  document.querySelector('#logout')?.addEventListener('click',async()=>{
    await sb.auth.signOut();location.replace('login.html');
  });
})();
