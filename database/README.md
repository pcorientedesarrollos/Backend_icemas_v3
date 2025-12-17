# Base de Datos ICEMAS

Este directorio contiene los scripts y configuración de la base de datos del sistema ICEMAS v3.

## Archivos

- **`schema.sql`**: Script completo de creación de tablas con datos iniciales
- **`README.md`**: Este archivo con instrucciones

## Estructura de la Base de Datos

### Tablas Principales (10 tablas):

1. **users** - Usuarios del sistema con autenticación
2. **clientes** - Empresas o personas que contratan servicios  
3. **sucursales** - Ubicaciones físicas de los clientes
4. **marcas** - Catálogo de marcas de equipos
5. **tipos_equipo** - Catálogo de tipos/categorías de equipos
6. **equipos** - Inventario de equipos de clientes
7. **tecnicos** - Personal técnico que realiza servicios
8. **tipos_servicio** - Catálogo de tipos de servicios
9. **servicios** - Órdenes de servicio/trabajo (tabla central)
10. **fotos_servicio** - Fotografías adjuntas a servicios

### Vista de Consulta:

- **vista_servicios_completa** - Vista desnormalizada con toda la información de servicios

## Cómo Usar el Script

### Opción 1: Desde la línea de comandos MySQL

```bash
# Conectarse a MySQL
mysql -u tu_usuario -p

# Crear la base de datos
CREATE DATABASE icemas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE icemas;

# Ejecutar el script
source database/schema.sql;
```

### Opción 2: Usando el cliente MySQL

```bash
mysql -u tu_usuario -p icemas < database/schema.sql
```

### Opción 3: Desde phpMyAdmin

1. Abre phpMyAdmin
2. Crea una nueva base de datos llamada `icemas`
3. Selecciona la base de datos
4. Ve a la pestaña "SQL"
5. Copia y pega el contenido de `schema.sql`
6. Click en "Continuar"

### Opción 4: Usando TypeORM (Sincronización Automática)

El proyecto está configurado para usar TypeORM. Si prefieres que las tablas se creen automáticamente:

1. Abre el archivo `.env`
2. Configura tu conexión a la base de datos:
   ```env
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=icemas
   DB_SYNCHRONIZE=true  # ⚠️ Solo en desarrollo
   DB_LOGGING=true
   ```
3. Inicia el backend: `npm run start:dev`
4. TypeORM creará automáticamente todas las tablas basándose en las entidades

⚠️ **IMPORTANTE**: `DB_SYNCHRONIZE=true` solo debe usarse en desarrollo. En producción, usa migraciones.

## Datos Iniciales Incluidos

El script `schema.sql` incluye registros iniciales para:

### Marcas (5 registros):
- Carrier
- Trane
- York
- Rheem  
- Lennox

### Tipos de Equipo (5 registros):
- Aire Acondicionado
- Caldera
- Chiller
- Manejadora de Aire
- Compresor

### Tipos de Servicio (5 registros):
- Mantenimiento Preventivo
- Mantenimiento Correctivo
- Instalación
- Diagnóstico
- Emergencia

## Usuario Admin

Después de crear las tablas, ejecuta el script de creación del usuario administrador:

```bash
cd backend_icemas
npx ts-node src/scripts/create-admin.ts
```

Esto creará el usuario:
- **Email**: admin@icemas.com
- **Contraseña**: Admin123!

## Relaciones Entre Tablas

```
users
  └─► servicios (lastUser_id)

clientes
  ├─► sucursales
  ├─► equipos
  └─► servicios

sucursales
  ├─► equipos
  └─► servicios

marcas
  └─► equipos

tipos_equipo
  └─► equipos

equipos
  └─► servicios

tecnicos
  └─► servicios

tipos_servicio
  └─► servicios

servicios
  └─► fotos_servicio
```

## Verificación

Para verificar que las tablas se crearon correctamente:

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Ver estructura de una tabla
DESCRIBE servicios;

-- Ver relaciones de foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME IS NOT NULL 
  AND TABLE_SCHEMA = 'icemas';

-- Contar registros en catálogos
SELECT 'marcas' AS tabla, COUNT(*) AS registros FROM marcas
UNION ALL
SELECT 'tipos_equipo', COUNT(*) FROM tipos_equipo
UNION ALL
SELECT 'tipos_servicio', COUNT(*) FROM tipos_servicio;
```

## Migraciones (Futuro)

Para entornos de producción, se recomienda usar migraciones de TypeORM:

```bash
# Generar migración desde entidades
npm run migration:generate -- -n NombreMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert
```

## Notas Importantes

1. **Charset**: Todas las tablas usan `utf8mb4` para soportar emojis y caracteres especiales
2. **Engine**: InnoDB para soporte de transacciones y foreign keys
3. **ON DELETE CASCADE**: Los registros dependientes se eliminan automáticamente
4. **ON DELETE RESTRICT**: Previene eliminación si hay registros relacionados
5. **Timestamps**: Todas las tablas tienen `created_at` y `updated_at` automáticos

## Troubleshooting

### Error: "Access denied for user"
- Verifica usuario y contraseña en `.env`
- Asegúrate de que el usuario tiene permisos en la base de datos

### Error: "Unknown database 'icemas'"
- Crea la base de datos primero: `CREATE DATABASE icemas;`

### Error: "Cannot add foreign key constraint"
- Asegúrate de ejecutar el script completo en orden
- Verifica que las tablas referenciadas existen

### Tablas ya existen
- El script usa `CREATE TABLE IF NOT EXISTS`, es seguro ejecutarlo múltiples veces
- Para recrear: `DROP DATABASE icemas; CREATE DATABASE icemas;`
