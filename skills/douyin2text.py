#!/usr/bin/env python3
"""douyin2text —— 抖音/社媒链接 → 文案（免费本地管线：yt-dlp + faster-whisper）
用法：python3 douyin2text.py <抖音分享链接或任意视频链接> [--model small]
依赖（已装）：ffmpeg(brew)、yt-dlp、faster-whisper(pip --user)
"""
import sys, os, glob, subprocess, tempfile, argparse

def main():
    ap = argparse.ArgumentParser(description='视频链接转文案（本地免费）')
    ap.add_argument('url', help='抖音分享链接（v.douyin.com 短链）/B站/YouTube 等任意 yt-dlp 支持链接')
    ap.add_argument('--model', default='base', help='whisper 模型：base(150MB,默认)/small/medium，越大越准越慢')
    a = ap.parse_args()

    with tempfile.TemporaryDirectory() as d:
        print('⬇ 下载音频（yt-dlp）…', file=sys.stderr)
        r = subprocess.run([sys.executable, '-m', 'yt_dlp', '-x', '--audio-format', 'm4a',
                            '-o', os.path.join(d, 'audio.%(ext)s'), a.url],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print('下载失败：\n' + r.stderr[-800:], file=sys.stderr); sys.exit(1)
        files = glob.glob(os.path.join(d, 'audio.*'))
        if not files:
            print('下载失败：未产出音频文件', file=sys.stderr); sys.exit(1)
        audio = files[0]

        print('🗣 本地转写中（首次运行自动下载模型）…', file=sys.stderr)
        from faster_whisper import WhisperModel
        model = WhisperModel(a.model, device='cpu', compute_type='int8')
        segs, info = model.transcribe(audio, language='zh', vad_filter=True)
        text = ''.join(s.text for s in segs).strip()

        print('\n===== 文案 =====')
        print(text if text else '（未识别到语音内容——可能视频无口播，文案在标题/字幕里）')

if __name__ == '__main__':
    main()
