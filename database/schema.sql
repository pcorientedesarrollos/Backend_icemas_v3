-- ============================================================================
-- ICEMAS - Sistema de Gestión de Servicios
-- Script de Creación de Base de Datos Completa
-- ============================================================================
-- Versión: 3.0
-- Fecha: Diciembre 2024
-- Motor: MySQL 8.0 / MariaDB 10.x
-- ============================================================================

-- Eliminar base de datos si existe (CUIDADO: Esto borrará todos los datos)
-- DROP DATABASE IF EXISTS icemas;

-- Crear base de datos
-- CREATE DATABASE IF NOT EXISTS icemas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE icemas;

-- ============================================================================
-- TABLA 1: users
-- Descripción: Usuarios del sistema con autenticación
-- ============================================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL COMMENT 'Nombre completo del usuario',
    `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Correo electrónico (login)',
    `email_verified_at` TIMESTAMP NULL COMMENT 'Fecha verificación email',
    `password` VARCHAR(255) NOT NULL COMMENT 'Contraseña hasheada (bcrypt)',
    `remember_token` VARCHAR(100) NULL COMMENT 'Token para "recordarme"',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios del sistema';

-- ============================================================================
-- TABLA 2: clientes
-- Descripción: Empresas o personas que contratan servicios
-- ============================================================================

CREATE TABLE IF NOT EXISTS `clientes` (
    `id_cliente` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre del contacto principal',
    `empresa` VARCHAR(255) NOT NULL COMMENT 'Nombre de la empresa/organización',
    `telefono` VARCHAR(20) NULL COMMENT 'Teléfono de contacto',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_clientes_nombre` (`nombre`),
    INDEX `idx_clientes_empresa` (`empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Clientes del sistema';

-- ============================================================================
-- TABLA 3: sucursales
-- Descripción: Ubicaciones físicas de los clientes
-- ============================================================================

CREATE TABLE IF NOT EXISTS `sucursales` (
    `id_sucursal` INT AUTO_INCREMENT PRIMARY KEY,
    `id_cliente` INT NOT NULL COMMENT 'Cliente propietario',
    `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre de la sucursal',
    `direccion` VARCHAR(255) NULL COMMENT 'Dirección completa',
    `telefono` VARCHAR(15) NULL COMMENT 'Teléfono de la sucursal',
    `contacto` VARCHAR(255) NULL COMMENT 'Persona de contacto en la sucursal',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE CASCADE,
    INDEX `idx_sucursales_cliente` (`id_cliente`),
    INDEX `idx_sucursales_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sucursales de clientes';

-- ============================================================================
-- TABLA 4: marcas
-- Descripción: Catálogo de marcas de equipos
-- ============================================================================

CREATE TABLE IF NOT EXISTS `marcas` (
    `id_marca` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Nombre de la marca',
    `descripcion` TEXT NULL COMMENT 'Descripción adicional',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `idx_marcas_nombre_unique` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Marcas de equipos';

-- ============================================================================
-- TABLA 5: tipos_equipo
-- Descripción: Catálogo de tipos/categorías de equipos
-- ============================================================================

CREATE TABLE IF NOT EXISTS `tipos_equipo` (
    `id_tipo` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre del tipo de equipo',
    `descripcion` TEXT NULL COMMENT 'Descripción del tipo',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tipos_equipo_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tipos de equipos';

-- ============================================================================
-- TABLA 6: equipos
-- Descripción: Inventario de equipos de clientes
-- ============================================================================

CREATE TABLE IF NOT EXISTS `equipos` (
    `id_equipo` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre del equipo',
    `modelo` VARCHAR(255) NOT NULL COMMENT 'Modelo del equipo',
    `descripcion` TEXT NULL COMMENT 'Descripción detallada',
    `id_marca` INT NOT NULL COMMENT 'Marca del equipo',
    `id_tipo` INT NOT NULL COMMENT 'Tipo de equipo',
    `id_cliente` INT NOT NULL COMMENT 'Cliente propietario',
    `id_sucursal` INT NOT NULL COMMENT 'Sucursal donde está instalado',
    `estado` INT NOT NULL DEFAULT 1 COMMENT 'Estado: 1=Activo, 0=Inactivo',
    `serie` VARCHAR(100) NULL COMMENT 'Número de serie',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`id_marca`) REFERENCES `marcas`(`id_marca`) ON DELETE RESTRICT,
    FOREIGN KEY (`id_tipo`) REFERENCES `tipos_equipo`(`id_tipo`) ON DELETE RESTRICT,
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE CASCADE,
    FOREIGN KEY (`id_sucursal`) REFERENCES `sucursales`(`id_sucursal`) ON DELETE CASCADE,
    INDEX `idx_equipos_cliente` (`id_cliente`),
    INDEX `idx_equipos_sucursal` (`id_sucursal`),
    INDEX `idx_equipos_marca` (`id_marca`),
    INDEX `idx_equipos_tipo` (`id_tipo`),
    INDEX `idx_equipos_serie` (`serie`),
    INDEX `idx_equipos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Equipos de clientes';

-- ============================================================================
-- TABLA 7: tecnicos
-- Descripción: Personal técnico que realiza servicios
-- ============================================================================

CREATE TABLE IF NOT EXISTS `tecnicos` (
    `id_tecnico` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre completo del técnico',
    `telefono` VARCHAR(20) NOT NULL COMMENT 'Teléfono de contacto',
    `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Correo electrónico',
    `especialidad` VARCHAR(255) NOT NULL COMMENT 'Área de especialización',
    `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Activo, 0=Inactivo',
    `firma` VARCHAR(255) NULL COMMENT 'Ruta de archivo de firma digital',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `idx_tecnicos_email_unique` (`email`),
    INDEX `idx_tecnicos_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Técnicos de servicio';

-- ============================================================================
-- TABLA 8: tipos_servicio
-- Descripción: Catálogo de tipos de servicios
-- ============================================================================

CREATE TABLE IF NOT EXISTS `tipos_servicio` (
    `id_tipo_servicio` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre del tipo de servicio',
    `descripcion` TEXT NULL COMMENT 'Descripción del tipo',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tipos_servicio_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tipos de servicios';

-- ============================================================================
-- TABLA 9: servicios
-- Descripción: Órdenes de servicio/trabajo
-- ============================================================================

CREATE TABLE IF NOT EXISTS `servicios` (
    `id_servicio` INT AUTO_INCREMENT PRIMARY KEY,
    `id_tecnico` INT NOT NULL COMMENT 'Técnico asignado',
    `id_tipo_servicio` INT NOT NULL COMMENT 'Tipo de servicio',
    `id_cliente` INT NOT NULL COMMENT 'Cliente',
    `id_sucursal` INT NOT NULL COMMENT 'Sucursal donde se realiza',
    `id_equipo` INT NOT NULL COMMENT 'Equipo a dar servicio',
    `fecha_servicio` DATE NOT NULL COMMENT 'Fecha de realización',
    `tipo` VARCHAR(100) NULL COMMENT 'Tipo adicional (legacy)',
    `descripcion` TEXT NULL COMMENT 'Descripción del servicio',
    `detalle_trabajo` TEXT NULL COMMENT 'Detalle del trabajo realizado',
    `folio` VARCHAR(100) NOT NULL COMMENT 'Número de folio/orden',
    `estado` VARCHAR(50) NOT NULL DEFAULT 'Pendiente' COMMENT 'Pendiente|En Proceso|Completado|Cancelado',
    `firma` VARCHAR(255) NULL COMMENT 'Ruta de firma del cliente',
    `lastUser_id` BIGINT UNSIGNED NULL COMMENT 'Último usuario que modificó',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`id_tecnico`) REFERENCES `tecnicos`(`id_tecnico`) ON DELETE RESTRICT,
    FOREIGN KEY (`id_tipo_servicio`) REFERENCES `tipos_servicio`(`id_tipo_servicio`) ON DELETE RESTRICT,
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE CASCADE,
    FOREIGN KEY (`id_sucursal`) REFERENCES `sucursales`(`id_sucursal`) ON DELETE CASCADE,
    FOREIGN KEY (`id_equipo`) REFERENCES `equipos`(`id_equipo`) ON DELETE CASCADE,
    FOREIGN KEY (`lastUser_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_servicios_fecha` (`fecha_servicio`),
    INDEX `idx_servicios_estado` (`estado`),
    INDEX `idx_servicios_folio` (`folio`),
    INDEX `idx_servicios_cliente` (`id_cliente`),
    INDEX `idx_servicios_tecnico` (`id_tecnico`),
    INDEX `idx_servicios_equipo` (`id_equipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Órdenes de servicio';

-- ============================================================================
-- TABLA 10: fotos_servicio
-- Descripción: Fotografías adjuntas a servicios
-- ============================================================================

CREATE TABLE IF NOT EXISTS `fotos_servicio` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `id_servicio` INT NOT NULL COMMENT 'Servicio al que pertenece',
    `imagen` VARCHAR(255) NOT NULL COMMENT 'Nombre del archivo de imagen',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE CASCADE,
    INDEX `idx_fotos_servicio` (`id_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fotos de servicios realizados';

-- ============================================================================
-- DATOS INICIALES - Catálogos básicos
-- ============================================================================

-- Marcas de ejemplo
INSERT INTO `marcas` (`nombre`, `descripcion`) VALUES
('Carrier', 'Líder mundial en sistemas de climatización'),
('Trane', 'Especialista en soluciones de aire acondicionado'),
('York', 'Marca reconocida de equipos HVAC'),
('Rheem', 'Fabricante de equipos de climatización'),
('Lennox', 'Sistemas de calefacción y refrigeración')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Tipos de equipo
INSERT INTO `tipos_equipo` (`nombre`, `descripcion`) VALUES
('Aire Acondicionado', 'Equipos de climatización y enfriamiento'),
('Caldera', 'Sistemas de calefacción y agua caliente'),
('Chiller', 'Enfriadores de agua para sistemas centralizados'),
('Manejadora de Aire', 'Unidades de tratamiento de aire'),
('Compresor', 'Equipos de compresión de refrigerante')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Tipos de servicio
INSERT INTO `tipos_servicio` (`nombre`, `descripcion`) VALUES
('Mantenimiento Preventivo', 'Revisión y limpieza programada'),
('Mantenimiento Correctivo', 'Reparación de fallas o averías'),
('Instalación', 'Instalación de equipos nuevos'),
('Diagnóstico', 'Evaluación de problemas'),
('Emergencia', 'Atención urgente')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- ============================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índice compuesto para búsquedas frecuentes
ALTER TABLE `servicios` ADD INDEX `idx_servicios_fecha_estado` (`fecha_servicio`, `estado`);
ALTER TABLE `equipos` ADD INDEX `idx_equipos_cliente_sucursal` (`id_cliente`, `id_sucursal`);

-- ============================================================================
-- VISTAS ÚTILES (OPCIONAL)
-- ============================================================================

-- Vista de servicios con todos los datos relacionados
CREATE OR REPLACE VIEW `vista_servicios_completa` AS
SELECT 
    s.id_servicio,
    s.folio,
    s.fecha_servicio,
    s.estado,
    s.descripcion,
    s.detalle_trabajo,
    c.nombre AS cliente_nombre,
    c.empresa AS cliente_empresa,
    suc.nombre AS sucursal_nombre,
    suc.direccion AS sucursal_direccion,
    e.nombre AS equipo_nombre,
    e.modelo AS equipo_modelo,
    e.serie AS equipo_serie,
    m.nombre AS marca_nombre,
    te.nombre AS tipo_equipo_nombre,
    t.nombre AS tecnico_nombre,
    t.telefono AS tecnico_telefono,
    ts.nombre AS tipo_servicio_nombre,
    u.name AS ultimo_usuario,
    s.created_at,
    s.updated_at
FROM servicios s
INNER JOIN clientes c ON s.id_cliente = c.id_cliente
INNER JOIN sucursales suc ON s.id_sucursal = suc.id_sucursal
INNER JOIN equipos e ON s.id_equipo = e.id_equipo
INNER JOIN marcas m ON e.id_marca = m.id_marca
INNER JOIN tipos_equipo te ON e.id_tipo = te.id_tipo
INNER JOIN tecnicos t ON s.id_tecnico = t.id_tecnico
INNER JOIN tipos_servicio ts ON s.id_tipo_servicio = ts.id_tipo_servicio
LEFT JOIN users u ON s.lastUser_id = u.id;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Para verificar que todas las tablas se crearon correctamente:
-- SHOW TABLES;
-- 
-- Para ver la estructura de una tabla:
-- DESCRIBE nombre_tabla;
--
-- Para ver las relaciones de foreign keys:
-- SELECT * FROM information_schema.KEY_COLUMN_USAGE 
-- WHERE REFERENCED_TABLE_NAME IS NOT NULL;
