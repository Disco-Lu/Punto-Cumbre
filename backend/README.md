# 🏔️ Punto Cumbre — Backend API

API REST construida con **FastAPI**, **SQLAlchemy 2.0 (asíncrono)** y **PostgreSQL (Supabase)**, implementada bajo la metodología **SDD (Specification-Driven Development)** y principios de **Green Software**.

---

## 🌿 Principios de Green Software Aplicados

1. **Serializador de ultra baja huella:** Se utiliza `orjson` como clase de respuesta por defecto (Rust core), reduciendo entre 5x y 10x los ciclos de CPU y consumo de memoria en la serialización JSON.
2. **Concurrencia Asíncrona Pura:** Manejo de I/O no bloqueante con `asyncpg` y un solo bucle de eventos, minimizando cambios de contexto en el procesador.
3. **Connection Pooling Estricto:** Reutilización de sockets TCP/TLS con Supabase (`pool_size=5`, `max_overflow=10`, `pool_pre_ping=True`) para evitar handshakes SSL repetitivos.
4. **Caché en memoria de Configuración:** `@lru_cache` para variables de entorno (`.env`), evitando lecturas redundantes a disco.
5. **Gestor de Ciclo de Vida Limpio (Lifespan):** Cierre y liberación automática de descriptores de sockets al apagar el servicio.

---

## 🚀 Requisitos de Ejecución

- **Python 3.11 o superior** (o Docker Desktop).
- Cuenta/Base de datos en **Supabase** (PostgreSQL).

---

## 📦 Puesta en Marcha Local

### Opción A: Con Python y Entorno Virtual

1. **Crear y activar el entorno virtual:**
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurar variables de entorno:**
   ```bash
   # Copiar el archivo plantilla
   cp .env.example .env
   ```
   *Edita `.env` con la cadena de conexión de Supabase y tu secreto JWT.*

4. **Iniciar el servidor de desarrollo:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

---

### Opción B: Con Docker / Docker Compose

Si prefieres correr el backend en un contenedor ligero (`python:3.12-slim`):

```bash
docker compose up --build
```

---

## 🔍 Verificación y Documentación Interactiva

Una vez que el servidor esté corriendo:

- **Health Check (Diagnóstico):** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Documentación Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Documentación ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Contrato OpenAPI JSON:** [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

---

## 👩‍💻 Instrucciones para tu compañera (Frontend Next.js)

Para que tu compañera consuma esta API con tipos TypeScript 100% seguros derivados del contrato SDD:

1. Ubicarse en su proyecto de frontend.
2. Ejecutar `openapi-typescript` apuntando a la especificación oficial del proyecto:
   ```bash
   npx openapi-typescript ../specs/openapi.yaml -o src/types/api.ts
   ```
3. Todas las interfaces (`Category`, `Equipment`, `Quote`, `Reservation`, etc.) quedarán autogeneradas sin tener que escribirlas a mano.
4. En su archivo `.env.local` debe configurar:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
