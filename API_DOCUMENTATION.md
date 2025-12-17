# ICEMAS API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints (except `/auth/login` and `/auth/register`) require JWT authentication.

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST /auth/login
Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### GET /auth/profile
Get current user profile (requires auth).

**Response:**
```json
{
  "id": 1,
  "email": "john@example.com",
  "name": "John Doe"
}
```

---

## Clientes Endpoints

### GET /clientes?search=term
Search clients by name, empresa, or telefono.

**Query Parameters:**
- `search` (required): Search term

**Response:**
```json
[
  {
    "idCliente": 1,
    "nombre": "Cliente Test",
    "empresa": "Test SA",
    "telefono": "9991234567",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /clientes
Create a new client.

**Request:**
```json
{
  "nombre": "Cliente Nuevo",
  "empresa": "Empresa SA",
  "telefono": "9991234567"
}
```

### GET /clientes/:id
Get client by ID with sucursales relationship.

### PUT /clientes/:id
Update client.

### DELETE /clientes/:id
Delete client.

### GET /clientes/autocomplete?term=search
Autocomplete for client selection (max 10 results).

**Response:**
```json
[
  {
    "value": 1,
    "label": "Cliente Test - Test SA"
  }
]
```

### GET /clientes/check-nombre?nombre=name
Check if client name exists.

**Response:**
```json
{
  "exists": true
}
```

### GET /clientes/:id/sucursales
Get all sucursales for a specific client.

---

## Sucursales Endpoints

### GET /sucursales?idCliente=1
Get all sucursales, optionally filtered by client.

### POST /sucursales
Create new sucursal.

**Request:**
```json
{
  "idCliente": 1,
  "nombre": "Sucursal Centro",
  "direccion": "Calle Principal #123",
  "telefono": "9991234567",
  "contacto": "Juan Pérez"
}
```

### GET /sucursales/por-cliente/:id
Get sucursales by client ID (for cascading selects).

### GET /sucursales/:id/equipos
Get all equipos in a sucursal.

---

## Equipos Endpoints

### GET /equipos
Get equipos with advanced filtering.

**Query Parameters:**
- `nombre`: Filter by equipment name (LIKE)
- `marca`: Filter by brand name (LIKE)
- `serie`: Filter by serial number (LIKE)
- `tipo`: Filter by equipment type (LIKE)
- `cliente`: Filter by client name (LIKE)
- `estado`: Filter by status (exact match)

**Example:**
```
GET /equipos?marca=Carrier&estado=1&cliente=VIPS
```

### POST /equipos
Create new equipment.

**Request:**
```json
{
  "nombre": "Minisplit",
  "modelo": "38MAQB18",
  "descripcion": "Minisplit 1.5 Ton",
  "idMarca": 1,
  "idTipo": 2,
  "idCliente": 5,
  "idSucursal": 10,
  "estado": 1,
  "serie": "ABC123456"
}
```

### POST /equipos/ajax
Same as POST /equipos, for AJAX modal creation.

### GET /equipos/autocomplete/nombre?term=search
Autocomplete equipment names.

### GET /equipos/autocomplete/serie?term=search
Autocomplete serial numbers.

### GET /equipos/por-sucursal/:id
Get all equipos in a specific sucursal.

### Marcas Endpoints

#### GET /equipos/marcas
Get all brands.

#### POST /equipos/marcas
Create new brand.

**Request:**
```json
{
  "nombre": "Carrier",
  "descripcion": "Marca de aires acondicionados"
}
```

#### GET /equipos/marcas/check-nombre?nombre=name
Check if brand name exists.

### Tipos Endpoints

#### GET /equipos/tipos
Get all equipment types.

#### POST /equipos/tipos
Create new equipment type.

---

## Servicios Endpoints

### GET /servicios
Get servicios with advanced filtering.

**Query Parameters:**
- `idServicio`: Filter by service ID
- `fechaInicio`: Start date (YYYY-MM-DD)
- `fechaFin`: End date (YYYY-MM-DD)
- `cliente`: Client name (LIKE)
- `equipo`: Equipment name (LIKE)
- `serie`: Serial number (LIKE)
- `estado`: Service status (exact)
- `detalle`: Work detail (LIKE)

**Example:**
```
GET /servicios?fechaInicio=2024-01-01&fechaFin=2024-12-31&estado=Completado
```

**Response:**
```json
[
  {
    "idServicio": 1,
    "folio": "SRV-001",
    "fechaServicio": "2024-01-15",
    "estado": "Completado",
    "cliente": { "nombre": "Cliente Test" },
    "equipo": { "nombre": "Minisplit", "serie": "ABC123" },
    "tecnico": { "nombre": "Juan Técnico" },
    "lastModifiedBy": { "name": "Admin User" }
  }
]
```

### POST /servicios
Create new service (auto-sets lastUser_id from JWT).

**Request:**
```json
{
  "idTecnico": 1,
  "idTipoServicio": 2,
  "idCliente": 5,
  "idSucursal": 10,
  "idEquipo": 15,
  "fechaServicio": "2024-01-15",
  "folio": "SRV-001",
  "estado": "Pendiente",
  "descripcion": "Mantenimiento preventivo",
  "detalleTrabajo": "Se realizó limpieza de filtros..."
}
```

### GET /servicios/pendientes
Get all pending services.

### GET /servicios/en-proceso
Get all in-progress services.

### GET /servicios/completados
Get all completed services.

### GET /servicios/cancelados
Get all cancelled services.

### POST /servicios/:id/firma
Save digital signature for service.

**Request:**
```json
{
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Firma guardada correctamente",
  "filename": "firma_1_1234567890.png"
}
```

### GET /servicios/autocomplete/id?term=search
Autocomplete service ID or folio.

### GET /servicios/autocomplete/cliente?term=search
Autocomplete client names from services.

### Tipos Servicio

#### GET /servicios/tipos
Get all service types.

#### POST /servicios/tipos
Create new service type.

---

## Técnicos Endpoints

### GET /tecnicos
Get all technicians.

**Response:**
```json
[
  {
    "idTecnico": 1,
    "nombre": "Juan Técnico",
    "telefono": "9991234567",
    "email": "juan@tecnico.com",
    "especialidad": "Refrigeración",
    "activo": 1,
    "firma": "firma_tecnico_1_1234567890.png"
  }
]
```

### POST /tecnicos
Create new technician.

**Request:**
```json
{
  "nombre": "Pedro Técnico",
  "telefono": "9997654321",
  "email": "pedro@tecnico.com",
  "especialidad": "Aires Acondicionados",
  "activo": 1
}
```

### POST /tecnicos/:id/firma
Save technician's signature.

**Request:**
```json
{
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 404,
  "message": "Cliente with ID 999 not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Validation

All DTOs are validated using class-validator. Common validation errors:

**Example Error:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```
