import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET() {
  const script = `(function(){
  try{
    var scriptTag = (function(){
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length-1];
    })();

    var botId = scriptTag && (scriptTag.getAttribute('data-bot-id') || scriptTag.dataset.botId);
    if(!botId){ console.error('Chatbot embed: missing data-bot-id'); return; }

    var position = scriptTag.getAttribute('data-position') || 'bottom-right';
    var openOnLoad = scriptTag.getAttribute('data-open') === 'true';
    var theme = scriptTag.getAttribute('data-theme') || '';
    var base = scriptTag.getAttribute('data-base') || '${BASE}';

    var container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.zIndex = 100000;
    container.style.bottom = '20px';
    container.style.right = position === 'bottom-left' ? 'auto' : '20px';
    container.style.left = position === 'bottom-left' ? '20px' : 'auto';
    container.style.pointerEvents = 'auto';
    document.body.appendChild(container);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label','Open chat');
    btn.style.width = '64px';
    btn.style.height = '64px';
    btn.style.borderRadius = '50%';
    btn.style.border = '0';
    btn.style.cursor = 'pointer';
    btn.style.background = '#ff6f61';
    btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.color = 'white';
    btn.innerHTML = '\u{1F4AC}';
    container.appendChild(btn);

    var iframe = null;
    var isOpen = false;

    function createIframe(){
      if(iframe) return iframe;
      iframe = document.createElement('iframe');
      iframe.src = base + '/chatbot/' + encodeURIComponent(botId) + (theme ? '?theme=' + encodeURIComponent(theme) : '');
      iframe.id = 'chatbot-embed-' + botId;
      iframe.title = 'AI Chat';
      iframe.style.position = 'fixed';
      iframe.style.bottom = '20px';
      iframe.style.right = position === 'bottom-left' ? 'auto' : '20px';
      iframe.style.left = position === 'bottom-left' ? '20px' : 'auto';
      iframe.style.width = '80px';
      iframe.style.height = '80px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '24px';
      iframe.style.background = 'transparent';
      iframe.style.zIndex = 100000;
      iframe.style.transition = 'all 300ms ease';
      iframe.style.overflow = 'hidden';
      iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups');
      iframe.setAttribute('allow','clipboard-read; clipboard-write; microphone; camera');
      document.body.appendChild(iframe);

      function onMessage(e){
        try{
          var originAllowed = (new URL(base)).origin;
          if(e.origin !== originAllowed) return;
          var d = e.data || {};
          if(d && d.type === 'CHATBOT_RESIZE'){
            if(d.isOpen){
              iframe.style.width = d.width || '380px';
              iframe.style.height = d.height || '600px';
              iframe.style.borderRadius = d.cornerRadius || '12px';
            } else {
              iframe.style.width = '80px';
              iframe.style.height = '80px';
              iframe.style.borderRadius = '50%';
            }
          }
        }catch(err){/* ignore */}
      }

      window.addEventListener('message', onMessage, false);
      window.addEventListener('beforeunload', function(){ window.removeEventListener('message', onMessage); });
      return iframe;
    }

    function openWidget(){
      var f = createIframe();
      f.style.width = '380px';
      f.style.height = '600px';
      f.style.borderRadius = '12px';
      isOpen = true;
      setTimeout(function(){ try{ f.contentWindow && f.contentWindow.postMessage({ type: 'EMBED_OPEN' }, (new URL(base)).origin); }catch(e){} }, 200);
    }

    function closeWidget(){
      if(!iframe) return;
      iframe.style.width = '80px';
      iframe.style.height = '80px';
      iframe.style.borderRadius = '50%';
      isOpen = false;
      try{ iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'EMBED_CLOSE' }, (new URL(base)).origin); }catch(e){}
    }

    btn.addEventListener('click', function(){ if(!iframe || !isOpen) openWidget(); else closeWidget(); });
    if(openOnLoad) setTimeout(openWidget, 350);

    window.ChatbotEmbed = window.ChatbotEmbed || {};
    window.ChatbotEmbed[botId] = { open: openWidget, close: closeWidget };

  }catch(err){ console.error('Chatbot embed loader error:', err); }
})();`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
