"""
Servidor de desarrollo de ReportaCampus.

    python run.py           -> http://localhost:5000

Sirve la API en /api y el frontend en /. Para producción se usa un
servidor WSGI (por ejemplo: gunicorn "run:app" o waitress-serve run:app).
"""
import os

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(os.environ.get('PUERTO', 5000)), debug=False)
