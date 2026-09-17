(() => {
  const button = document.getElementById('pipBtn');
  const message = document.getElementById('pipMessage');
  const canvas = document.createElement('canvas');
  canvas.width = 720; canvas.height = 430;
  const ctx = canvas.getContext('2d');
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.autoplay = true;
  video.className = 'pip-video-source';
  video.setAttribute('aria-hidden', 'true');
  document.body.append(video);
  let pipWindow = null, stream = null, preparing = false;
  const say = text => { message.hidden = false; message.textContent = text; };
  const active = () => !!pipWindow || document.pictureInPictureElement === video || video.webkitPresentationMode === 'picture-in-picture';
  function draw() {
    const loud = document.body.classList.contains('loud-mode');
    const warning = document.getElementById('warning').textContent;
    const mic = document.getElementById('micStatus').textContent;
    ctx.fillStyle = loud ? '#fff0ef' : '#edf3e4'; ctx.fillRect(0,0,720,430);
    ctx.textAlign = 'left'; ctx.fillStyle = '#284a38'; ctx.font = 'bold 26px -apple-system, sans-serif';
    ctx.fillText('Noise Timer',32,46);
    ctx.textAlign = 'right'; ctx.font = '18px -apple-system, sans-serif';ctx.fillText(mic,688,45);
    ctx.textAlign = 'center';ctx.fillStyle = loud ? '#bb202c' : '#24382e';
    const time = document.getElementById('timer').textContent;
    ctx.font = `bold ${time.length > 8 ? 86 : 108}px -apple-system, sans-serif`;ctx.fillText(time,360,176);
    ctx.font = '18px -apple-system, sans-serif';ctx.fillText('TOTAL NOISE TIME',360,210);
    ctx.fillStyle = loud ? '#c92332' : '#284a38';ctx.fillRect(32,234,656,52);
    ctx.fillStyle = '#fff';ctx.font = 'bold 23px -apple-system, sans-serif';ctx.fillText(warning,360,268,620);
    const noise = parseFloat(document.getElementById('noiseLevel').textContent)||0;
    const limit = Number(document.getElementById('threshold').value);
    ctx.fillStyle='#d4dfc8';ctx.fillRect(32,311,656,18);
    ctx.fillStyle=loud?'#c92332':'#789951';ctx.fillRect(32,311,656*noise/100,18);
    ctx.fillStyle='#24382e';ctx.fillRect(32+656*limit/100-2,306,4,28);
    ctx.font='20px -apple-system, sans-serif';ctx.textAlign='left';ctx.fillText(`Volume ${noise}%`,32,363);
    ctx.textAlign='right';ctx.fillText(`Limit ${limit}%`,688,363);
    ctx.textAlign='center';ctx.font='17px -apple-system, sans-serif';
    const grace=document.getElementById('graceWrap');
    ctx.fillText(!grace.classList.contains('hidden') ? `Above limit: ${document.getElementById('graceText').textContent}` : 'Keep the Noise Timer tab open',360,402);
  }
  function resetLabel(){button.textContent=active()?'Close Picture in Picture':'Picture in Picture';}
  function stopStream(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}video.srcObject=null;}
  async function prepare(){
    if(stream||preparing)return;
    preparing=true;
    try{draw();stream=canvas.captureStream(20);video.srcObject=stream;await video.play();}
    catch(_){stopStream();}
    finally{preparing=false;}
  }
  window.addEventListener('noise-timer-tick',draw);
  document.addEventListener('click',()=>{draw();},{passive:true});
  document.addEventListener('input',draw);
  // Prepare the visual-only stream after the user's launch gesture, before PiP is requested.
  document.getElementById('launchTimer').addEventListener('click',()=>{
    if(!window.documentPictureInPicture && canvas.captureStream)prepare();
  });
  video.addEventListener('enterpictureinpicture',resetLabel);
  video.addEventListener('leavepictureinpicture',resetLabel);
  video.addEventListener('webkitpresentationmodechanged',resetLabel);
  button.addEventListener('click',async()=>{
    if(button.disabled)return;
    draw();
    try{
      if(pipWindow){pipWindow.close();return;}
      if(document.pictureInPictureElement===video){await document.exitPictureInPicture();return;}
      if(video.webkitPresentationMode==='picture-in-picture'){video.webkitSetPresentationMode('inline');return;}
      if(window.documentPictureInPicture){
        button.disabled=true;
        pipWindow=await window.documentPictureInPicture.requestWindow({width:420,height:300});
        const doc=pipWindow.document;doc.title='Noise Timer';
        const style=doc.createElement('style');style.textContent='body{margin:0;background:#edf3e4;font-family:system-ui}canvas{display:block;width:100%;height:auto}button{padding:10px 20px;border:0;border-radius:10px;background:#284a38;color:white;font:inherit}nav{display:flex;gap:12px;justify-content:center;padding:8px}';doc.head.append(style);
        doc.body.append(canvas);
        const nav=doc.createElement('nav');
        const pause=doc.createElement('button');pause.textContent='Pause / Resume';pause.onclick=()=>{const p=document.getElementById('pauseBtn'),s=document.getElementById('startBtn');if(!p.disabled)p.click();else if(!s.disabled)s.click();draw();};
        const back=doc.createElement('button');back.textContent='Back to timer';back.onclick=()=>{window.focus();pipWindow.close();};nav.append(pause,back);doc.body.append(nav);
        pipWindow.addEventListener('pagehide',()=>{pipWindow=null;canvas.remove();resetLabel();},{once:true});
      }else{
        if(!stream || video.readyState<2){await prepare();say('The mini timer is preparing. Click Picture in Picture again to open it.');return;}
        if(document.pictureInPictureEnabled && video.requestPictureInPicture)await video.requestPictureInPicture();
        else if(video.webkitSupportsPresentationMode?.('picture-in-picture'))video.webkitSetPresentationMode('picture-in-picture');
        else{say('Picture in Picture is not available in this browser. Try opening Noise Timer in Chrome or Edge on your Mac.');return;}
      }
      say('Drag the floating timer to a corner and keep this tab open. Speaker audio from your video can also affect the noise meter.');
    }catch(_){say('The browser could not open Picture in Picture. Try again, or open this site in Chrome or Edge.');}
    finally{button.disabled=false;resetLabel();}
  });
  window.addEventListener('pagehide',()=>{if(pipWindow)pipWindow.close();stopStream();});
  draw();
})();
