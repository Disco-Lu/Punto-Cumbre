# Punto Cumbre API — Backend

API REST para la plataforma de arriendo de equipos de montaña **Punto Cumbre**.

## Requisitos

- Python 3.11+
- PostgreSQL (Supabase u otra instancia compatible)

## Instalación

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt
```

## Configuración

1. Copiar el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Editar `.env` con las credenciales de tu base de datos y demás configuraciones.

## Ejecución

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La documentación interactiva estará disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py           # Punto de entrada de la aplicación FastAPI
│   ├── config.py          # Configuración con pydantic-settings
│   ├── database.py        # Motor async de SQLAlchemy
│   ├── dependencies.py    # Inyección de dependencias
│   ├── models/            # Modelos ORM (SQLAlchemy)
│   ├── schemas/           # Esquemas Pydantic (request/response)
│   ├── routers/           # Rutas de la API
│   │   └── admin/         # Rutas protegidas de administración
│   ├── services/          # Lógica de negocio
│   └── utils/             # Utilidades
├── requirements.txt
├── .env.example
└── README.md
```
