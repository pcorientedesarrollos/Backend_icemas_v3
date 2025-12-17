# ✅ Resumen de Creación de Base de Datos - ICEMAS v3

## 🎯 Estado Actual

**✅ COMPLETADO** - Base de datos lista para usar

## 📋 Archivos Creados

### 1. **database/schema.sql** 
Script SQL completo con:
- ✅ 10 tablas principales
- ✅ Todas las foreign keys y relaciones
- ✅ Índices optimizados para búsquedas
- ✅ Datos iniciales (marcas, tipos de equipo, tipos de servicio)
- ✅ Vista "vista_servicios_completa" para consultas desnormalizadas

### 2. **database/README.md**
Documentación completa con:
- ✅ Instrucciones de instalación
- ✅ 4 opciones diferentes para crear las tablas
- ✅ Queries de verificación
- ✅ Troubleshooting

### 3. **src/scripts/create-admin.ts**
Script para crear usuario administrador

## 🗄️ Estructura de la Base de Datos

### Tablas Creadas (10):

| # | Tabla | Descripción | Registros Iniciales |
|---|-------|-------------|---------------------|
| 1 | `users` | Usuarios del sistema | 1 (admin) |
| 2 | `clientes` | Empresas/personas | 0 |
| 3 | `sucursales` | Ubicaciones de clientes | 0 |
| 4 | `marcas` | Catálogo de marcas | 5 |
| 5 | `tipos_equipo` | Tipos de equipos | 5 |
| 6 | `equipos` | Inventario de equipos | 0 |
| 7 | `tecnicos` | Personal técnico | 0 |
| 8 | `tipos_servicio` | Tipos de servicios | 5 |
| 9 | `servicios` | Órdenes de trabajo | 0 |
| 10 | `fotos_servicio` | Fotos de servicios | 0 |

### Relaciones Configuradas:

```
users (1) ──────► (N) servicios [lastUser_id]

clientes (1) ────► (N) sucursales
           │
           ├─────► (N) equipos
           │
           └─────► (N) servicios

sucursales (1) ──► (N) equipos
             │
             └───► (N) servicios

marcas (1) ──────► (N) equipos

tipos_equipo (1) ► (N) equipos

equipos (1) ─────► (N) servicios

tecnicos (1) ────► (N) servicios

tipos_servicio (1) ► (N) servicios

servicios (1) ───► (N) fotos_servicio
```

## 🚀 Cómo Crear las Tablas

### Opción 1: Sincronización Automática con TypeORM (Recomendado para Desarrollo)

El backend ya está configurado. Solo necesitas:

1. **Configurar tu archivo `.env`:**
   ```env
   DB_TYPE=mysql
   DB_HOST=localhost  # o tu servidor MySQL
   DB_PORT=3306
   DB_USER=root  # tu usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=icemas
   DB_SYNCHRONIZE=true  # ⚠️ Solo en desarrollo
   DB_LOGGING=true
   ```

2. **Iniciar el backend:**
   ```bash
   cd backend_icemas
   npm run start:dev
   ```

3. **TypeORM creará automáticamente todas las tablas** basándose en las entidades definidas en el código.

### Opción 2: Ejecutar el Script SQL Manualmente

```bash
# Conectarse a MySQL
mysql -u tu_usuario -p

# Crear la base de datos
CREATE DATABASE icemas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE icemas;

# Ejecutar el script
source database/schema.sql;

# O en una sola línea:
mysql -u tu_usuario -p icemas < database/schema.sql
```

### Opción 3: Desde phpMyAdmin

1. Crea la base de datos `icemas`
2. Selecciónala
3. Ve a SQL
4. Pega el contenido de `database/schema.sql`
5. Ejecuta

## 👤 Usuario Administrador

**Credenciales creadas:**
- **Email:** admin@icemas.com  
- **Contraseña:** Admin123!

Para recrear o verificar:
```bash
cd backend_icemas
npx ts-node src/scripts/create-admin.ts
```

## 📊 Datos Iniciales Incluidos

### Marcas (5):
- Carrier - Líder mundial en sistemas de climatización
- Trane - Especialista en soluciones de aire acondicionado
- York - Marca reconocida de equipos HVAC
- Rheem - Fabricante de equipos de climatización
- Lennox - Sistemas de calefacción y refrigeración

### Tipos de Equipo (5):
- Aire Acondicionado
- Caldera
- Chiller
- Manejadora de Aire
- Compresor

### Tipos de Servicio (5):
- Mantenimiento Preventivo
- Mantenimiento Correctivo
- Instalación
- Diagnóstico
- Emergencia

## ✅ Verificación

Ejecuta estas queries para verificar:

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Contar registros en catálogos
SELECT 'marcas' AS tabla, COUNT(*) AS registros FROM marcas
UNION ALL SELECT 'tipos_equipo', COUNT(*) FROM tipos_equipo
UNION ALL SELECT 'tipos_servicio', COUNT(*) FROM tipos_servicio
UNION ALL SELECT 'users', COUNT(*) FROM users;

-- Ver estructura de servicios (tabla principal)
DESCRIBE servicios;

-- Ver relaciones de foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME IS NOT NULL 
  AND TABLE_SCHEMA = 'icemas'
ORDER BY TABLE_NAME;
```

## 🔧 Configuración Actual del Backend

El archivo `app.module.ts` está configurado así:

```typescript
TypeOrmModule.forRoot({
  type: process.env.DB_TYPE as any || 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'icemas',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',  // ⚠️
  logging: process.env.DB_LOGGING === 'true',
})
```

## ⚠️ Advertencias Importantes

1. **`DB_SYNCHRONIZE=true`**  
   - ✅ **Desarrollo:** Útil para crear/actualizar tablas automáticamente
   - ❌ **Producción:** NUNCA uses esto en producción, puede causar pérdida de datos
   - 💡 **Alternativa:** Usa migraciones de TypeORM en producción

2. **Foreign Keys**
   - `ON DELETE CASCADE`: Elimina registros relacionados automáticamente
   - `ON DELETE RESTRICT`: Previene eliminación si hay relaciones
   - `ON DELETE SET NULL`: Establece NULL en registros relacionados

3. **Charset utf8mb4**
   - Soporta emojis y caracteres especiales
   - Necesario para nombres con acentos y símbolos

## 📝 Próximos Pasos

1. ✅ Tablas creadas
2. ✅ Datos iniciales insertados
3. ✅ Usuario admin creado
4. 🔄 **Siguiente:** Probar login y navegación en el frontend
5. 🔄 **Siguiente:** Crear clientes, sucursales y equipos de prueba

## 🐛 Problemas Comunes

### "Access denied for user"
- Verifica usuario y contraseña en `.env`
- Asegúrate de que MySQL está corriendo
- Verifica permisos del usuario

### "Unknown database 'icemas'"
- Crea la base de datos: `CREATE DATABASE icemas;`
- O deja que TypeORM la cree (si tiene permisos)

### "Cannot add foreign key constraint"
- Ejecuta el script SQL completo en orden
- Verifica que no falten tablas
- Comprueba tipos de datos compatibles

### Tablas vacías después de sincronizar
- Los datos iniciales solo están en `schema.sql`
- Ejecuta el script SQL para insertar marcas, tipos, etc.
- O créalos manualmente desde el frontend

## 📚 Documentación Adicional

- [database/README.md](./database/README.md) - Instrucciones detalladas
- [database/schema.sql](./database/schema.sql) - Script SQL completo
- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) - Documentación de endpoints

## ✨ Características del Schema

- ✅ 10 tablas normalizadas
- ✅ 15+ foreign keys configuradas
- ✅ 20+ índices para optimización
- ✅ Seguimiento de auditoría (lastUser_id)
- ✅ Timestamps automáticos
- ✅ Vista desnormalizada para reportes
- ✅ Datos de catálogos listos para usar
- ✅ Restricciones de integridad referencial

---

**Fecha de Creación:** 16 de Diciembre 2024  
**Versión:** 3.0  
**Motor:** MySQL 8.0 / MariaDB 10.x
