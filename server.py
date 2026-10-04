import os
import logging
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

from abllib import log

# Initialize logging
log.initialize(log.LogLevel.INFO)
log.add_ablapi_handler(
    os.environ.get("LOG_USER_ID", ""),
    os.environ.get("LOG_TOKEN", ""),
    "ablapi-web"
)

logger = logging.getLogger()

# Map common client-side level names to Python logging levels
_LEVEL_MAP = {
    "error": logging.ERROR,
    "warn": logging.WARNING,
    "warning": logging.WARNING,
    "info": logging.INFO,
    "debug": logging.DEBUG,
}

class LogReceiverHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        logger.info("%s - - %s", self.client_address[0], format % args)

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b""

            # Accept {"message": "...", "level": "..."} or just {"message": "..."}
            data = json.loads(body) if body else {}
            message = data.get("message", "")
            raw_level = data.get("level", "").lower()
            level = _LEVEL_MAP.get(raw_level, logging.INFO)

            logger.log(level, message)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')

        except Exception as e:
            logger.error("Log receive error: %s", e)
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

def main():
    server = HTTPServer(("0.0.0.0", 3001), LogReceiverHandler)
    logger.info(f"Log receiver listening on port {3001}")
    server.serve_forever()

if __name__ == "__main__":
    main()
