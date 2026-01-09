import { Pool } from 'pg';
import config from '../config';

// Crear pool de conexiones PostgreSQL
const pgPool = new Pool(config.DATABASE[config.NODE_ENVIRONMENT]);

// Manejar errores del pool
pgPool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
});

export const mysqlClient = pgPool;
export default pgPool;
