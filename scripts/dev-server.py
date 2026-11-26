"""Lokale preview met schone URL's, zoals Vercel (cleanUrls): /dakwerken serveert dakwerken.html.
Start: python3 scripts/dev-server.py [poort]"""
import http.server, os, sys
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        pad = super().translate_path(path)
        if not os.path.exists(pad) and os.path.exists(pad.rstrip('/') + '.html'):
            return pad.rstrip('/') + '.html'
        return pad

poort = int(sys.argv[1]) if len(sys.argv) > 1 else 4620
http.server.ThreadingHTTPServer(('', poort), partial(Handler, directory=ROOT)).serve_forever()
