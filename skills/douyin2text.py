#!/usr/bin/env python3
"""douyin2text —— 抖音/社媒链接 → 文案（免费本地管线：yt-dlp + faster-whisper）
用法：python3 douyin2text.py <抖音分享链接或任意视频链接> [--model small]
依赖（已装）：ffmpeg(brew)、yt-dlp(python3.12)、faster-whisper(pip --user)
下载三通道：①yt-dlp 直下 ②借浏览器 cookie ③分享页解析（yt-dlp 的
"Fresh cookies" 报错对抖音是误导——真死因是 a_bogus 签名过期，社区实证
绕行路 = 请求 iesdouyin.com/share/video/{id} 解析 _ROUTER_DATA 拿真实直链）
"""
import sys, os, glob, re, json, subprocess, tempfile, argparse, urllib.request
os.environ.setdefault('HF_ENDPOINT', 'https://hf-mirror.com')  # HuggingFace 国内镜像，模型下载不走它必超时

UA_PC = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
         'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
UA_MOBILE = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
             'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
UA = UA_PC  # 默认桌面 UA；分享页解析用 UA_MOBILE

def _pyexe():
    """优先新版解释器（yt-dlp 2025.11+ 不再支持 3.9），找不到退回当前 python"""
    for p in ('python3.12', 'python3.13', 'python3.14'):
        r = subprocess.run([p, '-c', 'import yt_dlp'], capture_output=True)
        if r.returncode == 0:
            return p
    return sys.executable

PY = _pyexe()

def try_download(url, d, cookie_browser=None):
    """下载音频；cookie_browser=None 先裸试，失败通常返回码非 0"""
    cmd = [PY, '-m', 'yt_dlp', '-x', '--audio-format', 'm4a',
           '-o', os.path.join(d, 'audio.%(ext)s')]
    if cookie_browser:
        cmd += ['--cookies-from-browser', cookie_browser]
    cmd.append(url)
    return subprocess.run(cmd, capture_output=True, text=True)

def _douyin_cookie_hdr():
    """借 yt-dlp 的 Chrome cookie 解密能力（复用其钥匙串机制）拼 Cookie 头"""
    sys.path.insert(0, subprocess.run([PY, '-c',
        'import yt_dlp,os;print(os.path.dirname(yt_dlp.__file__))'],
        capture_output=True, text=True).stdout.strip())
    from yt_dlp.cookies import extract_cookies_from_browser
    jar = extract_cookies_from_browser('chrome')
    parts = [f'{c.name}={c.value}' for c in jar
             if 'douyin' in (c.domain or '') or 'bytedance' in (c.domain or '')]
    return '; '.join(parts)

def _find_item_list(node):
    """递归找第一个含非空 item_list 的节点，返回 item_list[0]"""
    if isinstance(node, dict):
        il = node.get('item_list')
        if isinstance(il, list) and il:
            return il[0]
        for v in node.values():
            r = _find_item_list(v)
            if r: return r
    elif isinstance(node, list):
        for v in node:
            r = _find_item_list(v)
            if r: return r
    return None

def share_page_download(url, d):
    """③分享页解析通道：短链→视频id→分享页 _ROUTER_DATA→直链 mp4→抽音频"""
    hdr_base = {'User-Agent': UA, 'Referer': 'https://www.douyin.com/'}
    try:
        hdr_base['Cookie'] = _douyin_cookie_hdr()
    except Exception as e:
        print(f'⚠ 借 Chrome cookie 失败（{e}），裸试分享页', file=sys.stderr)

    # 短链→最终 URL→视频 id
    req = urllib.request.Request(url if 'douyin.com' in url else url, headers=hdr_base)
    final = urllib.request.urlopen(req, timeout=20).geturl()
    m = re.search(r'video/(\d+)', final)
    if not m:
        return None, None
    vid = m.group(1)

    # 分享页 HTML 里的 _ROUTER_DATA（必须手机 UA 才吐 SSR 数据，桌面 UA 只有 JS 壳）
    mob_hdr = dict(hdr_base, **{'User-Agent': UA_MOBILE})
    page = urllib.request.urlopen(urllib.request.Request(
        f'https://www.iesdouyin.com/share/video/{vid}/', headers=mob_hdr), timeout=20)
    html = page.read().decode('utf-8', 'ignore')
    m = re.search(r'window\._ROUTER_DATA\s*=\s*(\{.*?\})\s*</script>', html, re.S)
    if not m:
        return None, None
    data = json.loads(m.group(1))
    item = _find_item_list(data)
    if not item:
        return None, None
    desc = item.get('desc', '')
    pa = (item.get('video') or {}).get('play_addr') or {}
    play = (pa.get('url_list') or [None])[0] or \
        (f'https://www.iesdouyin.com/aweme/v1/play/?video_id={pa.get("uri","")}'
         if pa.get('uri') else None)
    if not play:
        return None, None

    # 直链下 mp4（签名有时效，尽快用）
    tmp_mp4 = os.path.join(d, 'video.mp4')
    req2 = urllib.request.Request(play, headers=hdr_base)
    with urllib.request.urlopen(req2, timeout=60) as r, open(tmp_mp4, 'wb') as f:
        f.write(r.read())
    if os.path.getsize(tmp_mp4) < 100_000:
        return None, None
    audio = os.path.join(d, 'audio.m4a')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp_mp4,
                    '-vn', '-c:a', 'aac', audio], check=True, capture_output=True)
    return audio, desc

def main():
    ap = argparse.ArgumentParser(description='视频链接转文案（本地免费）')
    ap.add_argument('url', help='抖音分享链接（v.douyin.com 短链）/B站/YouTube 等任意 yt-dlp 支持链接')
    ap.add_argument('--model', default='base', help='whisper 模型：base(150MB,默认)/small/medium，越大越准越慢')
    ap.add_argument('--cookies', default='auto', help='cookie 来源：auto(默认，裸试失败自动借浏览器)/firefox/chrome/edge/none')
    a = ap.parse_args()

    with tempfile.TemporaryDirectory() as d:
        print('⬇ 下载音频（yt-dlp）…', file=sys.stderr)
        r = try_download(a.url, d)
        if r.returncode != 0 and a.cookies != 'none':
            browsers = [a.cookies] if a.cookies != 'auto' else ['firefox', 'chrome', 'edge']
            for b in browsers:
                print(f'⚠ 直接下载被拒（反爬/需 cookie），改借 {b} 浏览器 cookie 重试…（首次会弹钥匙串授权，请点允许）', file=sys.stderr)
                r = try_download(a.url, d, cookie_browser=b)
                if r.returncode == 0: break
        audio, desc = None, ''
        files = glob.glob(os.path.join(d, 'audio.*'))
        if files:
            audio = files[0]
        elif 'douyin' in a.url:
            print('⚠ yt-dlp 全通道被拒（抖音 a_bogus 签名过期，已知回归），切分享页解析通道…', file=sys.stderr)
            audio, desc = share_page_download(a.url, d)
        if not audio:
            print('下载失败：\n' + (r.stderr[-800:] if r else ''), file=sys.stderr); sys.exit(1)

        print('🗣 本地转写中（首次运行自动下载模型）…', file=sys.stderr)
        from faster_whisper import WhisperModel
        model = WhisperModel(a.model, device='cpu', compute_type='int8')
        segs, info = model.transcribe(audio, language='zh', vad_filter=True)
        text = ''.join(s.text for s in segs).strip()

        print('\n===== 视频标题 =====\n' + (desc or '（无）'))
        print('\n===== 口播文案 =====')
        print(text if text else '（未识别到语音内容——可能视频无口播，文案在标题/字幕里）')

if __name__ == '__main__':
    main()
