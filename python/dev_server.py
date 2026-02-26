from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer

PORT = 8000

if __name__ == "__main__":
    with TCPServer(("", PORT), SimpleHTTPRequestHandler) as httpd:
        print(f"Serving on http://localhost:{PORT}")
        httpd.serve_forever()
