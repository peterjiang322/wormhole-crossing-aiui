import wx from 'wx';

export function estimateSpeechDuration(text, rate) {
  var contentLength = String(text || '').length;
  var safeRate = typeof rate === 'number' && rate > 0 ? rate : 1;
  return Math.max(900, Math.ceil(contentLength / (4.5 * safeRate)) * 1000);
}

export function createTtsRuntime() {
  var completionTimer = null;
  var completionGeneration = 0;

  function clearPendingCompletion() {
    completionGeneration += 1;
    if (completionTimer !== null) {
      clearTimeout(completionTimer);
      completionTimer = null;
    }
  }

  function speak(text, options) {
    var opts = options || {};
    var content = String(text || '').trim();
    if (!content) {
      return false;
    }

    clearPendingCompletion();
    var generation = completionGeneration;
    var lang = opts.lang || 'en-US';
    var rate = typeof opts.rate === 'number' && opts.rate > 0 ? opts.rate : 0.9;
    var started = false;

    try {
      if (
        typeof speechSynthesis !== 'undefined' &&
        typeof SpeechSynthesisUtterance !== 'undefined'
      ) {
        var utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = typeof opts.pitch === 'number' ? opts.pitch : 1;
        utterance.volume = typeof opts.volume === 'number' ? opts.volume : 1;
        speechSynthesis.speak(utterance);
        started = true;
      }
    } catch (error) {
      started = false;
    }

    if (!started) {
      try {
        // AIUI 文档约定：无法创建播报请求时返回空字符串。
        started = !!(wx && wx.speech && wx.speech.playTTS(content));
      } catch (fallbackError) {
        started = false;
      }
    }

    if (started && typeof opts.onDone === 'function') {
      completionTimer = setTimeout(function() {
        completionTimer = null;
        if (generation === completionGeneration) {
          opts.onDone();
        }
      }, estimateSpeechDuration(content, rate));
    }

    return started;
  }

  return { speak: speak, clearPendingCompletion: clearPendingCompletion };
}

// 单页面可直接导入；多个页面可能并存时，每页调用 createTtsRuntime() 单独持有。
var defaultRuntime = createTtsRuntime();
export var speak = defaultRuntime.speak;
export var clearPendingCompletion = defaultRuntime.clearPendingCompletion;
