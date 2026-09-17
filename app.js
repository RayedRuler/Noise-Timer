const $=id=>document.getElementById(id);const e={micBtn:$("micBtn"),startBtn:$("startBtn"),pauseBtn:$("pauseBtn"),endBtn:$("endBtn"),resetBtn:$("resetBtn"),fullscreenBtn:$("fullscreenBtn"),micDot:$("micDot"),micStatus:$("micStatus"),meterFill:$("meterFill"),thresholdLine:$("thresholdLine"),noiseLevel:$("noiseLevel"),thresholdText:$("thresholdText"),threshold:$("threshold"),thresholdSetting:$("thresholdSetting"),graceSeconds:$("graceSeconds"),graceSetting:$("graceSetting"),graceWrap:$("graceWrap"),graceFill:$("graceFill"),graceText:$("graceText"),warning:$("warning"),timer:$("timer"),summaryDialog:$("summaryDialog"),summaryTime:$("summaryTime"),closeSummary:$("closeSummary")};let analyser=null,data=null,classRunning=false,accumulatedMs=0,aboveSince=null,lastFrame=performance.now();const thresholdValue=()=>Number(e.threshold.value),graceMs=()=>Number(e.graceSeconds.value)*1000;function syncSettings(){const t=thresholdValue(),g=Number(e.graceSeconds.value);e.thresholdText.textContent=`${t}%`;e.thresholdSetting.textContent=`${t}%`;e.thresholdLine.style.left=`${t}%`;e.graceSetting.textContent=`${g.toFixed(1)} sec`}syncSettings();e.threshold.addEventListener("input",syncSettings);e.graceSeconds.addEventListener("input",syncSettings);function formatTime(ms){const tenths=Math.floor(ms/100)%10,totalSeconds=Math.floor(ms/1000),seconds=totalSeconds%60,minutes=Math.floor(totalSeconds/60);return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}.${tenths}`}function setWarning(type,text){e.warning.className=`warning ${type||""}`.trim();e.warning.textContent=text;document.body.classList.toggle("loud-mode",type==="loud")}async function enableMicrophone(){
  if(e.micBtn.disabled)return;
  e.micBtn.disabled=true;
  e.micBtn.textContent="Waiting for permission…";
  $("micPromptStatus").textContent="Choose Allow in your browser’s microphone prompt.";
  let stream=null,audioContext=null;
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error("UNAVAILABLE");
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
    audioContext=new(window.AudioContext||window.webkitAudioContext)();
    await audioContext.resume();
    analyser=audioContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.78;
    audioContext.createMediaStreamSource(stream).connect(analyser);data=new Uint8Array(analyser.fftSize);
    e.micDot.classList.add("on");e.micStatus.textContent="Microphone active";
    e.micBtn.textContent="Microphone Enabled";e.startBtn.disabled=false;setWarning("","Ready");
    $("micPromptTitle").textContent="Microphone enabled";
    $("micPromptStatus").textContent="You’re ready. Select Start Class below.";
    $("micPromptDetails").inert=true;
    $("micPromptDetails").setAttribute("aria-hidden","true");
    $("micPrompt").classList.add("is-enabled");
    e.startBtn.focus({preventScroll:true});
    lastFrame=performance.now();startSampling();
  }catch(err){
    if(stream)stream.getTracks().forEach(track=>track.stop());
    if(audioContext)audioContext.close().catch(()=>{});
    analyser=null;data=null;
    e.micBtn.disabled=false;e.micBtn.textContent="Try Enable Microphone Again";
    const denied=err.name==="NotAllowedError";
    const missing=err.name==="NotFoundError";
    $("micPromptStatus").textContent=denied?"Access wasn’t granted. You can try again.":"The microphone couldn’t connect.";
    $("micHelp").textContent=denied?"Allow microphone access in this site’s browser settings, then try again.":missing?"Connect a microphone, then try again.":"Use HTTPS or localhost, check your microphone, then try again.";
    e.micStatus.textContent="Microphone off";setWarning("wait","Microphone access needed");
  }
}
function getNoisePercent(){analyser.getByteTimeDomainData(data);let sum=0;for(const byte of data){const centered=(byte-128)/128;sum+=centered*centered}const rms=Math.sqrt(sum/data.length);return Math.min(100,Math.max(0,rms*829.92))}function startClass(){classRunning=true;aboveSince=null;lastFrame=performance.now();e.startBtn.disabled=true;e.pauseBtn.disabled=false;e.endBtn.disabled=false;setWarning("good","Class running")}function pauseClass(){classRunning=false;aboveSince=null;e.startBtn.disabled=false;e.pauseBtn.disabled=true;e.graceWrap.classList.add("hidden");setWarning("","Paused")}function endClass(){classRunning=false;aboveSince=null;e.startBtn.disabled=false;e.pauseBtn.disabled=true;e.endBtn.disabled=true;e.graceWrap.classList.add("hidden");setWarning("","Class ended");e.summaryTime.textContent=formatTime(accumulatedMs);e.summaryDialog.showModal()}function resetTimer(){if(accumulatedMs>0&&!confirm("Reset the accumulated noise time to zero?"))return;accumulatedMs=0;aboveSince=null;e.timer.textContent=formatTime(accumulatedMs);e.graceWrap.classList.add("hidden");setWarning(classRunning?"good":"",classRunning?"Class running":"Ready")}function loop(now){const gap=now-lastFrame;const delta=gap>2000?0:Math.max(0,gap);if(gap>2000)aboveSince=null;lastFrame=now;const noise=getNoisePercent(),limit=thresholdValue(),isAbove=noise>=limit;e.meterFill.style.width=`${noise}%`;e.noiseLevel.textContent=`${Math.round(noise)}%`;if(!classRunning){e.timer.textContent=formatTime(accumulatedMs);return}if(isAbove){if(aboveSince===null)aboveSince=now;const required=graceMs(),aboveFor=now-aboveSince;if(required>0&&aboveFor<required){e.graceWrap.classList.remove("hidden");const pct=Math.min(100,aboveFor/required*100);e.graceFill.style.width=`${pct}%`;e.graceText.textContent=`${(aboveFor/1000).toFixed(1)} / ${(required/1000).toFixed(1)} sec`;setWarning("wait","Getting loud…")}else{e.graceWrap.classList.add("hidden");accumulatedMs+=delta;setWarning("loud","TOO LOUD — TIMER RUNNING")}}else{aboveSince=null;e.graceWrap.classList.add("hidden");e.graceFill.style.width="0%";setWarning("good","Noise within limit")}e.timer.textContent=formatTime(accumulatedMs);}e.micBtn.addEventListener("click",enableMicrophone);e.startBtn.addEventListener("click",startClass);e.pauseBtn.addEventListener("click",pauseClass);e.endBtn.addEventListener("click",endClass);e.resetBtn.addEventListener("click",resetTimer);e.closeSummary.addEventListener("click",()=>e.summaryDialog.close());e.fullscreenBtn.addEventListener("click",async()=>{try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen();e.fullscreenBtn.textContent="Exit Full Screen"}else{await document.exitFullscreen();e.fullscreenBtn.textContent="Full Screen"}}catch(_){}});document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement)e.fullscreenBtn.textContent="Full Screen"});if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(console.error));

let sampleWorker=null,sampleInterval=null;
function startSampling(){
 if(sampleWorker||sampleInterval)return;
 const tick=()=>{if(analyser)loop(performance.now());window.dispatchEvent(new Event('noise-timer-tick'));};
 try{sampleWorker=new Worker('tick-worker.js');sampleWorker.onmessage=tick;sampleWorker.onerror=()=>{sampleWorker.terminate();sampleWorker=null;if(!sampleInterval)sampleInterval=setInterval(tick,50);};}
 catch(_){sampleInterval=setInterval(tick,50);}
}
