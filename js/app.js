(() => {
  const cfg = window.APP_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    console.warn('กรุณาสร้าง config.js จาก config.example.js');
  }
  window.sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.APP = {
    cfg,
    eventSlug: cfg.EVENT_SLUG || 'top100-charity-run',
    money(value, lang='th') {
      return new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US', {
        style:'currency', currency:'THB', maximumFractionDigits:0
      }).format(Number(value || 0));
    },
    async getEvent() {
      const {data,error}=await sb.from('events').select('*').eq('slug', this.eventSlug).single();
      if(error) throw error; return data;
    },
    async getCategories(eventId) {
      const {data,error}=await sb.from('event_categories').select('*').eq('event_id',eventId).eq('is_active',true).order('display_order');
      if(error) throw error; return data || [];
    },
    async getFields(eventId) {
      const {data,error}=await sb.from('registration_fields').select('*').eq('event_id',eventId).eq('is_active',true).order('display_order');
      if(error) throw error; return data || [];
    },
    async invoke(name, body) {
      const {data,error}=await sb.functions.invoke(name,{body});
      if(error) throw error; return data;
    },
    pick(obj, lang) {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      return obj[lang] || obj.th || obj.en || Object.values(obj)[0] || '';
    },
    esc(v='') { const d=document.createElement('div'); d.textContent=String(v); return d.innerHTML; }
  };
})();
