window.PromptPay = (()=>{
  const tlv=(id,v)=>id+String(v.length).padStart(2,'0')+v;
  const crc16=s=>{let crc=0xffff;for(const ch of s){crc^=ch.charCodeAt(0)<<8;for(let i=0;i<8;i++)crc=(crc&0x8000)?((crc<<1)^0x1021)&0xffff:(crc<<1)&0xffff;}return crc.toString(16).toUpperCase().padStart(4,'0');};
  function payload(target,amount){const raw=String(target||'').replace(/\D/g,'');let proxy,type;if(raw.length===10&&raw[0]==='0'){proxy='0066'+raw.slice(1);type='01';}else if(raw.length===13){proxy=raw;type='02';}else throw new Error('PromptPay ID must be phone 10 digits or Thai ID 13 digits');const merchant=tlv('00','A000000677010111')+tlv(type,proxy);let p=tlv('00','01')+tlv('01','12')+tlv('29',merchant)+tlv('53','764')+tlv('58','TH');if(Number(amount)>0)p+=tlv('54',Number(amount).toFixed(2));p+='6304';return p+crc16(p);}
  async function render(el,target,amount){const QRCode=window.QRCode; if(!QRCode) throw new Error('QR library not loaded');el.innerHTML='';new QRCode(el,{text:payload(target,amount),width:260,height:260,correctLevel:QRCode.CorrectLevel.M});}
  return {payload,render};
})();
