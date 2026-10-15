#!/usr/bin/env python3
"""Local-only JARVIS web server and llama.cpp chat proxy. Python standard library only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from pathlib import Path
import json

HOST = "127.0.0.1"
PORT = 8000
MODEL_URL = "http://127.0.0.1:8080/v1/chat/completions"
ROOT = Path(__file__).resolve().parent

class JarvisHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_error(404, "Not found")
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 1_000_000:
                self.send_error(413, "Request body too large or empty")
                return
            payload = self.rfile.read(length)
            # Only forward chat-completion requests to the local model server.
            parsed = json.loads(payload.decode("utf-8"))
            if not isinstance(parsed, dict) or not isinstance(parsed.get("messages"), list):
                self.send_error(400, "Expected a chat-completions JSON body")
                return
            req = Request(MODEL_URL, data=payload, headers={"Content-Type": "application/json"}, method="POST")
            with urlopen(req, timeout=180) as response:
                body = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", response.headers.get("Content-Type", "application/json"))
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
        except HTTPError as exc:
            body = exc.read()
            self.send_response(exc.code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (URLError, TimeoutError, OSError) as exc:
            body = json.dumps({"error": "Local model server not reachable. Start llama-server on 127.0.0.1:8080 first.", "detail": str(exc)}).encode()
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (ValueError, json.JSONDecodeError):
            self.send_error(400, "Invalid JSON")

    def log_message(self, fmt, *args):
        print("[JARVIS] " + (fmt % args))

if __name__ == "__main__":
    print("JARVIS UI: http://127.0.0.1:8000")
    print("Local model API expected at: " + MODEL_URL)
    print("This server binds to localhost only; keep it that way.")
    ThreadingHTTPServer((HOST, PORT), JarvisHandler).serve_forever()
