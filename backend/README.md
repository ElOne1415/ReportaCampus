# Backend de ReportaCampus

API REST en Python con Flask y SQLAlchemy. También entrega el frontend en `/`.

```bash
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # y cambia SECRET_KEY
python run.py                                         # http://localhost:5000
```

| Comando | Para qué |
|---|---|
| `python run.py` | Servidor de desarrollo (API + frontend). |
| `flask --app run semilla` | Borra la base y carga los datos de demostración. |
| `python -m app.esquema > sql/esquema-sqlserver.sql` | Regenera el script SQL de SQL Server. |
| `pip install -r requirements-dev.txt && pytest` | Pruebas (33). |
| `gunicorn "run:app"` | Servidor para producción. |

Configuración, endpoints, base de datos, seguridad y despliegue: [manual técnico](../documentacion/manual_tecnico/manual-tecnico.md).
