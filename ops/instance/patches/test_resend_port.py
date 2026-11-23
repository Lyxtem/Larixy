import socket

for port in [465, 587]:
    try:
        s = socket.create_connection(('smtp.resend.com', port), timeout=5)
        print(f"Port {port}: OPEN")
        s.close()
    except Exception as e:
        print(f"Port {port}: ERROR {e}")
