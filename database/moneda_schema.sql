-- ===================================================
-- SCRIPT DE CREACIÓN DE TABLA MONEDA
-- Base de datos: ateneapos (PostgreSQL)
-- ===================================================

-- Conectar a la base de datos
\c ateneapos;

-- Eliminar tabla si existe (solo para desarrollo)
-- DESCOMENTA LA SIGUIENTE LÍNEA SI QUIERES RECREAR LA TABLA
-- DROP TABLE IF EXISTS moneda CASCADE;

-- Crear tabla moneda
CREATE TABLE IF NOT EXISTS moneda (
    moneda_id SERIAL PRIMARY KEY,
    codigo_iso VARCHAR(3) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(10) NOT NULL,
    decimales INTEGER NOT NULL DEFAULT 2,
    activo BOOLEAN DEFAULT TRUE
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_moneda_codigo_iso ON moneda(codigo_iso);
CREATE INDEX IF NOT EXISTS idx_moneda_activo ON moneda(activo);

-- Comentarios de la tabla
COMMENT ON TABLE moneda IS 'Tabla de monedas del sistema POS Atenea';
COMMENT ON COLUMN moneda.moneda_id IS 'ID único de la moneda';
COMMENT ON COLUMN moneda.codigo_iso IS 'Código ISO de la moneda (ej: COP, USD, EUR)';
COMMENT ON COLUMN moneda.nombre IS 'Nombre completo de la moneda';
COMMENT ON COLUMN moneda.simbolo IS 'Símbolo de la moneda';
COMMENT ON COLUMN moneda.decimales IS 'Cantidad de decimales que maneja la moneda';
COMMENT ON COLUMN moneda.activo IS 'Indica si la moneda está activa en el sistema';

-- Insertar datos de prueba (opcional)
INSERT INTO moneda (codigo_iso, nombre, simbolo, decimales, activo) VALUES
('COP', 'Peso Colombiano', '$', 2, TRUE),
('USD', 'Dólar Estadounidense', '$', 2, TRUE),
('EUR', 'Euro', '€', 2, TRUE),
('GBP', 'Libra Esterlina', '£', 2, TRUE),
('JPY', 'Yen Japonés', '¥', 0, TRUE),
('MXN', 'Peso Mexicano', '$', 2, TRUE),
('BRL', 'Real Brasileño', 'R$', 2, TRUE),
('ARS', 'Peso Argentino', '$', 2, TRUE),
('CLP', 'Peso Chileno', '$', 0, TRUE),
('PEN', 'Sol Peruano', 'S/', 2, TRUE)
ON CONFLICT (codigo_iso) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    simbolo = EXCLUDED.simbolo,
    decimales = EXCLUDED.decimales,
    activo = EXCLUDED.activo;

-- Verificar que se crearon correctamente
SELECT * FROM moneda ORDER BY moneda_id;

-- Verificar estructura de la tabla
\d moneda;
