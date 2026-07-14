"""Minimal static server that never calls os.getcwd() (sandbox-safe)."""
import http.server
import socketserver

DIRECTORY = "/Users/box/Desktop/Claude Code/Website July 2026"
PORT = 5511


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, *args):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.serve_forever()
