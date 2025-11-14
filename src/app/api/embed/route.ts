import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET() {
  const script = `(function(){
  try{
    var scriptTag = (function(){
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length-1];
    })();

    // Resolve botId from multiple fallbacks: data-* attribute, global config, script src (query or path segment)
    var botId = null;
    if (scriptTag) {
      botId = scriptTag.getAttribute('data-bot-id') || scriptTag.dataset.botId || null;
      // global fallback used when WP strips attributes
      try {
        if (!botId && window.__CHATBOT_EMBED && window.__CHATBOT_EMBED.botId) {
          botId = window.__CHATBOT_EMBED.botId;
          console.warn('Chatbot embed: using botId from window.__CHATBOT_EMBED', botId);
        }
      } catch (e) {}

      // try parsing botId from script src (query param or path segment)
      if (!botId) {
        try {
          var src = scriptTag.src || '';
          var url = new URL(src, window.location.href);
          var maybe = url.searchParams.get('botId') || url.searchParams.get('id') || null;
          if (maybe) {
            botId = maybe;
            console.warn('Chatbot embed: parsed botId from script src query', botId);
          } else {
            var m = src.match(/\/api\/embed\/?([^?#\/]+)/i);
            if (m && m[1]) {
              botId = decodeURIComponent(m[1]);
              console.warn('Chatbot embed: parsed botId from script src path', botId);
            }
          }
        } catch (e) {}
      }
    }

    if(!botId){ console.error('Chatbot embed: missing bot id (provide data-bot-id, ?botId=, path /api/embed/<id> or set window.__CHATBOT_EMBED)'); return; }

    var position = scriptTag && (scriptTag.getAttribute('data-position') || 'bottom-right');
    var openOnLoad = scriptTag && scriptTag.getAttribute('data-open') === 'true';
    var theme = scriptTag && (scriptTag.getAttribute('data-theme') || '');
    var base = (scriptTag && (scriptTag.getAttribute('data-base') || scriptTag.dataset.base)) || (window.__CHATBOT_EMBED && window.__CHATBOT_EMBED.base) || '${BASE}';
    // Normalize base URL and prefer HTTPS when host page is HTTPS to avoid mixed-content blocking
    try {
      var _baseUrl = new URL(base, window.location.href);
      if (window.location.protocol === 'https:' && _baseUrl.protocol === 'http:') {
        console.warn('Chatbot embed: upgrading base to https to avoid mixed-content blocking', base);
        _baseUrl.protocol = 'https:';
      }
      base = _baseUrl.toString();
    } catch (err) {
      // Fallback: force https scheme for typical host:port strings
      try {
        base = base.replace(/^http:\/\//i, 'https://');
      } catch (e) {
        // leave original base if replacement fails
      }
    }

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
    var iframeReady = false;

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
      iframe.style.width = '380px';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px'; // Change from '12px' to '20px' for more rounded corners
      iframe.style.background = 'transparent';
      iframe.style.zIndex = 100000;
      iframe.style.transition = 'all 400ms cubic-bezier(0.2, 0.9, 0.2, 1)';
      iframe.style.overflow = 'hidden';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups');
      iframe.setAttribute('allow','clipboard-read; clipboard-write; microphone; camera');
      document.body.appendChild(iframe);

      function onMessage(e){
        try{
          var originAllowed = (new URL(base)).origin;
          console.log('Received message from:', e.origin, 'expected:', originAllowed, 'data:', e.data);
          
          // Allow localhost/127.0.0.1 interop for development
          var originOk = e.origin === originAllowed || 
                        (originAllowed.includes('localhost') && e.origin.includes('localhost')) ||
                        (originAllowed.includes('127.0.0.1') && e.origin.includes('127.0.0.1'));
          
          if(!originOk) {
            console.warn('Origin mismatch, ignoring message');
            return;
          }
          
          var d = e.data || {};
          if(d && d.type === 'CHATBOT_RESIZE'){
            console.log('CHATBOT_RESIZE received, isOpen:', d.isOpen);
            if(d.isOpen){
              iframe.style.width = d.width || '380px';
              iframe.style.height = d.height || '600px';
              iframe.style.borderRadius = d.cornerRadius || '12px';
              iframe.style.opacity = '1';
              iframe.style.pointerEvents = 'auto';
              console.log('Iframe shown');
            } else {
              iframe.style.opacity = '0';
              iframe.style.pointerEvents = 'none';
              console.log('Iframe hidden');
            }
          }
        }catch(err){console.error('onMessage error:', err);}
      }

      // Add basic load/error handlers to help detect mixed-content or network issues
      iframe.onload = function(){
        try{ 
          console.log('Chatbot embed: iframe loaded', iframe.src);
          iframeReady = true;
          // If user clicked before iframe was ready, open it now
          if(isOpen){
            setTimeout(function(){ 
              try{ iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'EMBED_OPEN' }, (new URL(base)).origin); }catch(e){console.error('postMessage failed:', e);} 
            }, 100);
          }
        }catch(e){console.error('onload handler error:', e);}
      };
      iframe.onerror = function(e){
        try{ console.error('Chatbot embed: iframe failed to load (possible mixed-content or blocked by CSP):', iframe.src, e); }catch(err){}
      };

      window.addEventListener('message', onMessage, false);
      window.addEventListener('beforeunload', function(){ window.removeEventListener('message', onMessage); });
      return iframe;
    }

    function openWidget(){
      console.log('openWidget called, iframeReady:', iframeReady);
      var f = createIframe();
      isOpen = true;
      
      if(iframeReady){
        // Iframe already loaded, send message immediately
        setTimeout(function(){ 
          try{ 
            console.log('Sending EMBED_OPEN to iframe');
            f.contentWindow && f.contentWindow.postMessage({ type: 'EMBED_OPEN' }, (new URL(base)).origin); 
          }catch(e){console.error('postMessage error:', e);} 
        }, 100);
      }
      // else: will be sent in onload handler
    }

    function closeWidget(){
      if(!iframe) return;
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
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
